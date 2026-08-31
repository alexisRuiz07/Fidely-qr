import { useNavigate } from 'react-router-dom';

export default function BackButton({ to, label = 'Volver', className = '' }) {
  const navigate = useNavigate();

  function goBack() {
    if (to) navigate(to);
    else navigate(-1);
  }

  return (
    <button
      onClick={goBack}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-sm font-medium text-white backdrop-blur-sm ${className}`}
    >
      <svg
        width="16" height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      {label}
    </button>
  );
}
