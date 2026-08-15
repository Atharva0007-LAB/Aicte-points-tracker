import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/index';
import { ApiError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User, AuthUserResponse } from '../types/index';
import { seedDatabase } from '../db/seed';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const { rows } = await query<User & { password_hash: string }>(
      'SELECT id, email, password_hash, full_name, role, department FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Set server-side session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    const userResponse: AuthUserResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department || null,
    };

    res.status(200).json({
      message: 'Logged in successfully',
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(new ApiError(500, 'Failed to log out session'));
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const userResponse: AuthUserResponse = {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
      department: req.user.department || null,
    };

    res.status(200).json({ user: userResponse });
  } catch (err) {
    next(err);
  }
}

export async function triggerSeed(req: Request, res: Response, next: NextFunction) {
  try {
    await seedDatabase();
    res.status(200).json({ message: 'Database successfully seeded with default roles and accounts' });
  } catch (err) {
    next(err);
  }
}
