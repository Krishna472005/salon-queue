import React from 'react';
import { useI18n } from '../../lib/i18n';

interface ConnectionBadgeProps {
  isLive?: boolean;
  theme?: 'light' | 'dark';
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  isLive = true,
  theme = 'light'
}) => {
  const { t } = useI18n();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        isLive
          ? theme === 'dark'
            ? 'bg-all1-lime/10 text-all1-lime border border-all1-lime/20'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : theme === 'dark'
          ? 'bg-all1-sun/10 text-all1-sun border border-all1-sun/20'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
      role="status"
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isLive ? (theme === 'dark' ? 'bg-all1-lime' : 'bg-emerald-500') : 'bg-amber-500'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isLive ? (theme === 'dark' ? 'bg-all1-lime' : 'bg-emerald-500') : 'bg-amber-500'
          }`}
        />
      </span>
      <span>{isLive ? t('status.live') : t('status.reconnecting')}</span>
    </div>
  );
};
