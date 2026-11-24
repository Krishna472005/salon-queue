import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useI18n } from '../../lib/i18n';
import { playChime, triggerVibration } from '../../lib/sound';
import { Scissors, Sparkles, Check } from 'lucide-react';

interface YouAreUpModalProps {
  barberName: string;
  onDismiss: () => void;
}

export const YouAreUpModal: React.FC<YouAreUpModalProps> = ({
  barberName,
  onDismiss,
}) => {
  const { t } = useI18n();

  useEffect(() => {
    // 1. Play chime sound
    playChime();

    // 2. Trigger haptic vibration
    triggerVibration([200, 100, 200, 100, 400]);

    // 3. Fire confetti blast
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6F59', '#2F6BFF', '#22D3EE', '#FFC857', '#A3E635'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-all1-navy/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="relative max-w-sm w-full bg-all1-deep rounded-card border-2 border-all1-coral p-8 text-center shadow-2xl text-white overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-all1-coral/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-all1-aqua/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-turn-gradient rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-all1-coral/40 animate-bounce">
            <Scissors className="w-10 h-10 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-all1-coral/20 text-all1-coral border border-all1-coral/30 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('status.called')}</span>
          </div>

          <h2 className="text-3xl font-heading font-extrabold text-white mb-2 tracking-tight">
            {t('myToken.youAreUpTitle')}
          </h2>

          <p className="text-base text-gray-200 font-body mb-8">
            {t('myToken.youAreUpMsg', { barber: barberName })}
          </p>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-4 bg-all1-coral text-white font-heading font-bold rounded-btn hover:bg-opacity-95 transition tap-target text-base shadow-lg shadow-all1-coral/40 flex items-center justify-center gap-2 group"
          >
            <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{t('myToken.gotItBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
