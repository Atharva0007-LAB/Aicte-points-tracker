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
  attendance_confirmed?: boolean;
  is_registered?: boolean;
  is_member?: boolean;
  registration_count?: number;
  created_at?: string;
}

export type MembershipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ClubMembership {
  id: string;
  club_id: string;
  student_id: string;
  status: MembershipStatus;
  created_at?: string;
  updated_at?: string;
  club_name?: string;
  student_name?: string;
  student_email?: string;
  roll_number?: string | null;
  department?: string | null;
  division?: string | null;
  year?: string | null;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  created_at?: string;
}

export interface EventAttendee {
  student_id: string;
  student_name: string;
  email: string;
  roll_number: string | null;
  department: string | null;
  division: string | null;
  year: string | null;
  registered_at: string;
  present?: boolean | null;
}

export interface ActivityClaim {
  id: string;
  student_id: string;
  student_name: string;
  event_id?: string | null;
  event_title?: string | null;
  club_event_id?: string | null;
  category_id: string;
  category_name?: string;
  max_points?: number;
  title: string;
  points_requested: number;
  points_awarded: number;
  proof_details: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  target_type?: 'CLUB' | 'TNP' | null;
  target_club_id?: string | null;
  target_club_name?: string | null;
  reviewed_by?: string | null;
  reviewer_role?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: UserRole;
  }
}

