import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Sparkles, Heart, Calendar, Briefcase, Lightbulb, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * AI Compatibility Card - Shows detailed AI analysis between two users
 */
export const AICompatibilityCard = ({ targetUserId, targetUserName, compact = false }) => {
  const { token, API } = useAuth();
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (targetUserId) {
      fetchScore();
    }
  }, [targetUserId]);

  const fetchScore = async () => {
    try {
      const res = await axios.get(`${API}/ai/compatibility/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScoreData(res.data);
    } catch (err) {
      console.error('Failed to fetch AI score');
    } finally {
      setLoading(false);
    }
  };

  const refreshScore = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post(`${API}/ai/refresh-compatibility/${targetUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScoreData(res.data);
    } catch (err) {
      console.error('Failed to refresh AI score');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5" style={{ color: '#8b5cf6' }} />
          <span style={{ color: '#94a3b8' }}>Analyzing compatibility...</span>
        </div>
        <div className="h-4 rounded" style={{ background: '#1e293b', width: '60%' }}></div>
      </div>
    );
  }

  if (!scoreData) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#fbbf24'; // Yellow
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const overallColor = getScoreColor(scoreData.overall_score);

  // Compact version for profile cards
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" 
        style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
        data-testid="ai-score-compact"
      >
        <Sparkles className="w-4 h-4" style={{ color: '#8b5cf6' }} />
        <span className="text-sm font-bold" style={{ color: overallColor }}>
          {scoreData.overall_score}% Match
        </span>
        {scoreData.ai_generated && (
          <span className="text-xs" style={{ color: '#64748b' }}>AI</span>
        )}
      </div>
    );
  }

  // Full detailed card
  return (
    <div className="glass-card p-6" data-testid="ai-compatibility-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: '#8b5cf6' }} />
          <h3 className="font-bold" style={{ color: '#f8fafc' }}>AI Compatibility</h3>
          {scoreData.ai_generated && (
            <span className="text-xs px-2 py-0.5 rounded-full" 
              style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
              GPT-5.2
            </span>
          )}
        </div>
        <button
          onClick={refreshScore}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          title="Refresh analysis"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#64748b' }} />
        </button>
      </div>

      {/* Overall Score */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64" cy="64" r="56"
              fill="none"
              stroke="#1e293b"
              strokeWidth="8"
            />
            <circle
              cx="64" cy="64" r="56"
              fill="none"
              stroke={overallColor}
              strokeWidth="8"
              strokeDasharray={`${(scoreData.overall_score / 100) * 352} 352`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: overallColor }}>
              {scoreData.overall_score}
            </span>
            <span className="text-xs" style={{ color: '#64748b' }}>out of 100</span>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
          <Calendar className="w-5 h-5 mx-auto mb-1" style={{ color: '#0ea5e9' }} />
          <div className="text-lg font-bold" style={{ color: getScoreColor(scoreData.schedule_compatibility) }}>
            {scoreData.schedule_compatibility}%
          </div>
          <div className="text-xs" style={{ color: '#64748b' }}>Schedule</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
          <Heart className="w-5 h-5 mx-auto mb-1" style={{ color: '#ec4899' }} />
          <div className="text-lg font-bold" style={{ color: getScoreColor(scoreData.lifestyle_match) }}>
            {scoreData.lifestyle_match}%
          </div>
          <div className="text-xs" style={{ color: '#64748b' }}>Lifestyle</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
          <Briefcase className="w-5 h-5 mx-auto mb-1" style={{ color: '#fbbf24' }} />
          <div className="text-lg font-bold" style={{ color: getScoreColor(scoreData.career_synergy) }}>
            {scoreData.career_synergy}%
          </div>
          <div className="text-xs" style={{ color: '#64748b' }}>Career</div>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {scoreData.highlight && (
          <div className="flex items-start gap-3 p-3 rounded-lg" 
            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: '#10b981' }}>HIGHLIGHT</div>
              <p className="text-sm" style={{ color: '#f8fafc' }}>{scoreData.highlight}</p>
            </div>
          </div>
        )}

        {scoreData.challenge && (
          <div className="flex items-start gap-3 p-3 rounded-lg" 
            style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: '#fbbf24' }}>CONSIDER</div>
              <p className="text-sm" style={{ color: '#f8fafc' }}>{scoreData.challenge}</p>
            </div>
          </div>
        )}

        {scoreData.tip && (
          <div className="flex items-start gap-3 p-3 rounded-lg" 
            style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
            <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0ea5e9' }} />
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: '#0ea5e9' }}>TIP</div>
              <p className="text-sm" style={{ color: '#f8fafc' }}>{scoreData.tip}</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {scoreData.summary && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#334155' }}>
          <p className="text-sm" style={{ color: '#94a3b8' }}>{scoreData.summary}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Compact AI Score Badge - For use in lists and cards
 */
export const AIScoreBadge = ({ score, showLabel = true }) => {
  const getScoreColor = (s) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#fbbf24';
    if (s >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full"
      style={{ background: 'rgba(139, 92, 246, 0.15)' }}
      data-testid="ai-score-badge"
    >
      <Sparkles className="w-3 h-3" style={{ color: '#8b5cf6' }} />
      <span className="text-xs font-bold" style={{ color: getScoreColor(score) }}>
        {score}%
      </span>
      {showLabel && (
        <span className="text-xs" style={{ color: '#64748b' }}>AI</span>
      )}
    </div>
  );
};
