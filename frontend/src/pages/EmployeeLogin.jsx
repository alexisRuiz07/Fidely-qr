import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import BackButton from '../components/BackButton.jsx';
import { useLang } from '../i18n/index.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function EmployeeLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.loginEmployee({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_role', 'employee');
      navigate('/employee/scan');
    } catch (err) {
      setError(err.connection ? t('errorConnect') : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="absolute top-4 left-4">
        <BackButton to="/" />
      </div>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher dark />
      </div>
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{t('employeeTitle')}</h1>
          <p className="text-gray-400 text-sm">{t('employeeSub')}</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/10 p-3 rounded-xl placeholder-gray-400"
          required
        />
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/10 p-3 rounded-xl placeholder-gray-400"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-400 text-gray-900 font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? t('loggingIn') : t('login')}
        </button>
      </form>
    </div>
  );
}
