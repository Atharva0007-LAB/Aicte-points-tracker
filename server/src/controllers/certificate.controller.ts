import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { query } from '../db/index';
import { ApiError } from '../middleware/error.middleware';

export async function getCertificateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const student_id = req.query.student_id as string || req.user!.id;

    // Check certificate table
    const certRes = await query('SELECT * FROM certificates WHERE student_id = $1', [student_id]);

    // Compute total approved points
    const ptsRes = await query(
      'SELECT COALESCE(SUM(points_awarded), 0) as total FROM student_activities WHERE student_id = $1 AND status = \'APPROVED\'',
      [student_id]
    );

    const totalPoints = parseInt(ptsRes.rows[0]?.total || '0', 10);
    const isEligible = totalPoints >= 100;

    res.status(200).json({
      certificate: certRes.rows[0] || null,
      totalPoints,
      targetPoints: 100,
      isEligible,
    });
  } catch (err) {
    next(err);
  }
}

export async function issueCertificate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { student_id } = req.body;
    const targetStudentId = student_id || req.user!.id;

    // Verify points threshold
    const ptsRes = await query(
      'SELECT COALESCE(SUM(points_awarded), 0) as total FROM student_activities WHERE student_id = $1 AND status = \'APPROVED\'',
      [targetStudentId]
    );

    const totalPoints = parseInt(ptsRes.rows[0]?.total || '0', 10);
    if (totalPoints < 100) {
      throw new ApiError(400, `Student has accumulated ${totalPoints}/100 points and is not yet eligible for certificate.`);
    }

    // Check if already issued
    const existing = await query('SELECT id, certificate_code FROM certificates WHERE student_id = $1', [targetStudentId]);
    if (existing.rows.length > 0) {
      return res.status(200).json({
        message: 'Certificate already issued',
        certificate: existing.rows[0],
      });
    }

    const certId = `cert_${Date.now()}`;
    const certCode = `AICTE-CERT-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    await query(`
      INSERT INTO certificates (id, student_id, total_points, approved_by, certificate_code)
      VALUES ($1, $2, $3, $4, $5)
    `, [certId, targetStudentId, totalPoints, req.user!.id, certCode]);

    const { rows } = await query('SELECT * FROM certificates WHERE id = $1', [certId]);

    res.status(201).json({
      message: '100 AICTE Activity Point Certificate issued successfully!',
      certificate: rows[0],
    });
  } catch (err) {
    next(err);
  }
}
