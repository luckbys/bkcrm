export type DepartmentType = keyof typeof import('./Sidebar.constants').DEPARTMENT_ICONS;

export interface Department {
  id: string;
  name: string;
  type: DepartmentType;
  icon?: string;
  color?: string;
  description?: string;
  priority: 'high' | 'normal' | 'low';
  is_active?: boolean;
}

export interface SidebarProps {
  departments: Department[];
  isLoading: boolean;
  error: Error | null;
  activeDepartment: Department | null;
  onSelectDepartment: (department: Department) => void;
  collapsed: boolean;
  onToggle: () => void;
  onDepartmentUpdate: () => Promise<void>;
  onDepartmentReorder: (reorderedDepartments: Department[]) => Promise<void>;
}

export type DepartmentColor = keyof typeof import('./Sidebar.constants').DEPARTMENT_COLORS;
export type PriorityType = 'high' | 'normal' | 'low';
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