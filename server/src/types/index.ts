export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CLUB = 'CLUB',
  TNP = 'TNP',
  STUDENT = 'STUDENT'
}

export type ClubStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ClubEventStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string | null;
  roll_number?: string | null;
  division?: string | null;
  year?: string | null;
  club_id?: string | null;
  club_name?: string | null;
  club_status?: ClubStatus | null;
  created_at?: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  roll_number?: string | null;
  division?: string | null;
  year?: string | null;
  club_id?: string | null;
  club_name?: string | null;
  club_status?: ClubStatus | null;
}

export interface Club {
  id: string;
  name: string;
  description?: string | null;
  administrator_user_id: string;
  status: ClubStatus;
  created_at?: string;
  updated_at?: string;
  admin_name?: string;
  admin_email?: string;
}

export interface ClubEvent {
  id: string;
  club_id: string;
  club_name?: string;
  title: string;
  description?: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  points: number;
  status: ClubEventStatus;
  created_at?: string;
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: UserRole;
  }
}
