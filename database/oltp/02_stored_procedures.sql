-- =============================================================================
-- HR Leave Management Platform — Stored Procedures
-- Target: Azure SQL Database
-- Return codes: 0 = success, negative = business rule violation
-- =============================================================================

USE hrleave;
GO

-- =============================================================================
-- sp_SubmitLeaveRequest
-- Validates balance, inserts the leave request.
-- Balance is NOT deducted here — deduction happens on approval.
-- Returns: @NewLeaveRequestId (OUTPUT), 0 on success, <0 on error.
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_SubmitLeaveRequest
    @EmployeeId          INT,
    @LeaveTypeId         INT,
    @StartDate           DATE,
    @EndDate             DATE,
    @TotalDays           DECIMAL(5,1),
    @Reason              NVARCHAR(500) = NULL,
    @NewLeaveRequestId   INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Year INT = YEAR(@StartDate);

    -- 1. Employee must exist and be active
    IF NOT EXISTS (
        SELECT 1 FROM dbo.Employee WHERE EmployeeId = @EmployeeId AND IsActive = 1
    )
    BEGIN
        RETURN -1; -- Employee not found or inactive
    END

    -- 2. LeaveType must exist and be active
    IF NOT EXISTS (
        SELECT 1 FROM dbo.LeaveType WHERE LeaveTypeId = @LeaveTypeId AND IsActive = 1
    )
    BEGIN
        RETURN -2; -- Leave type not found or inactive
    END

    -- 3. EndDate must be >= StartDate
    IF @EndDate < @StartDate
    BEGIN
        RETURN -3; -- Invalid date range
    END

    -- 4. Check sufficient balance (Remaining = TotalEntitled - TotalUsed)
    DECLARE @Remaining DECIMAL(5,1);
    SELECT @Remaining = (TotalEntitled - TotalUsed)
    FROM dbo.LeaveBalance
    WHERE EmployeeId = @EmployeeId
      AND LeaveTypeId = @LeaveTypeId
      AND Year = @Year;

    IF @Remaining IS NULL
    BEGIN
        RETURN -4; -- No balance record found for this year
    END

    IF @TotalDays > @Remaining
    BEGIN
        RETURN -5; -- Insufficient balance
    END

    -- 5. Check no overlapping approved/pending requests for same employee
    IF EXISTS (
        SELECT 1 FROM dbo.LeaveRequest
        WHERE EmployeeId = @EmployeeId
          AND Status IN ('Pending', 'Approved')
          AND StartDate <= @EndDate
          AND EndDate >= @StartDate
    )
    BEGIN
        RETURN -6; -- Overlapping leave request exists
    END

    -- 6. Insert the leave request
    INSERT INTO dbo.LeaveRequest
        (EmployeeId, LeaveTypeId, StartDate, EndDate, TotalDays, Status, Reason, CreatedAt, UpdatedAt)
    VALUES
        (@EmployeeId, @LeaveTypeId, @StartDate, @EndDate, @TotalDays, 'Pending', @Reason, GETUTCDATE(), GETUTCDATE());

    SET @NewLeaveRequestId = SCOPE_IDENTITY();

    RETURN 0;
END;
GO

-- =============================================================================
-- sp_ApproveLeaveRequest
-- Approves a pending request and deducts balance.
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_ApproveLeaveRequest
    @LeaveRequestId      INT,
    @ApprovedByEmployeeId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EmployeeId  INT;
    DECLARE @LeaveTypeId INT;
    DECLARE @TotalDays   DECIMAL(5,1);
    DECLARE @Status      NVARCHAR(20);
    DECLARE @StartDate   DATE;

    -- 1. Fetch the request
    SELECT
        @EmployeeId  = EmployeeId,
        @LeaveTypeId = LeaveTypeId,
        @TotalDays   = TotalDays,
        @Status      = Status,
        @StartDate   = StartDate
    FROM dbo.LeaveRequest
    WHERE LeaveRequestId = @LeaveRequestId;

    IF @EmployeeId IS NULL
        RETURN -1; -- Request not found

    IF @Status <> 'Pending'
        RETURN -2; -- Can only approve Pending requests

    -- 2. Verify approver exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM dbo.Employee WHERE EmployeeId = @ApprovedByEmployeeId AND IsActive = 1
    )
        RETURN -3; -- Approver not valid

    -- 3. Re-check balance at approval time (guard against race conditions)
    DECLARE @Remaining DECIMAL(5,1);
    SELECT @Remaining = (TotalEntitled - TotalUsed)
    FROM dbo.LeaveBalance
    WHERE EmployeeId = @EmployeeId
      AND LeaveTypeId = @LeaveTypeId
      AND Year = YEAR(@StartDate);

    IF @Remaining IS NULL OR @TotalDays > @Remaining
        RETURN -4; -- Insufficient balance at approval time

    -- 4. Approve the request
    UPDATE dbo.LeaveRequest
    SET
        Status               = 'Approved',
        ApprovedByEmployeeId = @ApprovedByEmployeeId,
        ApprovedAt           = GETUTCDATE(),
        UpdatedAt            = GETUTCDATE()
    WHERE LeaveRequestId = @LeaveRequestId;

    -- 5. Deduct from balance
    UPDATE dbo.LeaveBalance
    SET
        TotalUsed = TotalUsed + @TotalDays,
        UpdatedAt = GETUTCDATE()
    WHERE EmployeeId = @EmployeeId
      AND LeaveTypeId = @LeaveTypeId
      AND Year = YEAR(@StartDate);

    RETURN 0;
