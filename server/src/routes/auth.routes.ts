import { Router } from 'express';
import { login, logout, getMe, triggerSeed, signup, updateProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.post('/seed', triggerSeed);

export default router;
