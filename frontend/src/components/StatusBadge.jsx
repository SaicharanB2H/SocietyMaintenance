import React from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import styles from './Badges.module.css';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Open':
        return { className: styles.statusOpen, icon: <AlertCircle size={14} /> };
      case 'In Progress':
        return { className: styles.statusProgress, icon: <Clock size={14} /> };
      case 'Resolved':
        return { className: styles.statusResolved, icon: <CheckCircle2 size={14} /> };
      default:
        return { className: '', icon: null };
    }
  };

  const { className, icon } = getBadgeStyle();

  return (
    <span className={`badge ${className}`}>
      {icon}
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
