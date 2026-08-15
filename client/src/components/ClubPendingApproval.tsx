import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Building2, User, Mail, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export const ClubPendingApproval: React.FC = () => {
  const { user, logout } = useAuth();
  const isRejected = user?.club_status === 'REJECTED';

  return (
    <div className="auth-wrapper" style={{ minHeight: 'calc(100vh - 140px)', padding: '2rem 1rem' }}>
      <div className="auth-card" style={{ maxWidth: '540px', width: '100%', textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: isRejected ? 'var(--error-color)' : 'var(--role-club)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: isRejected ? '0 0 20px rgba(239, 68, 68, 0.2)' : '0 0 20px rgba(245, 158, 11, 0.2)',
          }}
        >
          {isRejected ? <ShieldAlert size={30} /> : <Clock size={30} />}
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {isRejected ? 'Club Application Rejected' : 'Your Club is Awaiting Approval'}
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {isRejected
            ? 'Unfortunately, your club registration was not approved by the Super Admin.'
            : 'Your club self-application has been submitted successfully and is currently under review by the College Super Administrator.'}
        </p>

        {/* Club Details Card */}
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={14} /> Club Name:
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {user?.club_name || user?.department || 'Student Club'}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={14} /> Administrator:
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.full_name}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} /> Email:
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Application Status:</span>
            <span
              className={`role-badge ${isRejected ? 'STUDENT' : 'CLUB'}`}
              style={{
                color: isRejected ? 'var(--error-color)' : 'var(--role-club)',
                background: isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: isRejected ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              {isRejected ? 'REJECTED' : 'PENDING APPROVAL'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
            title="Check if approved"
          >
            <RefreshCw size={15} />
            Refresh Status
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => logout()}
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
