import { Router } from 'express';
import { getUsers, createUser, getSystemAudit } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/index';

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.SUPER_ADMIN]));

router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/audit', getSystemAudit);

export default router;
