import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { useI18n } from '../lib/i18n';

export const NotFoundPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-all1-snow text-all1-ink">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white p-8 rounded-card border border-all1-cloud shadow-md">
          <span className="text-6xl font-mono font-bold text-all1-coral block mb-3">404</span>
          <h1 className="text-2xl font-heading font-bold text-all1-navy mb-2">Page Not Found</h1>
          <p className="text-sm text-gray-600 mb-6 font-body">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-all1-cobalt text-white font-medium rounded-btn hover:bg-opacity-90 transition tap-target w-full"
          >
            {t('nav.home')}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};
