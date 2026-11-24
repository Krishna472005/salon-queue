import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { ShieldCheck, KeyRound, AlertTriangle, ArrowRight, LogOut, CheckCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { t } = useI18n();
  const { user, role, isStaff, loginWithGoogle, loginWithDemoPin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDemoPinEnabled = import.meta.env.VITE_DEMO_PIN_ENABLED !== 'false';
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleGoogleLogin = async () => {
    try {
      setGoogleError('');
      setIsSubmitting(true);
      await loginWithGoogle();
    } catch (err: unknown) {
      setGoogleError((err as Error)?.message || 'Failed to initialize Google login. Check Supabase Auth configuration.');
      setIsSubmitting(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setIsSubmitting(true);
    setPinError('');

    const result = await loginWithDemoPin(pin);
    setIsSubmitting(false);

    if (result.success) {
      const destination = from || result.redirectPath || '/reception';
      navigate(destination, { replace: true });
    } else {
      setPinError(result.error || t('login.invalidPin'));
    }
  };

  // If already logged in
  if (user || role) {
    if (user && !isStaff) {
      return (
        <div className="min-h-screen flex flex-col bg-all1-navy text-white">
          <Header theme="dark" />
          <main className="flex-1 flex items-center justify-center p-4">
            <div className="bg-all1-deep rounded-card max-w-md w-full p-8 border border-all1-rose/40 text-center shadow-xl">
              <div className="w-16 h-16 bg-all1-rose/20 text-all1-rose rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-heading font-bold text-white mb-2">Access Denied</h1>
              <p className="text-sm text-all1-fog mb-2">
                Signed in as: <strong className="text-white font-mono">{user.email}</strong>
              </p>
              <p className="text-xs text-all1-fog mb-6 font-body">
                {t('login.accessDenied')}
              </p>
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 bg-all1-rose text-white font-medium py-3 rounded-btn hover:bg-opacity-90 transition tap-target"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out & Try Another Account</span>
              </button>
            </div>
          </main>
          <Footer theme="dark" />
        </div>
      );
    }

    const defaultRoute = role === 'owner' ? '/owner' : role === 'barber' ? '/barber/mahesh' : '/reception';

    return (
      <div className="min-h-screen flex flex-col bg-all1-navy text-white">
        <Header theme="dark" />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-all1-deep rounded-card max-w-md w-full p-8 border border-all1-lime/30 text-center shadow-xl">
            <div className="w-16 h-16 bg-all1-lime/20 text-all1-lime rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-heading font-bold text-white mb-1">Authenticated</h1>
            <p className="text-sm text-all1-fog mb-2">
              Role: <span className="font-semibold text-all1-aqua uppercase">{role}</span>
            </p>
            {user?.email && (
              <p className="text-xs text-all1-fog mb-6 font-mono">{user.email}</p>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate(defaultRoute)}
                className="w-full flex items-center justify-center gap-2 bg-all1-cobalt text-white font-medium py-3 rounded-btn hover:bg-opacity-90 transition tap-target"
              >
                <span>Go to {role === 'owner' ? 'Owner Panel' : role === 'barber' ? 'Barber Chair' : 'Reception Board'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 bg-all1-deep border border-all1-cobalt/30 text-all1-fog hover:text-white font-medium py-2.5 rounded-btn transition tap-target text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </main>
        <Footer theme="dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-all1-navy text-white">
      <Header theme="dark" />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-all1-deep rounded-card max-w-md w-full p-8 border border-all1-cobalt/30 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-all1-cobalt/20 text-all1-aqua rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">{t('login.title')}</h1>
            <p className="text-xs text-all1-fog mt-1">{t('login.subtitle')}</p>
          </div>

          {googleError && (
            <div className="mb-4 p-3 bg-all1-rose/10 border border-all1-rose/30 rounded-btn text-xs text-all1-rose">
              {googleError}
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-all1-navy font-semibold py-3 px-4 rounded-btn hover:bg-gray-100 transition tap-target shadow-md disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t('login.googleBtn')}</span>
          </button>

          {/* Quick Demo PIN access */}
          {isDemoPinEnabled && (
            <div className="mt-8 pt-6 border-t border-all1-cobalt/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-all1-aqua mb-3">
                <KeyRound className="w-4 h-4" />
                <span>{t('login.demoPinTitle')}</span>
              </div>
              <form onSubmit={handlePinSubmit} className="space-y-3">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  placeholder={t('login.demoPinPlaceholder')}
                  className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn px-4 py-2.5 text-center font-mono text-lg tracking-widest text-white outline-none focus:border-all1-aqua"
                />
                {pinError && <p className="text-xs text-all1-rose text-center">{pinError}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting || pin.length !== 4}
                  className="w-full bg-all1-cobalt text-white font-medium py-2.5 rounded-btn hover:bg-opacity-90 transition tap-target text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Authenticating…' : t('login.demoPinBtn')}
                </button>
              </form>
              <p className="text-[11px] text-all1-fog text-center mt-3 font-mono">
                {t('login.demoHints')}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer theme="dark" />
    </div>
  );
};
