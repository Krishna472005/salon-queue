import React from 'react';
import { Header } from '../components/common/Header';
import { useI18n } from '../lib/i18n';

export const ReceptionPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-all1-navy text-white">
      <Header theme="dark" />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-heading font-bold text-white">
            {t('reception.title')}
          </h1>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-all1-coral text-white font-medium rounded-btn text-sm tap-target">
              {t('reception.walkinBtn')}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-all1-deep rounded-card p-5 border border-all1-cobalt/20">
            <h2 className="text-base font-heading font-semibold text-all1-aqua mb-3">
              {t('reception.barbersSection')}
            </h2>
            <p className="text-xs text-all1-fog">Mahesh, Suresh, Ashlesh chairs</p>
          </div>
          <div className="lg:col-span-2 bg-all1-deep rounded-card p-5 border border-all1-cobalt/20">
            <h2 className="text-base font-heading font-semibold text-all1-aqua mb-3">
              {t('reception.waitingList')}
            </h2>
            <p className="text-xs text-all1-fog">{t('reception.emptyState')}</p>
          </div>
        </div>
      </main>
    </div>
  );
};
