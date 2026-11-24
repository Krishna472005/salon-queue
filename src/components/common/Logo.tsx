import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  theme = 'light',
  size = 'md',
  showTagline = false
}) => {
  const isDark = theme === 'dark';

  const dimensions = {
    sm: { width: 120, height: 36, badge: 32, fontSize: 20 },
    md: { width: 150, height: 44, badge: 40, fontSize: 26 },
    lg: { width: 200, height: 56, badge: 50, fontSize: 34 }
  }[size];

  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group tap-target select-none">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 160 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform group-hover:scale-102"
      >
        <defs>
          <linearGradient id="logoBadgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B1F3A" />
            <stop offset="100%" stopColor="#2F6BFF" />
          </linearGradient>
        </defs>

        {/* Rounded-square badge */}
        <rect
          x="1"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="url(#logoBadgeGradient)"
          stroke={isDark ? '#22D3EE' : 'transparent'}
          strokeWidth={isDark ? '1.5' : '0'}
        />

        {/* Coral '1' with scissor-notch cutout in stem */}
        <path
          d="M 13 17 L 23 10 L 23 21 L 20 23 L 23 25 L 23 38 L 15 38"
          fill="#FF6F59"
        />
        {/* Scissor pivot circles */}
        <circle cx="18.5" cy="21" r="1.5" fill="#FFFFFF" />
        <circle cx="18.5" cy="25" r="1.5" fill="#FFFFFF" />

        {/* 'ALL' text */}
        <text
          x="54"
          y="34"
          fontFamily="Sora, sans-serif"
          fontWeight="800"
          fontSize="30"
          fill={isDark ? '#FFFFFF' : '#0B1F3A'}
          letterSpacing="-0.5"
        >
          ALL
        </text>

        {/* '1' in coral text */}
        <text
          x="118"
          y="34"
          fontFamily="Sora, sans-serif"
          fontWeight="800"
          fontSize="30"
          fill="#FF6F59"
          letterSpacing="-0.5"
        >
          1
        </text>
      </svg>

      {showTagline && (
        <span className={`text-xs font-medium hidden sm:inline-block border-l pl-2.5 ${
          isDark ? 'border-all1-fog/30 text-all1-fog' : 'border-gray-300 text-gray-500'
        }`}>
          Zero guessing
        </span>
      )}
    </Link>
  );
};
