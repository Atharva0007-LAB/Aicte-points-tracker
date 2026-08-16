import React, { useState, useEffect } from 'react';
import { ActivityClaim } from '../types';
import { apiGetActivities, apiReviewClaim, apiIssueCertificate } from '../api/domain';
import { Briefcase, CheckCircle2, FileCheck, XCircle } from 'lucide-react';

export const TnpDashboard: React.FC = () => {
  const [activities, setActivities] = useState<ActivityClaim[]>([]);
  const [pointsInputMap, setPointsInputMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const actRes = await apiGetActivities();
      const claims = actRes.activities || [];
      setActivities(claims);

      const initialMap: Record<string, number> = {};
      claims.forEach((act) => {
        initialMap[act.id] = act.points_requested > 0 ? act.points_requested : 20;
      });
      setPointsInputMap((prev) => ({ ...initialMap, ...prev }));
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
      if (status === 'APPROVED') {
        const pts = pointsInputMap[id] || 20;
        if (!pts || pts <= 0) {
          alert('Please enter a valid positive points value to award.');
          return;
        }
        await apiReviewClaim(id, { status: 'APPROVED', points_awarded: pts });
        alert(`Claim approved with +${pts} points awarded!`);
      } else {
        const reason = prompt('Reason for rejection:') || 'Documentation incomplete';
        await apiReviewClaim(id, { status: 'REJECTED', rejection_reason: reason });
        alert('Claim rejected.');
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to review claim');
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

  const pendingClaims = activities.filter((a) => a.status === 'PENDING');

  return (
    <div className="dashboard-grid">
      <div className="welcome-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #8b5cf6' }}>
        <div className="welcome-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase style={{ color: '#8b5cf6' }} />
              Training & Placement Clearance Portal
            </h2>
            <p>Verify corporate internships, industrial training, and evaluate student activity claims</p>
          </div>
          <span className="role-badge TNP">TNP Verification Active</span>
        </div>
      </div>

      {/* T&P Activity Claims Verification (Backend Filtered by target_type = 'TNP') */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1rem' }}>
        T&P-Directed Activity Point Claims ({activities.length})
      </h3>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Student</th>
              <th style={{ padding: '0.85rem 1rem' }}>Activity / Internship Title</th>
              <th style={{ padding: '0.85rem 1rem' }}>Category</th>
              <th style={{ padding: '0.85rem 1rem' }}>Proof / Documentation</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Points to Award & Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No claims submitted to T&P Cell.
                </td>
              </tr>
            ) : (
              activities.map((claim) => (
                <tr key={claim.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{claim.student_name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{claim.title}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{claim.category_name}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{claim.proof_details}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`role-badge ${claim.status === 'APPROVED' ? 'SUPER_ADMIN' : claim.status === 'REJECTED' ? 'STUDENT' : 'CLUB'}`}>
                      {claim.status === 'APPROVED' ? `+${claim.points_awarded} Pts` : claim.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    {claim.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pts:</span>
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '65px', padding: '0.25rem 0.4rem', fontSize: '0.8rem', textAlign: 'center' }}
                            min={1}
                            max={50}
                            value={pointsInputMap[claim.id] ?? 20}
                            onChange={(e) =>
                              setPointsInputMap({ ...pointsInputMap, [claim.id]: Number(e.target.value) })
                            }
                          />
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#8b5cf6' }}
                          onClick={() => handleReview(claim.id, 'APPROVED')}
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#ef4444' }}
                          onClick={() => handleReview(claim.id, 'REJECTED')}
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Reviewed</span>
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
              Student Activity Points Ledger verified. Eligible for certificate upon reaching 100 points.
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

