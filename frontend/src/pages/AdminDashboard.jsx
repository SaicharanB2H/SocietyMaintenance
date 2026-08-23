import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import DashboardCard from '../components/DashboardCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import styles from './Dashboard.module.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [summaryRes, statusRes, categoryRes, trendsRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/status'),
          api.get('/dashboard/categories'),
          api.get('/dashboard/trends')
        ]);

        setSummary(summaryRes.data);
        setStatusData(statusRes.data);
        setCategoryData(categoryRes.data);
        
        // Format date string for trend charts
        const formattedTrends = trendsRes.data.map(item => {
          const d = new Date(item.date);
          return {
            ...item,
            displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          };
        });
        setTrendData(formattedTrends);

      } catch (err) {
        console.error('Error loading admin dashboard stats:', err);
        setError('Failed to fetch dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <ErrorMessage message={error} />;

  // Theme colors matching global css tokens
  const STATUS_COLORS = {
    'Open': '#f59e0b',
    'In Progress': '#3b82f6',
    'Resolved': '#10b981'
  };

  const getStatusColor = (name) => STATUS_COLORS[name] || '#6366f1';

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className={styles.grid}>
        <DashboardCard 
          label="Total complaints" 
          value={summary?.total || 0} 
          icon={<FileText size={24} />} 
          type="total"
        />
        <DashboardCard 
          label="Open Issues" 
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
        <DashboardCard 
          label="Overdue Issues" 
          value={summary?.overdue || 0} 
          icon={<AlertTriangle size={24} />} 
          type="overdue"
        />
      </div>

      {/* Analytics Charts section */}
      <div className={styles.chartsGrid}>
        
        {/* Trend Area Chart */}
        <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
          <h3 className={styles.chartTitle}>Complaint Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="displayDate" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                labelStyle={{ color: 'var(--text-secondary)' }}
              />
              <Area type="monotone" dataKey="count" name="Complaints Filed" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#trendGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Complaints by Category Bar Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Complaints by Category</h3>
          {categoryData.length === 0 ? (
            <div style={{ display: 'flex', height: '80%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No complaints filed yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="category" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="count" name="Count" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : 'var(--accent-cyan)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Complaints by Status Pie Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Complaints by Status</h3>
          {statusData.length === 0 ? (
            <div style={{ display: 'flex', height: '80%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No complaints filed yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
