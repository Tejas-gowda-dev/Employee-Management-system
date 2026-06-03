import { Router, Response } from 'express';
import db from '../config/db';
import { authenticateJWT, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to calculate status based on clockIn and clockOut durations
function calculateStatus(clockInStr: string, clockOutStr: string): 'present' | 'half-day' | 'absent' {
  try {
    const [inH, inM, inS] = clockInStr.split(':').map(Number);
    const [outH, outM, outS] = clockOutStr.split(':').map(Number);

    const inDate = new Date(2026, 0, 1, inH, inM, inS || 0);
    const outDate = new Date(2026, 0, 1, outH, outM, outS || 0);

    const diffMs = outDate.getTime() - inDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= 7.5) {
      return 'present';
    } else if (diffHours >= 4) {
      return 'half-day';
    } else {
      return 'absent'; // Clocked out way too early, counted as absent or half-day depending on policy
    }
  } catch {
    return 'present';
  }
}

// POST /api/attendance/clock-in
router.post('/clock-in', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Invalid token session' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  // Ensure they have not clocked in already
  const existingRecord = db.attendance.findOne((a) => a.userId === userId && a.date === today);
  if (existingRecord) {
    res.status(400).json({ success: false, message: `You already clocked in today at ${existingRecord.clockIn}` });
    return;
  }

  const record = db.attendance.create({
    userId,
    date: today,
    clockIn: currentTime,
    status: 'present', // Defaults as present on clock-in
  });

  // Log Notification
  db.notifications.create({
    userId,
    message: `You clocked in successfully at ${currentTime}.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    message: 'Clock-in recorded successfully',
    data: record,
  });
});

// POST /api/attendance/clock-out
router.post('/clock-out', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Invalid token session' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  // Find their clock-in record for today
  const record = db.attendance.findOne((a) => a.userId === userId && a.date === today);
  if (!record) {
    res.status(400).json({ success: false, message: 'No clock-in record found for today. Please clock-in first.' });
    return;
  }

  if (record.clockOut) {
    res.status(400).json({ success: false, message: `You have already clocked out today at ${record.clockOut}` });
    return;
  }

  const updatedStatus = calculateStatus(record.clockIn, currentTime);

  const updatedRecord = db.attendance.update(record.id, {
    clockOut: currentTime,
    status: updatedStatus,
  });

  // Log Notification
  db.notifications.create({
    userId,
    message: `You clocked out successfully at ${currentTime}. Status: ${updatedStatus}.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Clock-out recorded successfully',
    data: updatedRecord,
  });
});

// GET /api/attendance/my
router.get('/my', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  const { startDate, endDate } = req.query;

  let records = db.attendance.find((a) => a.userId === userId);

  // Apply filters if provided
  if (startDate) {
    records = records.filter((r) => r.date >= (startDate as string));
  }
  if (endDate) {
    records = records.filter((r) => r.date <= (endDate as string));
  }

  // Sort chronological descending
  records.sort((a, b) => b.date.localeCompare(a.date));

  res.json({ success: true, message: 'Personal attendance history retrieved', data: records });
});

// GET /api/attendance/all (Admin/Manager only)
router.get('/all', authenticateJWT, authorizeRoles('Admin', 'Manager'), (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, department } = req.query;

  let records = db.attendance.find();

  // Jointly compile employee identities
  const employees = db.users.find();
  const employeeMap = new Map(employees.map(u => [u.id, u]));

  // Connect employee names and departments on records
  let enrichedRecords = records.map((rec) => {
    const emp = employeeMap.get(rec.userId);
    return {
      ...rec,
      employeeName: emp ? emp.name : 'Unknown Employee',
      department: emp ? emp.department : 'N/A',
    };
  });

  // Apply filters
  if (startDate) {
    enrichedRecords = enrichedRecords.filter((r) => r.date >= (startDate as string));
  }
  if (endDate) {
    enrichedRecords = enrichedRecords.filter((r) => r.date <= (endDate as string));
  }
  if (department) {
    enrichedRecords = enrichedRecords.filter((r) => r.department.toLowerCase() === (department as string).toLowerCase());
  }

  // Sort by date desc
  enrichedRecords.sort((a, b) => b.date.localeCompare(a.date));

  res.json({ success: true, message: 'All employees attendance logs retrieved', data: enrichedRecords });
});

export default router;
