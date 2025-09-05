import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Extend Express Request to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session: {
        userId?: string;
        destroy: (callback: (err?: any) => void) => void;
        save: (callback?: (err?: any) => void) => void;
        reload: (callback: (err?: any) => void) => void;
        touch: () => void;
        resetMaxAge: () => void;
      };
    }
  }
}

// Hash password utility
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password utility
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Role-based access control middleware
export const requireRole = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || (user.role !== role && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking user role' });
    }
  };
};

// Multiple roles middleware
export const requireAnyRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || (!roles.includes(user.role) && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking user role' });
    }
  };
};

// Populate user middleware (for protected routes)
export const populateUser = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error('Error populating user:', error);
    }
  }
  next();
};