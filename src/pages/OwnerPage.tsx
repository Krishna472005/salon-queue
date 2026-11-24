import React from 'react';
import { Header } from '../components/common/Header';
import { useI18n } from '../lib/i18n';

export const OwnerPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-all1-navy text-white">
      <Header theme="dark" />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-heading font-bold text-white mb-6">
          {t('owner.title')}
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-all1-deep p-4 rounded-card border border-all1-cobalt/20">
            <span className="text-xs text-all1-fog block">{t('owner.todayServed')}</span>
            <span className="text-2xl font-mono font-bold text-all1-lime">18</span>
          </div>
          <div className="bg-all1-deep p-4 rounded-card border border-all1-cobalt/20">
            <span className="text-xs text-all1-fog block">{t('owner.avgWait')}</span>
            <span className="text-2xl font-mono font-bold text-all1-aqua">24 min</span>
          </div>
          <div className="bg-all1-deep p-4 rounded-card border border-all1-cobalt/20">
            <span className="text-xs text-all1-fog block">{t('owner.noShows')}</span>
            <span className="text-2xl font-mono font-bold text-all1-rose">1</span>
          </div>
          <div className="bg-all1-deep p-4 rounded-card border border-all1-cobalt/20">
            <span className="text-xs text-all1-fog block">Online Tokens</span>
            <span className="text-2xl font-mono font-bold text-all1-lime">Active</span>
          </div>
        </div>
      </main>
    </div>
  );
};
