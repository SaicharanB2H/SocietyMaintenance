import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, Info, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Settings = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [thresholdDays, setThresholdDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/settings');
      setThresholdDays(response.data.overdue_threshold_days);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to fetch system configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Local validation
    if (thresholdDays < 1 || thresholdDays > 365) {
      setError('Overdue threshold must be between 1 and 365 days.');
      setSubmitting(false);
      return;
    }

    try {
      await api.patch('/settings', {
        overdue_threshold_days: parseInt(thresholdDays, 10)
      });
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.response?.data?.detail || 'Failed to update system configurations.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '32px' }}>
        <ErrorMessage message="Access Denied: Resident accounts do not have permission to view settings." />
      </div>
    );
  }

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn var(--transition-normal)' }}>
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <SettingsIcon size={24} color="var(--primary)" />
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: 0 }}>System Configurations</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          Configure global system settings for the Society Maintenance Tracker application.
        </p>

        {error && <ErrorMessage message={error} />}
        
        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-sm)',
            color: '#a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <CheckCircle2 size={18} color="#34d399" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label htmlFor="threshold-input">Overdue Threshold Duration (Days)</label>
            <input
              id="threshold-input"
              type="number"
              min="1"
              max="365"
              value={thresholdDays}
              onChange={(e) => setThresholdDays(e.target.value)}
              required
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
              Complaints unresolved (Open or In Progress) longer than this threshold are marked as "Overdue".
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--glass-border)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Changing this threshold will dynamically recalculate overdue calculations on all unresolved complaints. Resolved issues are never flagged overdue.</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
          >
            <Save size={18} />
            <span>{submitting ? 'Saving Configurations...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
