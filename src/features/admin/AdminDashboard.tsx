import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRBAC, type DBUser } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import NoRequestsImg from '@/assets/illustrations/no_requests.png';

interface AccessRequest {
  id: string;
  resource: string;
  reason: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    role: string;
  };
}

function RequestCardSkeleton() {
  return (
    <div className="glass-card p-4 flex justify-between items-center animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <Skeleton width={120} height={16} />
          <Skeleton width={50} height={16} className="rounded" />
        </div>
        <Skeleton width="60%" height={12} variant="text" />
        <Skeleton width="40%" height={12} variant="text" />
        <Skeleton width={100} height={10} variant="text" className="mt-2" />
      </div>
      <Skeleton width={100} height={32} className="rounded-lg ml-4" />
    </div>
  );
}

export function AdminDashboard() {
  const { hasElevatedAccess, isSuperAdmin, getToken } = useRBAC();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');

  // --- Data Fetching ---
  const { data: requests, isLoading: loadingRequests } = useQuery<AccessRequest[]>({
    queryKey: ['access-requests'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/admin/access-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch requests');
      return res.json();
    },
    enabled: hasElevatedAccess,
  });

  const { data: users, isLoading: loadingUsers } = useQuery<DBUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: isSuperAdmin && activeTab === 'users',
  });

  // --- Mutations ---
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/access-requests/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve request');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string, role: string }) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error('Failed to change role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const triggerQStashMutation = useMutation({
    mutationFn: async () => {
      // MOCKED: API endpoint was deleted to stay under Vercel's 12 function Hobby Limit
      await new Promise(resolve => setTimeout(resolve, 800));
      return { message: 'Mocked successfully: Job queued in background (API disabled for Vercel Hobby limits)' };
    },
    onSuccess: (data) => {
      alert(data.message);
    },
    onError: (err: any) => {
      alert(`Error: ${err.message}`);
    }
  });

  if (!hasElevatedAccess) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
             <span className="text-2xl text-destructive">!</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary">Access Denied</h2>
          <p className="text-sm text-text-muted max-w-sm">
            You do not possess the required RBAC privileges to view this enterprise interface.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6 flex h-full flex-col"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Control Panel</h1>
          <p className="mt-1 text-sm text-text-secondary">Enterprise configuration, RBAC scopes, and background workers.</p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => triggerQStashMutation.mutate()}
          className="border-primary text-black hover:text-primary hover:bg-primary/10"
          isLoading={triggerQStashMutation.isPending}
        >
          Trigger QStash SLA Report
        </Button>
      </div>

      <div className="flex gap-4 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
        >
          Pending Access Requests
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
          >
            RBAC Directory
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'requests' && (
          <div className="space-y-4">
             {loadingRequests ? (
                <>
                  <RequestCardSkeleton />
                  <RequestCardSkeleton />
                  <RequestCardSkeleton />
                </>
             ) : requests?.length === 0 ? (
                <EmptyState 
                  title="No Pending Requests"
                  description="All access requests have been processed. New requests from team members will appear here for approval."
                  imageUrl={NoRequestsImg}
                  className="py-12"
                />
             ) : (
               requests?.map(req => (
                 <div key={req.id} className="glass-card p-4 flex justify-between items-center">
                   <div>
                     <p className="font-semibold text-text-primary">{req.user.firstName || req.user.email} <span className="text-xs bg-bg-muted px-2 py-0.5 rounded ml-2">{req.user.role}</span></p>
                     <p className="text-xs text-text-secondary mt-1">Resource requested: <strong className="text-text-primary">{req.resource}</strong></p>
                     <p className="text-xs text-text-muted mt-1 italic">"{req.reason}"</p>
                     <p className="text-[10px] text-text-muted mt-2">{new Date(req.createdAt).toLocaleString()}</p>
                   </div>
                   <Button 
                     variant="primary" 
                     size="sm" 
                     onClick={() => approveMutation.mutate(req.id)}
                     isLoading={approveMutation.isPending}
                   >
                     Approve Access
                   </Button>
                 </div>
               ))
             )}
          </div>
        )}

        {activeTab === 'users' && isSuperAdmin && (
          <div className="space-y-4">
             {loadingUsers ? (
                <div className="glass-card overflow-hidden">
                  <div className="bg-bg-muted/50 border-b border-border h-12 flex items-center px-4">
                    <Skeleton width="100%" height={14} />
                  </div>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </div>
             ) : (
               <div className="glass-card overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-bg-muted/50 border-b border-border">
                     <tr>
                       <th className="px-4 py-3 font-semibold text-text-secondary">User</th>
                       <th className="px-4 py-3 font-semibold text-text-secondary">Current Role</th>
                       <th className="px-4 py-3 font-semibold text-text-secondary">Status</th>
                       <th className="px-4 py-3 font-semibold text-text-secondary">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {users?.map(user => (
                       <tr key={user.id} className="hover:bg-bg-muted/20 transition-colors">
                         <td className="px-4 py-3 text-text-primary font-medium">{user.email}</td>
                         <td className="px-4 py-3">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${user.role === 'SUPERADMIN' ? 'bg-destructive/20 text-destructive' : user.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'}`}>
                             {user.role}
                           </span>
                         </td>
                         <td className="px-4 py-3 text-text-secondary">{user.status}</td>
                         <td className="px-4 py-3 space-x-2">
                           {user.role !== 'SUPERADMIN' && (
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => changeRoleMutation.mutate({ id: user.id, role: 'ADMIN' })}
                             >
                               Make Admin
                             </Button>
                           )}
                           {user.role === 'ADMIN' && (
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => changeRoleMutation.mutate({ id: user.id, role: 'USER' })}
                             >
                               Revoke Admin
                             </Button>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        )}
      </div>

    </motion.div>
  );
}
