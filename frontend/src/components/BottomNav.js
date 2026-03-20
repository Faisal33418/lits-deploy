import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plane, Heart, Bell, User } from 'lucide-react';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, API } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      // Silently fail
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-card" style={{ borderRadius: 0, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div className="flex justify-around items-center py-3 max-w-lg mx-auto">
        <button
          onClick={() => navigate('/discover')}
          className="flex flex-col items-center gap-1 p-2 transition-transform hover:scale-110"
          data-testid="nav-discover"
        >
          <Plane className="w-6 h-6" style={{ color: isActive('/discover') ? '#0ea5e9' : '#64748b' }} />
          <span className="text-xs" style={{ color: isActive('/discover') ? '#0ea5e9' : '#64748b' }}>Discover</span>
        </button>
        
        <button
          onClick={() => navigate('/matches')}
          className="flex flex-col items-center gap-1 p-2 transition-transform hover:scale-110"
          data-testid="nav-matches"
        >
          <Heart className="w-6 h-6" style={{ color: isActive('/matches') ? '#0ea5e9' : '#64748b' }} />
          <span className="text-xs" style={{ color: isActive('/matches') ? '#0ea5e9' : '#64748b' }}>Matches</span>
        </button>
        
        <button
          onClick={() => navigate('/notifications')}
          className="flex flex-col items-center gap-1 p-2 transition-transform hover:scale-110 relative"
          data-testid="nav-notifications"
        >
          <div className="relative">
            <Bell className="w-6 h-6" style={{ color: isActive('/notifications') ? '#0ea5e9' : '#64748b' }} />
            {unreadCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#ef4444', color: '#fff', fontSize: '10px' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: isActive('/notifications') ? '#0ea5e9' : '#64748b' }}>Alerts</span>
        </button>
        
        <button
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center gap-1 p-2 transition-transform hover:scale-110"
          data-testid="nav-profile"
        >
          <User className="w-6 h-6" style={{ color: isActive('/profile') ? '#0ea5e9' : '#64748b' }} />
          <span className="text-xs" style={{ color: isActive('/profile') ? '#0ea5e9' : '#64748b' }}>Profile</span>
        </button>
      </div>
    </div>
  );
};