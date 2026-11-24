import React from 'react';
import { Service } from '../../types';
import { useI18n } from '../../lib/i18n';
import { Scissors, Sparkles, Droplets, Hand, Check, Clock } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  scissors: Scissors,
  sparkles: Sparkles,
  droplets: Droplets,
  hand: Hand,
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  selected,
  onToggle,
  disabled = false,
}) => {
  const { lang, t } = useI18n();
  const IconComponent = iconMap[service.icon] || Scissors;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-card border transition-all tap-target flex items-center justify-between gap-3 select-none ${
        selected
          ? 'bg-all1-cobalt/5 border-all1-cobalt shadow-sm ring-1 ring-all1-cobalt'
          : disabled
          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
          : 'bg-white border-all1-cloud hover:border-all1-cobalt/40 shadow-sm'
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            selected
              ? 'bg-all1-cobalt text-white shadow-sm'
              : 'bg-all1-snow text-all1-cobalt border border-all1-cloud'
          }`}
        >
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="font-heading font-semibold text-sm sm:text-base text-all1-navy truncate">
            {lang === 'gu' ? service.name_gu : service.name_en}
          </h4>
          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {service.minutes} {t('landing.mins')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono font-bold text-all1-cobalt text-base sm:text-lg">
          ₹{service.price}
        </span>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
            selected
              ? 'bg-all1-cobalt border-all1-cobalt text-white'
              : 'border-gray-300 bg-white'
          }`}
        >
          {selected && <Check className="w-4 h-4 stroke-[3]" />}
        </div>
      </div>
    </button>
  );
};
