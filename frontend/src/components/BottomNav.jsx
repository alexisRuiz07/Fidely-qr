import { Link } from 'react-router-dom';
import { Wallet, QrCode, User } from 'lucide-react';

const TABS = [
  { id: 'wallet', label: 'Wallet', Icon: Wallet, to: '/wallet' },
  { id: 'qr',     label: 'Mi QR',  Icon: QrCode,  to: '/mi-qr'  },
  { id: 'perfil', label: 'Perfil', Icon: User,    to: '/perfil' },
];

export default function BottomNav({ active }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-neutral-300 z-20">
      <div className="max-w-md mx-auto flex items-center justify-around pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}>
        {TABS.map(({ id, label, Icon, to }) => {
          const on = active === id;
          return (
            <Link
              key={id}
              to={to}
              className={`flex flex-col items-center gap-[3px] px-6 py-2 rounded-md transition-colors ${
                on ? 'text-brand-700' : 'text-neutral-600'
              }`}
            >
              <Icon size={22} strokeWidth={2.75} />
              <span className={`text-[10px] font-medium ${on ? 'text-brand-700' : 'text-neutral-500'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
