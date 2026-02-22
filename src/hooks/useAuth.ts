import { useSelector } from 'react-redux';
import { RootState } from '@/store/reduxStore';
import { UserRole } from '@/types/auth.types';

export const useAuth = () => {
  const { user, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const isAdmin = user?.role === UserRole.Admin;
  const isOwner = user?.role === UserRole.Owner;
  const isCliente = user?.role === UserRole.Cliente;

  return {
    user,
    isAuthenticated,
    loading,
    error,
    isAdmin,
    isOwner,
    isCliente,
    role: user?.role,
  };
};
