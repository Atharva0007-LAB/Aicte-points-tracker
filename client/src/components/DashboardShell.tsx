import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { StudentDashboard } from './StudentDashboard';
import { ClubDashboard } from './ClubDashboard';
import { TnpDashboard } from './TnpDashboard';
import { AdminDashboard } from './AdminDashboard';

export const DashboardShell: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case UserRole.STUDENT:
      return <StudentDashboard />;
    case UserRole.CLUB:
      return <ClubDashboard />;
    case UserRole.TNP:
      return <TnpDashboard />;
    case UserRole.SUPER_ADMIN:
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
};
