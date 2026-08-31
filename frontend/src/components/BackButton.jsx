import { useNavigate } from 'react-router-dom';

export default function BackButton({ to, label = 'Volver', className = '', dark = false }) {
  const navigate = useNavigate();

  function goBack() {
    if (to) navigate(to);
    else navigate(-1);
  }

  return (
    <button
      onClick={goBack}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full active:scale-95 transition-all text-sm font-medium ${
        dark
          ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
          : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
      } ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      {label}
    </button>
  );
}
