import React from 'react';
import { Header } from '../components/common/Header';
import { QrCard } from '../components/queue/QrCard';
import { useI18n } from '../lib/i18n';

export const TvPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-all1-navy text-white">
      <Header theme="dark" showStatus={true} />
      <main className="flex-1 p-8 flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white mb-6">
            {t('tv.title')}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Mahesh', 'Suresh', 'Ashlesh'].map((barber) => (
              <div key={barber} className="bg-all1-deep rounded-card p-6 border border-all1-cobalt/30">
                <h3 className="text-xl font-heading font-bold text-white">{barber}</h3>
                <p className="text-sm text-all1-aqua mt-2">{t('tv.chairFree')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-all1-deep pt-6 mt-8">
          <p className="text-sm text-all1-fog">
            Facial ₹750 · 45 min • Haircut ₹300 · 60 min • Beard trimming ₹400 · 40 min
          </p>
          <QrCard theme="dark" size={80} label={t('tv.scanPrompt')} />
        </div>
      </main>
    </div>
  );
};
