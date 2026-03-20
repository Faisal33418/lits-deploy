import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Plane, Mail, Lock, User } from 'lucide-react';

// Google Icon SVG component
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const AuthPage = () => {
  const { login, API } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'verify'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    code: ''
  });
  const [pendingEmail, setPendingEmail] = useState('');
  const [demoCode, setDemoCode] = useState('');

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/auth/signup`, {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name
      });
      toast.success('Signup successful! Please verify your email.');
      setPendingEmail(formData.email);
      setDemoCode(res.data.verification_code_demo);
      setMode('verify');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: formData.email,
        password: formData.password
      });
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
      
      // Navigate based on profile completion status
      if (res.data.user.profile_complete) {
        navigate('/discover');
      } else {
        navigate('/profile-setup');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/auth/verify-email`, {
        email: pendingEmail,
        code: formData.code
      });
      login(res.data.token, res.data.user);
      toast.success('Email verified!');
      
      // New users need to complete profile setup
      navigate('/profile-setup');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 fade-in-up">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_layover-link/artifacts/idqffa3a_copilot_image_1772255420092.jpeg" 
              alt="LITS Logo" 
              className="w-48 h-48 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>Love In The Sky</h1>
          <p className="text-lg" style={{ color: '#94a3b8' }}>Where Crew Hearts Take Flight</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
          {mode === 'verify' && (
            <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Demo code: <span className="mono font-bold" style={{ color: '#0ea5e9' }}>{demoCode}</span></p>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} data-testid="login-form">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>Welcome Back</h2>
              
              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full mb-4 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-3 transition-all hover:opacity-90"
                style={{ background: '#fff', color: '#1f2937' }}
                data-testid="google-login-button"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: '#334155' }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2" style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#64748b' }}>or continue with email</span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Company Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#475569' }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                    placeholder="pilot@united.com"
                    required
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#475569' }} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                    placeholder="••••••••"
                    required
                    data-testid="login-password-input"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full mb-4" data-testid="login-submit-button">
                Take Off
              </button>

              <p className="text-center text-sm" style={{ color: '#94a3b8' }}>
                New to LITS?{' '}
                <button type="button" onClick={() => setMode('signup')} className="font-medium" style={{ color: '#0ea5e9' }} data-testid="switch-to-signup">
                  Join the Crew
                </button>
              </p>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} data-testid="signup-form">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>Join LITS</h2>
              
              {/* Google Signup Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full mb-4 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-3 transition-all hover:opacity-90"
                style={{ background: '#fff', color: '#1f2937' }}
                data-testid="google-signup-button"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: '#334155' }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2" style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#64748b' }}>or sign up with email</span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#475569' }} />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                    placeholder="Captain John Smith"
                    required
                    data-testid="signup-name-input"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Company Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#475569' }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                    placeholder="pilot@united.com"
                    required
                    data-testid="signup-email-input"
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: '#64748b' }}>Use your airline company email</p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#475569' }} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                    placeholder="••••••••"
                    required
                    data-testid="signup-password-input"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full mb-4" data-testid="signup-submit-button">
                Start Your Journey
              </button>

              <p className="text-center text-sm" style={{ color: '#94a3b8' }}>
                Already a member?{' '}
                <button type="button" onClick={() => setMode('login')} className="font-medium" style={{ color: '#0ea5e9' }} data-testid="switch-to-login">
                  Log In
                </button>
              </p>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerify} data-testid="verify-form">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>Verify Email</h2>
              <p className="mb-6 text-sm" style={{ color: '#94a3b8' }}>Enter the 6-digit code sent to {pendingEmail}</p>
              
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Verification Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 text-center mono text-2xl"
                  style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc', letterSpacing: '0.5em' }}
                  placeholder="000000"
                  maxLength={6}
                  required
                  data-testid="verify-code-input"
                />
              </div>

              <button type="submit" className="btn-primary w-full" data-testid="verify-submit-button">
                Verify & Continue
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
