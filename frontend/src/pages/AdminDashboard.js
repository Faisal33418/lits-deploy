import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Shield, CheckCircle, XCircle, Clock, User, Mail, Briefcase, Image, ExternalLink } from 'lucide-react';

export const AdminDashboard = () => {
  const { token, API } = useAuth();
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [photoUrls, setPhotoUrls] = useState({});

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const res = await axios.get(`${API}/verification/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(res.data.pending_requests);
      
      // Fetch presigned URLs for each photo
      const urlPromises = res.data.pending_requests.map(async (req) => {
        try {
          const urlRes = await axios.get(`${API}/verification/photo/${encodeURIComponent(req.photo_url)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return { id: req.id, url: urlRes.data.url };
        } catch (e) {
          return { id: req.id, url: null };
        }
      });
      
      const urls = await Promise.all(urlPromises);
      const urlMap = {};
      urls.forEach(u => { urlMap[u.id] = u.url; });
      setPhotoUrls(urlMap);
      
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load pending requests');
      setLoading(false);
    }
  };

  const handleReview = async (userId, approved, reason = null) => {
    try {
      await axios.post(`${API}/verification/admin/review`, {
        user_id: userId,
        approved,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(approved ? 'Verification approved!' : 'Verification rejected');
      fetchPendingRequests();
      setSelectedRequest(null);
    } catch (err) {
      toast.error('Review action failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#94a3b8' }}>Loading verification requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: '#020617' }}>
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
            Admin Dashboard
          </h1>
          <p className="text-lg" style={{ color: '#94a3b8' }}>
            Review verification requests ({pendingRequests.length} pending)
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <Clock className="w-12 h-12" style={{ color: '#fbbf24' }} />
              <div>
                <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>{pendingRequests.length}</p>
                <p className="text-sm" style={{ color: '#94a3b8' }}>Pending</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-12 h-12" style={{ color: '#10b981' }} />
              <div>
                <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>0</p>
                <p className="text-sm" style={{ color: '#94a3b8' }}>Approved Today</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <XCircle className="w-12 h-12" style={{ color: '#ef4444' }} />
              <div>
                <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>0</p>
                <p className="text-sm" style={{ color: '#94a3b8' }}>Rejected Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {pendingRequests.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: '#64748b' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#f8fafc' }}>No Pending Requests</h2>
            <p style={{ color: '#94a3b8' }}>All verification requests have been reviewed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingRequests.map((request) => (
              <div key={request.id} className="glass-card p-6">
                {/* User Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-cover bg-center" 
                    style={{ backgroundImage: `url(${request.user.photos?.[0] || 'https://images.unsplash.com/photo-1747095525296-13ebc4904d83?crop=entropy&cs=srgb&fm=jpg&q=85'})` }} 
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: '#f8fafc' }}>{request.user.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" style={{ color: '#64748b' }} />
                      <p className="text-sm" style={{ color: '#94a3b8' }}>{request.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="w-4 h-4" style={{ color: '#64748b' }} />
                      <p className="text-sm" style={{ color: '#94a3b8' }}>
                        {request.user.role?.replace('_', ' ')} • {request.user.airline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Type */}
                <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                  <p className="text-sm font-bold mb-1" style={{ color: '#fbbf24' }}>
                    {request.verification_type === 'badge' ? 'Badge Verification' : 'ID Verification'}
                  </p>
                  <p className="text-xs" style={{ color: '#64748b' }}>
                    Submitted: {new Date(request.submitted_at).toLocaleString()}
                  </p>
                </div>

                {/* Photo */}
                <div className="mb-4">
                  {photoUrls[request.id] ? (
                    <img 
                      src={photoUrls[request.id]}
                      alt="Verification document"
                      className="w-full rounded-lg"
                      style={{ maxHeight: '300px', objectFit: 'contain', background: '#0f172a' }}
                      data-testid={`verification-photo-${request.id}`}
                    />
                  ) : (
                    <div className="w-full rounded-lg p-8 text-center" style={{ background: '#0f172a' }}>
                      <Image className="w-12 h-12 mx-auto mb-2" style={{ color: '#64748b' }} />
                      <p className="text-sm" style={{ color: '#64748b' }}>Loading photo...</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(request.user_id, true)}
                    className="flex-1 px-4 py-3 rounded-lg font-bold transition-all"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}
                    data-testid={`approve-${request.id}`}
                  >
                    <CheckCircle className="inline w-5 h-5 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(request.user_id, false, 'Photo quality insufficient')}
                    className="flex-1 px-4 py-3 rounded-lg font-bold transition-all"
                    style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff' }}
                    data-testid={`reject-${request.id}`}
                  >
                    <XCircle className="inline w-5 h-5 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
