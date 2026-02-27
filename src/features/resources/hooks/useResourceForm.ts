/**
 * ==========================================================================
 * useResourceForm — Form Hook with Zod + TanStack Mutation + GraphQL
 * ==========================================================================
 * Custom hook orchestrating the full form submission lifecycle:
 *
 * 1. Client-side validation via Zod schema
 * 2. Optimistic cache update via TanStack Query
 * 3. Server mutation via Apollo Client GraphQL
 * 4. Error rollback and field-level error mapping
 *
 * This pattern decouples form logic from UI, enabling:
 * - Unit testing of validation without rendering components
 * - Reuse across modal, page, and drawer form UIs
 * - Type-safe field errors derived from Zod schema
 * ==========================================================================
 */

import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMutation as useApolloMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { z } from 'zod';
import {
  createResourceSchema,
  type CreateResourceInput,
} from '@/lib/validations';
import { resourceKeys } from '@/features/resources/hooks/useResources';
import type { Resource } from '@/types';

// ---------- GraphQL Mutation ----------

const CREATE_RESOURCE = gql`
  mutation CreateResource($input: CreateResourceInput!) {
    createResource(input: $input) {
      id
      name
      type
      status
      region
      provider
      cpuUtilization
      memoryUtilization
      costPerHour
      department
      tags
      createdAt
      updatedAt
    }
  }
`;

// ---------- Types ----------

type FieldErrors = Partial<Record<keyof CreateResourceInput, string>>;

interface UseResourceFormReturn {
  /** Current form values */
  values: CreateResourceInput;
  /** Field-level validation errors */
  errors: FieldErrors;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Whether the last submission was successful */
  isSuccess: boolean;
  /** Server-side error message (if any) */
  serverError: string | null;
  /** Whether the form has been modified */
  isDirty: boolean;
  /** Update a single field value */
  setFieldValue: <K extends keyof CreateResourceInput>(
    field: K,
    value: CreateResourceInput[K]
  ) => void;
  /** Set all form values at once */
  setValues: (values: Partial<CreateResourceInput>) => void;
  /** Validate a single field (for onBlur validation) */
  validateField: (field: keyof CreateResourceInput) => boolean;
  /** Validate the entire form */
  validate: () => boolean;
  /** Submit the form (validates + mutates) */
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  /** Reset form to initial state */
  reset: () => void;
}

// ---------- Default Values ----------

const DEFAULT_VALUES: CreateResourceInput = {
  name: '',
  type: 'COMPUTE',
  provider: 'AWS',
  region: 'us-east-1',
  department: 'Engineering',
  costPerHour: 0,
  tags: [],
  description: '',
};

// ---------- Mock API ----------

/**
 * Simulates the GraphQL mutation response.
 * In production, the Apollo mutation would handle this.
 */
async function createResourceApi(
  input: CreateResourceInput
): Promise<Resource> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simulate occasional server validation errors
  if (input.name.includes('error')) {
    throw new Error('Server validation failed: resource name conflicts with existing resource');
  }

  return {
    id: `res-${Date.now()}`,
    name: input.name,
    type: input.type,
    status: 'ACTIVE',
    region: input.region,
    provider: input.provider,
    cpuUtilization: 0,
    memoryUtilization: 0,
    costPerHour: input.costPerHour,
    tags: input.tags,
    department: input.department,
    lastHealthCheck: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ---------- Hook ----------

export function useResourceForm(
  options: {
    onSuccess?: (resource: Resource) => void;
    initialValues?: Partial<CreateResourceInput>;
  } = {}
): UseResourceFormReturn {
  const { onSuccess, initialValues } = options;

  const queryClient = useQueryClient();

  // Merge initial values with defaults
  const mergedDefaults = useMemo(
    () => ({ ...DEFAULT_VALUES, ...initialValues }),
    [initialValues]
  );

  const [values, setValuesState] = useState<CreateResourceInput>(mergedDefaults);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // GraphQL mutation (for demonstration — mock link handles it)
  const [gqlCreateResource] = useApolloMutation(CREATE_RESOURCE);

  // TanStack mutation for optimistic updates + cache management
  const mutation = useMutation({
    mutationFn: createResourceApi,

    /**
     * Optimistic update: Immediately add the new resource to the cache
     * so the table shows it before the server responds.
     */
    onMutate: async (newResource) => {
      await queryClient.cancelQueries({ queryKey: resourceKeys.all });

      const previousData = queryClient.getQueriesData({
        queryKey: resourceKeys.lists(),
      });

      // Optimistically add to cached lists
      queryClient.setQueriesData(
        { queryKey: resourceKeys.lists() },
        (old: Resource[] | undefined) => {
          if (!old) return old;
          const optimisticResource: Resource = {
            id: `temp-${Date.now()}`,
            name: newResource.name,
            type: newResource.type,
            status: 'ACTIVE',
            region: newResource.region,
            provider: newResource.provider,
            cpuUtilization: 0,
            memoryUtilization: 0,
            costPerHour: newResource.costPerHour,
            tags: newResource.tags,
            department: newResource.department,
            lastHealthCheck: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return [optimisticResource, ...old];
        }
      );

      return { previousData };
    },

    onError: (_err, _vars, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },

    onSuccess: (resource) => {
      // Also fire the GraphQL mutation for cache normalization
      gqlCreateResource({
        variables: { input: values },
      }).catch(() => {
        // Silently handle — mock link doesn't implement this mutation fully
      });

      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
      onSuccess?.(resource);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    },
  });

  // ---------- Field Operations ----------

  const setFieldValue = useCallback(
    <K extends keyof CreateResourceInput>(
      field: K,
      value: CreateResourceInput[K]
    ) => {
      setValuesState((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      // Clear field error on change
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const setValues = useCallback((partial: Partial<CreateResourceInput>) => {
    setValuesState((prev) => ({ ...prev, ...partial }));
    setIsDirty(true);
  }, []);

  // ---------- Validation ----------

  /**
   * Validates a single field using Zod's .pick() for granular validation.
   * Used for onBlur field-level validation to give immediate feedback.
   */
  const validateField = useCallback(
    (field: keyof CreateResourceInput): boolean => {
      try {
        // Pick the single field schema and validate
        const fieldSchema = createResourceSchema.shape[field];
        fieldSchema.parse(values[field]);

        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return true;
      } catch (err) {
        if (err instanceof z.ZodError) {
          const message = err.issues[0]?.message ?? 'Invalid value';
          setErrors((prev) => ({ ...prev, [field]: message }));
        }
        return false;
      }
    },
    [values]
  );

  /**
   * Validates the entire form. Returns true if valid.
   * Maps Zod errors to field-level error messages.
   */
  const validate = useCallback((): boolean => {
    try {
      createResourceSchema.parse(values);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.issues) {
          const field = issue.path[0] as keyof CreateResourceInput | undefined;
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [values]);

  // ---------- Submit ----------

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setServerError(null);

      // Step 1: Client-side validation
      if (!validate()) return;

      // Step 2: Submit via TanStack mutation
      try {
        await mutation.mutateAsync(values);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setServerError(message);
      }
    },
    [values, validate, mutation]
  );

  // ---------- Reset ----------

  const reset = useCallback(() => {
    setValuesState(mergedDefaults);
    setErrors({});
    setServerError(null);
    setIsDirty(false);
    mutation.reset();
  }, [mergedDefaults, mutation]);

  return {
    values,
    errors,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    serverError,
    isDirty,
    setFieldValue,
    setValues,
    validateField,
    validate,
    handleSubmit,
    reset,
  };
}
