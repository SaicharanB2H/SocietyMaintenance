import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck, Calendar } from 'lucide-react';

export const Profile = () => {
  const { user, isAdmin } = useAuth();

  if (!user) return <p style={{ textAlign: 'center', marginTop: '32px' }}>Loading profile...</p>;

  const dateJoined = new Date(user.created_at).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn var(--transition-normal)' }}>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Avatar Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--primary))',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: '800',
            color: '#fff'
          }}>
            {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'R'}
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{user.full_name}</h2>
            <span className="badge" style={{
              background: isAdmin ? 'rgba(6, 182, 212, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              color: isAdmin ? 'var(--accent-cyan)' : 'var(--text-link)',
              border: isAdmin ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Profile Details List */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</span>
              <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>{user.email}</span>
            </div>
          </div>

          {/* User ID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User UUID</span>
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{user.id}</span>
            </div>
          </div>

          {/* Date Joined */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered On</span>
              <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>{dateJoined}</span>
            </div>
          </div>

          {/* Permissions Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Authorization Level</span>
              <span style={{ fontSize: '15px', color: isAdmin ? 'var(--accent-cyan)' : 'var(--text-success)', fontWeight: '600' }}>
                {isAdmin ? 'Full Administrative Access' : 'Standard Resident Access'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
