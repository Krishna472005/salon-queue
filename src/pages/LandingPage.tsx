import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { QrCard } from '../components/queue/QrCard';
import { useI18n } from '../lib/i18n';
import { useQueue } from '../context/QueueContext';
import {
  Scissors,
  Sparkles,
  Droplets,
  Hand,
  Clock,
  Users,
  ArrowRight,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  scissors: Scissors,
  sparkles: Sparkles,
  droplets: Droplets,
  hand: Hand,
};

export const LandingPage: React.FC = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const {
    services,
    barbers,
    waitingCount,
    overallWaitMinutes,
    isOnlineTokensPaused,
    pauseReason,
    getBarberWaitMinutes,
    getBarberStatus,
    findActiveTokenByPhone,
    isLive,
  } = useQueue();

  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [findPhone, setFindPhone] = useState('');
  const [findError, setFindError] = useState('');
  const [isFinding, setIsFinding] = useState(false);

  const handleFindSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = findPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFindError(t('getToken.errInvalidPhone'));
      return;
    }

    setIsFinding(true);
    setFindError('');
    try {
      const activeToken = await findActiveTokenByPhone(cleanPhone);
      if (activeToken) {
        setIsFindModalOpen(false);
        navigate(`/t/${activeToken.id}`);
      } else {
        setFindError(t('landing.findModalNotFound'));
      }
    } catch {
      setFindError(t('landing.findModalNotFound'));
    } finally {
      setIsFinding(false);
    }
  };

  const formatWaitString = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
    }
    return `${mins} ${t('landing.mins')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-all1-snow text-all1-ink">
      <Header theme="light" isLive={isLive} />

      <main className="flex-1">
        {/* Navy gradient banner with subtle barber-pole pattern */}
        <section className="bg-hero-gradient bg-barber-pole text-white py-12 px-4 relative overflow-hidden border-b border-all1-deep">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              {/* Taking tokens / Paused status badge */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border transition-colors ${
                  !isOnlineTokensPaused
                    ? 'bg-all1-lime/20 text-all1-lime border-all1-lime/30'
                    : 'bg-all1-sun/20 text-all1-sun border-all1-sun/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    !isOnlineTokensPaused ? 'bg-all1-lime animate-pulse' : 'bg-all1-sun'
                  }`}
                />
                <span>
                  {!isOnlineTokensPaused
                    ? t('status.takingTokens')
                    : t('status.onlinePaused')}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold tracking-tight mb-3">
                {lang === 'gu' ? t('brand.nameGu') : t('brand.name')}
              </h1>
              <p className="text-lg text-all1-fog max-w-md font-body mb-6">
                {lang === 'gu' ? t('brand.taglineGu') : t('brand.tagline')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                {isOnlineTokensPaused ? (
                  <button
                    type="button"
                    disabled
                    title={pauseReason}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-500 text-gray-200 font-heading font-bold rounded-btn shadow opacity-80 cursor-not-allowed tap-target text-lg"
                  >
                    <span>{t('landing.getTicketBtn')}</span>
                    <AlertCircle className="w-5 h-5 text-all1-sun" />
                  </button>
                ) : (
                  <Link
                    to="/token"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-all1-coral text-white font-heading font-bold rounded-btn shadow-lg shadow-all1-coral/30 hover:bg-opacity-95 transition tap-target text-lg group"
                  >
                    <span>{t('landing.getTicketBtn')}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setIsFindModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-4 bg-all1-deep/80 text-all1-fog hover:text-white font-medium rounded-btn border border-all1-cobalt/30 transition tap-target text-sm"
                >
                  <Search className="w-4 h-4 text-all1-aqua" />
                  <span>{t('landing.findTokenLink')}</span>
                </button>
              </div>

              {isOnlineTokensPaused && (
                <p className="text-xs text-all1-sun mt-3 flex items-center justify-center md:justify-start gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pauseReason || t('landing.onlineTokensClosed')}</span>
                </p>
              )}
            </div>

            <div className="hidden sm:block">
              <QrCard theme="dark" size={130} />
            </div>
          </div>
        </section>

        {/* Live Status, Barbers, and Services Menu */}
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* "Right now" card */}
          <div className="bg-white rounded-card p-6 border border-all1-cloud shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-all1-cobalt/10 text-all1-cobalt flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  {t('landing.rightNow')}
                </span>
                <span className="text-xl sm:text-2xl font-heading font-bold text-all1-navy">
                  {t('landing.inLine', {
                    count: waitingCount,
                    wait: formatWaitString(overallWaitMinutes),
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Average wait: ~{overallWaitMinutes} min</span>
            </div>
          </div>

          {/* Three Barber Tiles (Mahesh, Suresh, Ashlesh) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-bold text-all1-navy flex items-center gap-2">
                <Scissors className="w-5 h-5 text-all1-cobalt" />
                <span>{t('landing.ourBarbers')}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {barbers.map((b) => {
                const bStatus = getBarberStatus(b);
                const bWait = getBarberWaitMinutes(b.id);

                const dotColor =
                  bStatus === 'Free'
                    ? 'bg-all1-lime'
                    : bStatus === 'Working'
                    ? 'bg-all1-aqua'
                    : 'bg-all1-sun';

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-card p-5 border border-all1-cloud shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-hero-gradient text-white font-heading font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                      {b.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-semibold text-all1-navy truncate">
                          {b.name}
                        </h3>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${dotColor}`}
                          title={bStatus}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {bStatus === 'On break'
                          ? t('status.onBreak')
                          : bWait === 0
                          ? t('status.free')
                          : `~${bWait} ${t('landing.mins')} wait`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Services Menu Strip */}
          <section>
            <h2 className="text-lg font-heading font-bold text-all1-navy mb-4">
              {t('landing.servicesTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services
                .filter((s) => s.active)
                .map((s) => {
                  const IconComp = iconMap[s.icon] || Scissors;
                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-card p-4 border border-all1-cloud shadow-sm flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-all1-snow text-all1-cobalt flex items-center justify-center shrink-0 border border-all1-cloud">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm text-all1-navy truncate">
                            {lang === 'gu' ? s.name_gu : s.name_en}
                          </h4>
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {s.minutes} {t('landing.mins')}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-all1-cobalt text-base shrink-0">
                        ₹{s.price}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      </main>

      {/* "Find my token" Modal */}
      {isFindModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 border border-all1-cloud">
            <button
              onClick={() => {
                setIsFindModalOpen(false);
                setFindError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 tap-target p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-2 text-all1-cobalt">
              <Search className="w-5 h-5" />
              <h3 className="text-lg font-heading font-bold text-all1-navy">
                {t('landing.findModalTitle')}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 font-body">
              Enter your registered mobile number to restore your active token page.
            </p>

            <form onSubmit={handleFindSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t('landing.findModalPhoneLabel')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono font-medium">
                    +91
                  </span>
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
                    autoFocus
                  />
                </div>
                {findError && (
                  <p className="text-xs text-all1-rose mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{findError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isFinding || findPhone.length !== 10}
                className="w-full py-3 bg-all1-cobalt text-white font-medium rounded-btn hover:bg-opacity-90 transition tap-target text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{isFinding ? t('common.loading') : t('landing.findModalBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer theme="light" />
    </div>
  );
};