END;
GO

-- =============================================================================
-- sp_RejectLeaveRequest
-- Rejects a pending request. No balance change.
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_RejectLeaveRequest
    @LeaveRequestId INT,
    @RejectionNote  NVARCHAR(500),
    @RejectedByEmployeeId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Status NVARCHAR(20);

    SELECT @Status = Status
    FROM dbo.LeaveRequest
    WHERE LeaveRequestId = @LeaveRequestId;

    IF @Status IS NULL
        RETURN -1; -- Request not found

    IF @Status <> 'Pending'
        RETURN -2; -- Can only reject Pending requests

    IF @RejectionNote IS NULL OR LEN(TRIM(@RejectionNote)) = 0
        RETURN -3; -- Rejection note is mandatory

    UPDATE dbo.LeaveRequest
    SET
        Status               = 'Rejected',
        RejectionNote        = @RejectionNote,
        ApprovedByEmployeeId = @RejectedByEmployeeId,
        ApprovedAt           = GETUTCDATE(),  -- records when action was taken
        UpdatedAt            = GETUTCDATE()
    WHERE LeaveRequestId = @LeaveRequestId;

    RETURN 0;
END;
GO

-- =============================================================================
-- sp_CancelLeaveRequest
-- Cancels a request only if it is still Pending.
-- No balance change needed (balance was never deducted on submit).
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_CancelLeaveRequest
    @LeaveRequestId INT,
    @RequestingEmployeeId INT   -- must match the original requestor
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EmployeeId INT;
    DECLARE @Status     NVARCHAR(20);

    SELECT @EmployeeId = EmployeeId, @Status = Status
    FROM dbo.LeaveRequest
    WHERE LeaveRequestId = @LeaveRequestId;

    IF @EmployeeId IS NULL
        RETURN -1; -- Request not found

    IF @EmployeeId <> @RequestingEmployeeId
        RETURN -2; -- Not the owner of this request

    IF @Status <> 'Pending'
        RETURN -3; -- Can only cancel Pending requests

    UPDATE dbo.LeaveRequest
    SET
        Status    = 'Cancelled',
        UpdatedAt = GETUTCDATE()
    WHERE LeaveRequestId = @LeaveRequestId;

    RETURN 0;
END;
GO

-- =============================================================================
-- sp_CalculateCarryForward
-- Run at year-end. For each employee + eligible leave type, compute unused days,
-- cap at MaxCarryForwardDays, and write CarryForward into the NEXT year's balance.
-- Call sp_InitialiseYearlyBalances first to ensure next-year rows exist.
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_CalculateCarryForward
    @CurrentYear INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NextYear INT = @CurrentYear + 1;

    -- Update next year's CarryForward and TotalEntitled for eligible types
    UPDATE lb_next
    SET
        lb_next.CarryForward  = carry.CarryDays,
        lb_next.TotalEntitled = lt.DefaultDaysPerYear + carry.CarryDays,
        lb_next.UpdatedAt     = GETUTCDATE()
    FROM dbo.LeaveBalance lb_next
    INNER JOIN dbo.LeaveType lt
        ON lb_next.LeaveTypeId = lt.LeaveTypeId
    INNER JOIN (
        -- Compute carry days from current year's balance
        SELECT
            lb.EmployeeId,
            lb.LeaveTypeId,
            CASE
                WHEN (lb.TotalEntitled - lb.TotalUsed) > lt2.MaxCarryForwardDays
                    THEN lt2.MaxCarryForwardDays
                ELSE (lb.TotalEntitled - lb.TotalUsed)
            END AS CarryDays
        FROM dbo.LeaveBalance lb
        INNER JOIN dbo.LeaveType lt2
            ON lb.LeaveTypeId = lt2.LeaveTypeId
        WHERE lb.Year = @CurrentYear
          AND lt2.IsCarryForwardAllowed = 1
          AND lt2.IsActive = 1
          AND (lb.TotalEntitled - lb.TotalUsed) > 0
    ) carry
        ON lb_next.EmployeeId = carry.EmployeeId
       AND lb_next.LeaveTypeId = carry.LeaveTypeId
    WHERE lb_next.Year = @NextYear
      AND lt.IsCarryForwardAllowed = 1;

    RETURN 0;
END;
GO

-- =============================================================================
-- sp_InitialiseYearlyBalances
-- Creates LeaveBalance rows for all active employees × active leave types
-- for a given year. Skips rows that already exist (idempotent).
-- Call this at the start of each year (or via admin endpoint).
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_InitialiseYearlyBalances
    @Year INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.LeaveBalance (EmployeeId, LeaveTypeId, Year, TotalEntitled, TotalUsed, CarryForward)
    SELECT
        e.EmployeeId,
        lt.LeaveTypeId,
        @Year,
        lt.DefaultDaysPerYear,  -- CarryForward will be updated by sp_CalculateCarryForward
        0,
        0
    FROM dbo.Employee e
    CROSS JOIN dbo.LeaveType lt
    WHERE e.IsActive = 1
      AND lt.IsActive = 1
      -- Skip rows that already exist
      AND NOT EXISTS (
          SELECT 1 FROM dbo.LeaveBalance lb
          WHERE lb.EmployeeId = e.EmployeeId
            AND lb.LeaveTypeId = lt.LeaveTypeId
            AND lb.Year = @Year
      );

    RETURN 0;
END;
GO

PRINT 'Stored procedures created successfully.';
