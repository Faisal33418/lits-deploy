import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Sparkles, Calendar, Lock, Unlock, Check } from 'lucide-react';
import { GoldPlaneBadge } from '../components/GoldPlaneBadge';

export const MatchesPage = () => {
  const { token, API } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarPermissions, setCalendarPermissions] = useState({
    granted_to: [],
    granted_by: [],
    mutual_access: []
  });

  useEffect(() => {
    fetchMatches();
    fetchCalendarPermissions();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await axios.get(`${API}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(res.data.matches);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load matches');
      setLoading(false);
    }
  };

  const fetchCalendarPermissions = async () => {
    try {
      const res = await axios.get(`${API}/calendar/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalendarPermissions(res.data);
    } catch (err) {
      console.error('Failed to fetch calendar permissions');
    }
  };

  const toggleCalendarAccess = async (matchUserId, e) => {
    e.stopPropagation(); // Prevent navigation to chat
    
    const hasGranted = calendarPermissions.granted_to.includes(matchUserId);
    
    try {
      if (hasGranted) {
        await axios.post(`${API}/calendar/revoke-access`, 
          { match_user_id: matchUserId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Calendar access revoked');
      } else {
        const res = await axios.post(`${API}/calendar/grant-access`, 
          { match_user_id: matchUserId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.mutual_access) {
          toast.success('Mutual calendar access enabled! You can now see each other\'s layovers.');
        } else {
          toast.success('Calendar access granted. Waiting for them to share theirs.');
        }
      }
      fetchCalendarPermissions();
    } catch (err) {
      toast.error('Failed to update calendar access');
    }
  };

  const getCalendarStatus = (matchUserId) => {
    const iGranted = calendarPermissions.granted_to.includes(matchUserId);
    const theyGranted = calendarPermissions.granted_by.includes(matchUserId);
    const mutual = calendarPermissions.mutual_access.includes(matchUserId);
    
    return { iGranted, theyGranted, mutual };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#94a3b8' }}>Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 p-4" style={{ background: '#020617' }}>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8 fade-in-up">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>Your Matches</h1>
          <p className="text-lg" style={{ color: '#94a3b8' }}>{matches.length} crew connections</p>
        </div>

        {/* Calendar Access Info */}
        <div className="glass-card p-4 mb-6" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
            <div>
              <p className="text-sm" style={{ color: '#fbbf24' }}>
                <strong>Calendar Sharing:</strong> Toggle the calendar icon to share your layover schedule. 
                Both users must share to see overlapping layovers!
              </p>
            </div>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="glass-card p-12 text-center fade-in-up">
            <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: '#8b5cf6' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>No Matches Yet</h2>
            <p style={{ color: '#94a3b8' }}>Start swiping to find your crew connections!</p>
            <button onClick={() => navigate('/discover')} className="btn-primary mt-6">
              Start Discovering
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match, idx) => {
              const calStatus = getCalendarStatus(match.matched_user.id);
              
              return (
                <div
                  key={match.id}
                  className="glass-card p-6 cursor-pointer hover:border-sky-500 transition-all fade-in-up"
                  onClick={() => navigate(`/chat/${match.id}`)}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  data-testid={`match-card-${idx}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${match.matched_user.photos?.[0] || 'https://images.unsplash.com/photo-1747095525296-13ebc4904d83?crop=entropy&cs=srgb&fm=jpg&q=85'})` }} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
                          {match.matched_user.full_name}
                        </h3>
                        {match.matched_user.is_gold_verified && <GoldPlaneBadge size="md" />}
                      </div>
                      <p className="text-sm mb-2" style={{ color: '#94a3b8' }}>
                        {match.matched_user.airline} • {match.matched_user.base}
                      </p>
                      {match.compatibility_score && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full" style={{ background: '#1e293b' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ 
                                width: `${match.compatibility_score}%`,
                                background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)'
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium" style={{ color: '#0ea5e9' }}>{Math.round(match.compatibility_score)}%</span>
                        </div>
                      )}
                      
                      {/* Calendar Status */}
                      <div className="flex items-center gap-2 mt-2">
                        {calStatus.mutual ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full" 
                            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                            <Check className="w-3 h-3" /> Calendar Shared
                          </span>
                        ) : calStatus.iGranted ? (
                          <span className="text-xs" style={{ color: '#fbbf24' }}>
                            Waiting for them to share...
                          </span>
                        ) : calStatus.theyGranted ? (
                          <span className="text-xs" style={{ color: '#8b5cf6' }}>
                            They shared! Share yours to see layovers
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      {/* Calendar Toggle Button */}
                      <button
                        onClick={(e) => toggleCalendarAccess(match.matched_user.id, e)}
                        className={`p-2 rounded-lg transition-all ${calStatus.iGranted ? 'hover:bg-red-500/20' : 'hover:bg-green-500/20'}`}
                        style={{ 
                          background: calStatus.mutual 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : calStatus.iGranted 
                              ? 'rgba(251, 191, 36, 0.2)' 
                              : 'rgba(30, 41, 59, 0.5)',
                          border: `1px solid ${calStatus.mutual ? '#10b981' : calStatus.iGranted ? '#fbbf24' : '#334155'}`
                        }}
                        title={calStatus.iGranted ? 'Revoke calendar access' : 'Share your calendar'}
                        data-testid={`calendar-toggle-${idx}`}
                      >
                        {calStatus.mutual ? (
                          <Unlock className="w-5 h-5" style={{ color: '#10b981' }} />
                        ) : calStatus.iGranted ? (
                          <Calendar className="w-5 h-5" style={{ color: '#fbbf24' }} />
                        ) : (
                          <Lock className="w-5 h-5" style={{ color: '#64748b' }} />
                        )}
                      </button>
                      
                      <MessageCircle className="w-5 h-5" style={{ color: '#0ea5e9' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};