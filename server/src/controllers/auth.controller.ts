import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/index';
import { ApiError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User, AuthUserResponse, UserRole } from '../types/index';
import { seedDatabase } from '../db/seed';

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      throw new ApiError(400, 'Full name, email, and password are required');
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const trimmedName = String(full_name).trim();

    if (!normalizedEmail || !trimmedName || !password) {
      throw new ApiError(400, 'All fields are required');
    }

    // Check if email already exists
    const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      throw new ApiError(400, 'An account with this email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = `usr_stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Create user with STUDENT role
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, department, roll_number, division, year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, normalizedEmail, passwordHash, trimmedName, UserRole.STUDENT, null, null, null, null]
    );

    // Immediately log the user in
    req.session.userId = userId;
    req.session.userRole = UserRole.STUDENT;

    const userResponse: AuthUserResponse = {
      id: userId,
      email: normalizedEmail,
      full_name: trimmedName,
      role: UserRole.STUDENT,
      department: null,
      roll_number: null,
      division: null,
      year: null,
    };

    res.status(201).json({
      message: 'Student account created successfully',
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { roll_number, department, division, year } = req.body;

    // Validate department: exactly "COMPS" or "IT"
    if (!department || (department !== 'COMPS' && department !== 'IT')) {
      throw new ApiError(400, 'Department must be either "COMPS" or "IT"');
    }

    // Validate roll number
    const trimmedRoll = roll_number ? String(roll_number).trim() : '';
    if (!trimmedRoll) {
      throw new ApiError(400, 'Roll number is required');
    }

    // Check if roll number is already taken by another account
    const existingRoll = await query<{ id: string }>(
      'SELECT id FROM users WHERE LOWER(roll_number) = LOWER($1) AND id != $2',
      [trimmedRoll, req.user.id]
    );

    if (existingRoll.rows.length > 0) {
      throw new ApiError(400, 'Roll number is already in use by another account');
    }

    const trimmedDivision = division ? String(division).trim() : null;
    const trimmedYear = year ? String(year).trim() : null;

    await query(
      `UPDATE users
       SET roll_number = $1, department = $2, division = $3, year = $4
       WHERE id = $5`,
      [trimmedRoll, department, trimmedDivision, trimmedYear, req.user.id]
    );

    const userResponse: AuthUserResponse = {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
      department,
      roll_number: trimmedRoll,
      division: trimmedDivision,
      year: trimmedYear,
    };

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const { rows } = await query<User & { password_hash: string }>(
      'SELECT id, email, password_hash, full_name, role, department, roll_number, division, year FROM users WHERE email = $1',
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

    let club_id: string | null = null;
    let club_name: string | null = null;
    let club_status: any = null;

    if (user.role === UserRole.CLUB) {
      const clubRes = await query<{ id: string; name: string; status: string }>(
        'SELECT id, name, status FROM clubs WHERE administrator_user_id = $1',
        [user.id]
      );
      if (clubRes.rows.length > 0) {
        club_id = clubRes.rows[0].id;
        club_name = clubRes.rows[0].name;
        club_status = clubRes.rows[0].status;
      }
    }

    const userResponse: AuthUserResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department || null,
      roll_number: user.roll_number || null,
      division: user.division || null,
      year: user.year || null,
      club_id,
      club_name,
      club_status,
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

    let club_id: string | null = null;
    let club_name: string | null = null;
    let club_status: any = null;

    if (req.user.role === UserRole.CLUB) {
      const clubRes = await query<{ id: string; name: string; status: string }>(
        'SELECT id, name, status FROM clubs WHERE administrator_user_id = $1',
        [req.user.id]
      );
      if (clubRes.rows.length > 0) {
        club_id = clubRes.rows[0].id;
        club_name = clubRes.rows[0].name;
        club_status = clubRes.rows[0].status;
      }
    }

    const userResponse: AuthUserResponse = {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
      department: req.user.department || null,
      roll_number: req.user.roll_number || null,
      division: req.user.division || null,
      year: req.user.year || null,
      club_id,
      club_name,
      club_status,
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
