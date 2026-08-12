import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  type?: 'danger' | 'warning' | 'success' | 'info';
  message: string;
  details?: { field?: string; message: string }[];
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type = 'danger', message, details }) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle size={20} className="alert-icon" />;
      case 'warning':
        return <AlertTriangle size={20} className="alert-icon" />;
      case 'success':
        return <CheckCircle size={20} className="alert-icon" />;
      default:
        return <Info size={20} className="alert-icon" />;
    }
  };

  return (
    <div className={`alert alert-${type}`}>
      {getIcon()}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{message}</div>
        {details && details.length > 0 && (
          <ul style={{ marginTop: '0.35rem', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
            {details.map((d, idx) => (
              <li key={idx}>
                {d.field ? <strong>{d.field}: </strong> : null}
                {d.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
