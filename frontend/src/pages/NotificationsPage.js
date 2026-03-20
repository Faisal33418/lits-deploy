import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Bell, MapPin, Heart, MessageCircle, CheckCircle, ArrowLeft, Plane, Calendar, RefreshCw } from 'lucide-react';

export const NotificationsPage = () => {
  const { token, API } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const checkLayoverMatches = async () => {
    setChecking(true);
    try {
      const res = await axios.get(`${API}/layovers/check-matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.notifications_created > 0) {
        toast.success(`Found ${res.data.notifications_created} new layover match${res.data.notifications_created > 1 ? 'es' : ''}!`);
        fetchNotifications();
      } else if (res.data.message) {
        // Show specific message from backend
        toast.info(res.data.message);
      } else if (res.data.layover_matches.length > 0) {
        toast.info('No new layover matches found');
      } else {
        toast.info('No upcoming layovers with matches. Add your schedule to find matches!');
      }
    } catch (err) {
      toast.error('Failed to check for layover matches');
    } finally {
      setChecking(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`${API}/notifications/read`, 
        { notification_id: notificationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(`${API}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    if (notification.type === 'new_match' && notification.data?.match_id) {
      navigate(`/chat/${notification.data.match_id}`);
    } else if (notification.type === 'layover_match') {
      // Could navigate to a layover details page or chat
      if (notification.data?.match_user_id) {
        // Find the match with this user
        navigate('/matches');
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'layover_match':
        return <MapPin className="w-6 h-6" style={{ color: '#fbbf24' }} />;
      case 'new_match':
        return <Heart className="w-6 h-6" style={{ color: '#ec4899' }} />;
      case 'message':
        return <MessageCircle className="w-6 h-6" style={{ color: '#0ea5e9' }} />;
      case 'verification_approved':
        return <CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />;
      default:
        return <Bell className="w-6 h-6" style={{ color: '#64748b' }} />;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#94a3b8' }}>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 p-4" style={{ background: '#020617' }}>
      <div className="max-w-2xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'rgba(30, 41, 59, 0.5)' }}
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: '#94a3b8' }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium"
              style={{ color: '#0ea5e9' }}
              data-testid="mark-all-read"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Check Layover Matches Button */}
        <button
          onClick={checkLayoverMatches}
          disabled={checking}
          className="w-full mb-6 p-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          style={{ 
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}
          data-testid="check-layovers-button"
        >
          {checking ? (
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: '#fbbf24' }} />
          ) : (
            <Plane className="w-5 h-5" style={{ color: '#fbbf24' }} />
          )}
          <span className="font-medium" style={{ color: '#fbbf24' }}>
            {checking ? 'Checking...' : 'Check for Layover Matches'}
          </span>
        </button>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: '#64748b' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f8fafc' }}>No Notifications Yet</h2>
            <p style={{ color: '#94a3b8' }}>
              When you get matches or layover overlaps, you'll see them here!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`glass-card p-4 cursor-pointer transition-all hover:scale-[1.02] ${
                  !notification.read ? 'ring-2 ring-sky-500/30' : ''
                }`}
                style={{ 
                  background: notification.read 
                    ? 'rgba(15, 23, 42, 0.5)' 
                    : 'rgba(15, 23, 42, 0.8)'
                }}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(30, 41, 59, 0.8)' }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold" style={{ color: '#f8fafc' }}>
                        {notification.title}
                      </h3>
                      <span className="text-xs flex-shrink-0" style={{ color: '#64748b' }}>
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                      {notification.message}
                    </p>

                    {/* Layover Details */}
                    {notification.type === 'layover_match' && notification.data && (
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" style={{ color: '#fbbf24' }} />
                          <span className="text-sm font-medium" style={{ color: '#fbbf24' }}>
                            {notification.data.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" style={{ color: '#64748b' }} />
                          <span className="text-sm" style={{ color: '#94a3b8' }}>
                            {notification.data.date}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="mt-2">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#0ea5e9' }}></span>
                      </div>
                    )}
                  </div>

                  {/* User Photo (if available) */}
                  {notification.data?.match_user_photo && (
                    <div 
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url(${notification.data.match_user_photo})`,
                        border: '2px solid rgba(14, 165, 233, 0.5)'
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
