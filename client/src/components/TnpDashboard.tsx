import React, { useState, useEffect } from 'react';
import { ActivityClaim, Certificate } from '../types';
import { apiGetActivities, apiReviewClaim, apiIssueCertificate } from '../api/domain';
import { Briefcase, CheckCircle2, FileCheck, Award, XCircle } from 'lucide-react';

export const TnpDashboard: React.FC = () => {
  const [activities, setActivities] = useState<ActivityClaim[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const actRes = await apiGetActivities();
      setActivities(actRes.activities);
    } catch (err) {
      console.error('Failed to load TNP data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiReviewClaim(id, { status });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIssueCertForStudent = async (studentId: string, studentName: string) => {
    try {
      const res = await apiIssueCertificate(studentId);
      alert(`100-Point Passing Certificate issued for ${studentName}! Code: ${res.certificate.certificate_code}`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading TNP Career Services Workspace...</div>;
  }

  // Filter internship & placement activities
  const internshipClaims = activities.filter((a) => a.category_id === 'cat_internship');

  return (
    <div className="dashboard-grid">
      <div className="welcome-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #8b5cf6' }}>
        <div className="welcome-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase style={{ color: '#8b5cf6' }} />
              Training & Placement Clearance Portal
            </h2>
            <p>Verify corporate internships, industrial training, and 100 AICTE Activity Point graduation eligibility</p>
          </div>
          <span className="role-badge TNP">TNP Verification Active</span>
        </div>
      </div>

      {/* Internship & Placement Activity Verification */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1rem' }}>
        Industrial Internship & Training Point Claims ({internshipClaims.length})
      </h3>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Student</th>
              <th style={{ padding: '0.85rem 1rem' }}>Internship / Training Title</th>
              <th style={{ padding: '0.85rem 1rem' }}>Requested Pts</th>
              <th style={{ padding: '0.85rem 1rem' }}>Proof / Corporate Report</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {internshipClaims.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No internship claims submitted.
                </td>
              </tr>
            ) : (
              internshipClaims.map((claim) => (
                <tr key={claim.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{claim.student_name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{claim.title}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>+{claim.points_requested}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{claim.proof_details}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`role-badge ${claim.status === 'APPROVED' ? 'SUPER_ADMIN' : 'CLUB'}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    {claim.status === 'PENDING' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#8b5cf6' }}
                        onClick={() => handleReview(claim.id, 'APPROVED')}
                      >
                        <CheckCircle2 size={12} /> Verify & Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Graduation Certificate Clearance */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1.5rem' }}>100-Point Graduation Certificate Clearance</h3>
      <div className="info-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Alex Morgan (Computer Science)</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Accumulated 90 / 100 AICTE Activity Points. Eligible for certificate upon reaching 100 points.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleIssueCertForStudent('usr_student_001', 'Alex Morgan')}
          >
            <FileCheck size={16} /> Issue Certificate
          </button>
        </div>
      </div>
    </div>
  );
};
