import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, UserPlus } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import styles from './Login.module.css';

const Register = () => {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    setAuthError('');
    try {
      await signUp(data.email, data.password, data.fullName);
      // Supabase auto logins on signup in typical configs.
      // Redirect to home dashboard
      navigate('/');
    } catch (err) {
      console.error(err);
      setAuthError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.panel} glass-panel`}>
        <div className={styles.header}>
          <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', marginBottom: '12px' }}>
            <Building size={32} color="var(--primary)" />
          </div>
          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.subtitle}>Register as a resident of the society</p>
        </div>

        {authError && <ErrorMessage message={authError} />}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              {...register('fullName', {
                required: 'Full name is required',
                minLength: {
                  value: 3,
                  message: 'Name must be at least 3 characters'
                }
              })}
            />
            {errors.fullName && <span className={styles.error}>{errors.fullName.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="john.doe@email.com"
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match'
              })}
            />
            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword.message}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? (
              'Creating Account...'
            ) : (
              <>
                <UserPlus size={18} />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
