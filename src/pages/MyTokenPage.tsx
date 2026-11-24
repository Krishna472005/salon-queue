import React from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { useI18n } from '../lib/i18n';

export const MyTokenPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-all1-snow text-all1-ink">
      <Header theme="light" />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8">
        <h1 className="text-xl font-heading font-bold text-all1-navy mb-4">
          {t('myToken.tokenCard')}
        </h1>
        <div className="bg-white rounded-card p-6 border border-all1-cloud shadow-sm text-center">
          <p className="text-xs text-gray-400 font-mono mb-2">Token ID: {id || 'demo'}</p>
          <div className="text-4xl font-mono font-bold text-all1-cobalt my-4">O-14</div>
          <p className="text-sm text-gray-600 mb-2">{t('myToken.position', { pos: '4th' })}</p>
          <p className="text-xs text-all1-cobalt font-medium">
            {t('myToken.expectedTime', { time: '6:45 PM' })}
          </p>
        </div>
      </main>
      <Footer theme="light" />
    </div>
  );
};
