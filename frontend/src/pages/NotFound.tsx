import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '9999px',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <HelpCircle size={36} />
      </div>
      <h2>404 - Page Not Found</h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
        The page or resource you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        <ArrowLeft size={16} /> Return to Dashboard
      </Link>
    </div>
  );
};
