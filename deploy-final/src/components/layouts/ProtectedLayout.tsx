import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedLayout() {
  const { user, loading } = useAuth();

  // Mostra nada enquanto verifica a autenticação
  if (loading) {
    return null;
  }

  // Redireciona para login se não estiver autenticado
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Renderiza o conteúdo protegido
  return <Outlet />;
} 