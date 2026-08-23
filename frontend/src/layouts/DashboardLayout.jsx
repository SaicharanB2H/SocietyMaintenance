import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Megaphone, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  Building
} from 'lucide-react';
import styles from './DashboardLayout.module.css';

const DashboardLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/complaints/raise')) return 'Raise Complaint';
    if (path.startsWith('/complaints/')) return 'Complaint Details';
    if (path.startsWith('/complaints')) return isAdmin ? 'Manage Complaints' : 'My Complaints';
    if (path.startsWith('/notices')) return 'Notice Board';
    if (path.startsWith('/settings')) return 'System Settings';
    if (path.startsWith('/profile')) return 'My Profile';
    return 'Society Tracker';
  };

  // Nav items based on role
  const navItems = isAdmin 
    ? [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/complaints', label: 'All Complaints', icon: <FileText size={20} /> },
        { path: '/notices', label: 'Notice Board', icon: <Megaphone size={20} /> },
        { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
        { path: '/profile', label: 'Profile', icon: <User size={20} /> },
      ]
    : [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/complaints', label: 'My Complaints', icon: <FileText size={20} /> },
        { path: '/complaints/raise', label: 'Raise Complaint', icon: <PlusCircle size={20} /> },
        { path: '/notices', label: 'Notice Board', icon: <Megaphone size={20} /> },
        { path: '/profile', label: 'Profile', icon: <User size={20} /> },
      ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.container}>
      {/* Sidebar navigation */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <Building size={24} className={styles.icon} color="var(--primary)" />
          <span className={styles.logoText}>SocietyTracker</span>
          <button 
            className={styles.menuToggle} 
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main workspace area */}
      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className={styles.menuToggle} 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
          </div>

          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {getInitials(user?.full_name)}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.full_name || 'Resident'}</span>
              <span className={styles.userRole}>
                {isAdmin ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)' }}>
                    <ShieldCheck size={12} /> admin
                  </span>
                ) : (
                  'resident'
                )}
              </span>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
