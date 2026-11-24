import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { useI18n } from '../lib/i18n';
import { useQueue } from '../context/QueueContext';
import {
  Coffee,
  CheckCircle,
  Play,
  CheckCheck,
  User,
  AlertCircle,
} from 'lucide-react';

export const BarberPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const { t, lang } = useI18n();
  const {
    barbers,
    services,
    queueEntries,
    startService,
    finishService,
    toggleBarberBreak,
    getServedTodayCount,
    isLive,
  } = useQueue();

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Find barber matching :name (case-insensitive)
  const barber = useMemo(() => {
    if (!name) return barbers[0];
    return (
      barbers.find((b) => b.name.toLowerCase() === name.toLowerCase()) ||
      barbers[0]
    );
  }, [name, barbers]);

  // Current customer for this barber (in_chair or called)
  const currentCustomer = useMemo(() => {
    if (!barber) return null;
    return (
      queueEntries.find(
        (e) => e.assigned_barber_id === barber.id && e.status === 'in_chair'
      ) ||
      queueEntries.find(
        (e) => e.assigned_barber_id === barber.id && e.status === 'called'
      ) ||
      null
    );
  }, [barber, queueEntries]);

  // Live timer since service started
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (currentCustomer?.status !== 'in_chair' || !currentCustomer.started_at) {
      setElapsedSeconds(0);
      return;
    }

    const calcElapsed = () => {
      const start = new Date(currentCustomer.started_at!).getTime();
      return Math.max(0, Math.floor((Date.now() - start) / 1000));
    };

    setElapsedSeconds(calcElapsed());
    const interval = setInterval(() => {
      setElapsedSeconds(calcElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentCustomer]);

  const formattedTimer = useMemo(() => {
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // "Up next for you" customer (earliest waiting customer preferring this barber or 'any')
  const upNextCustomer = useMemo(() => {
    if (!barber) return null;
    return (
      queueEntries
        .filter(
          (e) =>
            e.status === 'waiting' &&
            (e.preferred_barber_id === barber.id || !e.preferred_barber_id)
        )
        .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())[0] ||
      null
    );
  }, [barber, queueEntries]);

  // Services of current customer
  const currentCustomerServices = useMemo(() => {
    if (!currentCustomer) return [];
    return services.filter((s) => currentCustomer.service_ids.includes(s.id));
  }, [currentCustomer, services]);

  // Up next services
  const upNextServices = useMemo(() => {
    if (!upNextCustomer) return [];
    return services.filter((s) => upNextCustomer.service_ids.includes(s.id));
  }, [upNextCustomer, services]);

  // Start Service
  const handleStart = async () => {
    if (!currentCustomer || !barber || actionLoading) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await startService(currentCustomer.id, barber.id);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to start service');
    } finally {
      setActionLoading(false);
    }
  };

  // Finish Service
  const handleFinish = async () => {
    if (!currentCustomer || !barber || actionLoading) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await finishService(currentCustomer.id, barber.id);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to finish service');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Break
  const handleToggleBreak = async () => {
    if (!barber || actionLoading) return;
    setActionLoading(true);
    try {
      await toggleBarberBreak(barber.id, !barber.on_break);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to toggle break state');
    } finally {
      setActionLoading(false);
    }
  };

  const servedToday = barber ? getServedTodayCount(barber.id) : 0;
  const isOnBreak = Boolean(barber?.on_break);

  return (
    <div className="min-h-screen flex flex-col bg-all1-navy text-white">
      <Header theme="dark" isLive={isLive} />

      <main className="flex-1 max-w-md mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Barber Header / Profile Bar */}
        <div className="bg-all1-deep rounded-card p-5 border border-all1-cobalt/25 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-hero-gradient text-white font-heading font-extrabold text-xl flex items-center justify-center shadow-sm">
              {barber?.name?.charAt(0) || 'B'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-lg text-white">
                  {barber?.name}
                </h1>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOnBreak
                      ? 'bg-all1-sun'
                      : currentCustomer
                      ? 'bg-all1-aqua'
                      : 'bg-all1-lime'
                  }`}
                />
              </div>
              <p className="text-xs text-all1-fog mt-0.5">
                {isOnBreak
                  ? t('status.onBreak')
                  : currentCustomer
                  ? t('reception.chairBusy')
                  : t('status.free')}
              </p>
            </div>
          </div>

          {/* Small Served Today Counter */}
          <div className="text-right bg-all1-navy/80 px-3 py-1.5 rounded-xl border border-all1-cobalt/20">
            <span className="text-[10px] text-all1-fog block uppercase tracking-wider font-semibold">
              Today
            </span>
            <span className="text-base font-mono font-bold text-all1-lime">
              {servedToday}
            </span>
          </div>
        </div>

        {/* Quick Barber Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {barbers.map((b) => (
            <Link
              key={b.id}
              to={`/barber/${b.name.toLowerCase()}`}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all tap-target flex items-center gap-1.5 ${
                b.id === barber?.id
                  ? 'bg-all1-cobalt text-white shadow-xs'
                  : 'bg-all1-deep/80 text-all1-fog hover:text-white border border-all1-cobalt/20'
              }`}
            >
              <span>{b.name}</span>
            </Link>
          ))}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-all1-rose/15 border border-all1-rose/30 rounded-btn text-xs text-all1-rose flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CURRENT CUSTOMER CARD */}
        <div className="bg-all1-deep rounded-card p-6 border border-all1-cobalt/30 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-all1-cobalt/20 pb-3">
            <span className="text-xs font-semibold text-all1-aqua uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {t('barber.currentCustomer')}
            </span>
            {currentCustomer && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  currentCustomer.status === 'called'
                    ? 'bg-all1-coral/20 text-all1-coral border border-all1-coral/30'
                    : 'bg-all1-aqua/20 text-all1-aqua border border-all1-aqua/30'
                }`}
              >
                {currentCustomer.status === 'called' ? 'Called' : 'In chair'}
              </span>
            )}
          </div>

          {currentCustomer ? (
            <div className="space-y-4">
              {/* Token & Customer Name */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl sm:text-4xl font-mono font-extrabold text-all1-aqua">
                    {currentCustomer.token_prefix}-{currentCustomer.token_number}
                  </span>
                  <h3 className="text-lg font-heading font-bold text-white mt-0.5">
                    {currentCustomer.customer_name}
                  </h3>
                </div>

                {/* Service Details */}
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-all1-sun block">
                    ₹{currentCustomer.total_price}
                  </span>
                  <span className="text-xs text-all1-fog">
                    {currentCustomer.total_minutes} min scheduled
                  </span>
                </div>
              </div>

              {/* Services List */}
              <div className="p-3 bg-all1-navy rounded-xl border border-all1-cobalt/20 text-xs">
                <span className="text-all1-fog block mb-1 font-medium">Services:</span>
                <p className="font-semibold text-white">
                  {currentCustomerServices
                    .map((s) => (lang === 'gu' ? s.name_gu : s.name_en))
                    .join(' + ') || `${currentCustomer.service_ids.length} service(s)`}
                </p>
              </div>

              {/* Service Timer (when In Chair) */}
              {currentCustomer.status === 'in_chair' && (
                <div className="p-4 bg-all1-navy rounded-xl border border-all1-aqua/30 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-all1-fog uppercase tracking-wider block">
                    {t('barber.timerLabel')}
                  </span>
                  <div className="text-3xl sm:text-4xl font-mono font-extrabold text-all1-aqua tracking-widest">
                    {formattedTimer}
                  </div>
                  <p className="text-[11px] text-all1-fog">
                    Scheduled: {currentCustomer.total_minutes} min
                  </p>
                </div>
              )}

              {/* Large 56px Tall Action Buttons */}
              {currentCustomer.status === 'called' ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleStart}
                  className="w-full h-14 bg-all1-cobalt text-white font-heading font-extrabold text-base rounded-btn hover:bg-opacity-90 transition tap-target shadow-lg shadow-all1-cobalt/30 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{actionLoading ? t('common.loading') : t('barber.startBtn')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleFinish}
                  className="w-full h-14 bg-all1-lime text-all1-navy font-heading font-extrabold text-base rounded-btn hover:bg-opacity-95 transition tap-target shadow-lg shadow-all1-lime/30 flex items-center justify-center gap-2"
                >
                  <CheckCheck className="w-6 h-6 stroke-[2.5]" />
                  <span>{actionLoading ? t('common.loading') : t('barber.finishBtn')}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-all1-fog space-y-2">
              <CheckCircle className="w-10 h-10 text-all1-lime mx-auto opacity-80" />
              <p className="text-sm font-medium text-white">{t('barber.noCurrent')}</p>
              <p className="text-xs text-all1-fog">
                Use the Reception Board or wait for the next customer to be called.
              </p>
            </div>
          )}
        </div>

        {/* UP NEXT FOR YOU */}
        <div className="bg-all1-deep rounded-card p-5 border border-all1-cobalt/20 space-y-2">
          <span className="text-xs font-semibold text-all1-fog uppercase tracking-wider block">
            {t('barber.upNext')}
          </span>

          {upNextCustomer ? (
            <div className="flex items-center justify-between p-3 bg-all1-navy rounded-xl border border-all1-cobalt/20">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono font-bold text-sm text-all1-aqua">
                  {upNextCustomer.token_prefix}-{upNextCustomer.token_number}
                </span>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-sm text-white truncate">
                    {upNextCustomer.customer_name}
                  </p>
                  <p className="text-[11px] text-all1-fog truncate">
                    {upNextServices
                      .map((s) => (lang === 'gu' ? s.name_gu : s.name_en))
                      .join(' + ') || `${upNextCustomer.service_ids.length} service(s)`}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-gray-300 shrink-0">
                {upNextCustomer.total_minutes} min
              </span>
            </div>
          ) : (
            <p className="text-xs text-all1-fog italic p-2">
              {t('barber.noneUpNext')}
            </p>
          )}
        </div>

        {/* BREAK SWITCH */}
        <div className="bg-all1-deep rounded-card p-5 border border-all1-cobalt/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isOnBreak
                  ? 'bg-all1-sun/20 text-all1-sun'
                  : 'bg-all1-navy text-all1-fog border border-all1-cobalt/20'
              }`}
            >
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-semibold text-sm text-white">
                {isOnBreak ? t('barber.workingSwitch') : t('barber.breakSwitch')}
              </p>
              <p className="text-[11px] text-all1-fog">
                {isOnBreak ? 'Currently taking a break' : 'Active and accepting customers'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={actionLoading}
            onClick={handleToggleBreak}
            className={`px-4 py-2 rounded-btn font-heading font-bold text-xs tap-target transition-all shadow-sm ${
              isOnBreak
                ? 'bg-all1-lime text-all1-navy shadow-all1-lime/30'
                : 'bg-all1-navy text-all1-sun border border-all1-sun/40 hover:bg-all1-sun hover:text-all1-navy'
            }`}
          >
            {isOnBreak ? t('barber.workingSwitch') : t('barber.breakSwitch')}
          </button>
        </div>
      </main>

      <Footer theme="dark" />
    </div>
  );
};
