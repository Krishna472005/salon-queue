import React from 'react';
import { Logo } from './Logo';
import { LanguageToggle } from './LanguageToggle';
import { ConnectionBadge } from './ConnectionBadge';

interface HeaderProps {
  theme?: 'light' | 'dark';
  showStatus?: boolean;
  isLive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme = 'light',
  showStatus = true,
  isLive = true
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`w-full border-b transition-colors ${
        isDark
          ? 'bg-all1-navy border-all1-deep/80 text-white'
          : 'bg-white border-all1-cloud text-all1-ink'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo theme={theme} size="md" showTagline />
          {showStatus && <ConnectionBadge isLive={isLive} theme={theme} />}
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle theme={theme} />
        </div>
      </div>
    </header>
  );
};
