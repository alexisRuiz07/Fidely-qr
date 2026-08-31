import { useLang } from '../i18n/index.jsx';

// Selector de idioma Español/English. Uso ligero para header/landing.
export default function LanguageSwitcher({ dark = false }) {
  const { lang, setLang, t } = useLang();
  const base = dark
    ? 'text-white/80 hover:bg-white/10'
    : 'text-gray-700 hover:bg-gray-200';
  const active = dark ? 'bg-white/20' : 'bg-gray-900 text-white';
  const activeText = dark ? 'text-white' : 'text-white';

  return (
    <div className="inline-flex items-center gap-1 text-sm">
      <button
        onClick={() => setLang('es')}
        className={`px-2 py-1 rounded-lg font-medium ${base} ${
          lang === 'es' ? `${active} ${activeText}` : ''
        }`}
      >
        {t('langEs')}
      </button>
      <span className={dark ? 'text-white/40' : 'text-gray-300'}>|</span>
      <button
        onClick={() => setLang('en')}
        className={`px-2 py-1 rounded-lg font-medium ${base} ${
          lang === 'en' ? `${active} ${activeText}` : ''
        }`}
      >
        {t('langEn')}
      </button>
    </div>
  );
}
