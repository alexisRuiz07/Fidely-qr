import { Link } from 'react-router-dom';
import { Wallet, ScanLine, Settings } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import { useLang } from '../i18n/index.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Home() {
  const { t } = useLang();
  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col">

      {/* top bar */}
      <div className="flex items-center justify-between px-5 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
        <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">Fidely QR</p>
        <LanguageSwitcher />
      </div>

      {/* hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 sm:py-12 text-center">
        {/* logo */}
        <div className="w-16 h-16 rounded-[22px] bg-brand grid place-items-center text-white shadow-md mb-6">
          <ScanLine size={32} strokeWidth={2.75} />
        </div>

        <h1 className="font-display text-[40px] sm:text-[52px] text-ink leading-tight mb-3">
          {t('appName')}
        </h1>
        <p className="text-neutral-600 text-base sm:text-lg max-w-xs mb-10">
          {t('tagline')}
        </p>

        {/* botones */}
        <div className="w-full max-w-sm space-y-3">
          <Link to="/wallet"
            className="flex items-center justify-center gap-3 w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-full transition shadow-sm text-[15px]">
            <Wallet size={20} strokeWidth={2.75} />
            {t('homeClient')}
          </Link>
          <Link to="/employee/login"
            className="flex items-center justify-center gap-3 w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold py-4 rounded-full transition text-[15px]">
            <ScanLine size={20} strokeWidth={2.75} />
            {t('homeEmployee')}
          </Link>
          <Link to="/admin/login"
            className="flex items-center justify-center gap-3 w-full border border-neutral-400 hover:bg-neutral-200 text-neutral-700 font-semibold py-4 rounded-full transition text-[15px]">
            <Settings size={20} strokeWidth={2.75} />
            {t('homeAdmin')}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
