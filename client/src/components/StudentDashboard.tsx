import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Category, EventItem, ActivityClaim, ActivitySummary, Certificate } from '../types';
import { apiGetCategories, apiGetEvents, apiGetActivities, apiSubmitClaim, apiGetCertificateStatus, apiIssueCertificate } from '../api/domain';
import { Award, PlusCircle, CheckCircle2, Clock, XCircle, FileCheck, Sparkles, Calendar, MapPin } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activities, setActivities] = useState<ActivityClaim[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [certData, setCertData] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [eventId, setEventId] = useState('');
  const [pointsRequested, setPointsRequested] = useState(15);
  const [proofDetails, setProofDetails] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catList, evtList, actRes, certRes] = await Promise.all([
        apiGetCategories(),
        apiGetEvents(),
        apiGetActivities(),
        apiGetCertificateStatus(),
      ]);

      setCategories(catList);
      if (catList.length > 0 && !categoryId) setCategoryId(catList[0].id);
      setEvents(evtList);
      setActivities(actRes.activities);
      if (actRes.summary) setSummary(actRes.summary);
      setCertData(certRes.certificate);
    } catch (err: any) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !pointsRequested) return;

    try {
      setSubmitting(true);
      await apiSubmitClaim({
        title,
        category_id: categoryId,
        event_id: eventId || undefined,
        points_requested: Number(pointsRequested),
        proof_details: proofDetails,
      });

      setMessage('Activity point claim submitted successfully!');
      setShowClaimModal(false);
      setTitle('');
      setProofDetails('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      const res = await apiIssueCertificate();
      setCertData(res.certificate);
      alert('Congratulations! Your 100 AICTE Activity Point Passing Certificate has been issued!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading AICTE Points Ledger...</div>;
  }

  const currentPoints = summary?.totalPoints || 0;
  const progressPercent = Math.min(100, Math.round((currentPoints / 100) * 100));

  return (
    <div className="dashboard-grid">
      {/* Top 100-Point Progress Banner */}
      <div className="welcome-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #3b82f6' }}>
        <div className="welcome-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award style={{ color: '#3b82f6' }} />
              AICTE 100-Point Activity Ledger
            </h2>
            <p>Mandatory 100 activity points requirement for degree completion</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowClaimModal(true)}>
            <PlusCircle size={16} />
            Claim Activity Points
          </button>
        </div>

        {/* Progress Bar Gauge */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700 }}>
            <span>Progress to 100 Points</span>
            <span style={{ color: currentPoints >= 100 ? 'var(--role-admin)' : 'var(--primary)' }}>
              {currentPoints} / 100 Points ({progressPercent}%)
            </span>
          </div>

          <div style={{ height: '14px', background: 'var(--bg-input)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: currentPoints >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #3b82f6, #0ea5e9)',
                transition: 'width 0.8s ease',
              }}
            />
          </div>
        </div>

        {/* Certificate Banner if 100 points achieved */}
        {currentPoints >= 100 && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem 1.25rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h4 style={{ color: 'var(--role-admin)', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={18} />
                100-Point Requirement Complete!
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                You are eligible for your official AICTE Activity Passing Certificate.
              </p>
            </div>
            {certData ? (
              <div style={{ textAlign: 'right' }}>
                <span className="role-badge SUPER_ADMIN" style={{ fontSize: '0.8rem' }}>
                  <FileCheck size={14} /> Certificate Code: {certData.certificate_code}
                </span>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ background: 'var(--role-admin)' }} onClick={handleIssueCertificate}>
                Generate Certificate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Breakdown Cards */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1rem' }}>AICTE Category Distribution</h3>
      <div className="card-grid">
        {categories.map((cat) => {
          const catInfo = summary?.categoryTotals[cat.id] || { points: 0, max: cat.max_points };
          return (
            <div className="info-card" key={cat.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{cat.name}</h4>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {catInfo.points} / {cat.max_points} Pts
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{cat.description}</p>
              <div style={{ marginTop: '0.75rem', height: '6px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (catInfo.points / cat.max_points) * 100)}%`,
                    background: 'var(--primary)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* My Submitted Activity Claims Table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>My Activity Claims ({activities.length})</h3>
      </div>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Activity Title</th>
              <th style={{ padding: '0.85rem 1rem' }}>Category</th>
              <th style={{ padding: '0.85rem 1rem' }}>Requested Pts</th>
              <th style={{ padding: '0.85rem 1rem' }}>Awarded Pts</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Proof / Notes</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No activity claims submitted yet. Click "Claim Activity Points" to get started!
                </td>
              </tr>
            ) : (
              activities.map((act) => (
                <tr key={act.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{act.title}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{act.category_name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{act.points_requested}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: act.status === 'APPROVED' ? 'var(--role-admin)' : 'var(--text-main)' }}>
                    {act.status === 'APPROVED' ? `+${act.points_awarded}` : 0}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {act.status === 'APPROVED' && (
                      <span className="role-badge SUPER_ADMIN" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 size={12} /> Approved
                      </span>
                    )}
                    {act.status === 'PENDING' && (
                      <span className="role-badge CLUB" style={{ fontSize: '0.7rem' }}>
                        <Clock size={12} /> Pending Review
                      </span>
                    )}
                    {act.status === 'REJECTED' && (
                      <span className="role-badge" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.15)', fontSize: '0.7rem' }}>
                        <XCircle size={12} /> Rejected
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{act.proof_details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Claim Points Modal */}
      {showClaimModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="auth-card" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Submit Activity Point Claim</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Upload details of your participation to claim AICTE points.
            </p>

            <form onSubmit={handleClaimSubmit}>
              <div className="form-group">
                <label>Activity / Event Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. National Hackathon Winner or NSS Tree Plantation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>AICTE Point Category</label>
                <select className="form-control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Max {c.max_points} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Points Requested</label>
                <input
                  type="number"
                  className="form-control"
                  min={5}
                  max={40}
                  value={pointsRequested}
                  onChange={(e) => setPointsRequested(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Proof / Certificate Details</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Paste certificate link, registration ID, or event details..."
                  value={proofDetails}
                  onChange={(e) => setProofDetails(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClaimModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
