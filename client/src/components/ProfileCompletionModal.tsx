import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Sparkles, Building2, Hash, Layers, Calendar, X } from 'lucide-react';

interface ProfileCompletionProps {
  isMandatory?: boolean;
  onClose?: () => void;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionProps> = ({
  isMandatory = false,
  onClose,
}) => {
  const { user, updateProfile } = useAuth();

  const [rollNumber, setRollNumber] = useState(user?.roll_number || '');
  const [department, setDepartment] = useState<'COMPS' | 'IT'>(
    user?.department === 'IT' ? 'IT' : 'COMPS'
  );
  const [division, setDivision] = useState(user?.division || '');
  const [year, setYear] = useState(user?.year || '1st Year');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!rollNumber.trim()) {
      setErrorMessage('Roll number is required.');
      return;
    }

    if (department !== 'COMPS' && department !== 'IT') {
      setErrorMessage('Department must be Computer Engineering (COMPS) or Information Technology (IT).');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        roll_number: rollNumber.trim(),
        department,
        division: division.trim(),
        year,
      });

      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="auth-card" style={{ maxWidth: '520px', width: '100%' }}>
      <div className="auth-header" style={{ position: 'relative' }}>
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '-0.5rem',
              right: '-0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        )}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(14, 165, 233, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <UserCheck size={26} />
        </div>
        <h2>{isMandatory ? 'Complete Your Profile' : 'Edit Student Profile'}</h2>
        <p>
          {isMandatory
            ? 'Please provide your academic information before accessing the AICTE Points Ledger.'
            : 'Update your academic registration details.'}
        </p>
      </div>

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <Hash size={14} style={{ display: 'inline', marginRight: 4 }} />
            Roll Number
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. 2024-COMPS-101"
            value={rollNumber}
            onChange={(e) => {
              setErrorMessage(null);
              setRollNumber(e.target.value);
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />
            Department
          </label>
          <select
            className="form-control"
            value={department}
            onChange={(e) => {
              setErrorMessage(null);
              setDepartment(e.target.value as 'COMPS' | 'IT');
            }}
            required
          >
            <option value="COMPS">Computer Engineering (COMPS)</option>
            <option value="IT">Information Technology (IT)</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>
              <Layers size={14} style={{ display: 'inline', marginRight: 4 }} />
              Division
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. A"
              value={division}
              onChange={(e) => {
                setErrorMessage(null);
                setDivision(e.target.value);
              }}
            />
          </div>

          <div className="form-group">
            <label>
              <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
              Year
            </label>
            <select
              className="form-control"
              value={year}
              onChange={(e) => {
                setErrorMessage(null);
                setYear(e.target.value);
              }}
              required
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={isSubmitting}
          >
            <Sparkles size={16} />
            {isSubmitting ? 'Saving Profile...' : isMandatory ? 'Save & Go to Dashboard' : 'Save Changes'}
          </button>
          {!isMandatory && onClose && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );

  if (isMandatory) {
    return (
      <div className="auth-wrapper" style={{ minHeight: 'calc(100vh - 140px)', padding: '2rem 1rem' }}>
        {formContent}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      {formContent}
    </div>
  );
};
