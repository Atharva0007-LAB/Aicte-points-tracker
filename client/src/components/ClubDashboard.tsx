import React, { useState, useEffect } from 'react';
import { Category, EventItem, ActivityClaim } from '../types';
import { apiGetCategories, apiGetEvents, apiCreateEvent, apiGetActivities, apiReviewClaim } from '../api/domain';
import { Award, PlusCircle, CheckCircle2, XCircle, Calendar, MapPin, Users, Clock } from 'lucide-react';

export const ClubDashboard: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activities, setActivities] = useState<ActivityClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [points, setPoints] = useState(15);
  const [eventDate, setEventDate] = useState('2026-09-01');
  const [location, setLocation] = useState('College Main Auditorium');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catList, evtList, actRes] = await Promise.all([
        apiGetCategories(),
        apiGetEvents(),
        apiGetActivities(),
      ]);

      setCategories(catList);
      if (catList.length > 0 && !categoryId) setCategoryId(catList[0].id);
      setEvents(evtList);
      setActivities(actRes.activities);
    } catch (err) {
      console.error('Failed to load club data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !eventDate) return;

    try {
      await apiCreateEvent({
        title,
        description,
        category_id: categoryId,
        points: Number(points),
        event_date: eventDate,
        location,
      });

      alert('New Event Published Successfully!');
      setShowEventModal(false);
      setTitle('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
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
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Club Lead Workspace...</div>;
  }

  const pendingClaims = activities.filter((a) => a.status === 'PENDING');

  return (
    <div className="dashboard-grid">
      <div className="welcome-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #f59e0b' }}>
        <div className="welcome-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award style={{ color: '#f59e0b' }} />
              Club Lead Event & Point Portal
            </h2>
            <p>Publish workshops, host fests, and verify student activity attendance</p>
          </div>
          <button className="btn btn-primary" style={{ background: '#f59e0b', color: '#0f172a' }} onClick={() => setShowEventModal(true)}>
            <PlusCircle size={16} />
            Publish New Event
          </button>
        </div>
      </div>

      {/* Pending Review Queue */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1rem' }}>
        Pending Activity Approvals ({pendingClaims.length})
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
                  No pending student claims awaiting review!
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

      {/* Published Events List */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1.5rem' }}>Active College Events</h3>
      <div className="card-grid">
        {events.map((evt) => (
          <div className="info-card" key={evt.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{evt.title}</h4>
              <span className="role-badge CLUB">+{evt.points} Pts</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{evt.description}</p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} /> Date: {evt.event_date}
              </span>
              <span>
                <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} /> Location: {evt.location}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Event Modal */}
      {showEventModal && (
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Publish New Event / Workshop</h3>

            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Web Development Bootcamp"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Event agenda and details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>AICTE Category</label>
                <select className="form-control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Activity Points Awarded</label>
                <input
                  type="number"
                  className="form-control"
                  min={5}
                  max={40}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Date</label>
                <input type="date" className="form-control" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Venue / Location</label>
                <input type="text" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Publish Event
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEventModal(false)}>
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
