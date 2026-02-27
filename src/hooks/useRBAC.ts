import { useAuth, useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';

export interface DBUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  status: string;
}

export function useRBAC() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const { data: dbUser, isLoading, refetch } = useQuery<DBUser>({
    queryKey: ['rbac-user', clerkUser?.id],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch user role');
      return res.json();
    },
    enabled: isLoaded && isSignedIn && !!clerkUser,
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });

  return {
    role: dbUser?.role || 'USER',
    isLoading: isLoading || !isLoaded,
    hasElevatedAccess: dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPERADMIN',
    isSuperAdmin: dbUser?.role === 'SUPERADMIN',
    isApproved: dbUser?.status === 'ACTIVE',
    dbUser,
    refetchUser: refetch,
    getToken
  };
}
