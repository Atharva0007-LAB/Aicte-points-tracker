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
    const studentId = req.user?.id || null;

    const { rows } = await query<ClubEvent & { attendance_confirmed: boolean }>(
      `SELECT ce.id, ce.club_id, ce.title, ce.description, ce.event_date, ce.start_time, ce.end_time, ce.venue, ce.points, ce.status, ce.attendance_confirmed, ce.created_at,
              c.name as club_name,
              (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = ce.id)::int as registration_count,
              CASE WHEN $1::text IS NOT NULL AND EXISTS(
                SELECT 1 FROM event_registrations er2 WHERE er2.event_id = ce.id AND er2.student_id = $1
              ) THEN TRUE ELSE FALSE END as is_registered,
              CASE WHEN $1::text IS NOT NULL AND EXISTS(
                SELECT 1 FROM club_memberships cm WHERE cm.club_id = ce.club_id AND cm.student_id = $1 AND cm.status = 'ACCEPTED'
              ) THEN TRUE ELSE FALSE END as is_member,
              (SELECT cm2.status FROM club_memberships cm2 WHERE cm2.club_id = ce.club_id AND cm2.student_id = $1) as membership_status
       FROM club_events ce
       JOIN clubs c ON ce.club_id = c.id
       WHERE c.status = 'APPROVED' AND ce.status = 'UPCOMING'
       ORDER BY ce.event_date ASC, ce.created_at ASC`,
      [studentId]
    );

    res.status(200).json({ events: rows });
  } catch (err) {
    next(err);
  }
}

