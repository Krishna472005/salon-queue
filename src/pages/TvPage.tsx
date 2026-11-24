import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Logo } from '../components/common/Logo';
import { ConnectionBadge } from '../components/common/ConnectionBadge';
import { QrCard } from '../components/queue/QrCard';
import { useI18n } from '../lib/i18n';
import { useQueue } from '../context/QueueContext';
import { playChime } from '../lib/sound';
import { QueueEntry } from '../types';
import {
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle,
  Coffee,
} from 'lucide-react';

export const TvPage: React.FC = () => {
  const { t, lang } = useI18n();
  const {
    barbers,
    services,
    settings,
    queueEntries,
    isLive,
    overallWaitMinutes,
    lastCalledToken,
  } = useQueue();

  // Audio permission overlay state
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(true);

  // New call flash animation state (coral -> aqua)
  const [flashCall, setFlashCall] = useState<QueueEntry | null>(null);
  const prevCalledIdRef = useRef<string | null>(null);

  // Live IST Clock (Asia/Kolkata)
  const [clockTime, setClockTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        setClockTime(
          now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour12: true,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      } catch {
        setClockTime(new Date().toLocaleTimeString());
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect new call and trigger flash + chime
  useEffect(() => {
    if (lastCalledToken && lastCalledToken.id !== prevCalledIdRef.current) {
      prevCalledIdRef.current = lastCalledToken.id;
      setFlashCall(lastCalledToken);

      if (soundEnabled) {
        playChime();
      }

      const timer = setTimeout(() => {
        setFlashCall(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lastCalledToken, soundEnabled]);

  const enableAudio = () => {
    setSoundEnabled(true);
    setShowSoundPrompt(false);
    playChime(); // Warm up AudioContext on user gesture
  };

  // Up to 5 upcoming tokens waiting in line
  const nextInLine = useMemo(() => {
    return queueEntries
      .filter((e) => e.status === 'waiting')
      .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
      .slice(0, 5);
  }, [queueEntries]);

  // Current customer for a barber (called or in_chair)
  const getBarberCustomer = (barberId: string): QueueEntry | undefined => {
    return (
      queueEntries.find((e) => e.assigned_barber_id === barberId && e.status === 'in_chair') ||
      queueEntries.find((e) => e.assigned_barber_id === barberId && e.status === 'called')
    );
  };

  const isOnlineTokensOn = settings?.online_tokens_on !== false;

  return (
    <div
      onClick={() => {
        if (!soundEnabled) enableAudio();
      }}
      className={`min-h-screen flex flex-col bg-all1-navy text-white selection:bg-none relative overflow-hidden transition-colors duration-700 ${
        flashCall ? 'ring-8 ring-inset ring-all1-coral' : ''
      }`}
    >
      {/* Audio Enable Overlay for TV browsers */}
      {showSoundPrompt && (
        <div className="bg-all1-cobalt/95 text-white px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md z-50">
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>{t('tv.enableSound')}</span>
        </div>
      )}

      {/* New Call Flashing Hero Banner (Coral -> Aqua) */}
      {flashCall && (
        <div className="bg-linear-to-r from-all1-coral via-all1-sun to-all1-aqua text-all1-navy p-4 text-center shadow-2xl animate-pulse z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            <Sparkles className="w-8 h-8 text-white animate-spin" />
            <span className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
              {t('tv.calling')}: {flashCall.token_prefix}-{flashCall.token_number} — {flashCall.customer_name}!
            </span>
          </div>
        </div>
      )}

      {/* TV Header (Readable from 5m) */}
      <header className="p-6 border-b border-all1-deep flex items-center justify-between gap-6 bg-all1-navy/90 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Logo theme="dark" size="lg" />
          <div className="hidden sm:flex items-center gap-3">
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isOnlineTokensOn
                  ? 'bg-all1-lime/20 text-all1-lime border-all1-lime/30'
                  : 'bg-all1-sun/20 text-all1-sun border-all1-sun/30'
              }`}
            >
              ● {isOnlineTokensOn ? t('tv.onlineOpen') : t('tv.onlineClosed')}
            </span>
            <ConnectionBadge isLive={isLive} theme="dark" />
          </div>
        </div>

        {/* Large Clock Display */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-wider">
              {clockTime}
            </span>
            <span className="text-xs text-all1-fog block uppercase tracking-widest font-semibold">
              IST • Zero Guessing
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled((prev) => !prev);
            }}
            className="p-3 bg-all1-deep rounded-2xl border border-all1-cobalt/30 text-all1-fog hover:text-white tap-target"
            title={soundEnabled ? 'Sound enabled' : 'Sound disabled'}
          >
            {soundEnabled ? <Volume2 className="w-6 h-6 text-all1-aqua" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 3 Barber Chairs (Big Rows) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-all1-aqua flex items-center gap-2">
              <Radio className="w-6 h-6 text-all1-aqua animate-pulse" />
              <span>{t('tv.nowServing')}</span>
            </h2>
            <span className="text-xs text-all1-fog font-medium">3 Barber Stations</span>
          </div>

          <div className="space-y-4">
            {barbers.map((b) => {
              const current = getBarberCustomer(b.id);
              const isServing = Boolean(current);
              const isCalled = current?.status === 'called';
              const isOnBreak = !b.working_today || b.on_break;

              return (
                <div
                  key={b.id}
                  className={`bg-all1-deep rounded-card p-6 border-2 transition-all flex items-center justify-between gap-6 shadow-xl ${
                    isCalled
                      ? 'border-all1-coral bg-all1-coral/10 animate-pulse'
                      : isServing
                      ? 'border-all1-aqua/60 shadow-all1-aqua/10'
                      : isOnBreak
                      ? 'border-gray-800 opacity-60'
                      : 'border-all1-cobalt/30'
                  }`}
                >
                  {/* Barber Avatar & Name */}
                  <div className="flex items-center gap-5 min-w-0">
                    <div
                      className={`relative w-20 h-20 rounded-2xl bg-hero-gradient text-white font-heading font-extrabold text-3xl flex items-center justify-center shrink-0 shadow-lg ${
                        isServing ? 'ring-4 ring-all1-aqua/70' : ''
                      }`}
                    >
                      {b.name.charAt(0)}
                      {isServing && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-all1-aqua ring-4 ring-all1-deep" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-black text-2xl sm:text-3xl text-white truncate">
                        {b.name}
                      </h3>
                      <p className="text-sm text-all1-fog mt-0.5 font-medium">
                        {isOnBreak ? t('tv.onBreak') : isServing ? 'Station Active' : t('tv.chairFree')}
                      </p>
                    </div>
                  </div>

                  {/* Serving Status / Big Token */}
                  <div className="text-right shrink-0">
                    {isOnBreak ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-all1-sun/20 text-all1-sun font-heading font-bold text-base border border-all1-sun/30">
                        <Coffee className="w-5 h-5" />
                        <span>{t('tv.onBreak')}</span>
                      </span>
                    ) : current ? (
                      <div>
                        <span className="text-xs uppercase tracking-widest font-bold text-all1-fog block mb-0.5">
                          {current.status === 'called' ? t('tv.calling') : t('tv.nowServing')}
                        </span>
                        <div className="text-4xl sm:text-5xl font-mono font-black text-white flex items-center justify-end gap-2">
                          <span className={current.status === 'called' ? 'text-all1-coral' : 'text-all1-aqua'}>
                            {current.token_prefix}-{current.token_number}
                          </span>
                        </div>
                        <span className="text-base font-heading font-semibold text-gray-200 block truncate max-w-[200px]">
                          {current.customer_name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-all1-lime/15 text-all1-lime font-heading font-bold text-base border border-all1-lime/30">
                        <CheckCircle className="w-5 h-5" />
                        <span>{t('tv.chairFree')}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Next In Line (5 Tokens with Very Large Type >= 96px) & QR Card */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="bg-all1-deep rounded-card p-6 border border-all1-cobalt/30 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-all1-cobalt/20 pb-3">
              <h2 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-all1-cobalt" />
                <span>{t('tv.nextInLine')}</span>
              </h2>
              <span className="text-xs text-all1-aqua font-mono font-bold">
                Wait ≈ {overallWaitMinutes} min
              </span>
            </div>

            {nextInLine.length === 0 ? (
              <div className="py-12 text-center text-all1-fog space-y-2">
                <CheckCircle className="w-12 h-12 text-all1-lime mx-auto opacity-75" />
                <p className="font-heading font-bold text-lg text-white">
                  {t('reception.emptyState')}
                </p>
                <p className="text-xs text-all1-fog">
                  Scan the QR code to reserve your chair immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {nextInLine.map((entry, idx) => {
                  const estWait = Math.max(5, (idx + 1) * 15);
                  return (
                    <div
                      key={entry.id}
                      className="p-4 bg-all1-navy rounded-2xl border border-all1-cobalt/20 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-mono font-bold text-all1-fog">
                          #{idx + 1}
                        </span>
                        {/* Token Code (Extra Large Display) */}
                        <span className="text-3xl sm:text-4xl font-mono font-black text-all1-aqua tracking-tight">
                          {entry.token_prefix}-{entry.token_number}
                        </span>
                        <div className="min-w-0">
                          <p className="font-heading font-bold text-base sm:text-lg text-white truncate">
                            {entry.customer_name}
                          </p>
                          <p className="text-xs text-all1-fog truncate">
                            {entry.total_minutes} min service
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-all1-fog block">Estimated</span>
                        <span className="text-base font-mono font-bold text-all1-sun">
                          ~{estWait} min
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QR Code Banner for Phone Booking */}
          <div className="bg-all1-deep rounded-card p-5 border border-all1-cobalt/30 flex items-center justify-between gap-5 shadow-lg">
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-lg text-white">
                Take a Token from Your Phone
              </h3>
              <p className="text-xs text-all1-fog max-w-xs font-body">
                {t('tv.scanPrompt')}. No app download required.
              </p>
              <span className="inline-block text-[11px] font-mono text-all1-aqua mt-1">
                all1.salon/token
              </span>
            </div>
            <div className="shrink-0">
              <QrCard theme="dark" size={110} />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Menu Ticker */}
      <footer className="bg-all1-deep border-t border-all1-cobalt/20 py-3.5 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 text-xs sm:text-sm text-all1-fog font-medium">
          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap py-0.5">
            <span className="font-heading font-bold text-all1-coral uppercase tracking-wider text-xs">
              Menu:
            </span>
            {services
              .filter((s) => s.active)
              .map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1.5">
                  <span className="text-white font-semibold">
                    {lang === 'gu' ? s.name_gu : s.name_en}
                  </span>
                  <span className="font-mono text-all1-aqua">₹{s.price}</span>
                  <span className="text-gray-500">({s.minutes}m)</span>
                  <span className="text-gray-600 ml-3">•</span>
                </span>
              ))}
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-all1-fog shrink-0">
            <span>Powered by ALL1 Queue System</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
