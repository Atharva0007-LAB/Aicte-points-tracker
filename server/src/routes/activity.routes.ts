import { Router } from 'express';
import { getActivities, claimActivity, reviewActivity } from '../controllers/activity.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/index';

const router = Router();

router.use(requireAuth);

router.get('/', getActivities);
router.post('/claim', requireRole([UserRole.STUDENT]), claimActivity);
router.patch('/:id/review', requireRole([UserRole.CLUB, UserRole.TNP, UserRole.SUPER_ADMIN]), reviewActivity);

export default router;
