import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  AlertTriangle, 
  Camera, 
  ShieldAlert, 
  CheckCircle2, 
  Activity,
  Plus
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ComplaintTimeline from '../components/ComplaintTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Admin form states
  const [statusVal, setStatusVal] = useState('');
  const [noteVal, setNoteVal] = useState('');
  const [priorityVal, setPriorityVal] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/complaints/${id}`);
      setComplaint(response.data);
      setStatusVal(response.data.status);
      setPriorityVal(response.data.priority);
    } catch (err) {
      console.error('Error fetching complaint details:', err);
      setError(
        err.response?.data?.detail || 'Failed to load complaint. It may not exist or you may not have permission.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusVal) return;
    
    setUpdatingStatus(true);
    setError('');
    try {
      const response = await api.patch(`/complaints/${id}/status`, {
        status: statusVal,
        note: noteVal.trim() || null
      });
      // Refresh details
      setComplaint(response.data);
      setNoteVal('');
      // Re-fetch entire details to populate history correctly
      const fullRes = await api.get(`/complaints/${id}`);
      setComplaint(fullRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update complaint status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePriority = async (e) => {
    e.preventDefault();
    if (!priorityVal) return;

    setUpdatingPriority(true);
    setError('');
    try {
      const response = await api.patch(`/complaints/${id}/priority`, {
        priority: priorityVal
      });
      setComplaint(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update complaint priority.');
    } finally {
      setUpdatingPriority(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchComplaint} />;
  if (!complaint) return <p style={{ textAlign: 'center', marginTop: '32px' }}>Complaint not found.</p>;

  const dateFiled = new Date(complaint.created_at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Check if status is Resolved (terminal state)
  const isResolved = complaint.status === 'Resolved';

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      {/* Back CTA */}
      <button 
        onClick={() => navigate('/complaints')} 
        className="btn btn-secondary"
        style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Complaints</span>
      </button>

      {/* Main double column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }} className="grid-details-responsive">
        
        {/* Left Column: Complaint Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
                  {complaint.category} Complaint
                </h2>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  ID: {complaint.id.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {complaint.is_overdue && (
                  <span className="badge" style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', border: '1px solid var(--status-overdue-border)' }}>
                    <AlertTriangle size={12} /> Overdue
                  </span>
                )}
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Description
              </h3>
              <p style={{ fontSize: '16px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: 0 }}>
                {complaint.description}
              </p>
            </div>

            {/* Attached Photo */}
            {complaint.photo_url && (
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} /> Attached Image
                </h3>
                <div style={{ maxWidth: '400px', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  <a href={complaint.photo_url} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={complaint.photo_url} 
                      alt="Complaint snapshot" 
                      style={{ width: '100%', height: 'auto', display: 'block', transition: 'var(--transition-fast)' }}
                      className="photo-hover-zoom"
                    />
                  </a>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
                  Click image to open in full screen
                </span>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} />
                <span>Filed by: <strong>{complaint.resident_name || 'Resident'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} />
                <span>Filed on: {dateFiled}</span>
              </div>
            </div>
          </div>

          {/* Admin Management Controls */}
          {isAdmin && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                <ShieldAlert size={20} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: 0 }}>Admin Administration Panel</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-admin-responsive">
                {/* Status Update Form */}
                <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Update Status</h4>
                  
                  <div>
                    <label htmlFor="status-select">Select Status</label>
                    <select
                      id="status-select"
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      disabled={isResolved}
                    >
                      <option value="Open" disabled={complaint.status !== 'Open'}>Open</option>
                      <option value="In Progress" disabled={complaint.status === 'Resolved'}>In Progress</option>
                      <option value="Resolved" disabled={complaint.status === 'Resolved'}>Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="transition-note">Transition Comment Note (Optional)</label>
                    <input
                      id="transition-note"
                      type="text"
                      placeholder="e.g. Plumber assigned, work in progress"
                      value={noteVal}
                      onChange={(e) => setNoteVal(e.target.value)}
                      disabled={isResolved}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingStatus || isResolved || statusVal === complaint.status}
                    style={{ marginTop: '4px' }}
                  >
                    {updatingStatus ? 'Updating...' : 'Apply Status Update'}
                  </button>
                  {isResolved && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Resolved complaints are locked and closed.
                    </span>
                  )}
                </form>

                {/* Priority Update Form */}
                <form onSubmit={handleUpdatePriority} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assign Priority</h4>
                  
                  <div>
                    <label htmlFor="priority-select">Set Urgency Level</label>
                    <select
                      id="priority-select"
                      value={priorityVal}
                      onChange={(e) => setPriorityVal(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={updatingPriority || priorityVal === complaint.priority}
                    style={{ marginTop: '56px' }} // Aligns with inputs
                  >
                    {updatingPriority ? 'Assigning...' : 'Assign Priority'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Timeline History Log */}
        <div>
          <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--primary)" />
              <span>Resolution Timeline</span>
            </h3>
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
              <ComplaintTimeline history={complaint.history || []} />
            </div>
          </div>
        </div>

      </div>

      {/* Embedded styles for detail media queries and helper classes */}
      <style>{`
        .photo-hover-zoom:hover {
          transform: scale(1.02);
        }
        @media (max-width: 900px) {
          .grid-details-responsive {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .grid-admin-responsive {
            grid-template-columns: 1fr !important;
          }
          .grid-admin-responsive button {
            margin-top: 4px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ComplaintDetails;
