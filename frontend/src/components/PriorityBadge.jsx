import React from 'react';
import styles from './Badges.module.css';

export const PriorityBadge = ({ priority }) => {
  const getPriorityStyle = () => {
    switch (priority) {
      case 'High':
        return { className: styles.priorityHigh, dot: '🔴' };
      case 'Medium':
        return { className: styles.priorityMedium, dot: '🟠' };
      case 'Low':
        return { className: styles.priorityLow, dot: '🟢' };
      default:
        return { className: '', dot: '' };
    }
  };

  const { className, dot } = getPriorityStyle();

  return (
    <span className={`${styles.priorityBadge} ${className}`}>
      <span className={styles.dot}>{dot}</span>
      <span>{priority}</span>
    </span>
  );
};

export default PriorityBadge;
