import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccessDenied: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '9999px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <ShieldAlert size={36} />
      </div>
      <h2>403 - Access Denied</h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
        Your role (<strong>{user?.role || 'Guest'}</strong>) does not have authorization to view or perform operations on this module.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        <ArrowLeft size={16} /> Return to Dashboard
      </Link>
    </div>
  );
};
