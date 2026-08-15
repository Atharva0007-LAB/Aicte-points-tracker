import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { query } from '../db/index';
import { ApiError } from '../middleware/error.middleware';

export async function getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { rows } = await query(
      'SELECT id, email, full_name, role, department, created_at FROM users ORDER BY created_at DESC'
    );
    res.status(200).json({ users: rows });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { email, password, full_name, role, department } = req.body;
    if (!email || !password || !full_name || !role) {
      throw new ApiError(400, 'Email, Password, Full Name, and Role are required');
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    const id = `usr_${Date.now()}`;

    await query(`
      INSERT INTO users (id, email, password_hash, full_name, role, department)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, email.toLowerCase().trim(), hash, full_name, role, department || null]);

    res.status(201).json({ message: 'User account created successfully', userId: id });
  } catch (err) {
    next(err);
  }
}

export async function getSystemAudit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const usersCount = await query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const eventsCount = await query('SELECT COUNT(*) as total FROM events');
    const claimsCount = await query('SELECT status, COUNT(*) as count, SUM(points_awarded) as points FROM student_activities GROUP BY status');
    const certsCount = await query('SELECT COUNT(*) as total FROM certificates');

    res.status(200).json({
      users: usersCount.rows,
      totalEvents: parseInt(eventsCount.rows[0]?.total || '0', 10),
      claims: claimsCount.rows,
      totalCertificatesIssued: parseInt(certsCount.rows[0]?.total || '0', 10),
    });
  } catch (err) {
    next(err);
  }
}
