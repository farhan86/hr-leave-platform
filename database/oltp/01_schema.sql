-- =============================================================================
-- HR Leave Management Platform — OLTP Schema
-- Target: Azure SQL Database (free offer, serverless)
-- Run order: this file first, then 02_stored_procedures.sql, then 03_seed_data.sql
-- =============================================================================

USE hrleave;
GO

-- =============================================================================
-- 1. Department
-- =============================================================================
CREATE TABLE dbo.Department (
    DepartmentId   INT            NOT NULL IDENTITY(1,1),
    DepartmentName NVARCHAR(200)  NOT NULL,
    CreatedAt      DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt      DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_Department PRIMARY KEY (DepartmentId),
    CONSTRAINT UQ_Department_Name UNIQUE (DepartmentName)
);
GO

-- =============================================================================
-- 2. Employee
-- =============================================================================
CREATE TABLE dbo.Employee (
    EmployeeId   INT            NOT NULL IDENTITY(1,1),
    FirstName    NVARCHAR(100)  NOT NULL,
    LastName     NVARCHAR(100)  NOT NULL,
    Email        NVARCHAR(255)  NOT NULL,
    DepartmentId INT            NULL,
    ManagerId    INT            NULL,        -- self-ref FK; NULL for top-level
    JoinDate     DATE           NOT NULL,
    Role         NVARCHAR(100)  NOT NULL,    -- e.g. Engineer, Analyst, Manager
    IsActive     BIT            NOT NULL DEFAULT 1,
    CreatedAt    DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt    DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_Employee PRIMARY KEY (EmployeeId),
    CONSTRAINT UQ_Employee_Email UNIQUE (Email),
    CONSTRAINT FK_Employee_Department FOREIGN KEY (DepartmentId)
        REFERENCES dbo.Department (DepartmentId),
    CONSTRAINT FK_Employee_Manager FOREIGN KEY (ManagerId)
        REFERENCES dbo.Employee (EmployeeId)
);
GO

-- =============================================================================
-- 3. LeaveType
-- =============================================================================
CREATE TABLE dbo.LeaveType (
    LeaveTypeId          INT            NOT NULL IDENTITY(1,1),
    LeaveTypeName        NVARCHAR(100)  NOT NULL,
    DefaultDaysPerYear   DECIMAL(5,1)   NOT NULL DEFAULT 0,
    IsCarryForwardAllowed BIT           NOT NULL DEFAULT 0,
    MaxCarryForwardDays  DECIMAL(5,1)   NOT NULL DEFAULT 0,
    RequiresApproval     BIT            NOT NULL DEFAULT 1,
    IsActive             BIT            NOT NULL DEFAULT 1,
    CreatedAt            DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt            DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_LeaveType PRIMARY KEY (LeaveTypeId),
    CONSTRAINT UQ_LeaveType_Name UNIQUE (LeaveTypeName)
);
GO

-- =============================================================================
-- 4. LeaveRequest
-- =============================================================================
CREATE TABLE dbo.LeaveRequest (
    LeaveRequestId         INT            NOT NULL IDENTITY(1,1),
    EmployeeId             INT            NOT NULL,
    LeaveTypeId            INT            NOT NULL,
    StartDate              DATE           NOT NULL,
    EndDate                DATE           NOT NULL,
    TotalDays              DECIMAL(5,1)   NOT NULL,   -- working days, set by API
    Status                 NVARCHAR(20)   NOT NULL DEFAULT 'Pending',
    ApprovedByEmployeeId   INT            NULL,
    ApprovedAt             DATETIME2      NULL,
    Reason                 NVARCHAR(500)  NULL,
    RejectionNote          NVARCHAR(500)  NULL,
    CreatedAt              DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt              DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_LeaveRequest PRIMARY KEY (LeaveRequestId),
    CONSTRAINT FK_LeaveRequest_Employee FOREIGN KEY (EmployeeId)
        REFERENCES dbo.Employee (EmployeeId),
    CONSTRAINT FK_LeaveRequest_LeaveType FOREIGN KEY (LeaveTypeId)
        REFERENCES dbo.LeaveType (LeaveTypeId),
    CONSTRAINT FK_LeaveRequest_Approver FOREIGN KEY (ApprovedByEmployeeId)
        REFERENCES dbo.Employee (EmployeeId),
    CONSTRAINT CK_LeaveRequest_EndDate CHECK (EndDate >= StartDate),
    CONSTRAINT CK_LeaveRequest_Status CHECK (
        Status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')
    ),
    CONSTRAINT CK_LeaveRequest_TotalDays CHECK (TotalDays > 0)
);
GO

