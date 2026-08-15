import { Router } from 'express';
import { getEvents, createEvent, deleteEvent } from '../controllers/event.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/index';

const router = Router();

router.use(requireAuth);

router.get('/', getEvents);
router.post('/', requireRole([UserRole.CLUB, UserRole.SUPER_ADMIN]), createEvent);
router.delete('/:id', requireRole([UserRole.CLUB, UserRole.SUPER_ADMIN]), deleteEvent);

export default router;
