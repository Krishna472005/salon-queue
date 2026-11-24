import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { ServiceCard } from '../components/queue/ServiceCard';
import { BarberCard } from '../components/queue/BarberCard';
import { useI18n } from '../lib/i18n';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Scissors,
  Users,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

type Step = 1 | 2 | 3;

export const GetTokenPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();
  const {
    services,
    barbers,
    isOnlineTokensPaused,
    pauseReason,
    overallWaitMinutes,
    getBarberWaitMinutes,
    getBarberStatus,
    takeOnlineToken,
    findActiveTokenByPhone,
    isLive,
  } = useQueue();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form state
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    services[0]?.id || '',
  ]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null); // null = "Any available"

  // Feedback & error states
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active services
  const activeServices = useMemo(() => services.filter((s) => s.active), [services]);

  // Selected services details
  const selectedServices = useMemo(
    () => activeServices.filter((s) => selectedServiceIds.includes(s.id)),
    [activeServices, selectedServiceIds]
  );

  const totalMinutes = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.minutes, 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  );

  // Live wait estimate for current selection
  const estimatedWait = useMemo(() => {
    if (selectedBarberId) {
      return getBarberWaitMinutes(selectedBarberId);
    }
    return overallWaitMinutes;
  }, [selectedBarberId, getBarberWaitMinutes, overallWaitMinutes]);

  // Handle service selection toggle (max 4 rule)
  const toggleService = (serviceId: string) => {
    setErrorMsg('');
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
    } else {
      if (selectedServiceIds.length >= 4) {
        setErrorMsg(t('getToken.errMaxServices'));
        return;
      }
      setSelectedServiceIds((prev) => [...prev, serviceId]);
    }
  };

  // Google prefill handler
  const handleGooglePrefill = async () => {
    if (user?.user_metadata?.full_name) {
      setName(user.user_metadata.full_name);
      return;
    }
    try {
      await loginWithGoogle();
    } catch {
      // Offline fallback
      setName('Kunal Sharma');
    }
  };

  // Step 1 Validation & Next
  const handleStep1Next = async () => {
    setErrorMsg('');
    const cleanPhone = phone.replace(/\D/g, '');

    if (!name.trim()) {
      setErrorMsg(t('getToken.errInvalidName'));
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMsg(t('getToken.errInvalidPhone'));
      return;
    }

    // Check if phone already has an active token
    const existing = await findActiveTokenByPhone(cleanPhone);
    if (existing) {
      setInfoMsg(t('getToken.errActiveExists'));
      setTimeout(() => {
        navigate(`/t/${existing.id}`);
      }, 1200);
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 Validation & Next
  const handleStep2Next = () => {
    setErrorMsg('');
    if (selectedServiceIds.length === 0) {
      setErrorMsg(t('getToken.errMinServices'));
      return;
    }
    if (selectedServiceIds.length > 4) {
      setErrorMsg(t('getToken.errMaxServices'));
      return;
    }
    setCurrentStep(3);
  };

  // Final Token Confirmation
  const handleConfirmToken = async () => {
    if (isOnlineTokensPaused) {
      setErrorMsg(pauseReason || t('getToken.errOnlinePaused'));
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg(t('getToken.errInvalidPhone'));
      setCurrentStep(1);
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErrorMsg(t('getToken.errMinServices'));
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await takeOnlineToken(
        name,
        cleanPhone,
        selectedServiceIds,
        selectedBarberId
      );

      if (result.isExisting) {
        setInfoMsg(t('getToken.errActiveExists'));
        setTimeout(() => {
          navigate(`/t/${result.tokenId}`);
        }, 1200);
      } else {
        navigate(`/t/${result.tokenId}`);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to take token. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-all1-snow text-all1-ink pb-28">
      <Header theme="light" isLive={isLive} />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
        <h1 className="text-2xl font-heading font-extrabold text-all1-navy mb-4">
          {t('getToken.title')}
        </h1>

        {/* 3-Step Wizard Navigation Bar */}
        <div className="bg-white rounded-card p-3 border border-all1-cloud shadow-sm mb-6 flex items-center justify-between text-xs font-semibold">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors tap-target ${
              currentStep === 1
                ? 'bg-all1-cobalt text-white shadow-sm'
                : 'text-gray-500 hover:text-all1-navy'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. {t('getToken.step1')}</span>
          </button>

          <span className="text-gray-300">→</span>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => {
              if (name.trim() && phone.replace(/\D/g, '').length === 10) {
                setCurrentStep(2);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors tap-target ${
              currentStep === 2
                ? 'bg-all1-cobalt text-white shadow-sm'
                : 'text-gray-500 hover:text-all1-navy'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>2. {t('getToken.step2')}</span>
          </button>

          <span className="text-gray-300">→</span>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => {
              if (
                name.trim() &&
                phone.replace(/\D/g, '').length === 10 &&
                selectedServiceIds.length > 0
              ) {
                setCurrentStep(3);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors tap-target ${
              currentStep === 3
                ? 'bg-all1-cobalt text-white shadow-sm'
                : 'text-gray-500 hover:text-all1-navy'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. {t('getToken.step3')}</span>
          </button>
        </div>

        {/* Inline Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-all1-rose/30 rounded-btn text-xs text-all1-rose flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-btn text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMsg}</span>
          </div>
        )}

        {isOnlineTokensPaused && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-card text-xs text-amber-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-0.5">{t('status.onlinePaused')}</p>
              <p>{pauseReason || t('landing.onlineTokensClosed')}</p>
            </div>
          </div>
        )}

        {/* STEP 1: YOU (Name & Phone) */}
        {currentStep === 1 && (
          <div className="bg-white rounded-card p-6 border border-all1-cloud shadow-sm space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-heading font-bold text-all1-navy mb-1">
                {t('getToken.nameLabel')}
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                We will call your name when your chair is ready.
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={t('getToken.namePlaceholder')}
                className="w-full px-4 py-3 rounded-btn border border-all1-cloud focus:border-all1-cobalt focus:ring-1 focus:ring-all1-cobalt outline-none text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {t('getToken.phoneLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                  placeholder={t('getToken.phonePlaceholder')}
                  className="w-full pl-13 pr-4 py-3 rounded-btn border border-all1-cloud focus:border-all1-cobalt focus:ring-1 focus:ring-all1-cobalt outline-none font-mono text-sm"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Used to secure your spot. We never send spam.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGooglePrefill}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-all1-snow border border-all1-cloud text-gray-700 font-medium rounded-btn hover:bg-gray-100 transition tap-target text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-all1-cobalt" />
                <span>{t('getToken.googlePrefill')}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-all1-cloud">
              <button
                type="button"
                onClick={handleStep1Next}
                className="w-full py-3.5 bg-all1-cobalt text-white font-medium rounded-btn hover:bg-opacity-90 transition tap-target text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <span>
                  {t('getToken.nextBtn')}: {t('getToken.step2')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SERVICES (Max 4 Selection) */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold text-all1-navy">
                  {t('getToken.selectServices')}
                </h2>
                <p className="text-xs text-gray-500">
                  Select 1 to 4 services for today's visit.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-all1-cobalt/10 text-all1-cobalt border border-all1-cobalt/20">
                {selectedServiceIds.length} / 4
              </span>
            </div>

            <div className="space-y-3">
              {activeServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedServiceIds.includes(service.id)}
                  onToggle={() => toggleService(service.id)}
                />
              ))}
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3.5 bg-white border border-all1-cloud text-gray-700 font-medium rounded-btn hover:bg-gray-50 transition tap-target text-sm flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('getToken.backBtn')}</span>
              </button>
              <button
                type="button"
                disabled={selectedServiceIds.length === 0}
                onClick={handleStep2Next}
                className="flex-1 py-3.5 bg-all1-cobalt text-white font-medium rounded-btn hover:bg-opacity-90 transition tap-target text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>
                  {t('getToken.nextBtn')}: {t('getToken.step3')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: BARBER PREFERENCE */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-heading font-bold text-all1-navy">
                {t('getToken.selectBarber')}
              </h2>
              <p className="text-xs text-gray-500">
                Choose a preferred barber or take any free chair for the fastest turn.
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Any available barber */}
              <BarberCard
                isAny
                waitMinutes={overallWaitMinutes}
                selected={selectedBarberId === null}
                onSelect={() => setSelectedBarberId(null)}
              />

              {/* Option 2, 3, 4: Specific Barbers */}
              {barbers.map((barber) => (
                <BarberCard
                  key={barber.id}
                  barber={barber}
                  status={getBarberStatus(barber)}
                  waitMinutes={getBarberWaitMinutes(barber.id)}
                  selected={selectedBarberId === barber.id}
                  onSelect={() => setSelectedBarberId(barber.id)}
                />
              ))}
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-3.5 bg-white border border-all1-cloud text-gray-700 font-medium rounded-btn hover:bg-gray-50 transition tap-target text-sm flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('getToken.backBtn')}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting || isOnlineTokensPaused}
                onClick={handleConfirmToken}
                className="flex-1 py-3.5 bg-all1-coral text-white font-heading font-bold rounded-btn hover:bg-opacity-95 transition tap-target text-sm flex items-center justify-center gap-2 shadow-lg shadow-all1-coral/30 disabled:opacity-50"
              >
                <span>
                  {isSubmitting
                    ? t('getToken.submitting')
                    : t('getToken.confirmBtn')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Summary Footer (Updates dynamically on service ticks) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-all1-cloud p-3.5 shadow-lg z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-all1-navy truncate">
              {t('getToken.summaryServices', { count: selectedServiceIds.length })} ·{' '}
              {totalMinutes} {t('landing.mins')} ·{' '}
              <span className="font-mono font-bold text-all1-cobalt">₹{totalPrice}</span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              {t('getToken.waitApprox', { wait: `~${estimatedWait} ${t('landing.mins')}` })}
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting || (currentStep === 3 && isOnlineTokensPaused)}
            onClick={() => {
              if (currentStep === 1) handleStep1Next();
              else if (currentStep === 2) handleStep2Next();
              else handleConfirmToken();
            }}
            className="px-6 py-2.5 bg-all1-coral text-white font-heading font-bold rounded-btn hover:bg-opacity-95 transition tap-target text-sm shrink-0 shadow-md shadow-all1-coral/20 disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>
              {currentStep === 3 ? t('getToken.confirmBtn') : t('getToken.nextBtn')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Footer theme="light" />
    </div>
  );
};
