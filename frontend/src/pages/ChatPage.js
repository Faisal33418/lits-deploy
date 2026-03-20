import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Send, Plane, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { GoldPlaneBadge } from '../components/GoldPlaneBadge';
import { AICompatibilityCard } from '../components/AICompatibility';

export const ChatPage = () => {
  const { token, API, user } = useAuth();
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [matchedUser, setMatchedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll for new messages
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/messages/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
      
      // Get match info
      const matchRes = await axios.get(`${API}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const match = matchRes.data.matches.find(m => m.id === matchId);
      if (match) {
        setMatchedUser(match.matched_user);
      }
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load messages');
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${API}/messages`, {
        match_id: matchId,
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#94a3b8' }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#020617' }}>
      {/* Header */}
      <div className="glass-card p-4 flex items-center gap-4" style={{ borderRadius: 0 }}>
        <button onClick={() => navigate('/matches')} className="p-2" data-testid="back-button">
          <ArrowLeft className="w-6 h-6" style={{ color: '#0ea5e9' }} />
        </button>
        {matchedUser && (
          <>
            <div className="w-12 h-12 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${matchedUser.photos?.[0] || 'https://images.unsplash.com/photo-1747095525296-13ebc4904d83?crop=entropy&cs=srgb&fm=jpg&q=85'})` }} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold" style={{ color: '#f8fafc' }}>{matchedUser.full_name}</h2>
                {matchedUser.is_gold_verified && <GoldPlaneBadge size="sm" />}
              </div>
              <p className="text-sm" style={{ color: '#94a3b8' }}>{matchedUser.airline} • {matchedUser.base}</p>
            </div>
            <button
              onClick={() => setShowAIInsights(!showAIInsights)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-all"
              style={{ 
                background: showAIInsights ? 'rgba(139, 92, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                border: `1px solid ${showAIInsights ? '#8b5cf6' : '#334155'}`
              }}
              data-testid="ai-insights-toggle"
            >
              <Sparkles className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              <span className="text-xs font-medium" style={{ color: '#8b5cf6' }}>AI</span>
              {showAIInsights ? (
                <ChevronUp className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              )}
            </button>
          </>
        )}
      </div>

      {/* AI Insights Panel */}
      {showAIInsights && matchedUser && (
        <div className="p-4 border-b" style={{ background: 'rgba(15, 23, 42, 0.8)', borderColor: '#334155' }}>
          <AICompatibilityCard targetUserId={matchedUser.id} targetUserName={matchedUser.full_name} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="messages-container">
        {messages.length === 0 ? (
          <div className="text-center mt-12">
            <Plane className="w-16 h-16 mx-auto mb-4" style={{ color: '#475569' }} />
            <p style={{ color: '#94a3b8' }}>Start the conversation!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} fade-in-up`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  data-testid={`message-${idx}`}
                >
                  <div
                    className="max-w-xs px-4 py-3 rounded-2xl"
                    style={{
                      background: isMe ? 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' : 'rgba(30, 41, 59, 0.8)',
                      color: '#f8fafc',
                      borderRadius: isMe ? '1.5rem 1.5rem 0.25rem 1.5rem' : '1.5rem 1.5rem 1.5rem 0.25rem'
                    }}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="glass-card p-4 flex gap-2" style={{ borderRadius: 0 }} data-testid="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-sky-500"
          style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
          placeholder="Type a message..."
          data-testid="message-input"
        />
        <button
          type="submit"
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' }}
          data-testid="send-button"
        >
          <Send className="w-5 h-5" style={{ color: '#fff' }} />
        </button>
      </form>
    </div>
  );
};