import React from 'react';
import { Plane } from 'lucide-react';

/**
 * Gold Plane Badge - Shows next to verified users' names
 * Users get gold verified status via:
 * - Google OAuth with airline email
 * - Airline email verification
 * - Badge/ID verification approval
 */
export const GoldPlaneBadge = ({ size = 'md', showTooltip = true }) => {
  const sizes = {
    sm: { icon: 12, container: 16 },
    md: { icon: 16, container: 20 },
    lg: { icon: 20, container: 24 }
  };

  const { icon, container } = sizes[size] || sizes.md;

  return (
    <div 
      className="inline-flex items-center justify-center rounded-full flex-shrink-0"
      style={{ 
        width: container, 
        height: container,
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        boxShadow: '0 0 8px rgba(251, 191, 36, 0.5)'
      }}
      title={showTooltip ? 'Gold Verified - Airline Staff Confirmed' : undefined}
      data-testid="gold-plane-badge"
    >
      <Plane 
        className="transform -rotate-45" 
        style={{ 
          width: icon, 
          height: icon, 
          color: '#fff',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'
        }} 
      />
    </div>
  );
};

/**
 * User Name with Gold Badge - Shows name with gold plane if verified
 */
export const UserNameWithBadge = ({ 
  name, 
  isGoldVerified, 
  className = '', 
  style = {},
  size = 'md'
}) => {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} style={style}>
      {name}
      {isGoldVerified && <GoldPlaneBadge size={size} />}
    </span>
  );
};
