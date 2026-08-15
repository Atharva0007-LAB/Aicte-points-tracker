import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { query } from '../db/index';
import { ApiError } from '../middleware/error.middleware';

export async function getEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { rows } = await query(`
      SELECT e.id, e.title, e.description, e.category_id, c.name as category_name, e.points, e.event_date, e.location, e.organizer_id, e.organizer_name, e.status, e.created_at
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      ORDER BY e.event_date ASC
    `);
    res.status(200).json({ events: rows });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, category_id, points, event_date, location } = req.body;
    if (!title || !category_id || !points || !event_date) {
      throw new ApiError(400, 'Title, Category, Points, and Event Date are required');
    }

    const id = `evt_${Date.now()}`;
    const organizer_id = req.user?.id;
    const organizer_name = req.user?.full_name;

    await query(
      `
      INSERT INTO events (id, title, description, category_id, points, event_date, location, organizer_id, organizer_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE')
    `,
      [id, title, description || '', category_id, parseInt(points, 10), event_date, location || 'College Campus', organizer_id, organizer_name]
    );

    res.status(201).json({ message: 'Event created successfully', eventId: id });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await query('DELETE FROM events WHERE id = $1', [id]);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
}
