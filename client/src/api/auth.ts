import { User, Club } from '../types';

const API_BASE = '/api';

async function handleResponse(res: Response) {
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || 'Server returned an invalid response' };
  }

  if (!res.ok) {
    throw new Error(data.message || `Server error (${res.status}): Please check backend server.`);
  }

  return data;
}

export async function apiApplyClub(clubData: {
  name: string;
  description?: string;
  email: string;
  password: string;
  full_name: string;
}): Promise<{ user: User; club: Club; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/clubs/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(clubData),
    });

    return await handleResponse(res);
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Cannot connect to backend server. Make sure backend is running.');
    }
    throw err;
  }
}

export async function apiSignup(email: string, password: string, full_name: string): Promise<{ user: User; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, full_name }),
    });

    return await handleResponse(res);
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Cannot connect to backend server. Make sure "npm run dev:server" is running on port 5000.');
    }
    throw err;
  }
}

export async function apiUpdateProfile(profileData: {
  roll_number: string;
  department: string;
  division?: string;
  year?: string;
}): Promise<{ user: User; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });

    return await handleResponse(res);
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Cannot connect to backend server. Make sure "npm run dev:server" is running on port 5000.');
    }
    throw err;
  }
}

export async function apiLogin(email: string, password: string): Promise<{ user: User }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    return await handleResponse(res);
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Cannot connect to backend server. Make sure "npm run dev:server" is running on port 5000.');
    }
    throw err;
  }
}

export async function apiLogout(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  await handleResponse(res);
}

export async function apiGetMe(): Promise<{ user: User }> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Backend server disconnected');
    }
    throw err;
  }
}

export async function apiTriggerSeed(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/seed`, {
    method: 'POST',
    credentials: 'include',
  });
  return await handleResponse(res);
}

export async function apiGetHealth(): Promise<{ status: string; database: string }> {
  const res = await fetch(`${API_BASE}/health`, {
    method: 'GET',
    credentials: 'include',
  });
  return await handleResponse(res);
}
