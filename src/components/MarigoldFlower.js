import React from 'react';

export default function MarigoldFlower({
  size = 60,
  variant = 'orange',
  className = '',
  style = {}
}) {
  const colors = {
    orange: {
      outer: '#FF8C00',
      middle: '#FFA500',
      inner: '#FFD700',
      center: '#E67E22'
    },
    yellow: {
      outer: '#FFD700',
      middle: '#FDB813',
      inner: '#FFEB3B',
      center: '#FF9933'
    },
    deep: {
      outer: '#FF6B00',
      middle: '#FF8C00',
      inner: '#FFA500',
      center: '#C45911'
    }
  };

  const color = colors[variant] || colors.orange;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`marigold-flower ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer petals (20 petals) */}
      {[...Array(20)].map((_, i) => {
        const angle = (i * 18) * (Math.PI / 180);
        const x = 50 + Math.cos(angle) * 28;
        const y = 50 + Math.sin(angle) * 28;
        return (
          <ellipse
            key={`outer-${i}`}
            cx={x}
            cy={y}
            rx="8"
            ry="14"
            fill={color.outer}
            opacity="0.9"
            transform={`rotate(${i * 18} ${x} ${y})`}
          />
        );
      })}

      {/* Middle petals (16 petals) */}
      {[...Array(16)].map((_, i) => {
        const angle = (i * 22.5) * (Math.PI / 180);
        const x = 50 + Math.cos(angle) * 20;
        const y = 50 + Math.sin(angle) * 20;
        return (
          <ellipse
            key={`middle-${i}`}
            cx={x}
            cy={y}
            rx="6"
            ry="11"
            fill={color.middle}
            opacity="0.95"
            transform={`rotate(${i * 22.5} ${x} ${y})`}
          />
        );
      })}

      {/* Inner petals (12 petals) */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const x = 50 + Math.cos(angle) * 12;
        const y = 50 + Math.sin(angle) * 12;
        return (
          <ellipse
            key={`inner-${i}`}
            cx={x}
            cy={y}
            rx="4"
            ry="8"
            fill={color.inner}
            transform={`rotate(${i * 30} ${x} ${y})`}
          />
        );
      })}

      {/* Center */}
      <circle cx="50" cy="50" r="8" fill={color.center} />

      {/* Center detail */}
      <circle cx="50" cy="50" r="6" fill={color.center} opacity="0.7" />
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x = 50 + Math.cos(angle) * 3;
        const y = 50 + Math.sin(angle) * 3;
        return (
          <circle
            key={`detail-${i}`}
            cx={x}
            cy={y}
            r="1.5"
            fill="#8B4513"
            opacity="0.6"
          />
        );
      })}
    </svg>
  );
}

// Marigold Garland - decorative border element
export function MarigoldGarland({ count = 5, className = '' }) {
  return (
    <div className={`marigold-garland ${className}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {[...Array(count)].map((_, i) => (
        <MarigoldFlower
          key={i}
          size={40}
          variant={i % 3 === 0 ? 'yellow' : i % 3 === 1 ? 'orange' : 'deep'}
        />
      ))}
    </div>
  );
}

// Marigold Corner - decorative corner element
export function MarigoldCorner({ position = 'top-left', className = '' }) {
  const positions = {
    'top-left': { top: 0, left: 0, transform: 'rotate(0deg)' },
    'top-right': { top: 0, right: 0, transform: 'rotate(90deg)' },
    'bottom-right': { bottom: 0, right: 0, transform: 'rotate(180deg)' },
    'bottom-left': { bottom: 0, left: 0, transform: 'rotate(270deg)' }
  };

  return (
    <div
      className={`marigold-corner ${className}`}
      style={{
        position: 'absolute',
        ...positions[position],
        pointerEvents: 'none'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '-10px' }}>
        <MarigoldFlower size={50} variant="orange" />
        <div style={{ display: 'flex', marginLeft: '15px', marginTop: '-15px' }}>
          <MarigoldFlower size={40} variant="yellow" />
          <MarigoldFlower size={35} variant="deep" style={{ marginLeft: '-10px', marginTop: '5px' }} />
        </div>
      </div>
    </div>
  );
}
