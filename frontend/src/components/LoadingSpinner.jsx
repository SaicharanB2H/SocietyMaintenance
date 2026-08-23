import React from 'react';

export const LoadingSpinner = ({ size = 'medium', fullPage = false }) => {
  const getSpinnerDimensions = () => {
    switch (size) {
      case 'small':
        return { width: '16px', height: '16px', borderWidth: '2px' };
      case 'large':
        return { width: '48px', height: '48px', borderWidth: '4px' };
      case 'medium':
      default:
        return { width: '32px', height: '32px', borderWidth: '3px' };
    }
  };

  const spinnerStyle = {
    ...getSpinnerDimensions(),
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const containerStyle = fullPage
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
