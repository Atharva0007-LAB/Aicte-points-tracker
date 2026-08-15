import { Request, Response, NextFunction } from 'express';
import { testConnection } from '../db/index';

export async function getHealthStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const dbConnected = await testConnection();

    res.status(200).json({
      status: 'ok',
      service: 'AICTE Points Tracker Backend API',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
    });
  } catch (err) {
    next(err);
  }
}
