import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { query } from '../db/index';
import { ApiError } from '../middleware/error.middleware';
import { UserRole, Club } from '../types/index';

export async function getActivities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;

    if (user.role === UserRole.STUDENT) {
      // Get student's activity ledger
      const { rows } = await query(`
        SELECT a.id, a.student_id, a.student_name, a.event_id, e.title as event_title, a.club_event_id,
               a.category_id, c.name as category_name, c.max_points, a.title, a.points_requested, a.points_awarded,
               a.proof_details, a.status, a.target_type, a.target_club_id, cl.name as target_club_name,
               a.reviewed_by, a.reviewer_role, a.rejection_reason, a.created_at
        FROM student_activities a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN events e ON a.event_id = e.id
        LEFT JOIN clubs cl ON a.target_club_id = cl.id
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
    } else if (user.role === UserRole.CLUB) {
      // CLUB-role: only claims where target_type='CLUB' and target_club_id matches their own club
      const clubQuery = await query<Club>(
        'SELECT id, name FROM clubs WHERE administrator_user_id = $1',
        [user.id]
      );

      if (clubQuery.rows.length === 0) {
        return res.status(200).json({ activities: [] });
      }

      const myClubId = clubQuery.rows[0].id;
      const { rows } = await query(`
        SELECT a.id, a.student_id, a.student_name, a.event_id, e.title as event_title, a.club_event_id,
               a.category_id, c.name as category_name, a.title, a.points_requested, a.points_awarded,
               a.proof_details, a.status, a.target_type, a.target_club_id, cl.name as target_club_name,
               a.reviewed_by, a.reviewer_role, a.rejection_reason, a.created_at
        FROM student_activities a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN events e ON a.event_id = e.id
        LEFT JOIN clubs cl ON a.target_club_id = cl.id
        WHERE a.target_type = 'CLUB' AND a.target_club_id = $1
        ORDER BY CASE WHEN a.status = 'PENDING' THEN 1 ELSE 2 END, a.created_at DESC
      `, [myClubId]);

      res.status(200).json({ activities: rows });
    } else if (user.role === UserRole.TNP) {
      // TNP-role: only claims where target_type='TNP'
      const { rows } = await query(`
        SELECT a.id, a.student_id, a.student_name, a.event_id, e.title as event_title, a.club_event_id,
               a.category_id, c.name as category_name, a.title, a.points_requested, a.points_awarded,
               a.proof_details, a.status, a.target_type, a.target_club_id, cl.name as target_club_name,
               a.reviewed_by, a.reviewer_role, a.rejection_reason, a.created_at
        FROM student_activities a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN events e ON a.event_id = e.id
        LEFT JOIN clubs cl ON a.target_club_id = cl.id
        WHERE a.target_type = 'TNP'
        ORDER BY CASE WHEN a.status = 'PENDING' THEN 1 ELSE 2 END, a.created_at DESC
      `);

      res.status(200).json({ activities: rows });
    } else {
      // SUPER_ADMIN: sees all claims
      const { rows } = await query(`
        SELECT a.id, a.student_id, a.student_name, a.event_id, e.title as event_title, a.club_event_id,
               a.category_id, c.name as category_name, a.title, a.points_requested, a.points_awarded,
               a.proof_details, a.status, a.target_type, a.target_club_id, cl.name as target_club_name,
               a.reviewed_by, a.reviewer_role, a.rejection_reason, a.created_at
        FROM student_activities a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN events e ON a.event_id = e.id
        LEFT JOIN clubs cl ON a.target_club_id = cl.id
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
    const { title, category_id, target_type, target_club_id, event_id, proof_details } = req.body;
    if (!title || !category_id || !target_type) {
      throw new ApiError(400, 'Title, Category, and Target Type are required');
    }

    if (!['CLUB', 'TNP'].includes(target_type)) {
      throw new ApiError(400, 'Target type must be CLUB or TNP');
    }

    let finalClubId: string | null = null;
    if (target_type === 'CLUB') {
      if (!target_club_id) {
        throw new ApiError(400, 'target_club_id is required when target_type is CLUB');
      }
      const clubCheck = await query<Club>(
        'SELECT id, status FROM clubs WHERE id = $1',
        [target_club_id]
      );
      if (clubCheck.rows.length === 0 || clubCheck.rows[0].status !== 'APPROVED') {
        throw new ApiError(400, 'target_club_id must refer to an APPROVED club');
      }
      finalClubId = target_club_id;
    }

    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const student_id = req.user!.id;
    const student_name = req.user!.full_name;

    await query(`
      INSERT INTO student_activities (id, student_id, student_name, event_id, category_id, title, points_requested, points_awarded, proof_details, target_type, target_club_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, 0, 0, $7, $8, $9, 'PENDING')
    `, [id, student_id, student_name, event_id || null, category_id, title.trim(), proof_details || '', target_type, finalClubId]);

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

    const { rows } = await query(
      'SELECT id, target_type, target_club_id, status FROM student_activities WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      throw new ApiError(404, 'Activity claim not found');
    }

    const claim = rows[0];

    // Authorization checks based on reviewer role
    if (reviewer_role === UserRole.CLUB) {
      const clubQuery = await query<Club>(
        'SELECT id FROM clubs WHERE administrator_user_id = $1',
        [reviewer_id]
      );
      if (clubQuery.rows.length === 0) {
        throw new ApiError(403, 'Forbidden - No associated club found for this reviewer');
      }
      const myClubId = clubQuery.rows[0].id;
      if (claim.target_type !== 'CLUB' || claim.target_club_id !== myClubId) {
        throw new ApiError(403, 'Forbidden - You can only review claims submitted to your club');
      }
    } else if (reviewer_role === UserRole.TNP) {
      if (claim.target_type !== 'TNP') {
        throw new ApiError(403, 'Forbidden - You can only review claims submitted to T&P');
      }
    } else if (reviewer_role !== UserRole.SUPER_ADMIN) {
      throw new ApiError(403, 'Forbidden - Unauthorized to review activity claims');
    }

    let finalPoints = 0;
    if (status === 'APPROVED') {
      if (points_awarded === undefined || points_awarded === null || isNaN(Number(points_awarded)) || Number(points_awarded) <= 0) {
        throw new ApiError(400, 'points_awarded must be explicitly provided as a positive number upon approval');
      }
      finalPoints = parseInt(String(points_awarded), 10);
    }

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

    res.status(200).json({ message: `Activity claim ${status.toLowerCase()} successfully`, points_awarded: finalPoints });
  } catch (err) {
    next(err);
  }
}

