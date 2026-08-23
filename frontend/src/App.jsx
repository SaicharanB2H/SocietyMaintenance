import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RaiseComplaint from './pages/RaiseComplaint';
import ComplaintDetails from './pages/ComplaintDetails';
import AllComplaints from './pages/AllComplaints';
import NoticeBoard from './pages/NoticeBoard';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Import Loading Spinner
import LoadingSpinner from './components/LoadingSpinner';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner size="large" fullPage={true} />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingSpinner size="large" fullPage={true} />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

// Selection of Dashboard according to role
const DashboardSelector = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <ResidentDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Area Layout */}
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardSelector />} />
            
            {/* Complaint paths */}
            <Route path="complaints" element={<AllComplaints />} />
            <Route path="complaints/raise" element={<RaiseComplaint />} />
            <Route path="complaints/:id" element={<ComplaintDetails />} />
            
            {/* Notices Board */}
            <Route path="notices" element={<NoticeBoard />} />
            
            {/* System settings (Admin only) */}
            <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
            
            {/* User profile */}
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
