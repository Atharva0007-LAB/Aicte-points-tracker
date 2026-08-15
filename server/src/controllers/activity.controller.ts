import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { query } from '../db/index';
import { ApiError } from '../middleware/error.middleware';
import { UserRole } from '../types/index';

export async function getActivities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;

    if (user.role === UserRole.STUDENT) {
      // Get student's activity ledger
      const { rows } = await query(`
        SELECT a.id, a.student_id, a.student_name, a.event_id, e.title as event_title, a.category_id, c.name as category_name, c.max_points, a.title, a.points_requested, a.points_awarded, a.proof_details, a.status, a.reviewer_role, a.rejection_reason, a.created_at
        FROM student_activities a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN events e ON a.event_id = e.id
        WHERE a.student_id = $1
        ORDER BY a.created_at DESC
      `, [user.id]);

      // Compute total approved points and category totals
      let totalPoints = 0;
      const categoryTotals: Record<string, { name: string; points: number; max: number }> = {};

      for (const act of rows) {
        if (act.status === 'APPROVED') {
          totalPoints += act.points_awarded;
          if (!categoryTotals[act.category_id]) {
            categoryTotals[act.category_id] = {
              name: act.category_name || 'General',
              points: 0,
              max: act.max_points || 40,
            };
          }
          categoryTotals[act.category_id].points += act.points_awarded;
        }
      }

      res.status(200).json({
        activities: rows,
        summary: {
          totalPoints: Math.min(100, totalPoints),
          rawTotalPoints: totalPoints,
          targetPoints: 100,
          isEligibleForCertificate: totalPoints >= 100,
          categoryTotals,
        },
      });
    } else {
      // For Admin, Club, TNP: return all claims
      const { rows } = await query(`
        SELECT a.id, a.student_id, a.student_name, a.event_id, e.title as event_title, a.category_id, c.name as category_name, a.title, a.points_requested, a.points_awarded, a.proof_details, a.status, a.reviewed_by, a.reviewer_role, a.rejection_reason, a.created_at
        FROM student_activities a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN events e ON a.event_id = e.id
        ORDER BY CASE WHEN a.status = 'PENDING' THEN 1 ELSE 2 END, a.created_at DESC
      `);

      res.status(200).json({ activities: rows });
    }
  } catch (err) {
    next(err);
  }
}

export async function claimActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, category_id, event_id, points_requested, proof_details } = req.body;
    if (!title || !category_id || !points_requested) {
      throw new ApiError(400, 'Title, Category, and Points Requested are required');
    }

    const id = `act_${Date.now()}`;
    const student_id = req.user!.id;
    const student_name = req.user!.full_name;

    await query(`
      INSERT INTO student_activities (id, student_id, student_name, event_id, category_id, title, points_requested, points_awarded, proof_details, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 'PENDING')
    `, [id, student_id, student_name, event_id || null, category_id, title, parseInt(points_requested, 10), proof_details || '']);

    res.status(201).json({ message: 'Activity point claim submitted successfully', activityId: id });
  } catch (err) {
    next(err);
  }
}

export async function reviewActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, points_awarded, rejection_reason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new ApiError(400, 'Status must be APPROVED or REJECTED');
    }

    const reviewer_id = req.user!.id;
    const reviewer_role = req.user!.role;

    const { rows } = await query('SELECT id, points_requested FROM student_activities WHERE id = $1', [id]);
    if (rows.length === 0) {
      throw new ApiError(404, 'Activity claim not found');
    }

    const finalPoints = status === 'APPROVED' ? (points_awarded !== undefined ? parseInt(points_awarded, 10) : rows[0].points_requested) : 0;

    await query(`
      UPDATE student_activities
      SET status = $1,
          points_awarded = $2,
          reviewed_by = $3,
          reviewer_role = $4,
          rejection_reason = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [status, finalPoints, reviewer_id, reviewer_role, rejection_reason || null, id]);

    res.status(200).json({ message: `Activity claim ${status.toLowerCase()} successfully` });
  } catch (err) {
    next(err);
  }
}
