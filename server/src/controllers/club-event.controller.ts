import { Response, NextFunction } from 'express';
import { query } from '../db/index';
import { ApiError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Club, ClubEvent } from '../types/index';

export async function createClubEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    // Verify user owns an APPROVED club
    const clubQuery = await query<Club>(
      'SELECT id, name, status FROM clubs WHERE administrator_user_id = $1',
      [req.user.id]
    );

    if (clubQuery.rows.length === 0 || clubQuery.rows[0].status !== 'APPROVED') {
      throw new ApiError(403, 'Forbidden - Only approved clubs can create events');
    }

    const club = clubQuery.rows[0];
    const { title, description, event_date, start_time, end_time, venue, points } = req.body;

    if (!title || !event_date || points === undefined || points === null) {
      throw new ApiError(400, 'Title, event date, and points value are required');
    }

    const pointsNum = parseInt(String(points), 10);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      throw new ApiError(400, 'Points must be a positive integer value');
    }

    const eventId = `cevt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const { rows } = await query<ClubEvent>(
      `INSERT INTO club_events (id, club_id, title, description, event_date, start_time, end_time, venue, points, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'UPCOMING')
       RETURNING *`,
      [
        eventId,
        club.id,
        title.trim(),
        description ? description.trim() : null,
        event_date,
        start_time ? start_time.trim() : null,
        end_time ? end_time.trim() : null,
        venue ? venue.trim() : null,
        pointsNum,
      ]
    );

    res.status(201).json({
      message: 'Club event created successfully',
      event: { ...rows[0], club_name: club.name },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyClubEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const clubQuery = await query<Club>(
      'SELECT id, name FROM clubs WHERE administrator_user_id = $1',
      [req.user.id]
    );

    if (clubQuery.rows.length === 0) {
      return res.status(200).json({ events: [] });
    }

    const club = clubQuery.rows[0];
    const { rows } = await query<ClubEvent>(
      `SELECT ce.*, $2 as club_name
       FROM club_events ce
       WHERE ce.club_id = $1
       ORDER BY ce.event_date DESC, ce.created_at DESC`,
      [club.id, club.name]
    );

    res.status(200).json({ events: rows });
  } catch (err) {
    next(err);
  }
}

export async function updateClubEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    // Verify club ownership and approval
    const clubQuery = await query<Club>(
      'SELECT id, name, status FROM clubs WHERE administrator_user_id = $1',
      [req.user.id]
    );

    if (clubQuery.rows.length === 0 || clubQuery.rows[0].status !== 'APPROVED') {
      throw new ApiError(403, 'Forbidden - Only approved clubs can edit events');
    }

    const club = clubQuery.rows[0];

    // Verify event belongs to this club
    const eventQuery = await query<ClubEvent>(
      'SELECT * FROM club_events WHERE id = $1 AND club_id = $2',
      [id, club.id]
    );

    if (eventQuery.rows.length === 0) {
      throw new ApiError(404, 'Event not found or does not belong to your club');
    }

    const current = eventQuery.rows[0];
    const { title, description, event_date, start_time, end_time, venue, points, status } = req.body;

    const newTitle = title !== undefined ? String(title).trim() : current.title;
    const newDesc = description !== undefined ? (description ? String(description).trim() : null) : current.description;
    const newDate = event_date !== undefined ? event_date : current.event_date;
    const newStart = start_time !== undefined ? (start_time ? String(start_time).trim() : null) : current.start_time;
    const newEnd = end_time !== undefined ? (end_time ? String(end_time).trim() : null) : current.end_time;
    const newVenue = venue !== undefined ? (venue ? String(venue).trim() : null) : current.venue;
    const newPoints = points !== undefined ? parseInt(String(points), 10) : current.points;
    const newStatus = status !== undefined && ['UPCOMING', 'COMPLETED', 'CANCELLED'].includes(status) ? status : current.status;

    const { rows } = await query<ClubEvent>(
      `UPDATE club_events
       SET title = $1, description = $2, event_date = $3, start_time = $4, end_time = $5, venue = $6, points = $7, status = $8
       WHERE id = $9 AND club_id = $10
       RETURNING *`,
      [newTitle, newDesc, newDate, newStart, newEnd, newVenue, newPoints, newStatus, id, club.id]
    );

    res.status(200).json({
      message: 'Club event updated successfully',
      event: { ...rows[0], club_name: club.name },
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelClubEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    // Verify club ownership and approval
    const clubQuery = await query<Club>(
      'SELECT id, name, status FROM clubs WHERE administrator_user_id = $1',
      [req.user.id]
    );

    if (clubQuery.rows.length === 0 || clubQuery.rows[0].status !== 'APPROVED') {
      throw new ApiError(403, 'Forbidden - Only approved clubs can cancel events');
    }

    const club = clubQuery.rows[0];

    const { rows } = await query<ClubEvent>(
      `UPDATE club_events
       SET status = 'CANCELLED'
       WHERE id = $1 AND club_id = $2
       RETURNING *`,
      [id, club.id]
    );

    if (rows.length === 0) {
      throw new ApiError(404, 'Event not found or does not belong to your club');
    }

    res.status(200).json({
      message: 'Club event cancelled successfully',
      event: { ...rows[0], club_name: club.name },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUpcomingClubEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { rows } = await query<ClubEvent>(
      `SELECT ce.id, ce.club_id, ce.title, ce.description, ce.event_date, ce.start_time, ce.end_time, ce.venue, ce.points, ce.status, ce.created_at,
              c.name as club_name
       FROM club_events ce
       JOIN clubs c ON ce.club_id = c.id
       WHERE c.status = 'APPROVED' AND ce.status = 'UPCOMING'
       ORDER BY ce.event_date ASC, ce.created_at ASC`
    );

    res.status(200).json({ events: rows });
  } catch (err) {
    next(err);
  }
}
