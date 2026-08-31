import { Navigate } from 'react-router-dom';

export default function RequireAuth({ role, redirectTo, children }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('user_role');

  if (!token) return <Navigate to={redirectTo} replace />;
  if (role && userRole !== role) return <Navigate to={redirectTo} replace />;

  return children;
}
