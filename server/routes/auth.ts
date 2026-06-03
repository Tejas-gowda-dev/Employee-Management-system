import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { sendEmail, getWelcomeTemplate } from '../utils/email';

const router = Router();

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'ems_access_secret_token_default_key_2026';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'ems_refresh_secret_token_default_key_2026';

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password || !role || !department) {
    res.status(400).json({ success: false, message: 'Please provide all required fields' });
    return;
  }

  try {
    const existingUser = db.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An employee with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const joinDate = new Date().toISOString().split('T')[0];

    // Create user
    const newUser = db.users.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      department,
      documents: [],
      joinDate,
      isActive: true,
    });

    // Create default LeaveBalance
    db.leaveBalances.create({
      userId: newUser.id,
      annual: 20,
      sick: 10,
      casual: 10,
    });

    // Create Notification
    db.notifications.create({
      userId: newUser.id,
      message: `Welcome ${newUser.name}! Your account has been registered successfully.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Send Welcome Email
    await sendEmail({
      to: newUser.email,
      subject: 'Welcome to EMS - Account Registered',
      html: getWelcomeTemplate(newUser.name, newUser.email, newUser.role, newUser.department),
    });

    // Strip password from returned object
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      data: userWithoutPassword,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error during registration', error: err.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Please provide email and password' });
    return;
  }

  try {
    const user = db.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Generate JWTs
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' } // Large enough for preview usage, standard is 15m
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error during login', error: err.message });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logout successful' });
});

// Refresh Token
router.post('/refresh-token', (req: Request, res: Response): void => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    res.status(401).json({ success: false, message: 'Access denied. No refresh token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as { id: string };
    const user = db.users.findById(decoded.id);

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid token owner' });
      return;
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken },
    });
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

export default router;
