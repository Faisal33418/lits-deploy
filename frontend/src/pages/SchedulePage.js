import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Calendar, MapPin, Clock, Trash2, Plane, RefreshCw } from 'lucide-react';

export const SchedulePage = () => {
  const { token, API } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: '',
    city: '',
    arrival_time: '',
    departure_time: '',
    layover_hours: 0
  });

  // Popular layover cities
  const popularCities = [
    'Miami', 'Los Angeles', 'New York', 'Chicago', 'Denver', 
    'Seattle', 'San Francisco', 'Dallas', 'Atlanta', 'Boston',
    'Las Vegas', 'Phoenix', 'Orlando', 'Honolulu', 'London',
    'Paris', 'Tokyo', 'Dubai', 'Frankfurt', 'Amsterdam'
  ];

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      // Get user profile which may contain schedule info
      const res = await axios.get(`${API}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // For now we'll store locally and sync with backend
      const storedSchedules = localStorage.getItem('user_schedules');
      if (storedSchedules) {
        setSchedules(JSON.parse(storedSchedules));
      }
    } catch (err) {
      console.error('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const calculateLayoverHours = (arrival, departure) => {
    if (!arrival || !departure) return 0;
    const [arrHr, arrMin] = arrival.split(':').map(Number);
    const [depHr, depMin] = departure.split(':').map(Number);
    let hours = depHr - arrHr;
    let mins = depMin - arrMin;
    if (mins < 0) {
      hours -= 1;
      mins += 60;
    }
    return Math.max(0, hours + mins / 60);
  };

  const handleAddEntry = async () => {
    if (!newEntry.date || !newEntry.city) {
      toast.error('Please fill in date and city');
      return;
    }

    const layoverHours = calculateLayoverHours(newEntry.arrival_time, newEntry.departure_time);
    const entryWithId = {
      ...newEntry,
      id: Date.now().toString(),
      layover_hours: layoverHours
    };

    const updatedSchedules = [...schedules, entryWithId].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    setSaving(true);
    try {
      // Save to backend
      await axios.post(`${API}/schedule`, updatedSchedules, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSchedules(updatedSchedules);
      localStorage.setItem('user_schedules', JSON.stringify(updatedSchedules));
      
      setNewEntry({
        date: '',
        city: '',
        arrival_time: '',
        departure_time: '',
        layover_hours: 0
      });
      setShowForm(false);
      toast.success('Layover added! Check notifications to see if any matches overlap.');
    } catch (err) {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    const updatedSchedules = schedules.filter(s => s.id !== id);
    
    setSaving(true);
    try {
      await axios.post(`${API}/schedule`, updatedSchedules, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSchedules(updatedSchedules);
      localStorage.setItem('user_schedules', JSON.stringify(updatedSchedules));
      toast.success('Layover removed');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const checkForMatches = async () => {
    try {
      const res = await axios.get(`${API}/layovers/check-matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.notifications_created > 0) {
        toast.success(`Found ${res.data.notifications_created} layover match${res.data.notifications_created > 1 ? 'es' : ''}! Check your notifications.`);
      } else {
        toast.info('No new layover matches found with your current schedule.');
      }
    } catch (err) {
      toast.error('Failed to check for matches');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isUpcoming = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(dateStr + 'T00:00:00');
    return scheduleDate >= today;
  };

  // Filter to show only upcoming schedules
  const upcomingSchedules = schedules.filter(s => isUpcoming(s.date));
  const pastSchedules = schedules.filter(s => !isUpcoming(s.date));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#94a3b8' }}>Loading schedule...</p>
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
              onClick={() => navigate('/profile')} 
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'rgba(30, 41, 59, 0.5)' }}
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: '#94a3b8' }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
                My Layovers
              </h1>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                {upcomingSchedules.length} upcoming
              </p>
            </div>
          </div>
          
          <button
            onClick={checkForMatches}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.3)' }}
            data-testid="check-matches-button"
            title="Check for layover matches"
          >
            <RefreshCw className="w-5 h-5" style={{ color: '#fbbf24' }} />
          </button>
        </div>

        {/* Add New Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 p-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            style={{ 
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: '2px dashed rgba(14, 165, 233, 0.5)'
            }}
            data-testid="add-layover-button"
          >
            <Plus className="w-5 h-5" style={{ color: '#0ea5e9' }} />
            <span className="font-medium" style={{ color: '#0ea5e9' }}>Add Layover</span>
          </button>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="glass-card p-6 mb-6" data-testid="add-layover-form">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#f8fafc' }}>New Layover</h3>
            
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block mb-2 text-sm" style={{ color: '#94a3b8' }}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date
                </label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', color: '#f8fafc' }}
                  data-testid="layover-date-input"
                />
              </div>

              {/* City */}
              <div>
                <label className="block mb-2 text-sm" style={{ color: '#94a3b8' }}>
                  <MapPin className="w-4 h-4 inline mr-2" />
                  City
                </label>
                <input
                  type="text"
                  list="cities"
                  value={newEntry.city}
                  onChange={(e) => setNewEntry({ ...newEntry, city: e.target.value })}
                  placeholder="e.g., Miami, London, Tokyo"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', color: '#f8fafc' }}
                  data-testid="layover-city-input"
                />
                <datalist id="cities">
                  {popularCities.map(city => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm" style={{ color: '#94a3b8' }}>
                    <Clock className="w-4 h-4 inline mr-2" />
                    Arrival
                  </label>
                  <input
                    type="time"
                    value={newEntry.arrival_time}
                    onChange={(e) => setNewEntry({ ...newEntry, arrival_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', color: '#f8fafc' }}
                    data-testid="layover-arrival-input"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm" style={{ color: '#94a3b8' }}>
                    <Plane className="w-4 h-4 inline mr-2" />
                    Departure
                  </label>
                  <input
                    type="time"
                    value={newEntry.departure_time}
                    onChange={(e) => setNewEntry({ ...newEntry, departure_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', color: '#f8fafc' }}
                    data-testid="layover-departure-input"
                  />
                </div>
              </div>

              {/* Layover Duration Preview */}
              {newEntry.arrival_time && newEntry.departure_time && (
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                  <span style={{ color: '#94a3b8' }}>Layover: </span>
                  <span className="font-bold" style={{ color: '#0ea5e9' }}>
                    {calculateLayoverHours(newEntry.arrival_time, newEntry.departure_time).toFixed(1)} hours
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 rounded-lg font-medium"
                  style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#94a3b8' }}
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEntry}
                  disabled={saving || !newEntry.date || !newEntry.city}
                  className="flex-1 px-4 py-3 rounded-lg font-medium disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)', color: '#fff' }}
                  data-testid="save-layover-button"
                >
                  {saving ? 'Saving...' : 'Add Layover'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Schedules */}
        {upcomingSchedules.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium mb-2" style={{ color: '#64748b' }}>UPCOMING LAYOVERS</h3>
            {upcomingSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="glass-card p-4 flex items-center justify-between"
                data-testid={`schedule-${schedule.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: '#0ea5e9' }} />
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: '#f8fafc' }}>{schedule.city}</h4>
                    <div className="flex items-center gap-3 text-sm" style={{ color: '#94a3b8' }}>
                      <span>{formatDate(schedule.date)}</span>
                      {schedule.arrival_time && schedule.departure_time && (
                        <>
                          <span>•</span>
                          <span>{schedule.arrival_time} - {schedule.departure_time}</span>
                        </>
                      )}
                    </div>
                    {schedule.layover_hours > 0 && (
                      <span className="text-xs" style={{ color: '#0ea5e9' }}>
                        {schedule.layover_hours.toFixed(1)}h layover
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteEntry(schedule.id)}
                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  data-testid={`delete-${schedule.id}`}
                >
                  <Trash2 className="w-5 h-5" style={{ color: '#ef4444' }} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Plane className="w-16 h-16 mx-auto mb-4" style={{ color: '#64748b' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f8fafc' }}>No Layovers Yet</h2>
            <p style={{ color: '#94a3b8' }}>
              Add your upcoming layovers to find matches in the same cities!
            </p>
          </div>
        )}

        {/* Past Schedules (collapsed) */}
        {pastSchedules.length > 0 && (
          <div className="mt-6">
            <details>
              <summary className="text-sm font-medium cursor-pointer mb-2" style={{ color: '#64748b' }}>
                PAST LAYOVERS ({pastSchedules.length})
              </summary>
              <div className="space-y-2 mt-3">
                {pastSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="glass-card p-3 flex items-center justify-between opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4" style={{ color: '#64748b' }} />
                      <span style={{ color: '#94a3b8' }}>{schedule.city}</span>
                      <span className="text-sm" style={{ color: '#64748b' }}>{formatDate(schedule.date)}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(schedule.id)}
                      className="p-1 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#64748b' }} />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <p className="text-sm" style={{ color: '#fbbf24' }}>
            <strong>Pro tip:</strong> Add your layovers and we'll notify you when a match is in the same city! 
            Check your notifications after adding schedules.
          </p>
        </div>
      </div>
    </div>
  );
};
