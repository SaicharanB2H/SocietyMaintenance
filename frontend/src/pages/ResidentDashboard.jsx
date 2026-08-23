import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PlusCircle, FileText, CheckCircle2, Clock, Inbox } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import ComplaintCard from '../components/ComplaintCard';
import NoticeCard from '../components/NoticeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import styles from './Dashboard.module.css';

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch summary metrics
        const summaryRes = await api.get('/dashboard/summary');
        setSummary(summaryRes.data);

        // Fetch recent complaints (first page, limit 3)
        const complaintsRes = await api.get('/complaints?page=1&limit=3');
        setRecentComplaints(complaintsRes.data.items);

        // Fetch notice board announcements (limit 3)
        const noticesRes = await api.get('/notices');
        setRecentNotices(noticesRes.data.slice(0, 3));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner size="large" fullPage={false} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className={styles.grid}>
        <DashboardCard 
          label="Total Complaints" 
          value={summary?.total || 0} 
          icon={<FileText size={24} />} 
          type="total"
        />
        <DashboardCard 
          label="Open" 
          value={summary?.open || 0} 
          icon={<Clock size={24} />} 
          type="open"
        />
        <DashboardCard 
          label="In Progress" 
          value={summary?.in_progress || 0} 
          icon={<Clock size={24} />} 
          type="progress"
        />
        <DashboardCard 
          label="Resolved" 
          value={summary?.resolved || 0} 
          icon={<CheckCircle2 size={24} />} 
          type="resolved"
        />
      </div>

      {/* Main Split Grid */}
      <div className={styles.dashboardContent}>
        {/* Left Column: Recent Complaints */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Complaints</h2>
            <button 
              onClick={() => navigate('/complaints/raise')} 
              className="btn btn-primary"
            >
              <PlusCircle size={18} />
              <span>Raise Complaint</span>
            </button>
          </div>

          {recentComplaints.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Inbox size={40} />
              </div>
              <h3>No complaints filed yet</h3>
              <p>If you have any maintenance issues, feel free to raise a complaint now.</p>
              <button 
                onClick={() => navigate('/complaints/raise')} 
                className="btn btn-primary"
              >
                Raise a Complaint
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {recentComplaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Notice Board Announcement Sidebar */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Notice Board</h2>
            <button 
              onClick={() => navigate('/notices')} 
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              View All
            </button>
          </div>

          {recentNotices.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: '32px' }}>
              <h3>No announcements</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>There are no active notices at the moment.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentNotices.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
