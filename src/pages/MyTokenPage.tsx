import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { TicketCard } from '../components/queue/TicketCard';
import { WaitRing } from '../components/queue/WaitRing';
import { YouAreUpModal } from '../components/queue/YouAreUpModal';
import { useI18n } from '../lib/i18n';
import { useQueue } from '../context/QueueContext';
import { QueueEntry } from '../types';
import {
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Coffee,
  CheckCircle,
  XCircle,
  HelpCircle,
  Navigation,
} from 'lucide-react';

export const MyTokenPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();

  const {
    queueEntries,
    barbers,
    services,
    getTokenById,
    extendRunningLate,
    releaseCustomerToken,
    getBarberWaitMinutes,
    overallWaitMinutes,
    isLive,
  } = useQueue();

  const [token, setToken] = useState<QueueEntry | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [showYouAreUp, setShowYouAreUp] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lateSuccessMsg, setLateSuccessMsg] = useState(false);

  // Save active token ID to localStorage for session persistence
  useEffect(() => {
    if (id) {
      localStorage.setItem('all1_active_token_id', id);
    }
  }, [id]);

  // Load and refresh token data
  const loadToken = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getTokenById(id);
      if (data) {
        setToken(data);
      }
    } catch (e) {
      console.warn('Error loading token:', e);
    } finally {
      setLoadingToken(false);
    }
  }, [id, getTokenById]);

  useEffect(() => {
    loadToken();
  }, [loadToken, queueEntries]);

  // Trigger "You're up!" takeover once when status transitions to 'called'
  useEffect(() => {
    if (token?.status === 'called') {
      const hasShownKey = `all1_shown_up_${token.id}`;
      const alreadyShown = sessionStorage.getItem(hasShownKey);
      if (!alreadyShown) {
        setShowYouAreUp(true);
        sessionStorage.setItem(hasShownKey, 'true');
      }
    }
  }, [token?.status, token?.id]);

  // Preferred or assigned barber
  const assignedOrPreferredBarber = useMemo(() => {
    if (!token) return null;
    const targetId = token.assigned_barber_id || token.preferred_barber_id;
    return barbers.find((b) => b.id === targetId) || null;
  }, [token, barbers]);

  // Selected services list
  const tokenServices = useMemo(() => {
    if (!token || !token.service_ids) return [];
    return services.filter((s) => token.service_ids.includes(s.id));
  }, [token, services]);

  // Position in line
  const { positionNumber, positionText } = useMemo(() => {
    if (!token || token.status !== 'waiting') {
      return { positionNumber: 0, positionText: '' };
    }

    const waitingAhead = queueEntries.filter((e) => {
      if (e.status !== 'waiting') return false;
      return new Date(e.joined_at) <= new Date(token.joined_at);
    });

    const pos = waitingAhead.length;
    if (pos <= 0) return { positionNumber: 1, positionText: '1st' };

    const suffix =
      pos % 10 === 1 && pos % 100 !== 11
        ? 'st'
        : pos % 10 === 2 && pos % 100 !== 12
        ? 'nd'
        : pos % 10 === 3 && pos % 100 !== 13
        ? 'rd'
        : 'th';

    return { positionNumber: pos, positionText: `${pos}${suffix}` };
  }, [token, queueEntries]);

  // Estimated wait minutes
  const waitMinutes = useMemo(() => {
    if (!token) return 0;
    if (token.status === 'called' || token.status === 'in_chair') return 0;
    if (token.preferred_barber_id) {
      return Math.max(5, getBarberWaitMinutes(token.preferred_barber_id));
    }
    return Math.max(5, overallWaitMinutes);
  }, [token, getBarberWaitMinutes, overallWaitMinutes]);

  // Expected turn time (now + estimated wait in Asia/Kolkata)
  const expectedTurnTime = useMemo(() => {
    const turnDate = new Date(Date.now() + waitMinutes * 60000);
    try {
      return turnDate.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return turnDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }, [waitMinutes]);

  // Handle "I'm running late" (+5 min once)
  const handleRunningLate = async () => {
    if (!token || token.late_extension_used || actionLoading) return;
    setActionLoading(true);
    try {
      await extendRunningLate(token.id);
      setLateSuccessMsg(true);
      await loadToken();
    } catch (e) {
      console.warn('Failed to extend late time:', e);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Release Token
  const handleConfirmRelease = async () => {
    if (!token || actionLoading) return;
    setActionLoading(true);
    try {
      await releaseCustomerToken(token.id);
      setIsReleaseModalOpen(false);
      await loadToken();
    } catch (e) {
      console.warn('Failed to release token:', e);
    } finally {
      setActionLoading(false);
    }
  };

  // Stepper state
  const currentStepIndex = useMemo(() => {
    if (!token) return 0;
    if (token.status === 'waiting') {
      return positionNumber === 2 ? 1 : 0; // 0 = Waiting, 1 = Head over
    }
    if (token.status === 'called') return 2;
    if (token.status === 'in_chair') return 3;
    if (token.status === 'done') return 4;
    return 0;
  }, [token, positionNumber]);

  const stepsList = [
    { key: 'waiting', label: t('myToken.stepWaiting') },
    { key: 'head_over', label: t('myToken.stepHeadOver') },
    { key: 'called', label: t('myToken.stepCalled') },
    { key: 'in_chair', label: t('myToken.stepInChair') },
    { key: 'done', label: t('myToken.stepDone') },
  ];

  if (loadingToken) {
    return (
      <div className="min-h-screen flex flex-col bg-all1-snow text-all1-ink">
        <Header theme="light" isLive={isLive} />
        <main className="flex-1 max-w-md mx-auto w-full p-6 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-all1-cobalt/20 border-t-all1-cobalt rounded-full animate-spin" />
        </main>
        <Footer theme="light" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-all1-snow text-all1-ink">
        <Header theme="light" isLive={isLive} />
        <main className="flex-1 max-w-md mx-auto w-full p-6 flex items-center justify-center">
          <div className="bg-white rounded-card p-8 border border-all1-cloud shadow-sm text-center">
            <div className="w-14 h-14 bg-all1-sun/20 text-all1-sun rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-heading font-bold text-all1-navy mb-2">
              {t('myToken.tokenNotFound')}
            </h2>
            <p className="text-xs text-gray-500 mb-6 font-body">
              {t('myToken.tokenNotFoundDesc')}
            </p>
            <Link
              to="/token"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-all1-coral text-white font-medium rounded-btn hover:bg-opacity-90 transition tap-target w-full text-sm"
            >
              <span>{t('landing.getTicketBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer theme="light" />
      </div>
    );
  }

  const barberOnBreak = Boolean(
    assignedOrPreferredBarber &&
      (!assignedOrPreferredBarber.working_today || assignedOrPreferredBarber.on_break)
  );

  return (
    <div className="min-h-screen flex flex-col bg-all1-snow text-all1-ink">
      <Header theme="light" isLive={isLive} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-6">
        {/* Full-screen "You're up!" takeover celebration */}
        {showYouAreUp && (
          <YouAreUpModal
            barberName={assignedOrPreferredBarber?.name || 'your assigned barber'}
            onDismiss={() => setShowYouAreUp(false)}
          />
        )}

        {/* Dynamic Context Banners */}
        {/* 1. When position is 2nd: "Head over now" */}
        {token.status === 'waiting' && positionNumber === 2 && (
          <div className="p-4 bg-turn-gradient text-white rounded-card shadow-md flex items-center gap-3 animate-pulse">
            <Navigation className="w-6 h-6 shrink-0" />
            <div className="min-w-0">
              <p className="font-heading font-bold text-sm">
                {t('myToken.headOverBanner')}
              </p>
              <p className="text-xs text-white/90">
                You are 2nd in line. Please head towards ALL1 salon now.
              </p>
            </div>
          </div>
        )}

        {/* 2. When Called: banner if takeover is dismissed */}
        {token.status === 'called' && !showYouAreUp && (
          <div className="p-4 bg-all1-coral text-white rounded-card shadow-lg flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-heading font-extrabold text-base">
                  {t('myToken.youAreUpTitle')}
                </p>
                <p className="text-xs text-white/90">
                  {t('myToken.youAreUpMsg', {
                    barber: assignedOrPreferredBarber?.name || 'the barber',
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowYouAreUp(true)}
              className="px-3 py-1.5 bg-white text-all1-coral rounded-lg font-bold text-xs shrink-0 tap-target"
            >
              View
            </button>
          </div>
        )}

        {/* 3. If chosen barber is on break */}
        {barberOnBreak && token.status === 'waiting' && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-card flex items-start gap-3">
            <Coffee className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs">
                {t('myToken.barberOnBreak', {
                  barber: assignedOrPreferredBarber?.name || 'Barber',
                })}
              </p>
            </div>
          </div>
        )}

        {/* 4. If No-show */}
        {token.status === 'no_show' && (
          <div className="p-5 bg-rose-50 border border-all1-rose/30 text-all1-rose rounded-card text-center space-y-3">
            <div className="w-12 h-12 bg-all1-rose/15 rounded-full flex items-center justify-center mx-auto text-all1-rose">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base">
                {t('myToken.turnPassed')}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Your turn has passed. You can take a new token to rejoin the line.
              </p>
            </div>
            <Link
              to="/token"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-all1-coral text-white font-medium rounded-btn hover:bg-opacity-95 transition tap-target text-xs w-full shadow-sm"
            >
              <span>{t('myToken.takeNewTokenBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 5. If Done */}
        {token.status === 'done' && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-card text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base">
                {t('myToken.doneMsg')}
              </h3>
            </div>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-all1-cobalt text-white font-medium rounded-btn hover:bg-opacity-95 transition tap-target text-xs"
            >
              <span>{t('nav.home')}</span>
            </Link>
          </div>
        )}

        {/* 6. If Cancelled */}
        {token.status === 'cancelled' && (
          <div className="p-5 bg-gray-50 border border-gray-200 text-gray-700 rounded-card text-center space-y-3">
            <p className="font-semibold text-sm">{t('myToken.cancelledBanner')}</p>
            <Link
              to="/token"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-all1-cobalt text-white font-medium rounded-btn hover:bg-opacity-95 transition tap-target text-xs shadow-sm"
            >
              <span>{t('myToken.takeNewTokenBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Main Ticket-Style Card */}
        <TicketCard
          entry={token}
          barber={assignedOrPreferredBarber}
          services={tokenServices}
        />

        {/* Live Wait & Progress Block (Visible while waiting or called) */}
        {['waiting', 'called', 'in_chair'].includes(token.status) && (
          <div className="bg-white rounded-card p-6 border border-all1-cloud shadow-sm space-y-6">
            {/* Wait Ring & Expected Turn Time */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              <WaitRing waitMinutes={waitMinutes} size={150} />

              <div className="text-center sm:text-left space-y-2">
                {token.status === 'waiting' && positionText && (
                  <div className="inline-block px-3 py-1 rounded-full bg-all1-cobalt/10 text-all1-cobalt text-xs font-bold font-heading">
                    {t('myToken.position', { pos: positionText })}
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-400 block font-medium">
                    Estimated Time of Service
                  </span>
                  <span className="text-lg font-heading font-extrabold text-all1-navy">
                    {t('myToken.expectedTime', { time: expectedTurnTime })}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-1">
                  <Clock className="w-3 h-3 text-all1-aqua" />
                  <span>Updates live automatically</span>
                </p>
              </div>
            </div>

            {/* Stepper / Progress line: Waiting -> Head over -> Called -> In chair -> Done */}
            <div className="pt-4 border-t border-all1-cloud">
              <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-all1-cobalt -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${(currentStepIndex / (stepsList.length - 1)) * 100}%`,
                  }}
                />

                {stepsList.map((step, idx) => {
                  const isPast = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={step.key}
                      className="relative z-10 flex flex-col items-center select-none"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-all1-coral text-white ring-4 ring-all1-coral/20 shadow-md scale-110'
                            : isPast
                            ? 'bg-all1-cobalt text-white'
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        }`}
                      >
                        {isPast ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                          isCurrent
                            ? 'text-all1-coral font-bold'
                            : isPast
                            ? 'text-all1-navy'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* "I'm running late" Button (Enabled once after called) */}
            {token.status === 'called' && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={token.late_extension_used || actionLoading}
                  onClick={handleRunningLate}
                  className={`w-full py-3 px-4 rounded-btn font-medium text-xs flex items-center justify-center gap-2 tap-target transition-all ${
                    token.late_extension_used || lateSuccessMsg
                      ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                      : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    {token.late_extension_used || lateSuccessMsg
                      ? t('myToken.runningLateUsed')
                      : t('myToken.runningLateBtn')}
                  </span>
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-1.5">
                  Adds 5 extra minutes before reception may mark no-show.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Release Token Button (Only while still waiting) */}
        {token.status === 'waiting' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsReleaseModalOpen(true)}
              className="text-xs text-gray-400 hover:text-all1-rose underline transition-colors tap-target"
            >
              {t('myToken.releaseBtn')}
            </button>
          </div>
        )}

        {/* Release Confirmation Dialog */}
        {isReleaseModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-white rounded-card max-w-sm w-full p-6 text-center shadow-xl border border-all1-cloud">
              <div className="w-12 h-12 bg-rose-100 text-all1-rose rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-heading font-bold text-all1-navy mb-2">
                {t('myToken.releaseConfirmTitle')}
              </h3>
              <p className="text-xs text-gray-600 mb-6 font-body">
                {t('myToken.releaseConfirmMsg')}
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmRelease}
                  className="w-full py-3 bg-all1-rose text-white font-medium rounded-btn hover:bg-opacity-90 transition tap-target text-sm disabled:opacity-50"
                >
                  {actionLoading ? t('common.loading') : t('myToken.releaseConfirmYes')}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setIsReleaseModalOpen(false)}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded-btn hover:bg-gray-200 transition tap-target text-sm"
                >
                  {t('myToken.releaseConfirmNo')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer theme="light" />
    </div>
  );
};
