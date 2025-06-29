import type { DepartmentType } from '../components/crm/Sidebar.types';

export type PriorityType = 'high' | 'normal' | 'low';

export interface SectorFormData {
  id?: string;
  name: string;
  type: DepartmentType;
  icon: string;
  color: string;
  description: string;
  priority: PriorityType;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  order?: number;
}

export interface Sector extends SectorFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface SectorResponse {
  data: Sector[];
  error: Error | null;
} 