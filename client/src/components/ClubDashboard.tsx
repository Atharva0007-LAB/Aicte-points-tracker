import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Category, ActivityClaim, ClubEvent, ClubMembership, EventAttendee } from '../types';
import {
  apiGetCategories,
  apiGetActivities,
  apiReviewClaim,
  apiGetMyClubEvents,
  apiCreateClubEvent,
  apiUpdateClubEvent,
  apiCancelClubEvent,
  apiGetMyClubMemberships,
  apiReviewClubMembership,
  apiGetEventAttendees,
  apiConfirmEventAttendance,
} from '../api/domain';
import {
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
  Users,
  UserCheck,
  Check,
  X,
  Lock,
  ClipboardCheck,
} from 'lucide-react';

export const ClubDashboard: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<ActivityClaim[]>([]);
  const [myEvents, setMyEvents] = useState<ClubEvent[]>([]);
  const [pendingMembers, setPendingMembers] = useState<ClubMembership[]>([]);
  const [acceptedMembers, setAcceptedMembers] = useState<ClubMembership[]>([]);
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

  // Claim Points Input Map
  const [pointsInputMap, setPointsInputMap] = useState<Record<string, number>>({});

  // Attendees & Attendance State
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [attendeesList, setAttendeesList] = useState<EventAttendee[]>([]);
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [isConfirmingAttendance, setIsConfirmingAttendance] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catList, actRes, myEvtList, membRes] = await Promise.all([
        apiGetCategories(),
        apiGetActivities(),
        apiGetMyClubEvents(),
        apiGetMyClubMemberships(),
      ]);

      setCategories(catList);
      setActivities(actRes.activities);
      setMyEvents(myEvtList);
      setPendingMembers(membRes.pendingRequests || []);
      setAcceptedMembers(membRes.acceptedMembers || []);

      // Initialize points input map for pending claims
      const initialMap: Record<string, number> = {};
      (actRes.activities || []).forEach((act) => {
        initialMap[act.id] = act.points_requested > 0 ? act.points_requested : 15;
      });
      setPointsInputMap((prev) => ({ ...initialMap, ...prev }));
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

  const handleReviewClaim = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      if (status === 'APPROVED') {
        const pts = pointsInputMap[id] || 15;
        if (!pts || pts <= 0) {
          alert('Please enter a valid positive number of points to award.');
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

  const handleReviewMembership = async (membershipId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await apiReviewClubMembership(membershipId, status);
      alert(`Membership request ${status === 'ACCEPTED' ? 'accepted' : 'rejected'}.`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update membership status');
    }
  };

  const openAttendeesModal = async (evt: ClubEvent) => {
    try {
      setSelectedEvent(evt);
      const res = await apiGetEventAttendees(evt.id);
      setAttendeesList(res.attendees || []);
      setAttendanceConfirmed(Boolean(res.attendance_confirmed));

      // Populate initial attendance state
      const initialAtt: Record<string, boolean> = {};
      (res.attendees || []).forEach((att: EventAttendee) => {
        initialAtt[att.student_id] = att.present === null || att.present === undefined ? true : Boolean(att.present);
      });
      setAttendanceMap(initialAtt);
      setShowAttendeesModal(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load attendees');
    }
  };

  const handleConfirmAttendanceSubmit = async () => {
    if (!selectedEvent) return;
    if (attendeesList.length === 0) {
      alert('No registered students to take attendance for.');
      return;
    }

    const presentCount = Object.values(attendanceMap).filter(Boolean).length;
    if (
      !confirm(
        `Confirm attendance for ${attendeesList.length} registered students?\n- Present: ${presentCount}\n- Absent: ${attendeesList.length - presentCount}\n\nPresent students will directly receive +${selectedEvent.points} AICTE points. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsConfirmingAttendance(true);
      const payload = attendeesList.map((a) => ({
        student_id: a.student_id,
        present: Boolean(attendanceMap[a.student_id]),
      }));

      await apiConfirmEventAttendance(selectedEvent.id, payload);
      alert('Attendance confirmed and AICTE points awarded successfully!');
      setShowAttendeesModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm attendance');
    } finally {
      setIsConfirmingAttendance(false);
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
            <p>Publish fixed-point college events, manage memberships, track event attendance, and award AICTE points</p>
          </div>
          <button className="btn btn-primary" style={{ background: '#f59e0b', color: '#0f172a' }} onClick={openCreateModal}>
            <PlusCircle size={16} />
            Publish Club Event
          </button>
        </div>
      </div>

      {/* Part 2: Incoming Membership Requests Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={18} style={{ color: 'var(--role-club)' }} />
          Incoming Membership Requests ({pendingMembers.length})
        </h3>
      </div>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Student Name</th>
              <th style={{ padding: '0.85rem 1rem' }}>Roll Number</th>
              <th style={{ padding: '0.85rem 1rem' }}>Department</th>
              <th style={{ padding: '0.85rem 1rem' }}>Division & Year</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingMembers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No pending membership requests awaiting review.
                </td>
              </tr>
            ) : (
              pendingMembers.map((memb) => (
                <tr key={memb.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                    {memb.student_name}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{memb.student_email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{memb.roll_number || 'N/A'}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{memb.department || 'N/A'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {memb.division ? `Div ${memb.division}` : ''} {memb.year ? `(${memb.year})` : ''}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: 'var(--role-admin)' }}
                        onClick={() => handleReviewMembership(memb.id, 'ACCEPTED')}
                      >
                        <Check size={13} /> Accept
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#ef4444' }}
                        onClick={() => handleReviewMembership(memb.id, 'REJECTED')}
                      >
                        <X size={13} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Part 2: My Members Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <UserCheck size={18} style={{ color: 'var(--role-admin)' }} />
          My Club Members ({acceptedMembers.length})
        </h3>
      </div>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Member Name</th>
              <th style={{ padding: '0.85rem 1rem' }}>Roll Number</th>
              <th style={{ padding: '0.85rem 1rem' }}>Department</th>
              <th style={{ padding: '0.85rem 1rem' }}>Division & Year</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {acceptedMembers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No accepted club members yet.
                </td>
              </tr>
            ) : (
              acceptedMembers.map((memb) => (
                <tr key={memb.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                    {memb.student_name}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{memb.student_email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{memb.roll_number || 'N/A'}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{memb.department || 'N/A'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {memb.division ? `Div ${memb.division}` : ''} {memb.year ? `(${memb.year})` : ''}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="role-badge SUPER_ADMIN" style={{ fontSize: '0.7rem' }}>
                      <CheckCircle2 size={12} /> Active Member
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Part 3 & 4: Club Events Management with Attendees & Attendance Confirmation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
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
            const isConfirmed = Boolean(evt.attendance_confirmed);

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

                {/* Event Actions & Attendance Button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      fontSize: '0.775rem',
                      padding: '0.4rem',
                      background: isConfirmed ? 'var(--bg-input)' : 'var(--primary)',
                      border: isConfirmed ? '1px solid var(--border-color)' : undefined,
                      color: isConfirmed ? 'var(--text-main)' : undefined,
                    }}
                    onClick={() => openAttendeesModal(evt)}
                    disabled={isCancelled}
                  >
                    {isConfirmed ? <ClipboardCheck size={14} style={{ color: 'var(--role-admin)' }} /> : <Users size={14} />}
                    {isConfirmed ? 'View Final Attendance & Points' : 'Attendees & Attendance'}
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.35rem' }}
                      onClick={() => openEditModal(evt)}
                      disabled={isCancelled || isConfirmed}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    {!isCancelled && !isConfirmed && (
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
              </div>
            );
          })
        )}
      </div>

      {/* Part 1: Pending Student Activity Claims Approval Queue with points input */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2rem' }}>
        Club-Directed Activity Point Claim Verification ({pendingClaims.length})
      </h3>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Student</th>
              <th style={{ padding: '0.85rem 1rem' }}>Activity Claim</th>
              <th style={{ padding: '0.85rem 1rem' }}>Category</th>
              <th style={{ padding: '0.85rem 1rem' }}>Proof / Notes</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Points to Award & Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingClaims.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No pending student claims directed to your club awaiting review.
                </td>
              </tr>
            ) : (
              pendingClaims.map((claim) => (
                <tr key={claim.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{claim.student_name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{claim.title}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{claim.category_name}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{claim.proof_details}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pts:</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '65px', padding: '0.25rem 0.4rem', fontSize: '0.8rem', textAlign: 'center' }}
                          min={1}
                          max={50}
                          value={pointsInputMap[claim.id] ?? 15}
                          onChange={(e) =>
                            setPointsInputMap({ ...pointsInputMap, [claim.id]: Number(e.target.value) })
                          }
                        />
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: 'var(--role-admin)' }}
                        onClick={() => handleReviewClaim(claim.id, 'APPROVED')}
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#ef4444' }}
                        onClick={() => handleReviewClaim(claim.id, 'REJECTED')}
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

      {/* Part 4: Event Attendees & Attendance Confirmation Modal */}
      {showAttendeesModal && selectedEvent && (
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
          <div className="auth-card" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Event Attendees: {selectedEvent.title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Award Value: <strong>+{selectedEvent.points} AICTE Points</strong> | Registered Members: <strong>{attendeesList.length}</strong>
                </p>
              </div>
              {attendanceConfirmed && (
                <span className="role-badge SUPER_ADMIN" style={{ fontSize: '0.75rem' }}>
                  <Lock size={12} /> Attendance Confirmed & Locked
                </span>
              )}
            </div>

            {attendanceConfirmed && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--role-admin)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <CheckCircle2 size={16} /> Attendance has been confirmed. AICTE activity points have been automatically awarded to present students.
              </div>
            )}

            {attendeesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No club members have registered for this event yet.
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Student Details</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Roll No</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Dept / Div / Year</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                        {attendanceConfirmed ? 'Status & Points' : 'Attendance Mark'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendeesList.map((att) => {
                      const isPresent = Boolean(attendanceMap[att.student_id]);

                      return (
                        <tr key={att.student_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>
                            {att.student_name}
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{att.email}</div>
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem' }}>{att.roll_number || 'N/A'}</td>
                          <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {att.department || 'N/A'} {att.division ? `(Div ${att.division})` : ''} {att.year ? `Yr ${att.year}` : ''}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                            {attendanceConfirmed ? (
                              att.present ? (
                                <span className="role-badge SUPER_ADMIN" style={{ fontSize: '0.725rem' }}>
                                  <CheckCircle2 size={11} /> Present (+{selectedEvent.points} Pts)
                                </span>
                              ) : (
                                <span className="role-badge" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.15)', fontSize: '0.725rem' }}>
                                  <XCircle size={11} /> Absent
                                </span>
                              )
                            ) : (
                              <div style={{ display: 'inline-flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <button
                                  type="button"
                                  style={{
                                    padding: '0.25rem 0.55rem',
                                    fontSize: '0.75rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    background: isPresent ? 'var(--role-admin)' : 'var(--bg-input)',
                                    color: isPresent ? '#fff' : 'var(--text-muted)',
                                  }}
                                  onClick={() => setAttendanceMap({ ...attendanceMap, [att.student_id]: true })}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    padding: '0.25rem 0.55rem',
                                    fontSize: '0.75rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    background: !isPresent ? '#ef4444' : 'var(--bg-input)',
                                    color: !isPresent ? '#fff' : 'var(--text-muted)',
                                  }}
                                  onClick={() => setAttendanceMap({ ...attendanceMap, [att.student_id]: false })}
                                >
                                  Absent
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              {!attendanceConfirmed && attendeesList.length > 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'var(--role-admin)' }}
                  onClick={handleConfirmAttendanceSubmit}
                  disabled={isConfirmingAttendance}
                >
                  <CheckCircle2 size={16} />
                  {isConfirmingAttendance ? 'Confirming...' : 'Confirm Attendance & Auto-Award Points'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAttendeesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              Set event details and fixed AICTE activity points granted to participating members.
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


