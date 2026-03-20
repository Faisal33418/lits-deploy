import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('session_token'));
  const [loading, setLoading] = useState(true);

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const checkAuth = useCallback(async () => {
    // First check JWT token
    if (token) {
      try {
        const res = await axios.get(`${API}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('token');
        setToken(null);
      }
    }

    // Then check session token (OAuth)
    if (sessionToken) {
      try {
        const res = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        setUser(res.data);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('session_token');
        setSessionToken(null);
      }
    }

    setLoading(false);
  }, [token, sessionToken, API]);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the auth check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const loginWithSession = (newSessionToken, userData) => {
    localStorage.setItem('session_token', newSessionToken);
    setSessionToken(newSessionToken);
    setUser(userData);
  };

  const logout = async () => {
    // Clear JWT auth
    localStorage.removeItem('token');
    setToken(null);
    
    // Clear session auth
    if (sessionToken) {
      try {
        await axios.post(`${API}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
      } catch (e) {
        // Ignore logout errors
      }
    }
    localStorage.removeItem('session_token');
    setSessionToken(null);
    
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Get the active token (JWT or session)
  const activeToken = token || sessionToken;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token: activeToken, 
      login, 
      loginWithSession,
      logout, 
      updateUser, 
      loading, 
      API 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
