import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import { useLang } from '../i18n/index.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Home() {
  const { t } = useLang();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-800 to-gray-900 text-white">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher dark />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">{t('appName')}</h1>
          <p className="mt-2 text-gray-300">{t('tagline')}</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <Link
            to="/wallet"
            className="block w-full bg-amber-400 text-gray-900 font-semibold py-3 rounded-xl text-center"
          >
            {t('homeClient')}
          </Link>
          <Link
            to="/employee/login"
            className="block w-full bg-white/10 font-semibold py-3 rounded-xl text-center"
          >
            {t('homeEmployee')}
          </Link>
          <Link
            to="/admin/login"
            className="block w-full bg-white/10 font-semibold py-3 rounded-xl text-center"
          >
            {t('homeAdmin')}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
