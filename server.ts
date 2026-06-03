import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';

import db from './server/config/db';
import authRoutes from './server/routes/auth';
import usersRoutes from './server/routes/users';
import attendanceRoutes from './server/routes/attendance';
import leaveRoutes from './server/routes/leave';
import dashboardRoutes from './server/routes/dashboard';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Express Configuration
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Ensure uploads directory exists and is served statically
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Automatically Seed Default Admin if none exists
  try {
    const adminUser = db.users.findOne((u) => u.role === 'Admin');
    if (!adminUser) {
      console.log('[Database Seeder] No administrator found. Seeding a default Admin account...');
      const defaultPassword = 'adminpassword123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      const seededAdmin = db.users.create({
        name: 'EMS System Administrator',
        email: 'admin@ems.com',
        password: hashedPassword,
        role: 'Admin',
        department: 'Executive Services',
        documents: [],
        joinDate: new Date().toISOString().split('T')[0],
        isActive: true,
      });

      // Default LeaveBalance
      db.leaveBalances.create({
        userId: seededAdmin.id,
        annual: 20,
        sick: 10,
        casual: 10,
      });

      console.log(`[Database Seeder] Default Admin created successfully!`);
      console.log(`- Email: admin@ems.com`);
      console.log(`- Password: adminpassword123`);
    } else {
      console.log('[Database Seeder] Admin user already exists.');
    }
  } catch (error) {
    console.error('[Database Seeder] Failed to seed default Admin:', error);
  }

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is healthy', timestamp: new Date() });
  });

  // Integrate Vite Dev Server Middleware in non-production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server Setup] Vite Dev Server mounted as Express middleware');
  } else {
    // Production: Serve the single-page application from build assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server Setup] Serving built static assets from /dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server Ready] Employee Management System is running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[Server Crash] Fatal error during startup:', error);
});