// Student: Register for a club event (Members only)
export async function registerForEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params; // event_id
    const studentId = req.user.id;

    // Fetch event details
    const eventQuery = await query<ClubEvent & { attendance_confirmed: boolean }>(
      'SELECT id, club_id, title, status, attendance_confirmed FROM club_events WHERE id = $1',
      [id]
    );

    if (eventQuery.rows.length === 0) {
      throw new ApiError(404, 'Event not found');
    }

    const event = eventQuery.rows[0];

    if (event.status === 'CANCELLED') {
      throw new ApiError(400, 'Cannot register for a cancelled event');
    }

    if (event.attendance_confirmed) {
      throw new ApiError(400, 'Registration is closed. Attendance has already been confirmed for this event.');
    }

    // Verify student is an ACCEPTED member of the club
    const memberQuery = await query(
      'SELECT id, status FROM club_memberships WHERE club_id = $1 AND student_id = $2',
      [event.club_id, studentId]
    );

    if (memberQuery.rows.length === 0 || memberQuery.rows[0].status !== 'ACCEPTED') {
      throw new ApiError(403, 'Event registration is restricted to accepted club members only. Please join the club first.');
    }

    // Check if already registered
    const regCheck = await query(
      'SELECT id FROM event_registrations WHERE event_id = $1 AND student_id = $2',
      [id, studentId]
    );

    if (regCheck.rows.length > 0) {
      return res.status(200).json({ message: 'Already registered for this event' });
    }

    const regId = `ereg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await query(
      'INSERT INTO event_registrations (id, event_id, student_id) VALUES ($1, $2, $3)',
      [regId, id, studentId]
    );

    res.status(201).json({ message: 'Registered for event successfully' });
  } catch (err) {
    next(err);
  }
}

// Student: Unregister from a club event (only before attendance confirmation)
export async function unregisterFromEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params; // event_id
    const studentId = req.user.id;

    // Fetch event details
    const eventQuery = await query<ClubEvent & { attendance_confirmed: boolean }>(
      'SELECT id, attendance_confirmed FROM club_events WHERE id = $1',
      [id]
    );

    if (eventQuery.rows.length === 0) {
      throw new ApiError(404, 'Event not found');
    }

    const event = eventQuery.rows[0];

    if (event.attendance_confirmed) {
      throw new ApiError(400, 'Cannot unregister after event attendance has been confirmed.');
    }

    await query(
      'DELETE FROM event_registrations WHERE event_id = $1 AND student_id = $2',
      [id, studentId]
    );

    res.status(200).json({ message: 'Unregistered from event successfully' });
  } catch (err) {
    next(err);
  }
}

// Club Lead: Get registered attendees for an event with academic details & attendance status
export async function getEventAttendees(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params; // event_id

    // Verify club owns this event
    const clubQuery = await query<Club>(
      'SELECT id FROM clubs WHERE administrator_user_id = $1',
      [req.user.id]
    );

    if (clubQuery.rows.length === 0) {
      throw new ApiError(403, 'Forbidden - Only club administrators can view event attendees');
    }

    const clubId = clubQuery.rows[0].id;
    const eventQuery = await query<ClubEvent & { attendance_confirmed: boolean }>(
      'SELECT * FROM club_events WHERE id = $1 AND club_id = $2',
      [id, clubId]
    );

    if (eventQuery.rows.length === 0) {
      throw new ApiError(404, 'Event not found or does not belong to your club');
    }

    const event = eventQuery.rows[0];

    // Fetch registered attendees
    const { rows } = await query(
      `SELECT er.student_id, u.full_name as student_name, u.email, u.roll_number, u.department, u.division, u.year,
              er.created_at as registered_at,
              ea.present
       FROM event_registrations er
       JOIN users u ON er.student_id = u.id
       LEFT JOIN event_attendance ea ON ea.event_id = er.event_id AND ea.student_id = er.student_id
       WHERE er.event_id = $1
       ORDER BY u.full_name ASC`,
      [id]
    );

    res.status(200).json({
      event,
      attendees: rows,
      attendance_confirmed: Boolean(event.attendance_confirmed),
    });
  } catch (err) {
    next(err);
  }
}

// Club Lead: Confirm attendance & automatically grant points
export async function confirmEventAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params; // event_id
    const { attendance } = req.body; // Array of { student_id: string, present: boolean }

    if (!Array.isArray(attendance)) {
      throw new ApiError(400, 'Attendance must be provided as an array of student attendance records');
    }

    // Verify club owns this event
    const clubQuery = await query<Club>(
      'SELECT id FROM clubs WHERE administrator_user_id = $1',
      [req.user.id]
    );

    if (clubQuery.rows.length === 0) {
      throw new ApiError(403, 'Forbidden - Only club administrators can confirm event attendance');
    }

    const clubId = clubQuery.rows[0].id;
    const eventQuery = await query<ClubEvent & { attendance_confirmed: boolean }>(
      'SELECT * FROM club_events WHERE id = $1 AND club_id = $2',
      [id, clubId]
    );

    if (eventQuery.rows.length === 0) {
      throw new ApiError(404, 'Event not found or does not belong to your club');
    }

    const event = eventQuery.rows[0];

    if (event.attendance_confirmed) {
      throw new ApiError(400, 'Attendance for this event has already been confirmed and locked.');
    }

    // Record attendance for all submitted records
    for (const record of attendance) {
      const studentId = record.student_id;
      const isPresent = Boolean(record.present);
      const attId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await query(
        `INSERT INTO event_attendance (id, event_id, student_id, present)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id, student_id) DO UPDATE SET present = EXCLUDED.present`,
        [attId, id, studentId, isPresent]
      );

      // If present, auto-grant points into student_activities directly
      if (isPresent) {
        // Check if student already has a record for this club_event_id
        const existingAct = await query(
          'SELECT id FROM student_activities WHERE club_event_id = $1 AND student_id = $2',
          [id, studentId]
        );

        if (existingAct.rows.length === 0) {
          const userQuery = await query<{ full_name: string }>('SELECT full_name FROM users WHERE id = $1', [studentId]);
          const studentName = userQuery.rows[0]?.full_name || 'Student';
          const actId = `act_cevt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

          await query(
            `INSERT INTO student_activities
              (id, student_id, student_name, event_id, club_event_id, category_id, title, points_requested, points_awarded, proof_details, target_type, target_club_id, status, reviewed_by, reviewer_role)
             VALUES
              ($1, $2, $3, NULL, $4, 'cat_club_event', $5, $6, $6, 'Auto-awarded for confirmed attendance', 'CLUB', $7, 'APPROVED', $8, 'CLUB')`,
            [
              actId,
              studentId,
              studentName,
              id,
              event.title,
              event.points,
              clubId,
              req.user.id,
            ]
          );
        }
      }
    }

    // Lock attendance on the event
    await query('UPDATE club_events SET attendance_confirmed = TRUE WHERE id = $1', [id]);

    res.status(200).json({
      message: 'Attendance confirmed and points auto-awarded successfully',
      attendance_confirmed: true,
    });
  } catch (err) {
    next(err);
  }
}

