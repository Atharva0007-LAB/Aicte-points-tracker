import { Router } from 'express';
import {
  createClubEvent,
  getMyClubEvents,
  updateClubEvent,
  cancelClubEvent,
  getUpcomingClubEvents,
} from '../controllers/club-event.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/index';

const router = Router();

// Public / Authenticated route to view upcoming club events (Students, Clubs, Admins)
router.get('/upcoming', getUpcomingClubEvents);

// Club lead routes for managing their own club's events
router.get('/my', requireAuth, requireRole([UserRole.CLUB]), getMyClubEvents);
router.post('/', requireAuth, requireRole([UserRole.CLUB]), createClubEvent);
router.patch('/:id/cancel', requireAuth, requireRole([UserRole.CLUB]), cancelClubEvent);
router.patch('/:id', requireAuth, requireRole([UserRole.CLUB]), updateClubEvent);

export default router;
