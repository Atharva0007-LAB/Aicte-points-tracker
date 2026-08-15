import { Router } from 'express';
import { getCertificateStatus, issueCertificate } from '../controllers/certificate.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/index';

const router = Router();

router.use(requireAuth);

router.get('/', getCertificateStatus);
router.post('/issue', requireRole([UserRole.TNP, UserRole.SUPER_ADMIN, UserRole.STUDENT]), issueCertificate);

export default router;
