import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { loginWithSession, API } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('No session ID found');
          navigate('/auth');
          return;
        }

        // Exchange session_id for user data
        const res = await axios.post(`${API}/auth/session`, {
          session_id: sessionId
        });

        const { user, session_token } = res.data;

        // Login with session
        loginWithSession(session_token, user);

        toast.success(`Welcome${user.full_name ? ', ' + user.full_name : ''}!`);

        // Navigate based on profile completion
        if (user.profile_complete) {
          navigate('/discover', { state: { user } });
        } else {
          navigate('/profile-setup', { state: { user } });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMsg = err.response?.data?.detail || 'Authentication failed';
        toast.error(errorMsg);
        navigate('/auth');
      }
    };

    processAuth();
  }, [navigate, loginWithSession, API]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p style={{ color: '#94a3b8' }}>Completing authentication...</p>
      </div>
    </div>
  );
};
