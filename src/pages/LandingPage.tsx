import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { QrCard } from '../components/queue/QrCard';
import { useI18n } from '../lib/i18n';
import { Scissors, Sparkles, Droplets, Hand, Clock, Users, ArrowRight, Search, X } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [findPhone, setFindPhone] = useState('');
  const [findError, setFindError] = useState('');

  const services = [
    { nameEn: 'Haircut', nameGu: 'હેરકટ', time: 60, price: 300, icon: Scissors },
    { nameEn: 'Beard trimming', nameGu: 'દાઢી ટ્રીમિંગ', time: 40, price: 400, icon: Scissors },
    { nameEn: 'Facial', nameGu: 'ફેશિયલ', time: 45, price: 750, icon: Sparkles },
    { nameEn: 'Hair wash', nameGu: 'હેર વોશ', time: 20, price: 150, icon: Droplets },
    { nameEn: 'Massage', nameGu: 'મસાજ', time: 20, price: 200, icon: Hand },
  ];

  const barbers = [
    { name: 'Mahesh', status: 'Working', wait: 20, color: 'bg-all1-aqua' },
    { name: 'Suresh', status: 'Working', wait: 35, color: 'bg-all1-aqua' },
    { name: 'Ashlesh', status: 'Free', wait: 0, color: 'bg-all1-lime' },
  ];

  const handleFindSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(findPhone)) {
      setFindError(t('getToken.errInvalidPhone'));
      return;
    }
    // Will hook into Supabase RPC in Step 2/3
    setFindError(t('landing.findModalNotFound'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-all1-snow text-all1-ink">
      <Header theme="light" />

      <main className="flex-1">
        {/* Navy gradient banner with barber-pole background */}
        <section className="bg-hero-gradient bg-barber-pole text-white py-12 px-4 relative overflow-hidden border-b border-all1-deep">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-all1-lime/20 text-all1-lime text-xs font-semibold mb-4 border border-all1-lime/30">
                <span className="w-2 h-2 rounded-full bg-all1-lime animate-pulse" />
                {t('status.takingTokens')}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold tracking-tight mb-3">
                {lang === 'gu' ? t('brand.nameGu') : t('brand.name')}
              </h1>
              <p className="text-lg text-all1-fog max-w-md font-body mb-6">
                {lang === 'gu' ? t('brand.taglineGu') : t('brand.tagline')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/token"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-all1-coral text-white font-heading font-bold rounded-btn shadow-lg shadow-all1-coral/30 hover:bg-opacity-95 transition tap-target text-lg group"
                >
                  <span>{t('landing.getTicketBtn')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsFindModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-4 bg-all1-deep/80 text-all1-fog hover:text-white font-medium rounded-btn border border-all1-cobalt/30 transition tap-target text-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('landing.findTokenLink')}</span>
                </button>
              </div>
            </div>

            <div className="hidden sm:block">
              <QrCard theme="dark" size={130} />
            </div>
          </div>
        </section>

        {/* Live Status & Barbers */}
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Right now card */}
          <div className="bg-white rounded-card p-6 border border-all1-cloud shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-all1-cobalt/10 text-all1-cobalt flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  {t('landing.rightNow')}
                </span>
                <span className="text-xl sm:text-2xl font-heading font-bold text-all1-navy">
                  {t('landing.inLine', { count: 3, wait: '45 ' + t('landing.mins') })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Average service: 45 min
            </div>
          </div>

          {/* Barbers tiles */}
          <section>
            <h2 className="text-lg font-heading font-bold text-all1-navy mb-4 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-all1-cobalt" />
              {t('landing.ourBarbers')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {barbers.map((b) => (
                <div
                  key={b.name}
                  className="bg-white rounded-card p-5 border border-all1-cloud shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-hero-gradient text-white font-heading font-bold text-lg flex items-center justify-center shrink-0">
                    {b.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-all1-navy truncate">{b.name}</h3>
                      <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} title={b.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {b.wait === 0 ? t('status.free') : `~${b.wait} ${t('landing.mins')} wait`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Menu strip */}
          <section>
            <h2 className="text-lg font-heading font-bold text-all1-navy mb-4">
              {t('landing.servicesTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((s, idx) => {
                const IconComponent = s.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-card p-4 border border-all1-cloud shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-all1-snow text-all1-cobalt flex items-center justify-center shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-all1-navy">
                          {lang === 'gu' ? s.nameGu : s.nameEn}
                        </h4>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {s.time} {t('landing.mins')}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-all1-cobalt text-base">
                      ₹{s.price}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Find my token modal */}
      {isFindModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsFindModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 tap-target p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-heading font-bold text-all1-navy mb-2">
              {t('landing.findModalTitle')}
            </h3>
            <form onSubmit={handleFindSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t('landing.findModalPhoneLabel')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={findPhone}
                    onChange={(e) => {
                      setFindPhone(e.target.value.replace(/\D/g, ''));
                      setFindError('');
                    }}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-2.5 rounded-btn border border-all1-cloud focus:border-all1-cobalt focus:ring-1 focus:ring-all1-cobalt outline-none font-mono text-sm"
                  />
                </div>
                {findError && <p className="text-xs text-all1-rose mt-1">{findError}</p>}
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-all1-cobalt text-white font-medium rounded-btn hover:bg-opacity-90 transition tap-target text-sm"
              >
                {t('landing.findModalBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer theme="light" />
    </div>
  );
};
