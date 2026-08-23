import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ErrorMessage = ({ message, onRetry }) => {
  const containerStyle = {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '16px 20px',
    borderRadius: 'var(--border-radius-sm)',
    color: '#fca5a5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    margin: '16px 0',
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>
          {message || 'An unexpected error occurred. Please try again.'}
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
