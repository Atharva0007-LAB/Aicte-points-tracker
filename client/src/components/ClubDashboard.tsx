import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Category, EventItem, ActivityClaim, ClubEvent } from '../types';
import {
  apiGetCategories,
  apiGetActivities,
  apiReviewClaim,
  apiGetMyClubEvents,
  apiCreateClubEvent,
  apiUpdateClubEvent,
  apiCancelClubEvent,
} from '../api/domain';
import {
  Award,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  Edit3,
  Ban,
  Building2,
  Sparkles,
} from 'lucide-react';

export const ClubDashboard: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<ActivityClaim[]>([]);
  const [myEvents, setMyEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(15);
  const [eventDate, setEventDate] = useState('2026-09-15');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [venue, setVenue] = useState('Main College Seminar Hall');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catList, actRes, myEvtList] = await Promise.all([
        apiGetCategories(),
        apiGetActivities(),
        apiGetMyClubEvents(),
      ]);

      setCategories(catList);
      setActivities(actRes.activities);
      setMyEvents(myEvtList);
    } catch (err) {
      console.error('Failed to load club data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setPoints(15);
    setEventDate('2026-09-15');
    setStartTime('10:00 AM');
    setEndTime('04:00 PM');
    setVenue('Main College Seminar Hall');
    setShowEventModal(true);
  };

  const openEditModal = (evt: ClubEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDescription(evt.description || '');
    setPoints(evt.points);
    setEventDate(evt.event_date ? evt.event_date.split('T')[0] : '2026-09-15');
    setStartTime(evt.start_time || '10:00 AM');
    setEndTime(evt.end_time || '04:00 PM');
    setVenue(evt.venue || '');
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate || points <= 0) return;

    try {
      setIsSubmitting(true);
      if (editingEvent) {
        await apiUpdateClubEvent(editingEvent.id, {
          title: title.trim(),
          description: description.trim(),
          points: Number(points),
          event_date: eventDate,
          start_time: startTime.trim(),
          end_time: endTime.trim(),
          venue: venue.trim(),
        });
        alert('Club Event updated successfully!');
      } else {
        await apiCreateClubEvent({
          title: title.trim(),
          description: description.trim(),
          points: Number(points),
          event_date: eventDate,
          start_time: startTime.trim(),
          end_time: endTime.trim(),
          venue: venue.trim(),
        });
        alert('New Club Event published successfully!');
      }

      setShowEventModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to cancel the event "${eventTitle}"?`)) return;

    try {
      await apiCancelClubEvent(eventId);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel event');
    }
  };

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const reason = status === 'REJECTED' ? prompt('Reason for rejection:') || 'Documentation incomplete' : undefined;
      await apiReviewClaim(id, { status, rejection_reason: reason });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Club Workspace...</div>;
  }

  const pendingClaims = activities.filter((a) => a.status === 'PENDING');

  return (
    <div className="dashboard-grid">
      <div className="welcome-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #f59e0b' }}>
        <div className="welcome-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 style={{ color: '#f59e0b' }} />
              {user?.club_name || user?.department || 'Student Club Lead Portal'}
            </h2>
            <p>Publish fixed-point college events, manage schedule, and verify student claims</p>
          </div>
          <button className="btn btn-primary" style={{ background: '#f59e0b', color: '#0f172a' }} onClick={openCreateModal}>
            <PlusCircle size={16} />
            Publish Club Event
          </button>
        </div>
      </div>

      {/* Club Events Management (Fixed-Points System) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={18} style={{ color: 'var(--role-club)' }} />
          Our Club Events ({myEvents.length})
        </h3>
      </div>

      <div className="card-grid">
        {myEvents.length === 0 ? (
          <div className="info-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No events published yet. Click "Publish Club Event" above to create your first event with fixed activity points!
          </div>
        ) : (
          myEvents.map((evt) => {
            const isCancelled = evt.status === 'CANCELLED';
            return (
              <div className="info-card" key={evt.id} style={{ opacity: isCancelled ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                    {evt.title}
                  </h4>
                  <span
                    className="role-badge"
                    style={{
                      background: isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isCancelled ? 'var(--error-color)' : 'var(--role-club)',
                      border: isCancelled ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    {isCancelled ? 'CANCELLED' : `+${evt.points} AICTE Pts`}
                  </span>
                </div>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {evt.description || 'No description provided.'}
                </p>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                  <span>
                    <Calendar size={13} style={{ display: 'inline', marginRight: 5, color: 'var(--primary)' }} />
                    <strong>Date:</strong> {evt.event_date ? evt.event_date.split('T')[0] : ''}
                  </span>
                  {(evt.start_time || evt.end_time) && (
                    <span>
                      <Clock size={13} style={{ display: 'inline', marginRight: 5, color: 'var(--role-club)' }} />
                      <strong>Time:</strong> {evt.start_time} - {evt.end_time}
                    </span>
                  )}
                  {evt.venue && (
                    <span>
                      <MapPin size={13} style={{ display: 'inline', marginRight: 5, color: '#ec4899' }} />
                      <strong>Venue:</strong> {evt.venue}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.35rem' }}
                    onClick={() => openEditModal(evt)}
                    disabled={isCancelled}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  {!isCancelled && (
                    <button
                      className="btn btn-secondary"
                      style={{ color: 'var(--error-color)', fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                      onClick={() => handleCancelEvent(evt.id, evt.title)}
                      title="Cancel Event"
                    >
                      <Ban size={13} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pending Student Activity Claims Approval Queue */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2rem' }}>
        Student Activity Point Claim Verification ({pendingClaims.length})
      </h3>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Student</th>
              <th style={{ padding: '0.85rem 1rem' }}>Activity Claim</th>
              <th style={{ padding: '0.85rem 1rem' }}>Category</th>
              <th style={{ padding: '0.85rem 1rem' }}>Requested Pts</th>
              <th style={{ padding: '0.85rem 1rem' }}>Proof / Notes</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingClaims.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No pending student claims awaiting review.
                </td>
              </tr>
            ) : (
              pendingClaims.map((claim) => (
                <tr key={claim.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{claim.student_name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{claim.title}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{claim.category_name}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>+{claim.points_requested}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{claim.proof_details}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: 'var(--role-admin)' }}
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Event Modal */}
      {showEventModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div className="auth-card" style={{ maxWidth: '520px', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {editingEvent ? 'Edit Club Event' : 'Publish New Club Event'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Set event details and fixed AICTE activity points granted to participating students.
            </p>

            <form onSubmit={handleSaveEvent}>
              <div className="form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Annual IoT & Robotics Hackathon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Describe workshop schedule, requirements, and activities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Event Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fixed Points Value</label>
                  <input
                    type="number"
                    className="form-control"
                    min={5}
                    max={50}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 10:00 AM"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 04:00 PM"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Venue / Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Lab 4 / College Auditorium"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', background: 'var(--role-club)', color: '#0f172a' }}
                  disabled={isSubmitting}
                >
                  <Sparkles size={16} />
                  {isSubmitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Publish Event'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEventModal(false)}
                  disabled={isSubmitting}
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

