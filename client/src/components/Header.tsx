import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { LogOut, BookOpen } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-group">
          <div className="logo-icon">
            <BookOpen size={22} />
          </div>
          <div className="logo-text">
            <h1>AICTE Points Tracker</h1>
            <p>College Activity Point System (100 Pt Requirement)</p>
          </div>
        </div>

        {user && (
          <div className="user-nav">
            <RoleBadge role={user.role} />
            <div className="user-info">
              <span className="user-name">{user.full_name}</span>
              <span className="user-dept">
                {user.roll_number ? `${user.roll_number} • ` : ''}
                {user.department || user.email}
              </span>
            </div>
            <button className="btn btn-secondary" onClick={() => logout()} title="Sign Out">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
