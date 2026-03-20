import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, Sparkles, Plane, Crown, ArrowLeft } from 'lucide-react';

export const PricingPage = () => {
  const { token, user, updateUser, API } = useAuth();
  const navigate = useNavigate();
  const [selectedDuration, setSelectedDuration] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState('free');

  useEffect(() => {
    if (user) {
      setCurrentTier(user.subscription_tier || 'free');
    }
  }, [user]);

  const pricingData = {
    cruising_altitude: {
      name: 'Cruising Altitude',
      icon: Plane,
      color: '#0ea5e9',
      prices: {
        monthly: 10.99,
        quarterly: 8.99,
        annually: 6.99
      },
      savings: {
        quarterly: '18%',
        annually: '36%'
      },
      features: [
        'Unlimited swipes',
        'See who liked you',
        '5 Super Likes per day',
        'Rewind last swipe',
        'Layover Discovery',
        'Schedule-based matching',
        'Ad-free experience',
        '1 Profile boost/month'
      ]
    },
    first_class: {
      name: 'First Class',
      icon: Sparkles,
      color: '#8b5cf6',
      popular: true,
      prices: {
        monthly: 15.99,
        quarterly: 13.99,
        annually: 11.99
      },
      savings: {
        quarterly: '13%',
        annually: '25%'
      },
      features: [
        'All Cruising Altitude features',
        'Priority likes - seen first',
        'Unlimited Super Likes',
        'Gold Verified Only filter',
        'Advanced filters (airline, base, aircraft)',
        'Message before matching',
        '3 Profile boosts/month',
        'Passport Mode - swipe anywhere',
        'Read receipts'
      ]
    },
    captains_choice: {
      name: "Captain's Choice",
      icon: Crown,
      color: '#fbbf24',
      prices: {
        monthly: 22.99,
        quarterly: 19.99,
        annually: 17.99
      },
      savings: {
        quarterly: '13%',
        annually: '22%'
      },
      features: [
        'All First Class features',
        'AI Trip Planner for meetups',
        'Enhanced AI compatibility reports',
        'Unlimited profile boosts',
        'VIP badge on profile',
        'Message anyone before matching',
        'Exclusive crew events access',
        'Priority customer support'
      ]
    }
  };

  const handleUpgrade = async (tier) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/subscription/upgrade`, {
        tier,
        duration: selectedDuration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      updateUser(res.data.user);
      toast.success(`🎉 Welcome to ${pricingData[tier].name}!`);
      navigate('/discover');
    } catch (err) {
      toast.error('Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDurationPrice = (tier) => {
    return pricingData[tier].prices[selectedDuration];
  };

  const getTotalPrice = (tier) => {
    const price = pricingData[tier].prices[selectedDuration];
    if (selectedDuration === 'quarterly') return (price * 3).toFixed(2);
    if (selectedDuration === 'annually') return (price * 12).toFixed(2);
    return price.toFixed(2);
  };

  return (
    <div className="min-h-screen pb-20 p-4" style={{ background: '#020617' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto py-8">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2" style={{ color: '#0ea5e9' }} data-testid="back-button">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="text-center mb-12 fade-in-up">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
            Choose Your Plan
          </h1>
          <p className="text-xl mb-2" style={{ color: '#94a3b8' }}>
            Find love in the sky with the perfect plan for you
          </p>
          <p className="text-sm" style={{ color: '#64748b' }}>
            {currentTier !== 'free' && `Current plan: ${pricingData[currentTier]?.name || 'Free'}`}
          </p>
        </div>

        {/* Duration Toggle */}
        <div className="flex justify-center mb-12 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card p-2 flex gap-2">
            {['monthly', 'quarterly', 'annually'].map((duration) => (
              <button
                key={duration}
                onClick={() => setSelectedDuration(duration)}
                className="px-6 py-3 rounded-lg font-medium transition-all"
                style={{
                  background: selectedDuration === duration ? 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' : 'transparent',
                  color: selectedDuration === duration ? '#fff' : '#94a3b8'
                }}
                data-testid={`duration-${duration}`}
              >
                {duration === 'monthly' && 'Monthly'}
                {duration === 'quarterly' && 'Quarterly'}
                {duration === 'annually' && 'Annual'}
                {duration !== 'monthly' && (
                  <span className="ml-2 text-xs" style={{ color: selectedDuration === duration ? '#fff' : '#10b981' }}>
                    Save up to 36%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {Object.entries(pricingData).map(([tier, data], idx) => {
            const Icon = data.icon;
            const isCurrentTier = currentTier === tier;
            
            return (
              <div
                key={tier}
                className="glass-card p-8 relative fade-in-up"
                style={{
                  animationDelay: `${idx * 0.1 + 0.2}s`,
                  border: data.popular ? `2px solid ${data.color}` : '1px solid rgba(255, 255, 255, 0.05)',
                  transform: data.popular ? 'scale(1.05)' : 'scale(1)'
                }}
                data-testid={`pricing-card-${tier}`}
              >
                {data.popular && (
                  <div
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)', color: '#fff' }}
                  >
                    Most Popular
                  </div>
                )}

                {isCurrentTier && (
                  <div
                    className="absolute -top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#10b981', color: '#fff' }}
                  >
                    Current Plan
                  </div>
                )}

                {/* Icon */}
                <div className="mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: `${data.color}20` }}
                  >
                    <Icon className="w-8 h-8" style={{ color: data.color }} />
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
                  {data.name}
                </h3>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold" style={{ color: data.color }}>
                      ${getDurationPrice(tier)}
                    </span>
                    <span style={{ color: '#64748b' }}>/month</span>
                  </div>
                  {selectedDuration !== 'monthly' && (
                    <div className="mt-2">
                      <span className="text-sm" style={{ color: '#94a3b8' }}>
                        ${getTotalPrice(tier)} billed {selectedDuration}
                      </span>
                      <span className="ml-2 text-sm font-bold" style={{ color: '#10b981' }}>
                        Save {data.savings[selectedDuration]}
                      </span>
                    </div>
                  )}
                  {selectedDuration === 'monthly' && (
                    <div className="mt-1 text-sm" style={{ color: '#64748b' }}>
                      ${(getDurationPrice(tier) / 30).toFixed(2)}/day
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {data.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: data.color }} />
                      <span className="text-sm" style={{ color: '#cbd5e1' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={loading || isCurrentTier}
                  className="w-full py-3 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: isCurrentTier ? '#334155' : `linear-gradient(135deg, ${data.color} 0%, ${data.color}dd 100%)`,
                    color: '#fff',
                    boxShadow: isCurrentTier ? 'none' : `0 0 20px ${data.color}50`
                  }}
                  data-testid={`upgrade-${tier}`}
                >
                  {isCurrentTier ? 'Current Plan' : loading ? 'Processing...' : 'Get Started'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Demo Notice */}
        <div className="mt-12 text-center glass-card p-6 max-w-2xl mx-auto fade-in-up" style={{ animationDelay: '0.5s' }}>
          <p className="text-sm mb-2" style={{ color: '#94a3b8' }}>
            💳 <strong>Demo Mode:</strong> No payment required - instant activation!
          </p>
          <p className="text-xs" style={{ color: '#64748b' }}>
            In production, this would integrate with Stripe for secure payments.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto fade-in-up" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-3xl font-bold text-center mb-8" style={{ fontFamily: 'Outfit', color: '#f8fafc' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.'
              },
              {
                q: 'What happens if I cancel?',
                a: 'You keep your premium features until the end of your current billing period, then your account returns to the free tier.'
              },
              {
                q: 'Is there a money-back guarantee?',
                a: 'Yes! We offer a 7-day money-back guarantee on all plans. Not satisfied? Get a full refund within the first week.'
              },
              {
                q: 'Do you offer discounts for airline employees?',
                a: 'Yes! Contact us about our airline partnership program for corporate discounts.'
              }
            ].map((faq, i) => (
              <div key={i} className="glass-card p-6">
                <h3 className="font-bold mb-2" style={{ color: '#f8fafc' }}>{faq.q}</h3>
                <p style={{ color: '#94a3b8' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
