import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Employee';
  };
}

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'ems_access_secret_token_default_key_2026';

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Read token from cookie or Authorization header
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Access denied. No active session or token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
      id: string;
      email: string;
      role: 'Admin' | 'Manager' | 'Employee';
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired access token' });
  }
}

export function authorizeRoles(...roles: ('Admin' | 'Manager' | 'Employee')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Under present role (${req.user.role}), you do not have permission to access this resource`
      });
      return;
    }

    next();
  };
}
