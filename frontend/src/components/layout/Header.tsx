import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="top-header">
      <div>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>
          Mini ERP + CRM Portal
        </h2>
      </div>

      {user && (
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2 }}>
              {user.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {user.email}
            </span>
          </div>
          <Badge variant="role">{user.role}</Badge>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => logout()}
            title="Log out of application"
            style={{ marginLeft: '0.5rem' }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </header>
  );
};
