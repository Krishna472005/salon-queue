import React from 'react';
import { useI18n } from '../../lib/i18n';

interface LanguageToggleProps {
  theme?: 'light' | 'dark';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ theme = 'light' }) => {
  const { lang, setLang } = useI18n();

  const isDark = theme === 'dark';

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center rounded-full p-1 border transition-colors ${
        isDark ? 'bg-all1-deep/80 border-all1-cobalt/30 text-white' : 'bg-white border-all1-cloud text-all1-ink shadow-sm'
      }`}
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all tap-target flex items-center justify-center ${
          lang === 'en'
            ? 'bg-all1-cobalt text-white shadow-sm'
            : isDark
            ? 'text-all1-fog hover:text-white'
            : 'text-gray-500 hover:text-all1-ink'
        }`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('gu')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all tap-target flex items-center justify-center font-gujarati ${
          lang === 'gu'
            ? 'bg-all1-cobalt text-white shadow-sm'
            : isDark
            ? 'text-all1-fog hover:text-white'
            : 'text-gray-500 hover:text-all1-ink'
        }`}
        aria-pressed={lang === 'gu'}
      >
        ગુ
      </button>
    </div>
  );
};
