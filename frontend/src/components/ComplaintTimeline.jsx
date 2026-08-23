import React from 'react';
import styles from './ComplaintTimeline.module.css';

export const ComplaintTimeline = ({ history }) => {
  if (!history || history.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No history logs recorded.</p>;
  }

  const getNodeClass = (status) => {
    switch (status) {
      case 'Open':
        return { node: styles.nodeOpen, dot: styles.iconOpen };
      case 'In Progress':
        return { node: styles.nodeProgress, dot: styles.iconProgress };
      case 'Resolved':
        return { node: styles.nodeResolved, dot: styles.iconResolved };
      default:
        return { node: '', dot: '' };
    }
  };

  return (
    <div className={styles.timeline}>
      {history.map((step) => {
        const { node, dot } = getNodeClass(step.new_status);
        
        const date = new Date(step.created_at).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div key={step.id} className={styles.step}>
            <div className={`${styles.node} ${node}`}>
              <div className={`${styles.nodeIcon} ${dot}`} />
            </div>

            <div className={styles.content}>
              <div className={styles.header}>
                <span className={styles.statusName} style={{
                  color: step.new_status === 'Open' ? 'var(--status-open)' :
                         step.new_status === 'In Progress' ? 'var(--status-progress)' :
                         'var(--status-resolved)'
                }}>
                  {step.new_status}
                </span>
                <span className={styles.date}>{date}</span>
              </div>
              
              <div className={styles.meta}>
                Changed by <span className={styles.actor}>{step.actor_name || 'System'}</span>
              </div>

              {step.note && (
                <div className={styles.note}>
                  {step.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ComplaintTimeline;
