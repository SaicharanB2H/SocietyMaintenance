import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Megaphone, Plus, BellRing, Info, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import NoticeCard from '../components/NoticeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';

const NoticeBoard = () => {
  const { isAdmin } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal open states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null); // Holds notice object when editing
  const [submitting, setSubmitting] = useState(false);

  // Deletion state
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm();

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/notices');
      setNotices(response.data);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError('Failed to load notices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const openAddModal = () => {
    setEditingNotice(null);
    reset({
      title: '',
      content: '',
      is_important: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setValue('title', notice.title);
    setValue('content', notice.content);
    setValue('is_important', notice.is_important);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      if (editingNotice) {
        // Edit Notice
        await api.patch(`/notices/${editingNotice.id}`, data);
      } else {
        // Create Notice
        await api.post('/notices', data);
      }
      setIsModalOpen(false);
      reset();
      fetchNotices();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save notice. Please check input values.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!noticeToDelete) return;
    try {
      await api.delete(`/notices/${noticeToDelete}`);
      setNoticeToDelete(null);
      fetchNotices();
    } catch (err) {
      console.error(err);
      setError('Failed to delete notice. Please try again.');
    }
  };

  if (loading && notices.length === 0) return <LoadingSpinner size="large" />;

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      
      {/* Notice Board Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: 0 }}>
            Stay updated with the latest circulars and announcements from the society administration.
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={openAddModal} 
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {notices.length === 0 ? (
        <div style={{
          background: 'var(--glass-bg)',
          border: '1px dashed var(--glass-border)',
          borderRadius: 'var(--border-radius-md)',
          padding: '48px',
          textAlign: 'center'
        }}>
          <Megaphone size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>Notice board is empty</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            There are currently no active notices posted. Check back later.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {notices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onEdit={openEditModal}
              onDelete={(id) => setNoticeToDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Notice Add/Edit Modal overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="glass-panel" style={{ width: '560px', maxWidth: '95%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: 0 }}>
                {editingNotice ? 'Edit Notice Details' : 'Publish New Announcement'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {editingNotice?.is_important === false && (
              <div style={{ display: 'flex', gap: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '6px', color: '#93c5fd', fontSize: '13px' }}>
                <Info size={18} style={{ flexShrink: 0 }} />
                <span>Marking notices as important will trigger automated broadcast emails to all residents.</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="notice-title">Notice Title</label>
                <input
                  id="notice-title"
                  type="text"
                  placeholder="e.g. Scheduled Power Outage"
                  {...register('title', {
                    required: 'Announcement title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' }
                  })}
                />
                {errors.title && (
                  <span style={{ color: 'var(--status-overdue)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {errors.title.message}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="notice-content">Notice Content Details</label>
                <textarea
                  id="notice-content"
                  rows="6"
                  placeholder="Describe the details of this notice board post..."
                  {...register('content', {
                    required: 'Announcement content description is required',
                    minLength: { value: 10, message: 'Content details must be at least 10 characters' }
                  })}
                />
                {errors.content && (
                  <span style={{ color: 'var(--status-overdue)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {errors.content.message}
                  </span>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', margin: '4px 0' }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px' }}
                  {...register('is_important')}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>
                  <BellRing size={14} color="var(--status-open)" />
                  Mark notice as Pinned / Important
                </span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting}
                >
                  {submitting ? 'Saving Announcement...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation prompt */}
      <ConfirmDialog
        isOpen={noticeToDelete !== null}
        title="Delete Announcement?"
        message="Are you sure you want to remove this notice? It will be deleted permanently for all residents."
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setNoticeToDelete(null)}
      />
    </div>
  );
};

export default NoticeBoard;
