import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import gu from '../locales/gu.json';

type Lang = 'en' | 'gu';

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Lang, Record<string, unknown>> = { en, gu };

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('all1_lang');
    return (saved === 'gu' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('all1_lang', lang);
    if (lang === 'gu') {
      document.documentElement.lang = 'gu';
      document.body.classList.add('font-gujarati');
    } else {
      document.documentElement.lang = 'en';
      document.body.classList.remove('font-gujarati');
    }
  }, [lang]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState(prev => (prev === 'en' ? 'gu' : 'en'));
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const parts = path.split('.');
    let current: unknown = translations[lang];

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        // Fallback to English if translation is missing
        let fallback: unknown = translations.en;
        for (const fbPart of parts) {
          if (fallback && typeof fallback === 'object' && fbPart in fallback) {
            fallback = (fallback as Record<string, unknown>)[fbPart];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let text = current;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
