import React from 'react';
import { Barber } from '../../types';
import { useI18n } from '../../lib/i18n';
import { Users, Clock, Check } from 'lucide-react';

interface BarberCardProps {
  barber?: Barber | null;
  waitMinutes: number;
  status?: 'Working' | 'Free' | 'On break';
  selected?: boolean;
  onSelect?: () => void;
  isAny?: boolean;
}

export const BarberCard: React.FC<BarberCardProps> = ({
  barber,
  waitMinutes,
  status = 'Free',
  selected = false,
  onSelect,
  isAny = false,
}) => {
  const { t } = useI18n();

  const statusColors = {
    Working: 'bg-all1-aqua text-all1-aqua',
    Free: 'bg-all1-lime text-all1-lime',
    'On break': 'bg-all1-sun text-all1-sun',
  };

  const statusLabels = {
    Working: t('status.working'),
    Free: t('status.free'),
    'On break': t('status.onBreak'),
  };

  if (isAny) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left p-4 rounded-card border transition-all tap-target flex items-center justify-between gap-3 select-none ${
          selected
            ? 'bg-all1-cobalt/5 border-all1-cobalt shadow-sm ring-1 ring-all1-cobalt'
            : 'bg-white border-all1-cloud hover:border-all1-cobalt/40 shadow-sm'
        }`}
        aria-pressed={selected}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-hero-gradient text-white flex items-center justify-center shrink-0 shadow-sm">
            <Users className="w-6 h-6 text-all1-aqua" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-semibold text-sm sm:text-base text-all1-navy truncate">
                {t('getToken.anyAvailable')}
              </h4>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-all1-lime/20 text-emerald-700 border border-all1-lime/30">
                {t('getToken.fastestOption')}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {t('getToken.currentWait')}: ~{waitMinutes} {t('landing.mins')}
            </p>
          </div>
        </div>

        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
            selected
              ? 'bg-all1-cobalt border-all1-cobalt text-white'
              : 'border-gray-300 bg-white'
          }`}
        >
          {selected && <Check className="w-4 h-4 stroke-[3]" />}
        </div>
      </button>
    );
  }

  const name = barber?.name || 'Barber';
  const initial = name.charAt(0);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={Boolean(barber && (!barber.working_today || barber.on_break))}
      className={`w-full text-left p-4 rounded-card border transition-all tap-target flex items-center justify-between gap-3 select-none ${
        selected
          ? 'bg-all1-cobalt/5 border-all1-cobalt shadow-sm ring-1 ring-all1-cobalt'
          : barber && (!barber.working_today || barber.on_break)
          ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
          : 'bg-white border-all1-cloud hover:border-all1-cobalt/40 shadow-sm'
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-hero-gradient text-white font-heading font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-semibold text-sm sm:text-base text-all1-navy truncate">
              {name}
            </h4>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${statusColors[status].split(' ')[0]}`}
              />
              <span className="text-[11px] font-medium text-gray-500">
                {statusLabels[status]}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {waitMinutes === 0
              ? t('status.free')
              : `${t('getToken.currentWait')}: ~${waitMinutes} ${t('landing.mins')}`}
          </p>
        </div>
      </div>

      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
          selected
            ? 'bg-all1-cobalt border-all1-cobalt text-white'
            : 'border-gray-300 bg-white'
        }`}
      >
        {selected && <Check className="w-4 h-4 stroke-[3]" />}
      </div>
    </button>
  );
};
