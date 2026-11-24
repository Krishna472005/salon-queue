import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/common/Header';
import { WalkinModal } from '../components/queue/WalkinModal';
import { useCountdown } from '../hooks/useCountdown';
import { useI18n } from '../lib/i18n';
import { useQueue } from '../context/QueueContext';
import { QueueEntry } from '../types';
import {
  Scissors,
  UserPlus,
  Clock,
  AlertTriangle,
  Trash2,
  UserX,
  CheckCircle,
  Radio,
} from 'lucide-react';

// Subcomponent: Live Called Row Countdown Item
const CalledCountdownTimer: React.FC<{ calledAt?: string | null; extended?: boolean }> = ({
  calledAt,
  extended,
}) => {
  const duration = extended ? 13 : 8;
  const { formatted, isExpired } = useCountdown(calledAt, duration);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all ${
        isExpired
          ? 'bg-all1-rose text-white animate-pulse'
          : extended
          ? 'bg-amber-500/20 text-all1-sun border border-amber-500/30'
          : 'bg-all1-coral/20 text-all1-coral border border-all1-coral/30'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{isExpired ? '00:00 (Time passed)' : `${formatted}${extended ? ' (+5m)' : ''}`}</span>
    </div>
  );
};

export const ReceptionPage: React.FC = () => {
  const { t } = useI18n();
  const {
    barbers,
    services,
    settings,
    queueEntries,
    callNextCustomer,
    addWalkinCustomer,
    markNoShowCustomer,
    releaseCustomerToken,
    toggleOnlineTokens,
    isLive,
  } = useQueue();

  const [isWalkinOpen, setIsWalkinOpen] = useState(false);
  const [activeRemoveId, setActiveRemoveId] = useState<string | null>(null);
  const [activeNoShowId, setActiveNoShowId] = useState<string | null>(null);
  const [callingBarberId, setCallingBarberId] = useState<string | null>(null);
  const [callFeedback, setCallFeedback] = useState<{ barberId: string; message: string } | null>(null);

  // Live Clock (Asia/Kolkata)
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        setCurrentTime(
          now.toLocaleTimeString('en-GB', {
            timeZone: 'Asia/Kolkata',
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      } catch {
        setCurrentTime(new Date().toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter queue entries: waiting and called list
  const activeQueue = useMemo(() => {
    return queueEntries
      .filter((e) => e.status === 'waiting' || e.status === 'called')
      .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
  }, [queueEntries]);

  // Current customer for each barber
  const getBarberCustomer = (barberId: string): QueueEntry | undefined => {
    // Check in_chair first, then called
    return (
      queueEntries.find((e) => e.assigned_barber_id === barberId && e.status === 'in_chair') ||
      queueEntries.find((e) => e.assigned_barber_id === barberId && e.status === 'called')
    );
  };

  // Handle Call Next (strictly uses call_next function)
  const handleCallNext = async (barberId: string) => {
    setCallingBarberId(barberId);
    setCallFeedback(null);
    try {
      const called = await callNextCustomer(barberId);
      if (!called) {
        setCallFeedback({
          barberId,
          message: t('reception.noNextEligible'),
        });
        setTimeout(() => setCallFeedback(null), 3500);
      }
    } catch (err: unknown) {
      setCallFeedback({
        barberId,
        message: (err as Error)?.message || 'Failed to call customer',
      });
      setTimeout(() => setCallFeedback(null), 3500);
    } finally {
      setCallingBarberId(null);
    }
  };

  // Handle Mark No-Show
  const handleMarkNoShow = async (tokenId: string) => {
    try {
      await markNoShowCustomer(tokenId);
      setActiveNoShowId(null);
    } catch (e) {
      console.warn('Error marking no show:', e);
    }
  };

  // Handle Remove customer
  const handleRemove = async (tokenId: string) => {
    try {
      await releaseCustomerToken(tokenId);
      setActiveRemoveId(null);
    } catch (e) {
      console.warn('Error removing customer:', e);
    }
  };

  // Calculate wait duration in minutes
  const calculateWaitMinutes = (joinedAt: string): number => {
    const elapsed = Math.floor((Date.now() - new Date(joinedAt).getTime()) / 60000);
    return Math.max(0, elapsed);
  };

  const isOnlineTokensOn = settings?.online_tokens_on !== false;

  return (
    <div className="min-h-screen flex flex-col bg-all1-navy text-white">
      <Header theme="dark" isLive={isLive} />

      {/* Top Bar for 10" Tablet Landscape */}
      <section className="bg-all1-deep border-b border-all1-cobalt/20 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-all1-coral" />
              <span>{t('reception.title')}</span>
            </h1>

            {/* Live Clock */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-all1-navy border border-all1-cobalt/30 text-xs font-mono font-semibold text-all1-fog">
              <Clock className="w-3.5 h-3.5 text-all1-aqua" />
              <span>{currentTime} (IST)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Online Tokens Toggle Pill */}
            <div className="flex items-center gap-2 bg-all1-navy px-3 py-1.5 rounded-full border border-all1-cobalt/30 text-xs">
              <span className="text-all1-fog font-medium">{t('reception.onlineTokensToggle')}:</span>
              <button
                type="button"
                onClick={() => toggleOnlineTokens(!isOnlineTokensOn)}
                className={`px-2.5 py-0.5 rounded-full font-bold transition-all tap-target ${
                  isOnlineTokensOn
                    ? 'bg-all1-lime text-all1-navy shadow-xs'
                    : 'bg-all1-sun text-all1-navy'
                }`}
              >
                {isOnlineTokensOn ? 'ON' : 'PAUSED'}
              </button>
            </div>

            {/* + Walk-in Button */}
            <button
              type="button"
              onClick={() => setIsWalkinOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-all1-coral text-white font-heading font-bold rounded-btn hover:bg-opacity-95 transition tap-target text-sm shadow-md shadow-all1-coral/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('reception.walkinBtn')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Tablet Landscape 2-Column Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 3 Barber Cards (5 of 12 cols on desktop/tablet) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-heading font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-all1-aqua" />
              <span>{t('reception.barbersSection')}</span>
            </h2>
            <span className="text-xs text-all1-fog font-medium">3 chairs active</span>
          </div>

          <div className="space-y-4">
            {barbers.map((barber) => {
              const currentCustomer = getBarberCustomer(barber.id);
              const isBusy = Boolean(currentCustomer);
              const isOnBreak = !barber.working_today || barber.on_break;
              const isCalling = callingBarberId === barber.id;
              const feedback = callFeedback?.barberId === barber.id ? callFeedback.message : null;

              // Calculate time left in chair
              let percentComplete = 0;
              let elapsedMinutes = 0;
              if (currentCustomer?.status === 'in_chair' && currentCustomer.started_at) {
                elapsedMinutes = Math.floor(
                  (Date.now() - new Date(currentCustomer.started_at).getTime()) / 60000
                );
                percentComplete = Math.min(
                  100,
                  Math.round((elapsedMinutes / currentCustomer.total_minutes) * 100)
                );
              }

              return (
                <div
                  key={barber.id}
                  className={`bg-all1-deep rounded-card border transition-all p-5 shadow-sm ${
                    isOnBreak
                      ? 'border-gray-700 opacity-75'
                      : isBusy
                      ? 'border-all1-aqua/40'
                      : 'border-all1-cobalt/30 hover:border-all1-cobalt'
                  }`}
                >
                  {/* Barber Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-hero-gradient text-white font-heading font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                        {barber.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-base text-white">
                          {barber.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOnBreak
                                ? 'bg-all1-sun'
                                : isBusy
                                ? 'bg-all1-aqua'
                                : 'bg-all1-lime'
                            }`}
                          />
                          <span className="text-[11px] text-all1-fog">
                            {isOnBreak
                              ? t('status.onBreak')
                              : isBusy
                              ? `${currentCustomer?.status === 'called' ? t('status.called') : t('status.inChair')}`
                              : t('status.free')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Call Next Button */}
                    <button
                      type="button"
                      disabled={isBusy || isOnBreak || isCalling}
                      onClick={() => handleCallNext(barber.id)}
                      className={`px-4 py-2 rounded-btn font-heading font-bold text-xs tap-target transition-all shadow-sm flex items-center gap-1.5 ${
                        isBusy || isOnBreak
                          ? 'bg-all1-navy text-gray-500 border border-gray-700 cursor-not-allowed'
                          : 'bg-all1-cobalt text-white hover:bg-opacity-90 shadow-all1-cobalt/30'
                      }`}
                    >
                      <span>{isCalling ? t('common.loading') : t('reception.callNextBtn')}</span>
                    </button>
                  </div>

                  {/* Feedback error message if no customer was eligible */}
                  {feedback && (
                    <div className="mb-3 p-2 bg-all1-sun/15 border border-all1-sun/30 rounded-lg text-xs text-all1-sun flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{feedback}</span>
                    </div>
                  )}

                  {/* Current Customer Card / Chair Details */}
                  {currentCustomer ? (
                    <div className="p-3 bg-all1-navy rounded-xl border border-all1-cobalt/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-all1-aqua">
                            {currentCustomer.token_prefix}-{currentCustomer.token_number}
                          </span>
                          <span className="font-heading font-semibold text-sm text-white truncate max-w-[140px]">
                            {currentCustomer.customer_name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            currentCustomer.status === 'called'
                              ? 'bg-all1-coral/20 text-all1-coral border border-all1-coral/30'
                              : 'bg-all1-aqua/20 text-all1-aqua border border-all1-aqua/30'
                          }`}
                        >
                          {currentCustomer.status}
                        </span>
                      </div>

                      {/* If In Chair: progress bar of service completion */}
                      {currentCustomer.status === 'in_chair' && (
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-all1-fog mb-1">
                            <span>Service: {currentCustomer.total_minutes} min</span>
                            <span>{elapsedMinutes} min elapsed ({percentComplete}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-all1-aqua transition-all duration-500"
                              style={{ width: `${percentComplete}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* If Called: live countdown */}
                      {currentCustomer.status === 'called' && (
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-all1-fog">Arrival window:</span>
                          <CalledCountdownTimer
                            calledAt={currentCustomer.called_at}
                            extended={currentCustomer.late_extension_used}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-all1-navy/60 rounded-xl border border-dashed border-all1-cobalt/20 text-center text-xs text-all1-fog flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-all1-lime" />
                      <span>{isOnBreak ? t('status.onBreak') : t('reception.chairFree')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Waiting Queue List (7 of 12 cols on desktop/tablet) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-heading font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-all1-cobalt" />
              <span>{t('reception.waitingList')}</span>
            </h2>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-all1-deep border border-all1-cobalt/30 text-all1-aqua">
              {activeQueue.length} in queue
            </span>
          </div>

          {/* Queue Rows */}
          <div className="bg-all1-deep rounded-card border border-all1-cobalt/20 overflow-hidden flex-1 flex flex-col">
            {activeQueue.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-all1-fog">
                <div className="w-16 h-16 rounded-full bg-all1-navy flex items-center justify-center mb-3 text-all1-lime">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-lg text-white mb-1">
                  {t('reception.emptyState')}
                </h3>
                <p className="text-xs text-all1-fog max-w-xs">
                  Chairs are ready for walk-ins or online customers.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-all1-cobalt/15 overflow-y-auto max-h-[70vh]">
                {activeQueue.map((entry) => {
                  const waitMins = calculateWaitMinutes(entry.joined_at);
                  const isOver75 = waitMins >= 75;
                  const isCalled = entry.status === 'called';
                  const preferredBarber = barbers.find((b) => b.id === entry.preferred_barber_id);
                  const assignedBarber = barbers.find((b) => b.id === entry.assigned_barber_id);

                  return (
                    <div
                      key={entry.id}
                      className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCalled
                          ? 'bg-all1-coral/10 border-l-4 border-l-all1-coral'
                          : isOver75
                          ? 'bg-amber-500/10 border-l-4 border-l-all1-sun'
                          : 'hover:bg-all1-navy/50'
                      }`}
                    >
                      {/* Left: Token, Name, Services, Preferred Barber */}
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Token Badge */}
                        <div
                          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-mono font-extrabold ${
                            isCalled
                              ? 'bg-all1-coral text-white shadow-xs'
                              : isOver75
                              ? 'bg-all1-sun text-all1-navy'
                              : 'bg-all1-navy border border-all1-cobalt/40 text-all1-aqua'
                          }`}
                        >
                          <span className="text-[10px] leading-none opacity-80">
                            {entry.token_prefix}
                          </span>
                          <span className="text-base leading-none">
                            {entry.token_number}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading font-bold text-sm text-white truncate">
                              {entry.customer_name}
                            </h4>
                            {isCalled && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-all1-coral text-white">
                                {t('status.called')}
                              </span>
                            )}
                            {isOver75 && !isCalled && (
                              <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-all1-sun text-all1-navy">
                                &gt;75 min
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-all1-fog mt-0.5">
                            {entry.total_minutes} min · ₹{entry.total_price} •{' '}
                            <span className="text-gray-300">
                              Pref:{' '}
                              {preferredBarber
                                ? preferredBarber.name
                                : assignedBarber
                                ? assignedBarber.name
                                : 'Any'}
                            </span>
                          </p>

                          {/* Time waiting / Countdown */}
                          <div className="flex items-center gap-3 text-xs mt-1.5">
                            {isCalled ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-all1-fog text-[11px]">Arrival countdown:</span>
                                <CalledCountdownTimer
                                  calledAt={entry.called_at}
                                  extended={entry.late_extension_used}
                                />
                              </div>
                            ) : (
                              <span
                                className={`text-[11px] font-medium flex items-center gap-1 ${
                                  isOver75 ? 'text-all1-sun font-bold' : 'text-all1-fog'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {t('reception.timeWaiting', { time: waitMins })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions [No-show] and [Remove] */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-all1-cobalt/15">
                        {isCalled && (
                          <button
                            type="button"
                            onClick={() => setActiveNoShowId(entry.id)}
                            className="px-3 py-1.5 bg-all1-rose/20 text-all1-rose border border-all1-rose/40 hover:bg-all1-rose hover:text-white rounded-btn text-xs font-semibold transition-colors tap-target"
                          >
                            {t('reception.noShowBtn')}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveRemoveId(entry.id)}
                          className="px-3 py-1.5 bg-all1-navy border border-all1-cobalt/30 hover:border-all1-rose/50 hover:text-all1-rose text-all1-fog rounded-btn text-xs font-semibold transition-colors tap-target flex items-center gap-1"
                          title="Remove customer from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t('reception.removeBtn')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Walk-in Modal */}
      {isWalkinOpen && (
        <WalkinModal
          services={services}
          barbers={barbers}
          onClose={() => setIsWalkinOpen(false)}
          onSubmit={async (name, phone, serviceIds, preferredBarberId) => {
            await addWalkinCustomer(name, phone, serviceIds, preferredBarberId);
          }}
        />
      )}

      {/* Confirmation Modal for No-Show */}
      {activeNoShowId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-all1-deep rounded-card max-w-sm w-full p-6 text-center border border-all1-rose/40 shadow-2xl">
            <div className="w-12 h-12 bg-all1-rose/20 text-all1-rose rounded-full flex items-center justify-center mx-auto mb-3">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-white mb-2">
              {t('reception.noShowConfirm')}
            </h3>
            <p className="text-xs text-all1-fog mb-6">
              The called customer has not arrived within the time limit. Mark as No-show?
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleMarkNoShow(activeNoShowId)}
                className="w-full py-2.5 bg-all1-rose text-white font-medium rounded-btn hover:bg-opacity-90 tap-target text-xs shadow-sm"
              >
                Confirm No-Show
              </button>
              <button
                type="button"
                onClick={() => setActiveNoShowId(null)}
                className="w-full py-2 bg-all1-navy text-all1-fog hover:text-white rounded-btn tap-target text-xs border border-all1-cobalt/20"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Remove */}
      {activeRemoveId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-all1-deep rounded-card max-w-sm w-full p-6 text-center border border-all1-cobalt/30 shadow-2xl">
            <div className="w-12 h-12 bg-all1-cobalt/20 text-all1-aqua rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-white mb-2">
              {t('reception.removeConfirm')}
            </h3>
            <p className="text-xs text-all1-fog mb-6">
              This will cancel the customer's token and remove them from the queue.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleRemove(activeRemoveId)}
                className="w-full py-2.5 bg-all1-rose text-white font-medium rounded-btn hover:bg-opacity-90 tap-target text-xs shadow-sm"
              >
                {t('reception.removeBtn')}
              </button>
              <button
                type="button"
                onClick={() => setActiveRemoveId(null)}
                className="w-full py-2 bg-all1-navy text-all1-fog hover:text-white rounded-btn tap-target text-xs border border-all1-cobalt/20"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
