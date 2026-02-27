/**
 * ==========================================================================
 * Zod Validation Schemas — Resource Management
 * ==========================================================================
 * Type-safe validation schemas using Zod for form inputs. These schemas
 * define the contract between the UI form and the GraphQL mutation,
 * ensuring data integrity before it reaches the API layer.
 *
 * Key patterns:
 * - Schema-first: Types are derived FROM schemas, not duplicated
 * - Granular error messages for UX clarity
 * - Reusable base schemas composed into form-specific schemas
 * - Cross-field validation with .refine()
 * ==========================================================================
 */

import { z } from 'zod';

// ---------- Base Schemas (Reusable Primitives) ----------

export const resourceTypeSchema = z.enum(
  ['COMPUTE', 'STORAGE', 'NETWORK', 'DATABASE', 'CDN', 'CONTAINER'],
  { message: 'Please select a valid resource type' }
);

export const resourceStatusSchema = z.enum(
  ['ACTIVE', 'IDLE', 'OVERLOADED', 'MAINTENANCE', 'DECOMMISSIONED'],
  { message: 'Please select a valid status' }
);

export const providerSchema = z.enum(
  ['AWS', 'GCP', 'Azure', 'On-Premise'],
  { message: 'Please select a cloud provider' }
);

export const departmentSchema = z.enum(
  ['Engineering', 'Design', 'Product', 'Data Science', 'DevOps', 'QA', 'Security', 'Management'],
  { message: 'Please select a department' }
);

export const regionSchema = z.enum(
  ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'],
  { message: 'Please select a valid region' }
);

// ---------- Create Resource Schema ----------

export const createResourceSchema = z.object({
  name: z
    .string()
    .min(3, 'Resource name must be at least 3 characters')
    .max(128, 'Resource name cannot exceed 128 characters')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
      'Name must start with alphanumeric and contain only letters, numbers, hyphens, and underscores'
    ),

  type: resourceTypeSchema,

  provider: providerSchema,

  region: regionSchema,

  department: departmentSchema,

  costPerHour: z
    .number({ message: 'Cost must be a number' })
    .min(0, 'Cost cannot be negative')
    .max(1000, 'Cost per hour cannot exceed $1,000'),

  tags: z
    .array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),

  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

/**
 * TypeScript type derived FROM the Zod schema.
 * This is the single source of truth — no type duplication.
 */
export type CreateResourceInput = z.infer<typeof createResourceSchema>;

// ---------- Update Resource Schema ----------

export const updateResourceSchema = createResourceSchema.partial().extend({
  id: z.string().min(1, 'Invalid resource ID'),

  status: resourceStatusSchema.optional(),

  cpuUtilization: z
    .number()
    .min(0, 'CPU utilization cannot be negative')
    .max(100, 'CPU utilization cannot exceed 100%')
    .optional(),

  memoryUtilization: z
    .number()
    .min(0, 'Memory utilization cannot be negative')
    .max(100, 'Memory utilization cannot exceed 100%')
    .optional(),
});

export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

// ---------- Create Team Member Schema ----------

export const createTeamMemberSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),

  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),

  role: z
    .string()
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role cannot exceed 100 characters'),

  department: departmentSchema,

  skills: z
    .array(z.string().min(1).max(50))
    .min(1, 'At least one skill is required')
    .max(20, 'Maximum 20 skills allowed'),
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

// ---------- Allocation Schema (Conditional Validation) ----------

/**
 * Demonstrates Zod's .refine() for cross-field validation.
 * The end date (if provided) must be after the start date.
 */
export const createAllocationSchema = z
  .object({
    resourceId: z.string().min(1, 'Resource is required'),
    projectId: z.string().min(1, 'Project is required'),
    teamMemberId: z.string().min(1, 'Team member is required'),
    percentage: z
      .number()
      .min(1, 'Allocation must be at least 1%')
      .max(100, 'Allocation cannot exceed 100%'),
    startDate: z.string().datetime('Invalid date format'),
    endDate: z.string().datetime('Invalid date format').nullable(),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
