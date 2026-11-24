import React from 'react';
import { useI18n } from '../../lib/i18n';

interface WaitRingProps {
  waitMinutes: number;
  size?: number;
  strokeWidth?: number;
}

export const WaitRing: React.FC<WaitRingProps> = ({
  waitMinutes,
  size = 180,
  strokeWidth = 10,
}) => {
  const { t } = useI18n();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Visual fullness: if wait is 60m, full ring; if 0m, 10%
  const maxMins = 90;
  const progressPercent = Math.min(1, Math.max(0.12, waitMinutes / maxMins));
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="waitRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#2F6BFF" />
          </linearGradient>
        </defs>

        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E3EAF3"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated gradient progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#waitRingGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {t('myToken.waitRingAbout')}
        </span>
        <span className="text-4xl font-heading font-extrabold text-all1-navy tracking-tight my-0.5">
          {waitMinutes}
        </span>
        <span className="text-xs font-semibold text-all1-cobalt">
          {t('myToken.mins')}
        </span>
      </div>
    </div>
  );
};
