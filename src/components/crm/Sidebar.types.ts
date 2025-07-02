export type DepartmentType = 
  | 'support' 
  | 'sales' 
  | 'marketing' 
  | 'development' 
  | 'finance' 
  | 'hr' 
  | 'legal' 
  | 'operations' 
  | 'logistics' 
  | 'default';

export type PriorityType = 'high' | 'normal' | 'low';

export interface Department {
  id: string;
  name: string;
  type: DepartmentType;
  icon?: string;
  color?: string;
  description?: string;
  priority: PriorityType;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentCounts {
  nonVisualized: number;
  total: number;
}

export interface SidebarProps {
  departments: Department[];
  isLoading: boolean;
  error: Error | null;
  activeDepartment: Department | null;
  onSelectDepartment: (department: Department) => void;
  collapsed: boolean;
  onToggle: () => void;
  onDepartmentUpdate?: () => Promise<void>;
  onDepartmentReorder?: (reorderedDepartments: Department[]) => Promise<void>;
}

export interface DepartmentItemProps {
  department: Department;
  isActive: boolean;
  counts?: DepartmentCounts;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
  collapsed: boolean;
}

export interface DepartmentFormData {
  name: string;
  type: DepartmentType;
  icon?: string;
  color?: string;
  description?: string;
  priority: PriorityType;
  is_active: boolean;
}

export interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department;
  onSubmit: (data: DepartmentFormData) => Promise<void>;
  title: string;
}

export type DepartmentColor = keyof typeof import('./Sidebar.constants').DEPARTMENT_COLORS;
export type UserStatusType = 'online' | 'offline' | 'away' | 'busy';

export interface DepartmentIconProps {
  type: DepartmentType;
  className?: string;
}

export interface DepartmentBadgeProps {
  priority: PriorityType;
  className?: string;
}

export interface UserStatusBadgeProps {
  status: UserStatusType;
  className?: string;
} 