import React from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { useI18n } from '../lib/i18n';

export const BarberPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-all1-navy text-white">
      <Header theme="dark" />
      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-heading font-bold text-white mb-2 capitalize">
          {name || 'Barber'} Chair
        </h1>
        <div className="bg-all1-deep rounded-card p-6 border border-all1-cobalt/20 mt-4">
          <h2 className="text-sm font-semibold text-all1-aqua mb-2">
            {t('barber.currentCustomer')}
          </h2>
          <p className="text-sm text-all1-fog">{t('barber.noCurrent')}</p>
        </div>
      </main>
    </div>
  );
};
