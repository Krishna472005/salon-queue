import React from 'react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { useI18n } from '../lib/i18n';

export const GetTokenPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-all1-snow text-all1-ink">
      <Header theme="light" />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-heading font-bold text-all1-navy mb-6">
          {t('getToken.title')}
        </h1>
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 text-xs font-semibold text-gray-500 border-b border-all1-cloud pb-3">
          <span className="text-all1-cobalt">1. {t('getToken.step1')}</span>
          <span>2. {t('getToken.step2')}</span>
          <span>3. {t('getToken.step3')}</span>
        </div>
        <div className="bg-white rounded-card p-6 border border-all1-cloud shadow-sm">
          <p className="text-sm text-gray-600 mb-4">
            Get Token wizard placeholder (full implementation in Step 3).
          </p>
        </div>
      </main>
      <Footer theme="light" />
    </div>
  );
};
