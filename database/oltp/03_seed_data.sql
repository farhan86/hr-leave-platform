-- =============================================================================
-- HR Leave Management Platform — Seed Data
-- 3 departments, 10 employees (2 managers + 8 reports), 6 leave types,
-- 2026 leave balances, sample leave requests
-- =============================================================================

USE hrleave;
GO

-- =============================================================================
-- Departments
-- =============================================================================
INSERT INTO dbo.Department (DepartmentName) VALUES
    ('Engineering'),
    ('Human Resources'),
    ('Product & Design');
GO

-- =============================================================================
-- Leave Types
-- =============================================================================
INSERT INTO dbo.LeaveType (LeaveTypeName, DefaultDaysPerYear, IsCarryForwardAllowed, MaxCarryForwardDays, RequiresApproval, IsActive)
VALUES
    ('Annual Leave',    20.0, 1, 5.0, 1, 1),
    ('Sick Leave',      14.0, 0, 0.0, 1, 1),
    ('Casual Leave',    10.0, 0, 0.0, 1, 1),
    ('Maternity Leave', 112.0,0, 0.0, 1, 1),
    ('Paternity Leave', 14.0, 0, 0.0, 1, 1),
    ('Unpaid Leave',    0.0,  0, 0.0, 1, 1);
GO

-- =============================================================================
-- Employees
-- Department IDs: Engineering=1, HR=2, Product=3
-- Employees 1 and 2 are managers (ManagerId = NULL)
-- =============================================================================
INSERT INTO dbo.Employee (FirstName, LastName, Email, DepartmentId, ManagerId, JoinDate, Role, IsActive)
VALUES
    -- Managers (top-level, ManagerId = NULL)
    ('Farhan',   'Ahmed',    'farhan.ahmed@hrleave.dev',    1, NULL, '2020-03-01', 'Engineering Manager', 1),
    ('Nadia',    'Rahman',   'nadia.rahman@hrleave.dev',    2, NULL, '2019-06-15', 'HR Manager',          1),

    -- Engineering team (reports to EmployeeId = 1)
    ('Tanvir',   'Hossain',  'tanvir.hossain@hrleave.dev',  1, 1,    '2021-01-10', 'Software Engineer',   1),
    ('Priya',    'Das',      'priya.das@hrleave.dev',        1, 1,    '2021-07-20', 'Software Engineer',   1),
    ('Rafiq',    'Islam',    'rafiq.islam@hrleave.dev',      1, 1,    '2022-03-05', 'Data Engineer',       1),
    ('Mehrin',   'Sultana',  'mehrin.sultana@hrleave.dev',   1, 1,    '2022-09-12', 'QA Engineer',         1),

    -- HR team (reports to EmployeeId = 2)
    ('Karim',    'Chowdhury','karim.chowdhury@hrleave.dev',  2, 2,    '2021-04-01', 'HR Specialist',       1),
    ('Sultana',  'Begum',    'sultana.begum@hrleave.dev',    2, 2,    '2023-01-15', 'HR Coordinator',      1),

    -- Product team (reports to EmployeeId = 1 for demo purposes)
    ('Anisur',   'Malik',    'anisur.malik@hrleave.dev',     3, 1,    '2022-06-01', 'Product Manager',     1),
    ('Roksana',  'Khanam',   'roksana.khanam@hrleave.dev',   3, 1,    '2023-08-20', 'UX Designer',         1);
GO

-- =============================================================================
-- 2026 Leave Balances (all 10 employees × 6 leave types)
-- Call sp_InitialiseYearlyBalances for future years instead of inserting manually
-- =============================================================================
EXEC dbo.sp_InitialiseYearlyBalances @Year = 2026;
GO

-- Simulate some carry-forward for Annual Leave from 2025
-- (3 employees had unused Annual Leave in 2025 — manually set for demo)
UPDATE dbo.LeaveBalance
SET CarryForward = 5.0, TotalEntitled = 25.0   -- 20 default + 5 carry
WHERE EmployeeId = 3 AND LeaveTypeId = 1 AND Year = 2026;

UPDATE dbo.LeaveBalance
SET CarryForward = 3.0, TotalEntitled = 23.0
WHERE EmployeeId = 5 AND LeaveTypeId = 1 AND Year = 2026;

UPDATE dbo.LeaveBalance
SET CarryForward = 2.0, TotalEntitled = 22.0
WHERE EmployeeId = 9 AND LeaveTypeId = 1 AND Year = 2026;
GO

-- =============================================================================
-- Sample Leave Requests (for demo and ETL pipeline testing)
-- =============================================================================

-- Approved annual leave — Tanvir (EmployeeId=3), approved by Farhan (EmployeeId=1)
INSERT INTO dbo.LeaveRequest
    (EmployeeId, LeaveTypeId, StartDate, EndDate, TotalDays, Status, ApprovedByEmployeeId, ApprovedAt, Reason, CreatedAt, UpdatedAt)
VALUES
    (3, 1, '2026-01-05', '2026-01-09', 5.0, 'Approved', 1, '2025-12-28 09:00:00', 'Family vacation', '2025-12-26 10:30:00', '2025-12-28 09:00:00');

-- Update balance for the approved request above
UPDATE dbo.LeaveBalance SET TotalUsed = 5.0, UpdatedAt = GETUTCDATE()
WHERE EmployeeId = 3 AND LeaveTypeId = 1 AND Year = 2026;

