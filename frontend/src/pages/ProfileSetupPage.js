import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Plus, MapPin, Globe } from 'lucide-react';

const airlines = ['United', 'Delta', 'American', 'Southwest', 'JetBlue', 'Alaska', 'Spirit', 'Frontier', 'Hawaiian'];
const bases = ['JFK', 'LAX', 'ORD', 'DFW', 'ATL', 'DEN', 'SFO', 'SEA', 'MIA', 'BOS', 'PHX', 'LAS', 'MCO', 'CLT', 'IAH'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Dallas', 'Atlanta', 'Denver', 'San Francisco', 'Seattle', 'Miami', 'Boston', 'Phoenix', 'Las Vegas', 'Orlando', 'Charlotte', 'Houston', 'Detroit', 'Minneapolis', 'Philadelphia', 'Portland', 'Austin'];
const aircrafts = ['Boeing 737', 'Boeing 777', 'Boeing 787', 'Airbus A320', 'Airbus A330', 'Airbus A350', 'Embraer E175', 'N/A - Ground Crew'];
const companyTenure = ['Less than 6 months', '6 months - 1 year', '1-2 years', '2-5 years', '5-10 years', '10+ years'];
const daysOffOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Weekends', 'Rotating', 'Flexible'];
const flightCrewRoles = ['pilot', 'flight_attendant'];

export const ProfileSetupPage = () => {
  const { token, updateUser, API } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    airline: '',
    base: '',
    city: '',
    aircraft: '',
    role: '',
    bio: '',
    age: '',
    photos: [],
    time_with_company: '',
    days_off: [],
    trips_taken: [],
    bucket_list_trips: []
  });
  const [tripInput, setTripInput] = useState('');
  const [bucketListInput, setBucketListInput] = useState('');
  const [selectedDaysOff, setSelectedDaysOff] = useState([]);

  const isFlightCrew = flightCrewRoles.includes(formData.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        age: parseInt(formData.age),
        days_off: selectedDaysOff
      };
      
      const res = await axios.post(`${API}/profile/setup`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUser(res.data.user);
      toast.success('Profile created!');
      navigate('/discover');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Setup failed');
    }
  };

  const toggleDayOff = (day) => {
    setSelectedDaysOff(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addTrip = (type) => {
    const input = type === 'taken' ? tripInput : bucketListInput;
    if (!input.trim()) return;
    
    if (type === 'taken') {
      setFormData(prev => ({ ...prev, trips_taken: [...prev.trips_taken, input.trim()] }));
      setTripInput('');
    } else {
      setFormData(prev => ({ ...prev, bucket_list_trips: [...prev.bucket_list_trips, input.trim()] }));
      setBucketListInput('');
    }
  };

  const removeTrip = (type, index) => {
    if (type === 'taken') {
      setFormData(prev => ({ ...prev, trips_taken: prev.trips_taken.filter((_, i) => i !== index) }));
    } else {
      setFormData(prev => ({ ...prev, bucket_list_trips: prev.bucket_list_trips.filter((_, i) => i !== index) }));
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ background: '#020617' }}>
      <div className="max-w-2xl mx-auto py-12">
        <div className="mb-8 fade-in-up">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>Complete Your Profile</h1>
          <p className="text-lg" style={{ color: '#94a3b8' }}>Let's get you ready to connect with crew</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 fade-in-up" data-testid="profile-setup-form">
          {/* Photos */}
          <div className="mb-6">
            <label className="block mb-3 text-sm font-medium" style={{ color: '#94a3b8' }}>Profile Photos</label>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg flex items-center justify-center border-2 border-dashed cursor-pointer hover:border-sky-500 transition-colors"
                  style={{ background: 'rgba(2, 6, 23, 0.5)', borderColor: '#334155' }}
                  data-testid={`photo-upload-${idx}`}
                >
                  <Camera className="w-8 h-8" style={{ color: '#475569' }} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: '#64748b' }}>Add at least one photo (feature coming soon)</p>
          </div>

          {/* Age */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
              style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
              placeholder="28"
              min="18"
              max="99"
              required
              data-testid="age-input"
            />
          </div>

          {/* Role */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
              style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
              required
              data-testid="role-select"
            >
              <option value="">Select your role</option>
              <option value="pilot">Pilot</option>
              <option value="flight_attendant">Flight Attendant</option>
              <option value="ramp_agent">Ramp Agent</option>
              <option value="operations_agent">Operations Agent</option>
              <option value="provision_agent">Provision Agent</option>
              <option value="cargo_agent">Cargo Agent</option>
              <option value="aviation_mechanic">Aviation Mechanic</option>
              <option value="ground_service_equipment">Ground Service Equipment Operator</option>
              <option value="corporate_office">Corporate Office</option>
            </select>
          </div>

          {/* Airline */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Airline/Company</label>
            <select
              value={formData.airline}
              onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
              style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
              required
              data-testid="airline-select"
            >
              <option value="">Select airline/company</option>
              {airlines.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Conditional: Base for flight crew */}
          {isFlightCrew && (
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Home Base</label>
              <select
                value={formData.base}
                onChange={(e) => setFormData({ ...formData, base: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                data-testid="base-select"
              >
                <option value="">Select base</option>
                {bases.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {/* Conditional: City for ground crew */}
          {!isFlightCrew && formData.role && (
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>
                <MapPin className="inline w-4 h-4 mr-2" />City/Location
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                data-testid="city-select"
              >
                <option value="">Select city</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Conditional: Aircraft for flight crew */}
          {isFlightCrew && (
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Aircraft Type</label>
              <select
                value={formData.aircraft}
                onChange={(e) => setFormData({ ...formData, aircraft: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                data-testid="aircraft-select"
              >
                <option value="">Select aircraft</option>
                {aircrafts.filter(a => a !== 'N/A - Ground Crew').map(ac => <option key={ac} value={ac}>{ac}</option>)}
              </select>
            </div>
          )}

          {/* Time with Company */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Time with Company</label>
            <select
              value={formData.time_with_company}
              onChange={(e) => setFormData({ ...formData, time_with_company: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
              style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
              data-testid="tenure-select"
            >
              <option value="">Select tenure</option>
              {companyTenure.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Days Off */}
          <div className="mb-6">
            <label className="block mb-3 text-sm font-medium" style={{ color: '#94a3b8' }}>Regular Days Off</label>
            <div className="grid grid-cols-3 gap-2">
              {daysOffOptions.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDayOff(day)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: selectedDaysOff.includes(day) ? 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' : 'rgba(2, 6, 23, 0.5)',
                    border: selectedDaysOff.includes(day) ? '1px solid #0ea5e9' : '1px solid #334155',
                    color: selectedDaysOff.includes(day) ? '#fff' : '#94a3b8'
                  }}
                  data-testid={`day-${day}`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: '#64748b' }}>Select your typical days off</p>
          </div>

          {/* Trips Taken */}
          <div className="mb-6">
            <label className="block mb-3 text-sm font-medium" style={{ color: '#94a3b8' }}>
              <Globe className="inline w-4 h-4 mr-2" />
              Places You've Been
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tripInput}
                onChange={(e) => setTripInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrip('taken'))}
                className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                placeholder="e.g., Paris, Tokyo, Hawaii"
                data-testid="trip-input"
              />
              <button
                type="button"
                onClick={() => addTrip('taken')}
                className="px-4 py-2 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)', color: '#fff' }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.trips_taken.map((trip, idx) => (
                <div key={idx} className="px-3 py-1 rounded-full flex items-center gap-2" style={{ background: 'rgba(14, 165, 233, 0.2)', border: '1px solid #0ea5e9' }}>
                  <span className="text-sm" style={{ color: '#0ea5e9' }}>{trip}</span>
                  <button type="button" onClick={() => removeTrip('taken', idx)}>
                    <X className="w-3 h-3" style={{ color: '#0ea5e9' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bucket List */}
          <div className="mb-6">
            <label className="block mb-3 text-sm font-medium" style={{ color: '#94a3b8' }}>
              <Globe className="inline w-4 h-4 mr-2" />
              Bucket List Destinations
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={bucketListInput}
                onChange={(e) => setBucketListInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrip('bucket'))}
                className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
                placeholder="e.g., Maldives, Iceland, New Zealand"
                data-testid="bucket-input"
              />
              <button
                type="button"
                onClick={() => addTrip('bucket')}
                className="px-4 py-2 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #fbbf24 100%)', color: '#fff' }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.bucket_list_trips.map((trip, idx) => (
                <div key={idx} className="px-3 py-1 rounded-full flex items-center gap-2" style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8b5cf6' }}>
                  <span className="text-sm" style={{ color: '#8b5cf6' }}>{trip}</span>
                  <button type="button" onClick={() => removeTrip('bucket', idx)}>
                    <X className="w-3 h-3" style={{ color: '#8b5cf6' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <label className="block mb-2 text-sm font-medium" style={{ color: '#94a3b8' }}>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 h-32 resize-none"
              style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #334155', color: '#f8fafc' }}
              placeholder="Tell us about yourself and what you're looking for..."
              data-testid="bio-textarea"
            />
          </div>

          <button type="submit" className="btn-primary w-full" data-testid="profile-setup-submit">
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
};
