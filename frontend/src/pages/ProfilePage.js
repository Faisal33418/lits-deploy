import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit, MapPin, Plane, Briefcase, Mail, Crown, Sparkles, Calendar } from 'lucide-react';
import { GoldPlaneBadge } from '../components/GoldPlaneBadge';

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getTierDisplay = (tier) => {
    const tiers = {
      'free': { name: 'Ground Level', color: '#64748b', icon: null },
      'cruising_altitude': { name: 'Cruising Altitude', color: '#0ea5e9', icon: Plane },
      'first_class': { name: 'First Class', color: '#8b5cf6', icon: Sparkles },
      'captains_choice': { name: "Captain's Choice", color: '#fbbf24', icon: Crown }
    };
    return tiers[tier] || tiers.free;
  };

  const tierInfo = getTierDisplay(user?.subscription_tier || 'free');
  const TierIcon = tierInfo.icon;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-20 p-4" style={{ background: '#020617' }}>
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8 fade-in-up">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>My Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="glass-card p-8 mb-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Subscription Badge */}
          {user?.subscription_tier && user.subscription_tier !== 'free' && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: `${tierInfo.color}20`, border: `1px solid ${tierInfo.color}` }}>
                {TierIcon && <TierIcon className="w-4 h-4" style={{ color: tierInfo.color }} />}
                <span className="font-bold text-sm" style={{ color: tierInfo.color }}>{tierInfo.name}</span>
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-cover bg-center" style={{ backgroundImage: `url(${user?.photos?.[0] || 'https://images.unsplash.com/photo-1747095525296-13ebc4904d83?crop=entropy&cs=srgb&fm=jpg&q=85'})`, border: '4px solid rgba(14, 165, 233, 0.3)' }} />
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', color: '#f8fafc' }} data-testid="profile-name">
                {user?.full_name}
              </h2>
              {user?.is_gold_verified && <GoldPlaneBadge size="lg" />}
            </div>
            <p style={{ color: '#94a3b8' }} data-testid="profile-age">{user?.age} years old</p>
            {user?.is_gold_verified && (
              <span className="inline-flex items-center gap-1 text-xs mt-2 px-3 py-1 rounded-full" 
                style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                Gold Verified Airline Staff
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
              <Mail className="w-5 h-5 flex-shrink-0" style={{ color: '#0ea5e9' }} />
              <div>
                <p className="text-xs" style={{ color: '#64748b' }}>Email</p>
                <p style={{ color: '#f8fafc' }} data-testid="profile-email">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
              <Briefcase className="w-5 h-5 flex-shrink-0" style={{ color: '#0ea5e9' }} />
              <div>
                <p className="text-xs" style={{ color: '#64748b' }}>Role & Airline</p>
                <p style={{ color: '#f8fafc' }} data-testid="profile-role">{user?.role?.replace('_', ' ').toUpperCase()} • {user?.airline}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
              <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: '#0ea5e9' }} />
              <div>
                <p className="text-xs" style={{ color: '#64748b' }}>Home Base</p>
                <p style={{ color: '#f8fafc' }} data-testid="profile-base">{user?.base}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
              <Plane className="w-5 h-5 flex-shrink-0" style={{ color: '#0ea5e9' }} />
              <div>
                <p className="text-xs" style={{ color: '#64748b' }}>Aircraft</p>
                <p className="mono" style={{ color: '#f8fafc' }} data-testid="profile-aircraft">{user?.aircraft}</p>
              </div>
            </div>

            {user?.bio && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                <p className="text-xs mb-2" style={{ color: '#64748b' }}>Bio</p>
                <p style={{ color: '#f8fafc' }} data-testid="profile-bio">{user?.bio}</p>
              </div>
            )}

            {user?.time_with_company && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                <Briefcase className="w-5 h-5 flex-shrink-0" style={{ color: '#0ea5e9' }} />
                <div>
                  <p className="text-xs" style={{ color: '#64748b' }}>Time with Company</p>
                  <p style={{ color: '#f8fafc' }}>{user?.time_with_company}</p>
                </div>
              </div>
            )}

            {user?.days_off && user.days_off.length > 0 && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                <p className="text-xs mb-2" style={{ color: '#64748b' }}>Days Off</p>
                <div className="flex flex-wrap gap-2">
                  {user.days_off.map((day, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9' }}>
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user?.trips_taken && user.trips_taken.length > 0 && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                <p className="text-xs mb-2 flex items-center gap-2\" style={{ color: '#64748b' }}>
                  <MapPin className="w-4 h-4" />
                  Places I've Been
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.trips_taken.map((trip, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9', border: '1px solid #0ea5e9' }}>
                      {trip}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user?.bucket_list_trips && user.bucket_list_trips.length > 0 && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                <p className="text-xs mb-2 flex items-center gap-2" style={{ color: '#64748b' }}>
                  <Sparkles className="w-4 h-4" />
                  Bucket List Destinations
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.bucket_list_trips.map((trip, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', border: '1px solid #8b5cf6' }}>
                      {trip}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 fade-in-up" style={{ animationDelay: '0.2s' }}>
          {(!user?.subscription_tier || user.subscription_tier === 'free') && (
            <button
              onClick={() => navigate('/pricing')}
              className="w-full glass-card p-4 flex items-center justify-between hover:border-yellow-500 transition-colors"
              style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '2px solid rgba(251, 191, 36, 0.5)' }}
              data-testid="go-premium-button"
            >
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6" style={{ color: '#fbbf24' }} />
                <div className="text-left">
                  <span className="font-bold block" style={{ color: '#fbbf24' }}>Go Premium</span>
                  <span className="text-xs" style={{ color: '#94a3b8' }}>Unlock unlimited swipes & more</span>
                </div>
              </div>
              <Sparkles className="w-5 h-5" style={{ color: '#fbbf24' }} />
            </button>
          )}

          {user?.subscription_tier && user.subscription_tier !== 'free' && (
            <button
              onClick={() => navigate('/pricing')}
              className="w-full glass-card p-4 flex items-center justify-between hover:border-sky-500 transition-colors"
              data-testid="manage-subscription-button"
            >
              <div className="flex items-center gap-3">
                {TierIcon && <TierIcon className="w-5 h-5" style={{ color: tierInfo.color }} />}
                <span style={{ color: '#f8fafc' }}>Manage Subscription</span>
              </div>
              <span className="text-sm" style={{ color: tierInfo.color }}>{tierInfo.name}</span>
            </button>
          )}

          <button
            onClick={() => navigate('/verification')}
            className="w-full glass-card p-4 flex items-center justify-between hover:border-purple-500 transition-colors"
            style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)', border: '2px solid rgba(139, 92, 246, 0.5)' }}
            data-testid="verification-button"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6" style={{ color: '#8b5cf6' }} />
              <div className="text-left">
                <span className="font-bold block" style={{ color: '#8b5cf6' }}>Get Verified</span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>Badge & ID verification</span>
              </div>
            </div>
            <Sparkles className="w-5 h-5" style={{ color: '#8b5cf6' }} />
          </button>

          <button
            onClick={() => navigate('/schedule')}
            className="w-full glass-card p-4 flex items-center justify-between hover:border-yellow-500 transition-colors"
            style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '2px solid rgba(251, 191, 36, 0.5)' }}
            data-testid="schedule-button"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6" style={{ color: '#fbbf24' }} />
              <div className="text-left">
                <span className="font-bold block" style={{ color: '#fbbf24' }}>My Layovers</span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>Add schedule to find matches</span>
              </div>
            </div>
            <MapPin className="w-5 h-5" style={{ color: '#fbbf24' }} />
          </button>

          <button
            className="w-full glass-card p-4 flex items-center justify-between hover:border-sky-500 transition-colors"
            data-testid="edit-profile-button"
          >
            <span style={{ color: '#f8fafc' }}>Edit Profile</span>
            <Edit className="w-5 h-5" style={{ color: '#0ea5e9' }} />
          </button>

          <button
            onClick={handleLogout}
            className="w-full glass-card p-4 flex items-center justify-between hover:border-red-500 transition-colors"
            data-testid="logout-button"
          >
            <span style={{ color: '#ef4444' }}>Log Out</span>
            <LogOut className="w-5 h-5" style={{ color: '#ef4444' }} />
          </button>
        </div>
      </div>
    </div>
  );
};