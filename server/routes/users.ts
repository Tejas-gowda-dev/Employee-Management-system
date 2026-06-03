import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../config/db';
import { authenticateJWT, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB file size
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, Word documents are allowed!'));
    }
  },
});

// GET /api/users (Admin only)
router.get('/', authenticateJWT, authorizeRoles('Admin', 'Manager'), (req: AuthenticatedRequest, res: Response) => {
  const users = db.users.find();
  // Strip passwords for security
  const cleanUsers = users.map(({ password: _, ...u }) => u);
  res.json({ success: true, message: 'Employees retrieved successfully', data: cleanUsers });
});

// GET /api/users/:id
router.get('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;

  // Non-Admins/Managers can only view themselves
  if (req.user?.role !== 'Admin' && req.user?.role !== 'Manager' && req.user?.id !== id) {
    res.status(403).json({ success: false, message: 'Access Denied. You cannot view other employees profiles' });
    return;
  }

  const user = db.users.findById(id);
  if (!user) {
    res.status(404).json({ success: false, message: 'Employee not found' });
    return;
  }

  const { password: _, ...cleanUser } = user;
  res.json({ success: true, message: 'Employee profile retrieved', data: cleanUser });
});

// PUT /api/users/:id
router.put('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { name, email, role, department, isActive } = req.body;

  const currentLoggedInUser = req.user;
  if (!currentLoggedInUser) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  // Check editing authorization
  const isSelf = currentLoggedInUser.id === id;
  const isAdmin = currentLoggedInUser.role === 'Admin';
  const isManager = currentLoggedInUser.role === 'Manager';

  if (!isAdmin && !isManager && !isSelf) {
    res.status(403).json({ success: false, message: 'Permission denied' });
    return;
  }

  const targetUser = db.users.findById(id);
  if (!targetUser) {
    res.status(404).json({ success: false, message: 'Employee not found' });
    return;
  }

  // Restrict who can modify role, department, active status
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email.toLowerCase();

  if (isAdmin || isManager) {
    if (department !== undefined) updateData.department = department;
    if (role !== undefined) {
      // Only Admin can grant admin role
      if (role === 'Admin' && currentLoggedInUser.role !== 'Admin') {
        res.status(403).json({ success: false, message: 'Only administrators can assign the Admin role' });
        return;
      }
      updateData.role = role;
    }
    if (isActive !== undefined && isAdmin) {
      // Managers can't deactivate admins or managers, only Admins have this direct access
      updateData.isActive = isActive;
    }
  }

  const updatedUser = db.users.update(id, updateData);
  if (!updatedUser) {
    res.status(404).json({ success: false, message: 'Failed to update employee' });
    return;
  }

  const { password: _, ...cleanUser } = updatedUser;
  res.json({ success: true, message: 'Employee profile updated successfully', data: cleanUser });
});

// DELETE /api/users/:id (Admin only)
router.delete('/:id', authenticateJWT, authorizeRoles('Admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;

  if (req.user?.id === id) {
    res.status(400).json({ success: false, message: 'You cannot delete your own Administrator account' });
    return;
  }

  const user = db.users.findById(id);
  if (!user) {
    res.status(404).json({ success: false, message: 'Employee not found' });
    return;
  }

  db.users.delete(id);
  
  // Clean up employee's associated data
  const userLeaves = db.leaves.find((l) => l.userId === id);
  userLeaves.forEach((l) => db.leaves.delete(l.id));
  
  const userAttendance = db.attendance.find((a) => a.userId === id);
  userAttendance.forEach((a) => db.attendance.delete(a.id));

  const userBalance = db.leaveBalances.findOne((b) => b.userId === id);
  if (userBalance) {
    db.leaveBalances.delete(userBalance.id);
  }

  res.json({ success: true, message: 'Employee and all associated records deleted successfully' });
});

// POST /api/users/:id/upload (profile picture and documents)
router.post(
  '/:id/upload',
  authenticateJWT,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'document', maxCount: 5 }
  ]),
  (req: AuthenticatedRequest, res: Response): void => {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const user = db.users.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // Only self or Admin/Manager can upload
    if (req.user?.id !== id && req.user?.role !== 'Admin' && req.user?.role !== 'Manager') {
      res.status(403).json({ success: false, message: 'Access denied. Unauthorized file upload' });
      return;
    }

    const updates: any = {};

    // Process profile picture profilePhoto
    if (files && files.profilePicture && files.profilePicture.length > 0) {
      const pfFile = files.profilePicture[0];
      updates.profilePicture = `/uploads/${pfFile.filename}`;
    }

    // Process document files
    if (files && files.document && files.document.length > 0) {
      const newDocs = files.document.map((docFile) => ({
        name: docFile.originalname,
        path: `/uploads/${docFile.filename}`,
      }));
      updates.documents = [...(user.documents || []), ...newDocs];
    }

    const updatedUser = db.users.update(id, updates);
    if (!updatedUser) {
      res.status(500).json({ success: false, message: 'Error saving profile file updates' });
      return;
    }

    const { password: _, ...cleanUser } = updatedUser;
    res.json({
      success: true,
      message: 'Files uploaded and processed successfully!',
      data: cleanUser,
    });
  }
);

export default router;
