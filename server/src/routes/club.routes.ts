import { Router } from 'express';
import { applyClub, getMyClub, getAllClubs, updateClubStatus } from '../controllers/club.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/index';

const router = Router();

// Public self-application endpoint
router.post('/apply', applyClub);

// Authenticated club retrieval for logged-in user
router.get('/my', requireAuth, getMyClub);

// Super Admin endpoints to view and manage club approvals
router.get('/', requireAuth, requireRole([UserRole.SUPER_ADMIN]), getAllClubs);
router.patch('/:id/status', requireAuth, requireRole([UserRole.SUPER_ADMIN]), updateClubStatus);

export default router;
