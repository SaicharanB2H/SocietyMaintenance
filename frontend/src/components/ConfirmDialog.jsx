import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({ 
  isOpen, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel,
  isDanger = false
}) => {
  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-out'
  };

  const modalStyle = {
    width: '400px',
    maxWidth: '90%',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-lg)',
    borderRadius: 'var(--border-radius-md)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="glass-panel">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{
            background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            padding: '10px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={24} color={isDanger ? '#ef4444' : '#f59e0b'} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>{title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 0 }}>{message}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button onClick={onCancel} className="btn btn-secondary">
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
