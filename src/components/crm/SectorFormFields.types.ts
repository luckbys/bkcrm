import { z } from 'zod';
import type { DepartmentType } from './Sidebar.types';

export const sectorSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  type: z.enum(['default', 'support', 'sales', 'marketing', 'development', 'finance', 'hr', 'legal', 'operations', 'logistics'] as const),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'normal', 'low'] as const),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type SectorFormData = z.infer<typeof sectorSchema>;

export interface SectorFormFieldsProps {
  defaultValues?: Partial<SectorFormData>;
  onSubmit: (data: SectorFormData) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
} 