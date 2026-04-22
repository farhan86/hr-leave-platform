using HRLeave.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRLeave.Api.Data;

public class HRLeaveDbContext(DbContextOptions<HRLeaveDbContext> options) : DbContext(options)
{
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<LeaveType> LeaveTypes => Set<LeaveType>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<LeaveBalance> LeaveBalances => Set<LeaveBalance>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Department
        modelBuilder.Entity<Department>(e =>
        {
            e.ToTable("Department");
            e.HasKey(d => d.DepartmentId);
            e.Property(d => d.DepartmentName).HasMaxLength(200).IsRequired();
        });

        // Employee
        modelBuilder.Entity<Employee>(e =>
        {
            e.ToTable("Employee");
            e.HasKey(emp => emp.EmployeeId);
            e.Property(emp => emp.FirstName).HasMaxLength(100).IsRequired();
            e.Property(emp => emp.LastName).HasMaxLength(100).IsRequired();
            e.Property(emp => emp.Email).HasMaxLength(255).IsRequired();
            e.Property(emp => emp.Role).HasMaxLength(100).IsRequired();

            e.HasOne(emp => emp.Department)
             .WithMany(d => d.Employees)
             .HasForeignKey(emp => emp.DepartmentId)
             .OnDelete(DeleteBehavior.SetNull);

            // Self-referencing FK for Manager — restrict to avoid cascade cycles
            e.HasOne(emp => emp.Manager)
             .WithMany(emp => emp.DirectReports)
             .HasForeignKey(emp => emp.ManagerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // LeaveType
        modelBuilder.Entity<LeaveType>(e =>
        {
            e.ToTable("LeaveType");
            e.HasKey(lt => lt.LeaveTypeId);
            e.Property(lt => lt.LeaveTypeName).HasMaxLength(100).IsRequired();
            e.Property(lt => lt.DefaultDaysPerYear).HasColumnType("decimal(5,1)");
            e.Property(lt => lt.MaxCarryForwardDays).HasColumnType("decimal(5,1)");
        });

        // LeaveRequest
        modelBuilder.Entity<LeaveRequest>(e =>
        {
            e.ToTable("LeaveRequest");
            e.HasKey(lr => lr.LeaveRequestId);
            e.Property(lr => lr.Status).HasMaxLength(20).IsRequired();
            e.Property(lr => lr.TotalDays).HasColumnType("decimal(5,1)");
            e.Property(lr => lr.Reason).HasMaxLength(500);
            e.Property(lr => lr.RejectionNote).HasMaxLength(500);

            e.HasOne(lr => lr.Employee)
             .WithMany(emp => emp.LeaveRequests)
             .HasForeignKey(lr => lr.EmployeeId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(lr => lr.LeaveType)
             .WithMany()
             .HasForeignKey(lr => lr.LeaveTypeId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(lr => lr.ApprovedByEmployee)
             .WithMany()
             .HasForeignKey(lr => lr.ApprovedByEmployeeId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // LeaveBalance
        modelBuilder.Entity<LeaveBalance>(e =>
        {
            e.ToTable("LeaveBalance");
            e.HasKey(lb => lb.LeaveBalanceId);
            e.Property(lb => lb.TotalEntitled).HasColumnType("decimal(5,1)");
            e.Property(lb => lb.TotalUsed).HasColumnType("decimal(5,1)");
            e.Property(lb => lb.CarryForward).HasColumnType("decimal(5,1)");

            // Remaining is a computed column — never written by EF
            e.Property(lb => lb.Remaining)
             .HasColumnType("decimal(5,1)")
             .HasComputedColumnSql("(TotalEntitled - TotalUsed)", stored: false)
             .ValueGeneratedOnAddOrUpdate();

            e.HasOne(lb => lb.Employee)
             .WithMany(emp => emp.LeaveBalances)
             .HasForeignKey(lb => lb.EmployeeId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(lb => lb.LeaveType)
             .WithMany()
             .HasForeignKey(lb => lb.LeaveTypeId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.ToTable("AuditLog");
            e.HasKey(a => a.AuditLogId);
            e.Property(a => a.ActionType).HasMaxLength(10).IsRequired();
            e.Property(a => a.AffectedTable).HasMaxLength(100).IsRequired();
            e.Property(a => a.OldValues).HasColumnType("nvarchar(max)");
            e.Property(a => a.NewValues).HasColumnType("nvarchar(max)");
        });
    }
}
