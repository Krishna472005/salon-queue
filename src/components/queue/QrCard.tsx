import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useI18n } from '../../lib/i18n';

interface QrCardProps {
  url?: string;
  theme?: 'light' | 'dark';
  size?: number;
  label?: string;
}

export const QrCard: React.FC<QrCardProps> = ({
  url = typeof window !== 'undefined' ? `${window.location.origin}/token` : '/token',
  theme = 'light',
  size = 140,
  label
}) => {
  const { t } = useI18n();
  const isDark = theme === 'dark';

  return (
    <div
      className={`p-4 rounded-card border flex flex-col items-center justify-center text-center transition-shadow ${
        isDark
          ? 'bg-all1-deep/80 border-all1-cobalt/30 text-white'
          : 'bg-white border-all1-cloud text-all1-ink shadow-sm'
      }`}
    >
      <div className="bg-white p-2 rounded-xl shadow-inner mb-3">
        <QRCodeSVG
          value={url}
          size={size}
          bgColor="#FFFFFF"
          fgColor="#0B1F3A"
          level="M"
          includeMargin={false}
        />
      </div>
      <p className={`text-xs font-medium max-w-[160px] ${isDark ? 'text-all1-fog' : 'text-gray-600'}`}>
        {label || t('landing.scanQr')}
      </p>
    </div>
  );
};
