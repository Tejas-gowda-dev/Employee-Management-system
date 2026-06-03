import { Router, Response } from 'express';
import db from '../config/db';
import { authenticateJWT, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';
import { sendEmail, getLeaveRequestTemplate, getLeaveStatusTemplate } from '../utils/email';

const router = Router();

// Helper to calculate total days inclusive of start and end dates
function getDaysCount(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

// POST /api/leave/apply
router.post('/apply', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Invalid session' });
    return;
  }

  if (!leaveType || !startDate || !endDate || !reason) {
    res.status(400).json({ success: false, message: 'Missing required leave fields' });
    return;
  }

  if (startDate > endDate) {
    res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    return;
  }

  try {
    const employee = db.users.findById(userId);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee profile not found' });
      return;
    }

    // Get LeaveBalance
    let balance = db.leaveBalances.findOne((b) => b.userId === userId);
    if (!balance) {
      // Create lazy matching balance
      balance = db.leaveBalances.create({
        userId,
        annual: 20,
        sick: 10,
        casual: 10,
      });
    }

    // Calculate requested duration
    const reqDays = getDaysCount(startDate, endDate);
    const typeKey = leaveType as 'annual' | 'sick' | 'casual';

    if (!['annual', 'sick', 'casual'].includes(leaveType)) {
      res.status(400).json({ success: false, message: 'Invalid leave type. Type must be annual, sick, or casual' });
      return;
    }

    const availableDays = (balance as any)[typeKey] || 0;
    if (reqDays > availableDays) {
      res.status(400).json({
        success: false,
        message: `Insufficient leave balance. You requested ${reqDays} day(s) but only have ${availableDays} day(s) remaining for ${leaveType} leave.`
      });
      return;
    }

    // Save leave application
    const leave = db.leaves.create({
      userId,
      leaveType: typeKey,
      startDate,
      endDate,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Create system notifications for admin/managers
    db.notifications.create({
      userId: 'admin_broadcast', // Broad marker or specific broadcast
      message: `New leave application requested by ${employee.name} (${reqDays} day(s) of ${leaveType}).`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Find admin to email notification (let's find the first Admin)
    const admin = db.users.findOne((u) => u.role === 'Admin');
    if (admin) {
      await sendEmail({
        to: admin.email,
        subject: `New Leave Application - ${employee.name}`,
        html: getLeaveRequestTemplate(employee.name, leaveType, startDate, endDate, reason),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: { leave, balance },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error applying for leave', error: err.message });
  }
});

// GET /api/leave/my
router.get('/my', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  let balance = db.leaveBalances.findOne((b) => b.userId === userId);
  if (!balance) {
    balance = db.leaveBalances.create({
      userId,
      annual: 20,
      sick: 10,
      casual: 10,
    });
  }

  const leaves = db.leaves.find((l) => l.userId === userId);
  
  // Sort reverse chronological
  leaves.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.json({
    success: true,
    message: 'Personal leave files retrieved',
    data: {
      leaves,
      balance,
    },
  });
});

// GET /api/leave/all (Admin/Manager only)
router.get('/all', authenticateJWT, authorizeRoles('Admin', 'Manager'), (req: AuthenticatedRequest, res: Response) => {
  const leaves = db.leaves.find();
  const employees = db.users.find();
  const employeeMap = new Map(employees.map(u => [u.id, u]));

  // Connect employee names
  const enrichedLeaves = leaves.map((lv) => {
    const emp = employeeMap.get(lv.userId);
    return {
      ...lv,
      employeeName: emp ? emp.name : 'Unknown Employee',
      department: emp ? emp.department : 'N/A',
    };
  });

  // Sort desc
  enrichedLeaves.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.json({ success: true, message: 'All leave applications retrieved', data: enrichedLeaves });
});

// PUT /api/leave/:id/status (approve/reject) (Admin/Manager only)
router.put('/:id/status', authenticateJWT, authorizeRoles('Admin', 'Manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  const reviewerId = req.user?.id;

  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, message: 'Please provide a valid status: approved or rejected' });
    return;
  }

  try {
    const leave = db.leaves.findById(id);
    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave request not found' });
      return;
    }

    if (leave.status !== 'pending') {
      res.status(400).json({ success: false, message: `Leave application is already reviewed and marked as ${leave.status}` });
      return;
    }

    const applicant = db.users.findById(leave.userId);
    if (!applicant) {
      res.status(404).json({ success: false, message: 'Applicant employee not found' });
      return;
    }

    const reviewer = db.users.findById(reviewerId || '');
    if (!reviewer) {
      res.status(401).json({ success: false, message: 'Reviewing user profile not found' });
      return;
    }

    // Business compliance check:
    // - Employees cannot approve their own leaves
    // - Managers cannot approve either other Managers or Admin requests (only Admins are final arbiters of managers/admins)
    if (leave.userId === reviewerId) {
      res.status(403).json({ success: false, message: 'You cannot approve or reject your own leave request.' });
      return;
    }

    if (reviewer.role === 'Manager') {
      if (applicant.role === 'Admin' || applicant.role === 'Manager') {
        res.status(403).json({ success: false, message: 'As a Manager, you cannot approve or reject leave requests for other Managers or Administrators.' });
        return;
      }
    }

    const reviewerName = reviewer.name;

    if (status === 'approved') {
      // Fetch employee balance
      const balance = db.leaveBalances.findOne((b) => b.userId === leave.userId);
      if (!balance) {
        res.status(500).json({ success: false, message: 'Error updating leave balance. Balance file is missing.' });
        return;
      }

      const reqDays = getDaysCount(leave.startDate, leave.endDate);
      const typeKey = leave.leaveType as 'annual' | 'sick' | 'casual';
      const availableDays = (balance as any)[typeKey] || 0;

      if (reqDays > availableDays) {
        res.status(400).json({
          success: false,
          message: `Cannot approve. Employee has insufficient leave balance (${availableDays} remaining format, requested ${reqDays})`
        });
        return;
      }

      // Deduct balance
      db.leaveBalances.update(balance.id, {
        [typeKey]: availableDays - reqDays,
      });

      // Add actual attendance mock status of present of type 'on-leave' for days range!
      // This allows the attendance logs to reflect the leave schedule correctly.
      try {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const currentIter = new Date(start);

        while (currentIter <= end) {
          const dateStr = currentIter.toISOString().split('T')[0];
          const existingAtt = db.attendance.findOne((a) => a.userId === leave.userId && a.date === dateStr);

          if (existingAtt) {
            db.attendance.update(existingAtt.id, {
              status: 'on-leave',
              clockIn: '09:00:00',
              clockOut: '17:00:00'
            });
          } else {
            db.attendance.create({
              userId: leave.userId,
              date: dateStr,
              clockIn: '09:00:00',
              clockOut: '17:00:00',
              status: 'on-leave'
            });
          }
          currentIter.setDate(currentIter.getDate() + 1);
        }
      } catch (scheduleError: any) {
        console.error('[Leave Approval] Failed to build attendance scheduler hooks:', scheduleError);
      }
    }

    // Update leave request
    const updatedLeave = db.leaves.update(id, {
      status,
      approvedBy: reviewerName,
    });

    // Create Notification
    db.notifications.create({
      userId: leave.userId,
      message: `Your leave request for ${leave.startDate} to ${leave.endDate} was ${status} by ${reviewerName}.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Send Email notification to applicant
    await sendEmail({
      to: applicant.email,
      subject: `Leave Application Update: ${status.toUpperCase()}`,
      html: getLeaveStatusTemplate(leave.leaveType, leave.startDate, leave.endDate, status as 'approved' | 'rejected', reviewerName),
    });

    res.json({
      success: true,
      message: `Leave request has been ${status}`,
      data: updatedLeave,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error reviewing leave request', error: err.message });
  }
});

export default router;
