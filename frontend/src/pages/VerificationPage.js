import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Shield, CheckCircle, Clock, XCircle, Camera, ArrowLeft, Award, FileText, AlertCircle } from 'lucide-react';

export const VerificationPage = () => {
  const { token, API } = useAuth();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [selectedBadgeFile, setSelectedBadgeFile] = useState(null);
  const [selectedIdFile, setSelectedIdFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState(null);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const res = await axios.get(`${API}/verification/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerificationStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch verification status');
    }
  };

  const handleUpload = async (verificationType) => {
    const file = verificationType === 'badge' ? selectedBadgeFile : selectedIdFile;
    
    if (!file) {
      toast.error('Please select a photo first');
      return;
    }

    setUploading(true);
    setUploadType(verificationType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axios.post(`${API}/verification/upload?verification_type=${verificationType}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Verification submitted! Review takes 24-48 hours.');
      fetchVerificationStatus();
      if (verificationType === 'badge') {
        setSelectedBadgeFile(null);
      } else {
        setSelectedIdFile(null);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Upload failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      setUploadType(null);
    }
  };

  const getVerificationBadge = (level) => {
    const badges = {
      email: { icon: Shield, color: '#0ea5e9', label: 'Email Verified' },
      badge: { icon: Award, color: '#fbbf24', label: 'Badge Verified' },
      full: { icon: CheckCircle, color: '#8b5cf6', label: 'Fully Verified' }
    };
    return badges[level] || badges.email;
  };

  const currentBadge = getVerificationBadge(verificationStatus?.verification_level || 'email');
  const CurrentIcon = currentBadge.icon;
  const status = verificationStatus?.verification_status || 'approved';

  const canUploadBadge = verificationStatus?.verification_level === 'email' || status === 'rejected';
  const canUploadId = verificationStatus?.verification_level === 'badge' && status === 'approved';

  return (
    <div className="min-h-screen pb-20 p-4" style={{ background: '#020617' }}>
      <div className="max-w-3xl mx-auto py-8">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2" 
          style={{ color: '#0ea5e9' }}
          data-testid="back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>Verification Center</h1>
          <p className="text-lg" style={{ color: '#94a3b8' }}>Build trust with verified credentials</p>
        </div>

        {/* Current Status */}
        <div className="glass-card p-8 mb-6" data-testid="verification-status-card">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${currentBadge.color}20`, border: `2px solid ${currentBadge.color}` }}>
              <CurrentIcon className="w-10 h-10" style={{ color: currentBadge.color }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
              {currentBadge.label}
            </h2>
          </div>

          {status === 'pending' && (
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24' }}>
              <Clock className="w-5 h-5" style={{ color: '#fbbf24' }} />
              <span style={{ color: '#fbbf24' }}>Under review (24-48 hours)</span>
            </div>
          )}
          
          {status === 'rejected' && (
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444' }}>Verification rejected. Please try again with a clearer photo.</span>
            </div>
          )}
        </div>

        {/* Badge Upload */}
        {canUploadBadge && status !== 'pending' && (
          <div className="glass-card p-6 mb-6" data-testid="badge-upload-card">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#f8fafc' }}>
              <Award className="inline w-6 h-6 mr-2" style={{ color: '#fbbf24' }} />
              Badge Verification
            </h3>
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
              Upload a clear photo of your airline employee badge. Make sure your name and company are visible.
            </p>
            <label className="block">
              <div className="px-4 py-8 rounded-lg border-2 border-dashed cursor-pointer text-center hover:border-opacity-80 transition-all"
                style={{ borderColor: '#fbbf24' }}>
                <Camera className="w-12 h-12 mx-auto mb-3" style={{ color: '#fbbf24' }} />
                <p style={{ color: '#f8fafc' }}>Click to upload badge photo</p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>JPG, PNG up to 10MB</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => setSelectedBadgeFile(e.target.files[0])}
                data-testid="badge-file-input"
              />
            </label>
            {selectedBadgeFile && (
              <p className="text-sm mt-2" style={{ color: '#10b981' }}>✓ {selectedBadgeFile.name}</p>
            )}
            <button
              onClick={() => handleUpload('badge')}
              disabled={!selectedBadgeFile || uploading}
              className="btn-primary w-full mt-4 disabled:opacity-50"
              data-testid="badge-upload-button"
            >
              {uploading && uploadType === 'badge' ? 'Uploading...' : 'Submit Badge for Review'}
            </button>
          </div>
        )}

        {/* ID Upload - Only available after badge is verified */}
        {canUploadId && (
          <div className="glass-card p-6 mb-6" data-testid="id-upload-card">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#f8fafc' }}>
              <FileText className="inline w-6 h-6 mr-2" style={{ color: '#8b5cf6' }} />
              Full Verification (ID)
            </h3>
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
              Upload a government-issued ID to complete full verification and unlock the VIP badge.
            </p>
            <label className="block">
              <div className="px-4 py-8 rounded-lg border-2 border-dashed cursor-pointer text-center hover:border-opacity-80 transition-all"
                style={{ borderColor: '#8b5cf6' }}>
                <Camera className="w-12 h-12 mx-auto mb-3" style={{ color: '#8b5cf6' }} />
                <p style={{ color: '#f8fafc' }}>Click to upload ID photo</p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>JPG, PNG up to 10MB</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => setSelectedIdFile(e.target.files[0])}
                data-testid="id-file-input"
              />
            </label>
            {selectedIdFile && (
              <p className="text-sm mt-2" style={{ color: '#10b981' }}>✓ {selectedIdFile.name}</p>
            )}
            <button
              onClick={() => handleUpload('id')}
              disabled={!selectedIdFile || uploading}
              className="btn-primary w-full mt-4 disabled:opacity-50"
              data-testid="id-upload-button"
            >
              {uploading && uploadType === 'id' ? 'Uploading...' : 'Submit ID for Review'}
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="glass-card p-6" style={{ borderColor: 'rgba(14, 165, 233, 0.3)' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-1" style={{ color: '#0ea5e9' }} />
            <div>
              <h4 className="font-bold mb-2" style={{ color: '#f8fafc' }}>Verification Levels</h4>
              <ul className="space-y-2 text-sm" style={{ color: '#94a3b8' }}>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                  <span><strong>Email Verified</strong> - Basic profile access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: '#fbbf24' }} />
                  <span><strong>Badge Verified</strong> - Appears in "Staff Verified Only" searches</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                  <span><strong>Fully Verified</strong> - VIP badge + priority matching</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
