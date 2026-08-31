import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useLang } from '../i18n/index.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import BackButton from '../components/BackButton.jsx';

export default function AdminRegister() {
  const [fullName, setFullName] = useState('');
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
      const data = await api.registerAdmin({ email, password, full_name: fullName });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_role', 'admin');
      navigate('/admin');
    } catch (err) {
      setError(err.connection ? t('errorConnect') : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="absolute top-4 left-4">
        <BackButton to="/admin/login" />
      </div>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher dark />
      </div>
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{t('adminRegisterTitle')}</h1>
          <p className="text-gray-400 text-sm">{t('adminRegisterSub')}</p>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
        <input type="text" placeholder={t('fullName')} value={fullName}
          onChange={(e) => setFullName(e.target.value)} required
          className="w-full bg-white/10 p-3 rounded-xl placeholder-gray-400" />
        <input type="email" placeholder={t('email')} value={email}
          onChange={(e) => setEmail(e.target.value)} required
          className="w-full bg-white/10 p-3 rounded-xl placeholder-gray-400" />
        <input type="password" placeholder={`${t('password')} (6+)`} value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={6}
          className="w-full bg-white/10 p-3 rounded-xl placeholder-gray-400" />
        <button type="submit" disabled={loading}
          className="w-full bg-amber-400 text-gray-900 font-bold py-3 rounded-xl disabled:opacity-50">
          {loading ? t('creatingAccount') : t('createAccount')}
        </button>
        <p className="text-sm text-center text-gray-400">
          {t('adminTitle')}?{' '}
          <Link to="/admin/login" className="text-amber-400 underline">{t('login')}</Link>
        </p>
      </form>
    </div>
  );
}