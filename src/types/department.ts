import { VariantProps } from 'class-variance-authority'
import { styles } from '../components/crm/Sidebar.styles'

export interface Department {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  totalTickets: number;
  unreadTickets: number;
  resolvedTickets: number;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentStats {
  totalTickets: number;
  unreadTickets: number;
  resolvedTickets: number;
}

export type SidebarVariants = VariantProps<typeof styles.container>

export interface SidebarProps extends SidebarVariants {
  onDepartmentSelect?: (departmentId: string) => void;
  onAddDepartment?: () => void;
  className?: string;
}

export type DepartmentPriority = 'high' | 'medium' | 'low'

export interface DepartmentFilters {
  search?: string;
  priority?: DepartmentPriority;
  hasUnread?: boolean;
}

export interface DepartmentFormData {
  id?: string;
  name: string;
  description?: string;
  order?: number;
  is_active?: boolean;
}

export interface DepartmentResponse {
  data: Department[];
  error: Error | null;
} 