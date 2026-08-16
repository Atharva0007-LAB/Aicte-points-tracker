import { Router } from 'express';
import {
  createClubEvent,
  getMyClubEvents,
  updateClubEvent,
  cancelClubEvent,
  getUpcomingClubEvents,
  registerForEvent,
  unregisterFromEvent,
  getEventAttendees,
  confirmEventAttendance,
} from '../controllers/club-event.controller';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.middleware';
import { UserRole } from '../types/index';

const router = Router();

// Public / Authenticated route to view upcoming club events (Students, Clubs, Admins)
router.get('/upcoming', optionalAuth, getUpcomingClubEvents);


// Student routes for event registration/unregistration
router.post('/:id/register', requireAuth, requireRole([UserRole.STUDENT]), registerForEvent);
router.post('/:id/unregister', requireAuth, requireRole([UserRole.STUDENT]), unregisterFromEvent);

// Club lead routes for attendees & attendance confirmation
router.get('/:id/attendees', requireAuth, requireRole([UserRole.CLUB, UserRole.SUPER_ADMIN]), getEventAttendees);
router.post('/:id/confirm-attendance', requireAuth, requireRole([UserRole.CLUB, UserRole.SUPER_ADMIN]), confirmEventAttendance);

// Club lead routes for managing their own club's events
router.get('/my', requireAuth, requireRole([UserRole.CLUB]), getMyClubEvents);
router.post('/', requireAuth, requireRole([UserRole.CLUB]), createClubEvent);
router.patch('/:id/cancel', requireAuth, requireRole([UserRole.CLUB]), cancelClubEvent);
router.patch('/:id', requireAuth, requireRole([UserRole.CLUB]), updateClubEvent);

export default router;