-- =============================================================================
-- 5. LeaveBalance
-- =============================================================================
CREATE TABLE dbo.LeaveBalance (
    LeaveBalanceId  INT           NOT NULL IDENTITY(1,1),
    EmployeeId      INT           NOT NULL,
    LeaveTypeId     INT           NOT NULL,
    Year            INT           NOT NULL,
    TotalEntitled   DECIMAL(5,1)  NOT NULL,           -- DefaultDaysPerYear + CarryForward
    TotalUsed       DECIMAL(5,1)  NOT NULL DEFAULT 0,
    CarryForward    DECIMAL(5,1)  NOT NULL DEFAULT 0,
    -- Remaining is a computed column: TotalEntitled - TotalUsed
    Remaining       AS (TotalEntitled - TotalUsed),
    CreatedAt       DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_LeaveBalance PRIMARY KEY (LeaveBalanceId),
    CONSTRAINT UQ_LeaveBalance_EmployeeTypeYear UNIQUE (EmployeeId, LeaveTypeId, Year),
    CONSTRAINT FK_LeaveBalance_Employee FOREIGN KEY (EmployeeId)
        REFERENCES dbo.Employee (EmployeeId),
    CONSTRAINT FK_LeaveBalance_LeaveType FOREIGN KEY (LeaveTypeId)
        REFERENCES dbo.LeaveType (LeaveTypeId),
    CONSTRAINT CK_LeaveBalance_Year CHECK (Year BETWEEN 2020 AND 2099),
    CONSTRAINT CK_LeaveBalance_TotalUsed CHECK (TotalUsed >= 0),
    CONSTRAINT CK_LeaveBalance_TotalEntitled CHECK (TotalEntitled >= 0)
);
GO

-- =============================================================================
-- 6. AuditLog
-- =============================================================================
CREATE TABLE dbo.AuditLog (
    AuditLogId       INT            NOT NULL IDENTITY(1,1),
    ActingEmployeeId INT            NULL,              -- NULL for system actions
    ActionType       NVARCHAR(10)   NOT NULL,          -- INSERT | UPDATE | DELETE
    AffectedTable    NVARCHAR(100)  NOT NULL,
    RecordId         INT            NOT NULL,
    OldValues        NVARCHAR(MAX)  NULL,              -- JSON
    NewValues        NVARCHAR(MAX)  NULL,              -- JSON
    Timestamp        DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_AuditLog PRIMARY KEY (AuditLogId),
    CONSTRAINT CK_AuditLog_ActionType CHECK (ActionType IN ('INSERT', 'UPDATE', 'DELETE'))
);
GO

-- =============================================================================
-- Indexes for common query patterns
-- =============================================================================

-- Leave requests by employee (My Leaves page)
CREATE INDEX IX_LeaveRequest_EmployeeId_CreatedAt
    ON dbo.LeaveRequest (EmployeeId, CreatedAt DESC);

-- Pending requests for a manager's team
CREATE INDEX IX_LeaveRequest_Status_CreatedAt
    ON dbo.LeaveRequest (Status, CreatedAt ASC);

-- Balance lookup (real-time balance display)
CREATE INDEX IX_LeaveBalance_EmployeeId_Year
    ON dbo.LeaveBalance (EmployeeId, Year);

-- Audit trail lookup by table + record
CREATE INDEX IX_AuditLog_AffectedTable_RecordId
    ON dbo.AuditLog (AffectedTable, RecordId);

GO
PRINT 'Schema created successfully.';
