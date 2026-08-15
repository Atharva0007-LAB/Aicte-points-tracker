import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/index';
import { ApiError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserRole, AuthUserResponse, Club, ClubStatus } from '../types/index';

export async function applyClub(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, club_name, description, club_description, email, password, full_name } = req.body;

    const clubName = (club_name || name || '').trim();
    const clubDesc = (club_description || description || '').trim();
    const adminEmail = (email || '').toLowerCase().trim();
    const adminName = (full_name || '').trim();

    if (!clubName || !adminEmail || !password || !adminName) {
      throw new ApiError(400, 'Club name, administrator full name, email, and password are required');
    }

    // Check if user email already exists
    const existingUser = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existingUser.rows.length > 0) {
      throw new ApiError(400, 'An account with this administrator email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = `usr_club_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clubId = `club_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Create user account with CLUB role
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, department)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, adminEmail, passwordHash, adminName, UserRole.CLUB, clubName]
    );

    // Create club entry with PENDING status
    await query(
      `INSERT INTO clubs (id, name, description, administrator_user_id, status)
       VALUES ($1, $2, $3, $4, 'PENDING')`,
      [clubId, clubName, clubDesc || null, userId]
    );

    // Immediately log the new administrator in
    req.session.userId = userId;
    req.session.userRole = UserRole.CLUB;

    const userResponse: AuthUserResponse = {
      id: userId,
      email: adminEmail,
      full_name: adminName,
      role: UserRole.CLUB,
      department: clubName,
      roll_number: null,
      division: null,
      year: null,
      club_id: clubId,
      club_name: clubName,
      club_status: 'PENDING',
    };

    res.status(201).json({
      message: 'Club application submitted successfully. Pending Super Admin approval.',
      user: userResponse,
      club: {
        id: clubId,
        name: clubName,
        description: clubDesc || null,
        administrator_user_id: userId,
        status: 'PENDING',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyClub(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { rows } = await query<Club>(
      `SELECT c.id, c.name, c.description, c.administrator_user_id, c.status, c.created_at, c.updated_at
       FROM clubs c
       WHERE c.administrator_user_id = $1`,
      [req.user.id]
    );

    res.status(200).json({ club: rows[0] || null });
  } catch (err) {
    next(err);
  }
}

export async function getAllClubs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { rows } = await query<Club>(
      `SELECT c.id, c.name, c.description, c.administrator_user_id, c.status, c.created_at, c.updated_at,
              u.full_name as admin_name, u.email as admin_email
       FROM clubs c
       LEFT JOIN users u ON c.administrator_user_id = u.id
       ORDER BY c.created_at DESC`
    );

    res.status(200).json({ clubs: rows });
  } catch (err) {
    next(err);
  }
}

export async function updateClubStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      throw new ApiError(400, 'Valid status is required (PENDING, APPROVED, or REJECTED)');
    }

    const { rows } = await query<Club>(
      `UPDATE clubs
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, description, administrator_user_id, status, created_at, updated_at`,
      [status, id]
    );

    if (rows.length === 0) {
      throw new ApiError(404, 'Club not found');
    }

    res.status(200).json({
      message: `Club application marked as ${status}`,
      club: rows[0],
    });
  } catch (err) {
    next(err);
  }
}
