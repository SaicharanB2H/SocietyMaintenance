import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Send, Upload, X } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lift',
  'Water Supply',
  'Parking',
  'Maintenance',
  'Other'
];

const RaiseComplaint = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPEG, PNG, or WEBP images are allowed.');
      return;
    }

    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('description', data.description);
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/complaints');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 'Failed to submit complaint. Please check fields and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', animation: 'fadeIn var(--transition-normal)' }}>
      {/* Back button */}
      <button 
        onClick={() => navigate('/complaints')} 
        className="btn btn-secondary"
        style={{ marginBottom: '24px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={16} />
        <span>Back to List</span>
      </button>

      {/* Form panel */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Raise Complaint</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          Please fill out the form details below to request maintenance assistance.
        </p>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Category */}
          <div>
            <label htmlFor="category">Complaint Category</label>
            <select
              id="category"
              {...register('category', { required: 'Please select a complaint category' })}
            >
              <option value="">-- Choose Category --</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <span style={{ color: 'var(--status-overdue)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {errors.category.message}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description">Detailed Description</label>
            <textarea
              id="description"
              rows="6"
              placeholder="Please describe the issue in detail (minimum 10 characters)..."
              {...register('description', {
                required: 'Complaint description is required',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters long'
                },
                maxLength: {
                  value: 1000,
                  message: 'Description cannot exceed 1000 characters'
                }
              })}
            />
            {errors.description && (
              <span style={{ color: 'var(--status-overdue)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Optional Photo Attachment */}
          <div>
            <label>Attachment Photo (Optional)</label>
            
            {!photoPreview ? (
              <div style={{
                border: '2px dashed var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '32px 16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.01)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                position: 'relative'
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  const input = document.getElementById('photo-upload');
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  input.files = dt.files;
                  handlePhotoChange({ target: input });
                }
              }}
              onClick={() => document.getElementById('photo-upload').click()}
              >
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                <Upload size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Click or drag image here to upload
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 0 }}>
                  Supports JPEG, PNG, WEBP (Max 5MB)
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--glass-border)', maxWidth: '300px' }}>
                <img
                  src={photoPreview}
                  alt="Complaint Preview"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Remove Photo"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '14px', marginTop: '12px' }}
          >
            {submitting ? (
              'Submitting Complaint...'
            ) : (
              <>
                <Send size={18} />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RaiseComplaint;
