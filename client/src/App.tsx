import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginForm } from './components/LoginForm';
import { DashboardShell } from './components/DashboardShell';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="pulse-dot" style={{ width: 16, height: 16, margin: '0 auto 1rem' }}></div>
          <p>Connecting to AICTE Points Tracker API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">{user ? <DashboardShell /> : <LoginForm />}</main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
