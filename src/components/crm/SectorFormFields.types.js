import { z } from 'zod';
export const sectorSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    type: z.enum(['default', 'support', 'sales', 'marketing', 'development', 'finance', 'hr', 'legal', 'operations', 'logistics']),
    description: z.string().optional(),
    priority: z.enum(['high', 'medium', 'normal', 'low']),
    icon: z.string().optional(),
    color: z.string().optional(),
});
