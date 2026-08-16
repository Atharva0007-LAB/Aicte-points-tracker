import { Router } from 'express';
import {
  applyClub,
  getMyClub,
  getAllClubs,
  updateClubStatus,
  requestClubMembership,
  getMyMemberships,
  getMyClubMemberships,
  reviewClubMembership,
} from '../controllers/club.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/index';

const router = Router();

// Public self-application endpoint
router.post('/apply', applyClub);

// Authenticated club retrieval for logged-in user
router.get('/my', requireAuth, getMyClub);

// Membership routes
router.get('/memberships/my', requireAuth, requireRole([UserRole.STUDENT]), getMyMemberships);
router.get('/my/memberships', requireAuth, requireRole([UserRole.CLUB]), getMyClubMemberships);
router.post('/:id/memberships', requireAuth, requireRole([UserRole.STUDENT]), requestClubMembership);
router.patch('/memberships/:id', requireAuth, requireRole([UserRole.CLUB, UserRole.SUPER_ADMIN]), reviewClubMembership);

// Super Admin endpoints to view and manage club approvals
router.get('/', requireAuth, getAllClubs);
router.patch('/:id/status', requireAuth, requireRole([UserRole.SUPER_ADMIN]), updateClubStatus);

export default router;

