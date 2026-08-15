import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error.middleware';
import { UserRole, User } from '../types/index';
import { query } from '../db/index';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.session || !req.session.userId) {
      throw new ApiError(401, 'Unauthorized - Session invalid or expired');
    }

    const { rows } = await query<User>(
      'SELECT id, email, full_name, role, department, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (rows.length === 0) {
      req.session.destroy(() => {});
      throw new ApiError(401, 'User account no longer exists');
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(
          403,
          `Forbidden - Requires one of the following roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
