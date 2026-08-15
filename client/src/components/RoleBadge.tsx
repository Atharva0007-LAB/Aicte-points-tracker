import React from 'react';
import { UserRole } from '../types';
import { ShieldCheck, Award, Briefcase, GraduationCap } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getIcon = () => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <ShieldCheck size={14} />;
      case UserRole.CLUB:
        return <Award size={14} />;
      case UserRole.TNP:
        return <Briefcase size={14} />;
      case UserRole.STUDENT:
        return <GraduationCap size={14} />;
    }
  };

  const formatRoleLabel = (r: UserRole) => {
    switch (r) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.CLUB:
        return 'Club Head';
      case UserRole.TNP:
        return 'TNP Officer';
      case UserRole.STUDENT:
        return 'Student';
    }
  };

  return (
    <span className={`role-badge ${role}`}>
      {getIcon()}
      {formatRoleLabel(role)}
    </span>
  );
};
