import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';

interface FooterProps {
  theme?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ theme = 'light' }) => {
  const { t } = useI18n();
  const isDark = theme === 'dark';

  return (
    <footer
      className={`w-full py-8 border-t transition-colors ${
        isDark
          ? 'bg-all1-deep/50 border-all1-deep text-all1-fog'
          : 'bg-white border-all1-cloud text-gray-500'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="text-center sm:text-left">
          <p className="font-semibold text-sm mb-1">{t('brand.name')} — {t('brand.tagline')}</p>
          <p>© {new Date().getFullYear()} ALL1 Salon. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/tv"
            className={`hover:underline tap-target flex items-center ${isDark ? 'text-all1-aqua' : 'text-all1-cobalt'}`}
          >
            {t('nav.tv')}
          </Link>
          <span className="opacity-30">•</span>
          <Link
            to="/login"
            className={`hover:underline tap-target flex items-center ${isDark ? 'text-all1-fog hover:text-white' : 'text-gray-600 hover:text-all1-ink'}`}
          >
            {t('nav.staffLogin')}
          </Link>
        </div>
      </div>
    </footer>
  );
};
