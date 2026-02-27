import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRBAC } from '@/hooks/useRBAC';

export function RequestAccessModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { getToken } = useRBAC();
  const [resource, setResource] = useState('ROLE_ADMIN');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resource, reason }),
      });
      if (!res.ok) {
        throw new Error('Failed to submit request');
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setReason('');
      }, 2000);
    },
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-bg-popover shadow-2xl"
        >
          {success ? (
            <div className="p-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                ✓
              </div>
              <h3 className="text-lg font-bold text-text-primary">Request Submitted</h3>
              <p className="text-sm text-text-muted">An administrator will review your access request shortly.</p>
            </div>
          ) : (
             <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
                className="flex flex-col"
              >
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Request Elevated Access</h2>
                  <p className="mt-1 text-xs text-text-secondary">
                    Your account is currently restricted (USER). Petition for admin capabilities.
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <Input
                  label="Requested Subsystem"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  placeholder="e.g. ROLE_ADMIN or PROD_CLUSTER_WRITE"
                  required
                />
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary">Justification</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-24 rounded-lg bg-bg-main border-border text-text-primary px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Provide business justification for elevated access..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border p-4 bg-bg-muted/20">
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={mutation.isPending}>
                  Submit Request
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