-- Pending sick leave — Priya (EmployeeId=4)
INSERT INTO dbo.LeaveRequest
    (EmployeeId, LeaveTypeId, StartDate, EndDate, TotalDays, Status, Reason, CreatedAt, UpdatedAt)
VALUES
    (4, 2, '2026-04-21', '2026-04-22', 2.0, 'Pending', 'Doctor appointment and recovery', GETUTCDATE(), GETUTCDATE());

-- Pending annual leave — Rafiq (EmployeeId=5)
INSERT INTO dbo.LeaveRequest
    (EmployeeId, LeaveTypeId, StartDate, EndDate, TotalDays, Status, Reason, CreatedAt, UpdatedAt)
VALUES
    (5, 1, '2026-05-01', '2026-05-05', 5.0, 'Pending', 'Eid holiday travel', GETUTCDATE(), GETUTCDATE());

-- Rejected casual leave — Mehrin (EmployeeId=6), rejected by Farhan
INSERT INTO dbo.LeaveRequest
    (EmployeeId, LeaveTypeId, StartDate, EndDate, TotalDays, Status, ApprovedByEmployeeId, ApprovedAt, Reason, RejectionNote, CreatedAt, UpdatedAt)
VALUES
    (6, 3, '2026-03-10', '2026-03-10', 1.0, 'Rejected', 1, '2026-03-08 11:00:00', 'Personal errand', 'Critical release week — please reschedule.', '2026-03-07 14:00:00', '2026-03-08 11:00:00');

-- Cancelled leave — Karim (EmployeeId=7)
INSERT INTO dbo.LeaveRequest
    (EmployeeId, LeaveTypeId, StartDate, EndDate, TotalDays, Status, Reason, CreatedAt, UpdatedAt)
VALUES
    (7, 3, '2026-02-20', '2026-02-21', 2.0, 'Cancelled', 'Personal', '2026-02-15 09:00:00', '2026-02-17 10:00:00');

-- Approved paternity leave — Anisur (EmployeeId=9)
INSERT INTO dbo.LeaveRequest
    (EmployeeId, LeaveTypeId, StartDate, EndDate, TotalDays, Status, ApprovedByEmployeeId, ApprovedAt, Reason, CreatedAt, UpdatedAt)
VALUES
    (9, 5, '2026-02-03', '2026-02-21', 14.0, 'Approved', 1, '2026-01-25 10:00:00', 'New baby', '2026-01-20 08:00:00', '2026-01-25 10:00:00');

UPDATE dbo.LeaveBalance SET TotalUsed = 14.0, UpdatedAt = GETUTCDATE()
WHERE EmployeeId = 9 AND LeaveTypeId = 5 AND Year = 2026;
GO

-- =============================================================================
-- Audit log entries for the sample requests above (seeded manually for demo)
-- In production these are written by the .NET service layer
-- =============================================================================
INSERT INTO dbo.AuditLog (ActingEmployeeId, ActionType, AffectedTable, RecordId, OldValues, NewValues, Timestamp)
VALUES
    (3,    'INSERT', 'LeaveRequest', 1, NULL, '{"Status":"Approved","TotalDays":5.0}',   '2025-12-26 10:30:00'),
    (1,    'UPDATE', 'LeaveRequest', 1, '{"Status":"Pending"}', '{"Status":"Approved","ApprovedByEmployeeId":1}', '2025-12-28 09:00:00'),
    (4,    'INSERT', 'LeaveRequest', 2, NULL, '{"Status":"Pending","TotalDays":2.0}',    GETUTCDATE()),
    (5,    'INSERT', 'LeaveRequest', 3, NULL, '{"Status":"Pending","TotalDays":5.0}',    GETUTCDATE()),
    (6,    'INSERT', 'LeaveRequest', 4, NULL, '{"Status":"Pending","TotalDays":1.0}',    '2026-03-07 14:00:00'),
    (1,    'UPDATE', 'LeaveRequest', 4, '{"Status":"Pending"}', '{"Status":"Rejected","RejectionNote":"Critical release week"}', '2026-03-08 11:00:00'),
    (7,    'INSERT', 'LeaveRequest', 5, NULL, '{"Status":"Pending","TotalDays":2.0}',    '2026-02-15 09:00:00'),
    (7,    'UPDATE', 'LeaveRequest', 5, '{"Status":"Pending"}', '{"Status":"Cancelled"}', '2026-02-17 10:00:00'),
    (9,    'INSERT', 'LeaveRequest', 6, NULL, '{"Status":"Pending","TotalDays":14.0}',   '2026-01-20 08:00:00'),
    (1,    'UPDATE', 'LeaveRequest', 6, '{"Status":"Pending"}', '{"Status":"Approved","ApprovedByEmployeeId":1}', '2026-01-25 10:00:00');
GO

PRINT 'Seed data inserted successfully.';
PRINT '';
PRINT 'Summary:';
PRINT '  Departments : 3';
PRINT '  Leave Types : 6';
PRINT '  Employees   : 10 (2 managers, 8 reports)';
PRINT '  Balances    : 60 rows (10 employees x 6 leave types, Year 2026)';
PRINT '  Requests    : 6 (1 Approved, 2 Pending, 1 Rejected, 1 Cancelled, 1 Approved paternity)';
