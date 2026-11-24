import React from 'react';
import { QueueEntry, Barber, Service } from '../../types';
import { useI18n } from '../../lib/i18n';
import { Scissors, Clock, User, Sparkles } from 'lucide-react';

interface TicketCardProps {
  entry: QueueEntry;
  barber?: Barber | null;
  services?: Service[];
}

export const TicketCard: React.FC<TicketCardProps> = ({
  entry,
  barber,
  services = [],
}) => {
  const { t, lang } = useI18n();

  const formattedToken = `${entry.token_prefix}-${entry.token_number}`;

  const statusColors = {
    waiting: 'bg-all1-cobalt/10 text-all1-cobalt border-all1-cobalt/20',
    called: 'bg-all1-coral/15 text-all1-coral border-all1-coral/30 animate-pulse',
    in_chair: 'bg-all1-aqua/15 text-cyan-700 border-all1-aqua/30',
    done: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    no_show: 'bg-all1-rose/10 text-all1-rose border-all1-rose/20',
  };

  const statusLabels = {
    waiting: t('status.waiting'),
    called: t('status.called'),
    in_chair: t('status.inChair'),
    done: t('status.done'),
    cancelled: t('status.cancelled'),
    no_show: t('status.noShow'),
  };

  return (
    <div className="relative bg-white rounded-card border border-all1-cloud shadow-md overflow-hidden select-none">
      {/* Top section: Brand & Token code */}
      <div className="p-6 bg-linear-to-b from-all1-snow to-white flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-0.5">
            {t('myToken.tokenCard')}
          </span>
          <div className="text-4xl sm:text-5xl font-mono font-extrabold text-all1-navy tracking-tight">
            {formattedToken}
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              statusColors[entry.status]
            }`}
          >
            {entry.status === 'called' && <Sparkles className="w-3.5 h-3.5" />}
            <span>{statusLabels[entry.status]}</span>
          </span>
          <p className="text-[11px] text-gray-400 mt-2 font-mono">
            {entry.token_prefix === 'O' ? 'Online Token' : 'Walk-in'}
          </p>
        </div>
      </div>

      {/* Perforated ticket divider with circular cutout notches */}
      <div className="relative flex items-center py-2 bg-white">
        <div className="absolute -left-3 w-6 h-6 rounded-full bg-all1-snow border-r border-all1-cloud shadow-inner" />
        <div className="w-full border-b-2 border-dashed border-all1-cloud mx-6" />
        <div className="absolute -right-3 w-6 h-6 rounded-full bg-all1-snow border-l border-all1-cloud shadow-inner" />
      </div>

      {/* Bottom section: Customer, Services, and Barber info */}
      <div className="p-6 space-y-4 bg-white">
        {/* Customer Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-all1-cobalt/10 text-all1-cobalt flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-gray-400 block font-medium">Customer</span>
            <h3 className="font-heading font-bold text-base text-all1-navy truncate">
              {entry.customer_name}
            </h3>
          </div>
        </div>

        {/* Selected Services */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-all1-snow text-all1-cobalt flex items-center justify-center shrink-0 border border-all1-cloud mt-0.5">
            <Scissors className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-gray-400 block font-medium">
              {t('getToken.selectServices')}
            </span>
            <p className="text-xs font-semibold text-all1-navy mt-0.5">
              {services.length > 0
                ? services.map((s) => (lang === 'gu' ? s.name_gu : s.name_en)).join(', ')
                : `${entry.service_ids?.length || 1} service(s)`}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                {entry.total_minutes} {t('landing.mins')}
              </span>
              <span>•</span>
              <span className="font-mono font-bold text-all1-cobalt">
                ₹{entry.total_price}
              </span>
            </div>
          </div>
        </div>

        {/* Barber Assignment / Preference */}
        <div className="pt-2 border-t border-all1-cloud/80 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">{t('getToken.selectBarber')}:</span>
          <span className="font-heading font-semibold text-all1-navy bg-all1-snow px-2.5 py-1 rounded-md border border-all1-cloud">
            {barber ? barber.name : t('landing.anyBarber')}
          </span>
        </div>
      </div>
    </div>
  );
};
