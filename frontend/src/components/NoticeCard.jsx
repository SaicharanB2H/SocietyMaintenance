import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Pin, Edit3, Trash2, Calendar } from 'lucide-react';
import styles from './NoticeCard.module.css';

export const NoticeCard = ({ notice, onEdit, onDelete }) => {
  const { isAdmin } = useAuth();

  const formattedDate = new Date(notice.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className={`${styles.card} ${notice.is_important ? styles.importantCard : ''}`}>
      {notice.is_important && (
        <span className={styles.pin}>
          <Pin size={12} style={{ transform: 'rotate(45deg)' }} /> Pinned
        </span>
      )}

      <div className={styles.header}>
        <h3 className={`${styles.title} ${notice.is_important ? styles.importantTitle : ''}`}>
          {notice.title}
        </h3>
        
        {isAdmin && (
          <div className={styles.actions}>
            <button 
              onClick={() => onEdit(notice)}
              className={styles.actionBtn}
              title="Edit notice"
            >
              <Edit3 size={16} />
            </button>
            <button 
              onClick={() => onDelete(notice.id)}
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              title="Delete notice"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <p className={styles.content}>{notice.content}</p>

      <div className={styles.footer}>
        <span className={styles.date} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} /> {formattedDate}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Posted by <span className={styles.adminName}>{notice.admin_name || 'Admin'}</span>
        </span>
      </div>
    </div>
  );
};

export default NoticeCard;
