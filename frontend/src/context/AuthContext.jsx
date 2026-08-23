import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUser(null);
    }
  };

  useEffect(() => {
    // Verify current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for sign-in/sign-out transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchProfile();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
