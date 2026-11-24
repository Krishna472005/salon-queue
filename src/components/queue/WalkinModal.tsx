import React, { useState, useMemo } from 'react';
import { useI18n } from '../../lib/i18n';
import { Service, Barber } from '../../types';
import { X, UserPlus, AlertCircle, Check } from 'lucide-react';

interface WalkinModalProps {
  services: Service[];
  barbers: Barber[];
  onClose: () => void;
  onSubmit: (
    name: string,
    phone: string,
    serviceIds: string[],
    preferredBarberId: string | null
  ) => Promise<void>;
}

export const WalkinModal: React.FC<WalkinModalProps> = ({
  services,
  barbers,
  onClose,
  onSubmit,
}) => {
  const { t, lang } = useI18n();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    services[0]?.id || '',
  ]);
  const [preferredBarberId, setPreferredBarberId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeServices = useMemo(() => services.filter((s) => s.active), [services]);

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

  const toggleService = (id: string) => {
    setErrorMsg('');
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds((prev) => prev.filter((sId) => sId !== id));
    } else {
      if (selectedServiceIds.length >= 4) {
        setErrorMsg(t('getToken.errMaxServices'));
        return;
      }
      setSelectedServiceIds((prev) => [...prev, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!name.trim()) {
      setErrorMsg(t('getToken.errInvalidName'));
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMsg(t('getToken.errInvalidPhone'));
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErrorMsg(t('getToken.errMinServices'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSubmit(name.trim(), cleanPhone, selectedServiceIds, preferredBarberId);
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to register walk-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative max-w-lg w-full bg-all1-deep rounded-card border border-all1-cobalt/30 text-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-all1-cobalt/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-all1-coral/20 text-all1-coral flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-white">
                {t('reception.walkinTitle')}
              </h2>
              <p className="text-xs text-all1-fog">
                Creates a W-token for in-person customer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-all1-fog hover:text-white hover:bg-all1-navy tap-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-all1-rose/15 border border-all1-rose/30 rounded-btn text-xs text-all1-rose flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-all1-fog mb-1">
                {t('getToken.nameLabel')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Customer Name"
                className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn px-3 py-2.5 text-sm text-white outline-none focus:border-all1-aqua"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-all1-fog mb-1">
                {t('getToken.phoneLabel')} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-all1-fog font-mono text-xs">
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
                  placeholder="9876543210"
                  className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn pl-11 pr-3 py-2.5 text-sm font-mono text-white outline-none focus:border-all1-aqua"
                />
              </div>
            </div>
          </div>

          {/* Services selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-all1-fog">
                {t('getToken.selectServices')} (max 4)
              </label>
              <span className="text-[11px] font-mono text-all1-aqua font-semibold">
                {selectedServiceIds.length}/4 selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeServices.map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors tap-target ${
                      isSelected
                        ? 'bg-all1-cobalt/25 border-all1-aqua text-white'
                        : 'bg-all1-navy border-all1-cobalt/20 text-all1-fog hover:text-white'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {lang === 'gu' ? s.name_gu : s.name_en}
                      </p>
                      <span className="text-[10px] text-all1-fog">
                        {s.minutes} min · ₹{s.price}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-all1-aqua" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Barber */}
          <div>
            <label className="block text-xs font-semibold text-all1-fog mb-1.5">
              {t('getToken.selectBarber')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPreferredBarberId(null)}
                className={`py-2 px-3 rounded-btn border text-center transition-colors tap-target ${
                  preferredBarberId === null
                    ? 'bg-all1-cobalt text-white border-all1-aqua font-semibold'
                    : 'bg-all1-navy border-all1-cobalt/20 text-all1-fog hover:text-white'
                }`}
              >
                {t('getToken.anyAvailable')}
              </button>
              {barbers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={!b.working_today || b.on_break}
                  onClick={() => setPreferredBarberId(b.id)}
                  className={`py-2 px-3 rounded-btn border text-center transition-colors tap-target ${
                    preferredBarberId === b.id
                      ? 'bg-all1-cobalt text-white border-all1-aqua font-semibold'
                      : !b.working_today || b.on_break
                      ? 'bg-all1-navy/50 border-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-all1-navy border-all1-cobalt/20 text-all1-fog hover:text-white'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-all1-navy rounded-btn border border-all1-cobalt/20 flex items-center justify-between text-xs">
            <span className="text-all1-fog">
              Total: {totalMinutes} min · ₹{totalPrice}
            </span>
            <span className="text-all1-aqua font-mono font-semibold">
              Prefix: W- (Walk-in)
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-all1-navy border border-all1-cobalt/30 text-all1-fog hover:text-white rounded-btn text-xs font-medium tap-target"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-all1-coral text-white font-heading font-bold rounded-btn hover:bg-opacity-90 text-xs shadow-md shadow-all1-coral/30 tap-target disabled:opacity-50"
            >
              {isSubmitting ? t('common.loading') : t('reception.walkinBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
