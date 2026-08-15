import React, { useState, useEffect } from 'react';
import { User, UserRole, Club, ClubStatus } from '../types';
import { apiGetUsers, apiCreateUser, apiGetAdminAudit, apiGetClubs, apiUpdateClubStatus } from '../api/domain';
import { ShieldCheck, UserPlus, Users, Award, FileCheck, Calendar, Building2, Check, X, Clock } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [department, setDepartment] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uList, auditData, cList] = await Promise.all([
        apiGetUsers(),
        apiGetAdminAudit(),
        apiGetClubs(),
      ]);
      setUsers(uList);
      setAudit(auditData);
      setClubs(cList || []);
    } catch (err) {
      console.error('Failed to load admin audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClubStatus = async (clubId: string, status: ClubStatus) => {
    try {
      await apiUpdateClubStatus(clubId, status);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update club status');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !role) return;

    try {
      await apiCreateUser({
        email,
        password,
        full_name: fullName,
        role,
        department,
      });

      alert('User Account Created Successfully!');
      setShowUserModal(false);
      setEmail('');
      setPassword('');
      setFullName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Super Admin Workspace...</div>;
  }

  return (
    <div className="dashboard-grid">
      <div className="welcome-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #10b981' }}>
        <div className="welcome-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck style={{ color: '#10b981' }} />
              Super Admin System Oversight
            </h2>
            <p>College activity points system control, user account provisioning, and global audit metrics</p>
          </div>
          <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={() => setShowUserModal(true)}>
            <UserPlus size={16} />
            Create User Account
          </button>
        </div>
      </div>

      {/* Global Audit Metrics Cards */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1rem' }}>Global System Audit Metrics</h3>
      <div className="card-grid">
        <div className="info-card">
          <div className="info-card-header">
            <div className="info-icon" style={{ color: '#10b981' }}>
              <Users size={20} />
            </div>
            <div>
              <h3>{users.length} Total Users</h3>
              <p>Registered across 4 roles</p>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <div className="info-icon" style={{ color: '#f59e0b' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3>{audit?.totalEvents || 0} Events Published</h3>
              <p>Active & completed activities</p>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <div className="info-icon" style={{ color: '#3b82f6' }}>
              <Award size={20} />
            </div>
            <div>
              <h3>AICTE Points Ledger</h3>
              <p>System-wide point records verified</p>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <div className="info-icon" style={{ color: '#8b5cf6' }}>
              <FileCheck size={20} />
            </div>
            <div>
              <h3>{audit?.totalCertificatesIssued || 0} Certificates</h3>
              <p>100-Point Certificates issued</p>
            </div>
          </div>
        </div>
      </div>

      {/* Club Applications & Management */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Building2 size={18} style={{ color: 'var(--role-club)' }} />
          Club Applications & Approvals ({clubs.length})
        </h3>
      </div>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Club Name</th>
              <th style={{ padding: '0.85rem 1rem' }}>Description</th>
              <th style={{ padding: '0.85rem 1rem' }}>Administrator</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clubs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No club applications registered yet.
                </td>
              </tr>
            ) : (
              clubs.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{c.name}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '280px' }}>
                    {c.description || 'No description provided'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{c.admin_name || 'Admin'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.admin_email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      className={`role-badge ${c.status === 'APPROVED' ? 'SUPER_ADMIN' : c.status === 'REJECTED' ? 'STUDENT' : 'CLUB'}`}
                      style={{
                        color: c.status === 'APPROVED' ? 'var(--role-admin)' : c.status === 'REJECTED' ? 'var(--error-color)' : 'var(--role-club)',
                        background: c.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : c.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {c.status !== 'APPROVED' && (
                        <button
                          className="btn btn-primary"
                          style={{ background: 'var(--role-admin)', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleClubStatus(c.id, 'APPROVED')}
                          title="Approve Club"
                        >
                          <Check size={13} /> Approve
                        </button>
                      )}
                      {c.status !== 'REJECTED' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--error-color)' }}
                          onClick={() => handleClubStatus(c.id, 'REJECTED')}
                          title="Reject Club"
                        >
                          <X size={13} /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Directory */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1.5rem' }}>User Directory ({users.length})</h3>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Full Name</th>
              <th style={{ padding: '0.85rem 1rem' }}>Email Address</th>
              <th style={{ padding: '0.85rem 1rem' }}>Role</th>
              <th style={{ padding: '0.85rem 1rem' }}>Department</th>
              <th style={{ padding: '0.85rem 1rem' }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{u.full_name}</td>
                <td style={{ padding: '0.85rem 1rem' }}>{u.email}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span className={`role-badge ${u.role}`}>{u.role}</span>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{u.department || 'N/A'}</td>
                <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Initial Seed'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showUserModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="auth-card" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create User Account</h3>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="s.jenkins@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assigned Role</label>
                <select className="form-control" value={role} onChange={(e) => setRole(e.target.value as UserRole)} required>
                  <option value={UserRole.STUDENT}>STUDENT (Student Portal)</option>
                  <option value={UserRole.CLUB}>CLUB (Club Lead)</option>
                  <option value={UserRole.TNP}>TNP (Training & Placement)</option>
                  <option value={UserRole.SUPER_ADMIN}>SUPER_ADMIN (System Administrator)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Computer Science or Student Affairs"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#10b981' }}>
                  Create User
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
