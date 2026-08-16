import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Category, EventItem, ActivityClaim, ActivitySummary, Certificate, ClubEvent, Club, ClubMembership } from '../types';
import {
  apiGetCategories,
  apiGetEvents,
  apiGetActivities,
  apiSubmitClaim,
  apiGetCertificateStatus,
  apiIssueCertificate,
  apiGetUpcomingClubEvents,
  apiGetClubs,
  apiGetMyMemberships,
  apiRequestClubMembership,
  apiRegisterClubEvent,
  apiUnregisterClubEvent,
} from '../api/domain';
import {
  Award,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  Sparkles,
  Calendar,
  MapPin,
  Edit3,
  UserCheck,
  Building2,
  Users,
  AlertCircle,
} from 'lucide-react';
import { ProfileCompletionModal } from './ProfileCompletionModal';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activities, setActivities] = useState<ActivityClaim[]>([]);
  const [clubEvents, setClubEvents] = useState<ClubEvent[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [certData, setCertData] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [targetRecipient, setTargetRecipient] = useState('TNP'); // 'TNP' or 'CLUB:<id>'
  const [proofDetails, setProofDetails] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catList, evtList, actRes, certRes, clubEvtList, clubList, membList] = await Promise.all([
        apiGetCategories(),
        apiGetEvents(),
        apiGetActivities(),
        apiGetCertificateStatus(),
        apiGetUpcomingClubEvents(),
        apiGetClubs(),
        apiGetMyMemberships(),
      ]);

      setCategories(catList);
      if (catList.length > 0 && !categoryId) setCategoryId(catList[0].id);
      setEvents(evtList);
      setActivities(actRes.activities);
      setClubEvents(clubEvtList || []);
      const approvedClubs = (clubList || []).filter((c) => c.status === 'APPROVED');
      setClubs(approvedClubs);
      setMemberships(membList || []);
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
    if (!title.trim() || !categoryId) return;

    let target_type: 'CLUB' | 'TNP' = 'TNP';
    let target_club_id: string | null = null;

    if (targetRecipient.startsWith('CLUB:')) {
      target_type = 'CLUB';
      target_club_id = targetRecipient.replace('CLUB:', '');
    }

    try {
      setSubmitting(true);
      await apiSubmitClaim({
        title: title.trim(),
        category_id: categoryId,
        target_type,
        target_club_id,
        proof_details: proofDetails.trim(),
      });

      alert('Activity point claim submitted successfully!');
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

  const handleRequestMembership = async (clubId: string) => {
    try {
      setActionLoading(`memb_${clubId}`);
      await apiRequestClubMembership(clubId);
      alert('Club membership request submitted successfully!');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to request membership');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegisterEvent = async (eventId: string) => {
    try {
      setActionLoading(`reg_${eventId}`);
      await apiRegisterClubEvent(eventId);
      alert('Successfully registered for event!');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to register for event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnregisterEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to unregister from this event?')) return;
    try {
      setActionLoading(`unreg_${eventId}`);
      await apiUnregisterClubEvent(eventId);
      alert('Successfully unregistered from event.');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to unregister from event');
    } finally {
      setActionLoading(null);
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
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setShowEditProfile(true)}>
              <Edit3 size={16} />
              Edit Profile
            </button>
            <button className="btn btn-primary" onClick={() => setShowClaimModal(true)}>
              <PlusCircle size={16} />
              Claim Activity Points
            </button>
          </div>
        </div>

        {/* Student Academic Profile Badges */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.825rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.25)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Roll No:</span>
            <strong style={{ color: 'var(--text-main)' }}>{user?.roll_number || 'N/A'}</strong>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.25)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Department:</span>
            <strong style={{ color: 'var(--text-main)' }}>
              {user?.department === 'COMPS' ? 'Computer Engineering (COMPS)' : user?.department === 'IT' ? 'Information Technology (IT)' : user?.department || 'N/A'}
            </strong>
          </div>
          {user?.division && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.25)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Division:</span>
              <strong style={{ color: 'var(--text-main)' }}>{user.division}</strong>
            </div>
          )}
          {user?.year && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.25)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Year:</span>
              <strong style={{ color: 'var(--text-main)' }}>{user.year}</strong>
            </div>
          )}
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

      {/* College Clubs & Memberships Section (Part 2) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Building2 size={18} style={{ color: 'var(--role-club)' }} />
          College Clubs & Membership ({clubs.length})
        </h3>
      </div>

      <div className="card-grid">
        {clubs.length === 0 ? (
          <div className="info-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            No approved college clubs currently active.
          </div>
        ) : (
          clubs.map((c) => {
            const memb = memberships.find((m) => m.club_id === c.id);
            const isAccepted = memb?.status === 'ACCEPTED';
            const isPending = memb?.status === 'PENDING';
            const isRejected = memb?.status === 'REJECTED';

            return (
              <div className="info-card" key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{c.name}</h4>
                  {isAccepted && (
                    <span className="role-badge SUPER_ADMIN" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}>
                      <UserCheck size={12} /> Member
                    </span>
                  )}
                  {isPending && (
                    <span className="role-badge CLUB" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}>
                      <Clock size={12} /> Pending Approval
                    </span>
                  )}
                  {isRejected && (
                    <span className="role-badge" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.15)', fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}>
                      <XCircle size={12} /> Request Rejected
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                  {c.description || 'Official college student club.'}
                </p>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                  {isAccepted ? (
                    <div style={{ fontSize: '0.775rem', color: 'var(--role-admin)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={14} /> You are an active member. Eligible for club events!
                    </div>
                  ) : isPending ? (
                    <div style={{ fontSize: '0.775rem', color: 'var(--role-club)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={14} /> Membership request submitted. Waiting for club lead approval.
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                      onClick={() => handleRequestMembership(c.id)}
                      disabled={actionLoading === `memb_${c.id}`}
                    >
                      <Users size={14} />
                      {actionLoading === `memb_${c.id}` ? 'Submitting...' : isRejected ? 'Re-request Membership' : 'Request Membership'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upcoming Club Events (Members Only Registration - Part 3) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={18} style={{ color: 'var(--role-club)' }} />
          Upcoming Club Events ({clubEvents.length})
        </h3>
      </div>

      <div className="card-grid">
        {clubEvents.length === 0 ? (
          <div className="info-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            No upcoming club events scheduled currently. Check back soon!
          </div>
        ) : (
          clubEvents.map((ce) => {
            const isConfirmed = Boolean(ce.attendance_confirmed);
            const isRegistered = Boolean(ce.is_registered);
            const isMember = Boolean(ce.is_member);

            return (
              <div className="info-card" key={ce.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="role-badge CLUB" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}>
                    <Building2 size={12} /> {ce.club_name || 'Approved Club'}
                  </span>
                  <span
                    className="role-badge"
                    style={{
                      color: 'var(--primary)',
                      background: 'rgba(14, 165, 233, 0.15)',
                      border: '1px solid rgba(14, 165, 233, 0.3)',
                      fontWeight: 700,
                    }}
                  >
                    +{ce.points} Pts
                  </span>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {ce.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  {ce.description || 'No description provided.'}
                </p>

                <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', marginBottom: '0.85rem' }}>
                  <span>
                    <Calendar size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--primary)' }} />
                    <strong>Date:</strong> {ce.event_date ? ce.event_date.split('T')[0] : ''}
                  </span>
                  {(ce.start_time || ce.end_time) && (
                    <span>
                      <Clock size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--role-club)' }} />
                      <strong>Time:</strong> {ce.start_time} - {ce.end_time}
                    </span>
                  )}
                  {ce.venue && (
                    <span>
                      <MapPin size={12} style={{ display: 'inline', marginRight: 4, color: '#ec4899' }} />
                      <strong>Venue:</strong> {ce.venue}
                    </span>
                  )}
                </div>

                {/* Event Registration Actions (Part 3) */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  {isConfirmed ? (
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--role-admin)' }} /> Attendance Confirmed / Completed
                    </div>
                  ) : isRegistered ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span className="role-badge SUPER_ADMIN" style={{ fontSize: '0.725rem' }}>
                        <CheckCircle2 size={12} /> Registered
                      </span>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#ef4444' }}
                        onClick={() => handleUnregisterEvent(ce.id)}
                        disabled={actionLoading === `unreg_${ce.id}`}
                      >
                        {actionLoading === `unreg_${ce.id}` ? 'Unregistering...' : 'Unregister'}
                      </button>
                    </div>
                  ) : isMember ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                      onClick={() => handleRegisterEvent(ce.id)}
                      disabled={actionLoading === `reg_${ce.id}`}
                    >
                      <PlusCircle size={14} />
                      {actionLoading === `reg_${ce.id}` ? 'Registering...' : 'Register for Event'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem 0.75rem', opacity: 0.6, cursor: 'not-allowed' }}
                        disabled
                        title="You must be an accepted member of this club to register"
                      >
                        Register (Members Only)
                      </button>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertCircle size={11} /> Join {ce.club_name || 'club'} above to register
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Category Breakdown Cards */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1.75rem' }}>AICTE Category Distribution</h3>
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

      {/* My Submitted Activity Claims Table (Part 1 Ledger) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>My Activity Claims Ledger ({activities.length})</h3>
      </div>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Activity Title</th>
              <th style={{ padding: '0.85rem 1rem' }}>Category</th>
              <th style={{ padding: '0.85rem 1rem' }}>Sent To</th>
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
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>
                    <span className={`role-badge ${act.target_type === 'CLUB' ? 'CLUB' : 'TNP'}`} style={{ fontSize: '0.7rem' }}>
                      {act.target_type === 'CLUB' ? act.target_club_name || 'Club' : 'T&P Cell'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: act.status === 'APPROVED' ? 'var(--role-admin)' : 'var(--text-main)' }}>
                    {act.status === 'APPROVED' ? `+${act.points_awarded}` : act.status === 'REJECTED' ? 0 : 'Pending'}
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
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {act.proof_details}
                    {act.rejection_reason && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        Reason: {act.rejection_reason}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Claim Points Modal (Part 1 Reworked) */}
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
            padding: '1rem',
          }}
        >
          <div className="auth-card" style={{ maxWidth: '520px', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Submit Activity Point Claim</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Submit your participation claim for reviewer evaluation. Reviewers award AICTE points upon approval.
            </p>

            <form onSubmit={handleClaimSubmit}>
              <div className="form-group">
                <label>Activity / Event Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. National Hackathon 1st Runner Up or 8-Week Corporate Internship"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Send Request To (Reviewing Authority)</label>
                <select
                  className="form-control"
                  value={targetRecipient}
                  onChange={(e) => setTargetRecipient(e.target.value)}
                  required
                >
                  <option value="TNP">💼 Training & Placement (T&P Cell) — Internships & Corporate Training</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={`CLUB:${c.id}`}>
                      🏛️ {c.name} (Club Reviewer)
                    </option>
                  ))}
                </select>
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
                <label>Proof / Certificate Details</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Paste certificate link, registration ID, or participation documentation..."
                  value={proofDetails}
                  onChange={(e) => setProofDetails(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Submitting Claim...' : 'Submit Claim'}
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

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <ProfileCompletionModal
          isMandatory={false}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
};

