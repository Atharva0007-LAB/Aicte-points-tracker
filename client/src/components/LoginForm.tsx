import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Key, Mail, User as UserIcon, Building2, AlignLeft, Sparkles } from 'lucide-react';

type AuthMode = 'login' | 'student_signup' | 'club_apply';

export const LoginForm: React.FC = () => {
  const { login, signup, applyClub, error, clearError, seed } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsSubmitting(true);
      if (authMode === 'student_signup') {
        if (!fullName) return;
        await signup(email, password, fullName);
      } else if (authMode === 'club_apply') {
        if (!fullName || !clubName) return;
        await applyClub({
          name: clubName,
          description: clubDescription,
          email,
          password,
          full_name: fullName,
        });
      } else {
        await login(email, password);
      }
    } catch {
      // Error handled in AuthContext state
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    clearError();
    setAuthMode(mode);
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    clearError();
    setAuthMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: authMode === 'club_apply' ? '480px' : '440px' }}>
        <div className="auth-header">
          <h2>
            {authMode === 'login' && 'Portal Sign In'}
            {authMode === 'student_signup' && 'Student Sign Up'}
            {authMode === 'club_apply' && 'Register Your Club'}
          </h2>
          <p>
            {authMode === 'login' && 'Access your AICTE Points Tracker account'}
            {authMode === 'student_signup' && 'Create your student account to track AICTE points'}
            {authMode === 'club_apply' && 'Apply to register a student club for Super Admin review'}
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {authMode === 'club_apply' && (
            <>
              <div className="form-group">
                <label>
                  <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Club / Organization Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Coding Club, Eco Warriors"
                  value={clubName}
                  onChange={(e) => {
                    clearError();
                    setClubName(e.target.value);
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <AlignLeft size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Club Description & Objectives
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Briefly describe club purpose and planned events..."
                  value={clubDescription}
                  onChange={(e) => {
                    clearError();
                    setClubDescription(e.target.value);
                  }}
                />
              </div>
            </>
          )}

          {(authMode === 'student_signup' || authMode === 'club_apply') && (
            <div className="form-group">
              <label>
                <UserIcon size={14} style={{ display: 'inline', marginRight: 4 }} />
                {authMode === 'club_apply' ? 'Administrator Full Name' : 'Full Name'}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => {
                  clearError();
                  setFullName(e.target.value);
                }}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>
              <Mail size={14} style={{ display: 'inline', marginRight: 4 }} />
              {authMode === 'club_apply' ? 'Administrator Email Address' : 'Email Address'}
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="user@college.edu"
              value={email}
              onChange={(e) => {
                clearError();
                setEmail(e.target.value);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Key size={14} style={{ display: 'inline', marginRight: 4 }} />
              Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                clearError();
                setPassword(e.target.value);
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '0.5rem',
              background: authMode === 'club_apply' ? 'var(--role-club)' : undefined,
              color: authMode === 'club_apply' ? '#0f172a' : undefined,
            }}
            disabled={isSubmitting}
          >
            {authMode === 'login' && <LogIn size={16} />}
            {authMode === 'student_signup' && <UserPlus size={16} />}
            {authMode === 'club_apply' && <Building2 size={16} />}
            {isSubmitting
              ? authMode === 'club_apply'
                ? 'Submitting Application...'
                : authMode === 'student_signup'
                ? 'Creating Account...'
                : 'Signing In...'
              : authMode === 'club_apply'
              ? 'Submit Club Application'
              : authMode === 'student_signup'
              ? 'Sign Up as Student'
              : 'Sign In'}
          </button>
        </form>

        {/* Navigation & Mode Switching Links */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {authMode === 'login' && (
            <>
              <div>
                New student?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('student_signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Student Sign Up
                </button>
              </div>
              <div style={{ paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                Represent a club?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('club_apply')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--role-club)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Register Your Club
                </button>
              </div>
            </>
          )}

          {authMode === 'student_signup' && (
            <>
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Sign In
                </button>
              </div>
              <div style={{ paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                Club Administrator?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('club_apply')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--role-club)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Register Your Club
                </button>
              </div>
            </>
          )}

          {authMode === 'club_apply' && (
            <>
              <div>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Back to Sign In
                </button>
              </div>
              <div>
                Are you a student?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('student_signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Student Sign Up
                </button>
              </div>
            </>
          )}
        </div>

        {authMode === 'login' && (
          <div className="demo-accounts">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4>Quick Demo Roles</h4>
              <button
                onClick={() => seed()}
                className="btn-demo"
                title="Seed DB with test accounts if not already seeded"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              >
                <Sparkles size={12} style={{ marginRight: 2 }} />
                Seed DB
              </button>
            </div>
            <div className="demo-grid">
              <button
                className="btn-demo"
                onClick={() => fillDemoAccount('admin@college.edu', 'AdminPassword123!')}
              >
                🔑 Super Admin
              </button>
              <button
                className="btn-demo"
                onClick={() => fillDemoAccount('club.robotics@college.edu', 'ClubPassword123!')}
              >
                🏆 Club Lead
              </button>
              <button
                className="btn-demo"
                onClick={() => fillDemoAccount('tnp.head@college.edu', 'TnpPassword123!')}
              >
                💼 TNP Officer
              </button>
              <button
                className="btn-demo"
                onClick={() => fillDemoAccount('student.alex@college.edu', 'StudentPassword123!')}
              >
                🎓 Student
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
