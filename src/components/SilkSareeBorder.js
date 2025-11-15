import React from 'react';

/**
 * SilkSareeBorder - Decorative border inspired by South Indian silk saree patterns
 * Bold, colorful, storytelling feel with handmade aesthetic
 * 
 * Props:
 * - size: 'small' | 'medium' | 'large'
 * - colors: { primary, gold, accent } (customizable)
 * - position: 'top' | 'bottom' | 'both'
 */

export function SilkSareeBorder({ 
  size = 'medium', 
  colors = { primary: '#0d3b66', gold: '#d4af37', accent: '#c41e3a' },
  position = 'top' 
}) {
  const sizeMap = {
    small: { height: '50px', patternSize: '50' },
    medium: { height: '70px', patternSize: '70' },
    large: { height: '90px', patternSize: '90' },
  };

  const { height, patternSize } = sizeMap[size];

  const borderSVG = (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 1000 ${patternSize}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Silk saree border pattern - bold and colorful */}
        <pattern id="saree-pattern" x="0" y="0" width="100" height={patternSize} patternUnits="userSpaceOnUse">
          {/* Main diamond shape */}
          <polygon 
            points={`50,${patternSize * 0.2} 70,${patternSize * 0.5} 50,${patternSize * 0.8} 30,${patternSize * 0.5}`}
            fill={colors.gold}
            opacity="0.95"
            stroke={colors.primary}
            strokeWidth="1.5"
          />

          {/* Decorative circles around diamond */}
          <circle cx="50" cy={patternSize * 0.2} r="5" fill={colors.accent} opacity="0.8" />
          <circle cx="70" cy={patternSize * 0.5} r="5" fill={colors.accent} opacity="0.8" />
          <circle cx="50" cy={patternSize * 0.8} r="5" fill={colors.accent} opacity="0.8" />
          <circle cx="30" cy={patternSize * 0.5} r="5" fill={colors.accent} opacity="0.8" />

          {/* Inner accent circles */}
          <circle cx="50" cy={patternSize * 0.5} r="3" fill={colors.primary} opacity="0.9" />

          {/* Side flourishes */}
          <circle cx="15" cy={patternSize * 0.3} r="3" fill={colors.gold} opacity="0.6" />
          <circle cx="15" cy={patternSize * 0.7} r="3" fill={colors.gold} opacity="0.6" />
          <circle cx="85" cy={patternSize * 0.3} r="3" fill={colors.gold} opacity="0.6" />
          <circle cx="85" cy={patternSize * 0.7} r="3" fill={colors.gold} opacity="0.6" />

          {/* Connecting lines for woven effect */}
          <line x1="5" y1={patternSize * 0.5} x2="25" y2={patternSize * 0.5} stroke={colors.gold} strokeWidth="2" opacity="0.5" />
          <line x1="75" y1={patternSize * 0.5} x2="95" y2={patternSize * 0.5} stroke={colors.gold} strokeWidth="2" opacity="0.5" />
        </pattern>

        {/* Gradient for depth */}
        <linearGradient id="border-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: colors.gold, stopOpacity: 0.15 }} />
          <stop offset="50%" style={{ stopColor: colors.primary, stopOpacity: 0.1 }} />
          <stop offset="100%" style={{ stopColor: colors.accent, stopOpacity: 0.15 }} />
        </linearGradient>
      </defs>

      {/* Background with gradient */}
      <rect width="1000" height={patternSize} fill={colors.gold} opacity="0.08" />
      <rect width="1000" height={patternSize} fill="url(#border-gradient)" />

      {/* Apply the pattern */}
      <rect width="1000" height={patternSize} fill="url(#saree-pattern)" />

      {/* Bold decorative top line */}
      <line x1="0" y1="2" x2="1000" y2="2" stroke={colors.primary} strokeWidth="3" opacity="0.8" />
      {/* Bold decorative bottom line */}
      <line x1="0" y1={patternSize - 2} x2="1000" y2={patternSize - 2} stroke={colors.accent} strokeWidth="3" opacity="0.8" />
    </svg>
  );

  if (position === 'both') {
    return (
      <>
        {borderSVG}
        <div style={{ margin: '20px 0' }} />
        {borderSVG}
      </>
    );
  }

  return borderSVG;
}

export default SilkSareeBorder;

