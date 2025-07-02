import React from 'react';
import { Briefcase, Headphones, ShoppingCart, Megaphone, Code, CreditCard, Users, Shield, Settings, Truck } from 'lucide-react';
import type { DepartmentType } from './Sidebar.types';

const departmentTypeToIcon: Record<DepartmentType, typeof Briefcase> = {
  default: Briefcase,
  support: Headphones,
  sales: ShoppingCart,
  marketing: Megaphone,
  development: Code,
  finance: CreditCard,
  hr: Users,
  legal: Shield,
  operations: Settings,
  logistics: Truck
};

export const getDepartmentIcon = (type: DepartmentType): JSX.Element => {
  const Icon = departmentTypeToIcon[type] || departmentTypeToIcon.default;
  return React.createElement(Icon, { className: "h-5 w-5" });
};

export const formatTicketCount = (count: number): string => {
  if (count > 999) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

export const getPriorityColor = (priority: Department['priority']): string => {
  switch (priority) {
    case 'high':
      return 'text-red-400 bg-red-500/10';
    case 'normal':
      return 'text-yellow-400 bg-yellow-500/10';
    case 'low':
      return 'text-green-400 bg-green-500/10';
    default:
      return 'text-slate-400 bg-slate-500/10';
  }
};

export const validateDepartmentForm = (data: Partial<Department>) => {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'Nome é obrigatório';
  }

  if (!data.type) {
    errors.type = 'Tipo é obrigatório';
  }

  if (!data.priority) {
    errors.priority = 'Prioridade é obrigatória';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const sortDepartments = (departments: Department[]): Department[] => {
  return [...departments].sort((a, b) => {
    // Primeiro por prioridade
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Depois por nome
    return a.name.localeCompare(b.name);
  });
}; 