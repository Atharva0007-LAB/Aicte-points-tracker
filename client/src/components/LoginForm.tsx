import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, Mail, Sparkles } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, error, clearError, seed } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch {
      // Error handled in AuthContext state
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    clearError();
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Portal Sign In</h2>
          <p>Access your AICTE Points Tracker account</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <Mail size={14} style={{ display: 'inline', marginRight: 4 }} />
              Email Address
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
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            <LogIn size={16} />
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

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
      </div>
    </div>
  );
};
