import React from 'react';
import styles from './DashboardCard.module.css';

export const DashboardCard = ({ label, value, icon, type = 'total' }) => {
  const getCardClass = () => {
    switch (type) {
      case 'open':
        return styles.cardOpen;
      case 'progress':
        return styles.cardProgress;
      case 'resolved':
        return styles.cardResolved;
      case 'overdue':
        return styles.cardOverdue;
      case 'total':
      default:
        return styles.cardTotal;
    }
  };

  return (
    <div className={`${styles.card} ${getCardClass()}`}>
      <div>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
      </div>
      <div className={styles.iconWrapper}>
        {icon}
      </div>
    </div>
  );
};

export default DashboardCard;
