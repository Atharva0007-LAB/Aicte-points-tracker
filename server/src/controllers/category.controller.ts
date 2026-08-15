import { Request, Response, NextFunction } from 'express';
import { query } from '../db/index';

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await query(
      'SELECT id, name, max_points, min_points, description FROM categories ORDER BY name ASC'
    );
    res.status(200).json({ categories: rows });
  } catch (err) {
    next(err);
  }
}
