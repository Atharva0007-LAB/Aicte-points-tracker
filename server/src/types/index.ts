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

export interface AuthUserResponse {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: UserRole;
  }
}
