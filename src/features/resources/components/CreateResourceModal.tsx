/**
 * ==========================================================================
 * CreateResourceModal — Form UI Using Reusable Components
 * ==========================================================================
 * Modal form demonstrating:
 * - useResourceForm hook for validation + submission
 * - Reusable Input, Button, Card components from design system
 * - Framer Motion enter/exit animations
 * - Field-level onBlur validation with error messages
 * - Server error display and success feedback
 * - Full keyboard accessibility (Escape to close, focus trap)
 * ==========================================================================
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useResourceForm } from '@/features/resources/hooks/useResourceForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// ---------- Types ----------

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ---------- Select Component (local to this feature) ----------

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly { value: string; label: string }[];
  error?: string;
}

function SelectField({ label, value, onChange, onBlur, options, error }: SelectFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          'w-full h-9 rounded-lg border bg-bg-input px-3 text-sm text-text-primary',
          'focus:border-border-active focus:outline-none focus:ring-1 focus:ring-ring',
          'transition-colors',
          error ? 'border-destructive' : 'border-border'
        )}
        aria-invalid={error ? 'true' : undefined}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[11px] text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}

// ---------- Option Constants ----------

const RESOURCE_TYPES = [
  { value: 'COMPUTE', label: 'Compute' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'CDN', label: 'CDN' },
  { value: 'CONTAINER', label: 'Container' },
] as const;

const PROVIDERS = [
  { value: 'AWS', label: 'AWS' },
  { value: 'GCP', label: 'Google Cloud' },
  { value: 'Azure', label: 'Microsoft Azure' },
  { value: 'On-Premise', label: 'On-Premise' },
] as const;

const REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU West (Ireland)' },
  { value: 'eu-central-1', label: 'EU Central (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
] as const;

const DEPARTMENTS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Design', label: 'Design' },
  { value: 'Product', label: 'Product' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'QA', label: 'QA' },
  { value: 'Security', label: 'Security' },
  { value: 'Management', label: 'Management' },
] as const;

// ---------- Component ----------

export function CreateResourceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateResourceModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    values,
    errors,
    isSubmitting,
    isSuccess,
    serverError,
    isDirty,
    setFieldValue,
    validateField,
    handleSubmit,
    reset,
  } = useResourceForm({
    onSuccess: () => {
      onSuccess?.();
      // Auto-close after brief success indication
      setTimeout(() => {
        reset();
        onClose();
      }, 1200);
    },
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap — focus the modal when it opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector<HTMLInputElement>(
        'input:not([disabled]), select:not([disabled])'
      );
      firstInput?.focus();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isDirty && !isSuccess) {
      // In production, show a confirmation dialog
      if (!window.confirm('You have unsaved changes. Discard?')) return;
    }
    reset();
    onClose();
  }, [isDirty, isSuccess, reset, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-resource-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle id="create-resource-title">Create New Resource</CardTitle>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {/* Success Message */}
                  {isSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-lg bg-success/15 border border-success/30 p-3 text-sm text-success"
                    >
                      ✓ Resource created successfully!
                    </motion.div>
                  )}

                  {/* Server Error */}
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {serverError}
                    </motion.div>
                  )}

                  {/* Name */}
                  <Input
                    label="Resource Name"
                    placeholder="e.g. prod-compute-primary-001"
                    value={values.name}
                    onChange={(e) => setFieldValue('name', e.target.value)}
                    onBlur={() => validateField('name')}
                    error={errors.name}
                    disabled={isSubmitting || isSuccess}
                    leftAddon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3" />
                      </svg>
                    }
                  />

                  {/* Type + Provider (2-column) */}
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="Resource Type"
                      value={values.type}
                      onChange={(v) =>
                        setFieldValue('type', v as typeof values.type)
                      }
                      onBlur={() => validateField('type')}
                      options={RESOURCE_TYPES}
                      error={errors.type}
                    />
                    <SelectField
                      label="Cloud Provider"
                      value={values.provider}
                      onChange={(v) =>
                        setFieldValue('provider', v as typeof values.provider)
                      }
                      onBlur={() => validateField('provider')}
                      options={PROVIDERS}
                      error={errors.provider}
                    />
                  </div>

                  {/* Region + Department (2-column) */}
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="Region"
                      value={values.region}
                      onChange={(v) =>
                        setFieldValue('region', v as typeof values.region)
                      }
                      options={REGIONS}
                      error={errors.region}
                    />
                    <SelectField
                      label="Department"
                      value={values.department}
                      onChange={(v) =>
                        setFieldValue( 'department', v as typeof values.department)
                      }
                      options={DEPARTMENTS}
                      error={errors.department}
                    />
                  </div>

                  {/* Cost Per Hour */}
                  <Input
                    label="Cost Per Hour (USD)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    placeholder="0.00"
                    value={values.costPerHour || ''}
                    onChange={(e) =>
                      setFieldValue('costPerHour', parseFloat(e.target.value) || 0)
                    }
                    onBlur={() => validateField('costPerHour')}
                    error={errors.costPerHour}
                    disabled={isSubmitting || isSuccess}
                    leftAddon={<span className="text-xs font-medium">$</span>}
                  />

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="description"
                      className="block text-xs font-medium text-text-secondary"
                    >
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      placeholder="Brief description of this resource..."
                      value={values.description || ''}
                      onChange={(e) => setFieldValue('description', e.target.value)}
                      disabled={isSubmitting || isSuccess}
                      className={cn(
                        'w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text-primary',
                        'placeholder:text-text-muted resize-none',
                        'focus:border-border-active focus:outline-none focus:ring-1 focus:ring-ring',
                        'transition-colors',
                        errors.description && 'border-destructive'
                      )}
                    />
                    {errors.description && (
                      <p className="text-[11px] text-destructive" role="alert">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    disabled={isSuccess}
                  >
                    {isSuccess ? '✓ Created' : 'Create Resource'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
