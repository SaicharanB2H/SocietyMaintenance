import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import styles from './ComplaintCard.module.css';

export const ComplaintCard = ({ complaint }) => {
  const navigate = useNavigate();

  const formattedDate = new Date(complaint.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div 
      className={`${styles.card} ${complaint.is_overdue ? styles.overdueCard : ''}`}
      onClick={() => navigate(`/complaints/${complaint.id}`)}
    >
      {complaint.is_overdue && (
        <span className={styles.overdueBadge}>
          <AlertTriangle size={10} /> Overdue
        </span>
      )}
      
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{complaint.category}</h3>
          <span className={styles.id}>#{complaint.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      <p className={styles.desc}>{complaint.description}</p>

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Resident: <strong>{complaint.resident_name || 'Resident'}</strong>
          </span>
          <span className={styles.date} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} /> Filed {formattedDate}
          </span>
        </div>
        <PriorityBadge priority={complaint.priority} />
      </div>
    </div>
  );
};

export default ComplaintCard;
