import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, LogIn } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import styles from './Login.module.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    setAuthError('');
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setAuthError(err.message || 'Invalid email or password. Please try again.');
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
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Log in to manage complains & notices</p>
        </div>

        {authError && <ErrorMessage message={authError} />}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@society.com"
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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? (
              'Signing In...'
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.link}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
