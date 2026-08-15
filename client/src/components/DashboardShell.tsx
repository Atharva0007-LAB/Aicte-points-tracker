import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { StudentDashboard } from './StudentDashboard';
import { ClubDashboard } from './ClubDashboard';
import { TnpDashboard } from './TnpDashboard';
import { AdminDashboard } from './AdminDashboard';
import { ProfileCompletionModal } from './ProfileCompletionModal';
import { ClubPendingApproval } from './ClubPendingApproval';

export const DashboardShell: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case UserRole.STUDENT:
      if (!user.roll_number || !user.roll_number.trim()) {
        return <ProfileCompletionModal isMandatory={true} />;
      }
      return <StudentDashboard />;
    case UserRole.CLUB:
      if (user.club_status !== 'APPROVED') {
        return <ClubPendingApproval />;
      }
      return <ClubDashboard />;
    case UserRole.TNP:
      return <TnpDashboard />;
    case UserRole.SUPER_ADMIN:
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
};
