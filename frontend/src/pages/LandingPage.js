import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Heart, MapPin, Sparkles, Calendar } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: '#020617' }}>
      {/* Hero */}
      <div
        className="relative min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1761813409957-681c1e4376ec?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9) 0%, rgba(15, 23, 42, 0.8) 100%)' }} />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center fade-in-up">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_layover-link/artifacts/idqffa3a_copilot_image_1772255420092.jpeg" 
              alt="LITS Logo" 
              className="w-64 h-64 object-contain"
            />
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
            Love In The Sky
          </h1>
          
          <p className="text-xl sm:text-2xl mb-8" style={{ color: '#94a3b8' }}>
            Where Crew Hearts Take Flight
          </p>
          
          <p className="text-lg mb-12 max-w-2xl mx-auto" style={{ color: '#cbd5e1' }}>
            The independent dating platform built exclusively for airline employees.
            Connect with pilots, flight attendants, ramp agents, operations agents, provision agents, 
            aviation mechanics, ground service equipment operators, and all airline professionals who understand your lifestyle. 
            Match based on schedules, layovers, and aviation culture.
          </p>
          
          <button
            onClick={() => navigate('/auth')}
            className="btn-primary text-lg px-8 py-4"
            data-testid="get-started-button"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
            Built for Your Aviation Lifestyle
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Schedule Matching',
                desc: 'Find crew with overlapping layovers and compatible schedules'
              },
              {
                icon: MapPin,
                title: 'Layover Discovery',
                desc: 'See who\'s in the same city tonight and meet up'
              },
              {
                icon: Sparkles,
                title: 'AI Compatibility',
                desc: 'Smart matching based on aviation lifestyle and preferences'
              },
              {
                icon: Heart,
                title: 'Staff Verified Only',
                desc: 'Safe environment with airline email verification'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="glass-card p-6 text-center fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' }}>
                  <feature.icon className="w-6 h-6" style={{ color: '#fff' }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>{feature.title}</h3>
                <p className="text-sm" style={{ color: '#94a3b8' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center glass-card p-12 fade-in-up">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
            Ready to Connect with Your Crew?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#94a3b8' }}>
            Join the exclusive community for airline professionals
          </p>
          <button onClick={() => navigate('/auth')} className="btn-primary text-lg px-8 py-4">
            Join LITS
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm mb-3" style={{ color: '#64748b' }}>
            LITS (Love In The Sky) is an <strong>independent dating platform</strong> built exclusively for airline employees.
          </p>
          <p className="text-xs" style={{ color: '#475569' }}>
            Not affiliated with any airline company, travel service, or booking platform. Standalone and focused on aviation dating.
          </p>
          <p className="text-xs mt-6" style={{ color: '#334155' }}>
            © 2026 LITS. All rights reserved. Where Crew Hearts Take Flight ✈️💕
          </p>
        </div>
      </footer>
    </div>
  );
};