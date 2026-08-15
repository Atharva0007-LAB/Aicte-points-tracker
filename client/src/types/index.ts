export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CLUB = 'CLUB',
  TNP = 'TNP',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string | null;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  max_points: number;
  min_points: number;
  description: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name?: string;
  points: number;
  event_date: string;
  location: string;
  organizer_id: string;
  organizer_name: string;
  status: string;
  created_at?: string;
}

export interface ActivityClaim {
  id: string;
  student_id: string;
  student_name: string;
  event_id?: string | null;
  event_title?: string | null;
  category_id: string;
  category_name?: string;
  max_points?: number;
  title: string;
  points_requested: number;
  points_awarded: number;
  proof_details: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string | null;
  reviewer_role?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface ActivitySummary {
  totalPoints: number;
  rawTotalPoints: number;
  targetPoints: number;
  isEligibleForCertificate: boolean;
  categoryTotals: Record<string, { name: string; points: number; max: number }>;
}

export interface Certificate {
  id: string;
  student_id: string;
  total_points: number;
  issued_at: string;
  approved_by?: string;
  certificate_code: string;
}
