import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Heart, MapPin, Plane, Briefcase, Crown, Shield, Lock, Sparkles } from 'lucide-react';
import { GoldPlaneBadge } from '../components/GoldPlaneBadge';

export const DiscoverPage = () => {
  const { token, user, API } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipesRemaining, setSwipesRemaining] = useState(10);
  const [aiScores, setAiScores] = useState({});
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [canUseFilter, setCanUseFilter] = useState(false);

  useEffect(() => {
    fetchUsers();
    checkSwipeLimit();
  }, [verifiedOnly]);

  const checkSwipeLimit = () => {
    const tier = user?.subscription_tier || 'free';
    if (tier === 'free') {
      // In production, this would come from backend
      setSwipesRemaining(10 - (user?.daily_swipes_used || 0));
    } else {
      setSwipesRemaining(999); // Unlimited
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/discover?verified_only=${verifiedOnly}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
      setCanUseFilter(res.data.can_use_verified_filter);
      
      // Show toast if filter was requested but not applied (not premium)
      if (verifiedOnly && !res.data.filter_applied && !res.data.can_use_verified_filter) {
        toast.error('Upgrade to First Class or Captain\'s Choice to use Verified Only filter!');
        setVerifiedOnly(false);
      }
      
      setCurrentIndex(0);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const toggleVerifiedFilter = () => {
    if (!canUseFilter) {
      toast.error('Upgrade to First Class or Captain\'s Choice to filter by verified users!');
      navigate('/pricing');
      return;
    }
    setVerifiedOnly(!verifiedOnly);
  };

  // Fetch AI score for current user
  const fetchAIScore = async (targetUserId) => {
    if (aiScores[targetUserId]) return; // Already fetched
    
    try {
      const res = await axios.get(`${API}/ai/compatibility/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiScores(prev => ({ ...prev, [targetUserId]: res.data }));
    } catch (err) {
      console.error('Failed to fetch AI score');
    }
  };

  // Fetch AI score when current user changes
  useEffect(() => {
    const currentUser = users[currentIndex];
    if (currentUser?.id) {
      fetchAIScore(currentUser.id);
    }
  }, [currentIndex, users]);

  const handleSwipe = async (action) => {
    if (currentIndex >= users.length) return;
    
    // Check swipe limit for free users
    const tier = user?.subscription_tier || 'free';
    if (tier === 'free' && swipesRemaining <= 0) {
      toast.error('Out of swipes! Upgrade to premium for unlimited swipes.');
      navigate('/pricing');
      return;
    }
    
    const currentUser = users[currentIndex];
    
    try {
      const res = await axios.post(`${API}/swipe`, {
        target_user_id: currentUser.id,
        action: action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.match) {
        toast.success("🎉 It's a match! You can now chat.");
      }
      
      setCurrentIndex(prev => prev + 1);
      if (tier === 'free') {
        setSwipesRemaining(prev => prev - 1);
      }
    } catch (err) {
      toast.error('Swipe failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#94a3b8' }}>Loading crew members...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center glass-card p-8">
          <Plane className="w-16 h-16 mx-auto mb-4" style={{ color: '#0ea5e9' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>No More Crew Members</h2>
          <p style={{ color: '#94a3b8' }}>Check back later for new connections!</p>
        </div>
      </div>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <div className="min-h-screen pb-24 p-4" style={{ background: '#020617' }}>
      <div className="max-w-lg mx-auto py-8">
        {/* Header */}
        <div className="mb-6 text-center fade-in-up">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>Discover</h1>
          <p style={{ color: '#94a3b8' }}>{users.length} crew members nearby</p>
          
          {/* Swipes remaining indicator */}
          {swipesRemaining < 999 && (
            <p className="text-sm mt-1" style={{ color: '#fbbf24' }}>
              {swipesRemaining} swipes remaining today
            </p>
          )}
        </div>

        {/* Verified Only Filter Toggle */}
        <div className="mb-4 flex justify-center">
          <button
            onClick={toggleVerifiedFilter}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              verifiedOnly ? 'ring-2 ring-yellow-500' : ''
            }`}
            style={{ 
              background: verifiedOnly 
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)' 
                : 'rgba(30, 41, 59, 0.5)',
              border: verifiedOnly ? '1px solid #fbbf24' : '1px solid #334155'
            }}
            data-testid="verified-filter-toggle"
          >
            {canUseFilter ? (
              <Shield className="w-4 h-4" style={{ color: verifiedOnly ? '#fbbf24' : '#64748b' }} />
            ) : (
              <Lock className="w-4 h-4" style={{ color: '#64748b' }} />
            )}
            <span className="text-sm font-medium" style={{ color: verifiedOnly ? '#fbbf24' : '#94a3b8' }}>
              Gold Verified Only
            </span>
            {!canUseFilter && (
              <Crown className="w-4 h-4" style={{ color: '#fbbf24' }} />
            )}
          </button>
        </div>

        {/* Swipe Card */}
        <div className="swipe-card mx-auto fade-in-up" data-testid="swipe-card" style={{ animationDelay: '0.1s' }}>
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${currentUser.photos?.[0] || 'https://images.unsplash.com/photo-1747095525296-13ebc4904d83?crop=entropy&cs=srgb&fm=jpg&q=85'})`,
              filter: 'brightness(0.7)'
            }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(2, 6, 23, 0.9) 70%)' }} />
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6" style={{ color: '#f8fafc' }}>
            {/* AI Score Badge */}
            {aiScores[currentUser.id] && (
              <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)' }}
                data-testid="ai-score-badge"
              >
                <Sparkles className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                <span className="text-sm font-bold" style={{ 
                  color: aiScores[currentUser.id].overall_score >= 70 ? '#10b981' : 
                         aiScores[currentUser.id].overall_score >= 50 ? '#fbbf24' : '#f97316' 
                }}>
                  {aiScores[currentUser.id].overall_score}% Match
                </span>
                {aiScores[currentUser.id].ai_generated && (
                  <span className="text-xs" style={{ color: '#94a3b8' }}>AI</span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }} data-testid="user-name">
                {currentUser.full_name}, {currentUser.age}
              </h2>
              {currentUser.is_gold_verified && <GoldPlaneBadge size="lg" />}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                <span className="text-sm" data-testid="user-role">{currentUser.role?.replace('_', ' ').toUpperCase()} • {currentUser.airline}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                <span className="text-sm" data-testid="user-base">{currentUser.base}</span>
              </div>
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                <span className="text-sm mono" data-testid="user-aircraft">{currentUser.aircraft}</span>
              </div>
            </div>
            
            {/* AI Highlight */}
            {aiScores[currentUser.id]?.highlight && (
              <div className="mb-3 p-2 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <p className="text-xs" style={{ color: '#10b981' }}>
                  ✨ {aiScores[currentUser.id].highlight}
                </p>
              </div>
            )}
            
            {currentUser.bio && (
              <p className="text-sm mb-4" style={{ color: '#cbd5e1' }} data-testid="user-bio">{currentUser.bio}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mt-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => handleSwipe('pass')}
            className="w-16 h-16 rounded-full flex items-center justify-center border-2 hover:scale-110 transition-transform"
            style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444' }}
            data-testid="pass-button"
          >
            <X className="w-8 h-8" style={{ color: '#ef4444' }} />
          </button>
          
          <button
            onClick={() => handleSwipe('like')}
            className="w-20 h-20 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}
            data-testid="like-button"
          >
            <Heart className="w-10 h-10" style={{ color: '#fff' }} />
          </button>
        </div>
      </div>
    </div>
  );
};