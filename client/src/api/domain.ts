import { Category, EventItem, ActivityClaim, ActivitySummary, Certificate, User, Club, ClubEvent, ClubStatus } from '../types';

const API_BASE = '/api';

async function handleResponse(res: Response) {
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || 'Server error' };
  }

  if (!res.ok) {
    throw new Error(data.message || `Server error (${res.status})`);
  }

  return data;
}

// Categories
export async function apiGetCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`, { credentials: 'include' });
  const data = await handleResponse(res);
  return data.categories;
}

// Events (AICTE General Events)
export async function apiGetEvents(): Promise<EventItem[]> {
  const res = await fetch(`${API_BASE}/events`, { credentials: 'include' });
  const data = await handleResponse(res);
  return data.events;
}

export async function apiCreateEvent(eventData: Partial<EventItem>): Promise<void> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(eventData),
  });
  await handleResponse(res);
}

export async function apiDeleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await handleResponse(res);
}

// Club Applications & Management
export async function apiGetClubs(): Promise<Club[]> {
  const res = await fetch(`${API_BASE}/clubs`, { credentials: 'include' });
  const data = await handleResponse(res);
  return data.clubs;
}

export async function apiGetMyClub(): Promise<{ club: Club | null }> {
  const res = await fetch(`${API_BASE}/clubs/my`, { credentials: 'include' });
  return await handleResponse(res);
}

export async function apiUpdateClubStatus(id: string, status: ClubStatus): Promise<Club> {
  const res = await fetch(`${API_BASE}/clubs/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  const data = await handleResponse(res);
  return data.club;
}

// Fixed-Points Club Events System
export async function apiGetUpcomingClubEvents(): Promise<ClubEvent[]> {
  const res = await fetch(`${API_BASE}/club-events/upcoming`, { credentials: 'include' });
  const data = await handleResponse(res);
  return data.events || [];
}

export async function apiGetMyClubEvents(): Promise<ClubEvent[]> {
  const res = await fetch(`${API_BASE}/club-events/my`, { credentials: 'include' });
  const data = await handleResponse(res);
  return data.events || [];
}

export async function apiCreateClubEvent(eventData: {
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  points: number;
}): Promise<{ event: ClubEvent; message: string }> {
  const res = await fetch(`${API_BASE}/club-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(eventData),
  });
  return await handleResponse(res);
}

export async function apiUpdateClubEvent(
  id: string,
  eventData: Partial<ClubEvent>
): Promise<{ event: ClubEvent; message: string }> {
  const res = await fetch(`${API_BASE}/club-events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(eventData),
  });
  return await handleResponse(res);
}

export async function apiCancelClubEvent(id: string): Promise<{ event: ClubEvent; message: string }> {
  const res = await fetch(`${API_BASE}/club-events/${id}/cancel`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return await handleResponse(res);
}

// Activities
export async function apiGetActivities(): Promise<{ activities: ActivityClaim[]; summary?: ActivitySummary }> {
  const res = await fetch(`${API_BASE}/activities`, { credentials: 'include' });
  return await handleResponse(res);
}

export async function apiSubmitClaim(claimData: {
  title: string;
  category_id: string;
  event_id?: string;
  points_requested: number;
  proof_details: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/activities/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(claimData),
  });
  await handleResponse(res);
}

export async function apiReviewClaim(
  id: string,
  reviewData: { status: 'APPROVED' | 'REJECTED'; points_awarded?: number; rejection_reason?: string }
): Promise<void> {
  const res = await fetch(`${API_BASE}/activities/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(reviewData),
  });
  await handleResponse(res);
}

// Certificates
export async function apiGetCertificateStatus(studentId?: string): Promise<{
  certificate: Certificate | null;
  totalPoints: number;
  targetPoints: number;
  isEligible: boolean;
}> {
  const url = studentId ? `${API_BASE}/certificates?student_id=${studentId}` : `${API_BASE}/certificates`;
  const res = await fetch(url, { credentials: 'include' });
  return await handleResponse(res);
}

export async function apiIssueCertificate(studentId?: string): Promise<{ certificate: Certificate }> {
  const res = await fetch(`${API_BASE}/certificates/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ student_id: studentId }),
  });
  return await handleResponse(res);
}

// Admin
export async function apiGetUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/admin/users`, { credentials: 'include' });
  const data = await handleResponse(res);
  return data.users;
}

export async function apiCreateUser(userData: Partial<User> & { password: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(userData),
  });
  await handleResponse(res);
}

export async function apiGetAdminAudit(): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/audit`, { credentials: 'include' });
  return await handleResponse(res);
}
