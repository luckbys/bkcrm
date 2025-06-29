import { useState } from 'react';
import type { SectorFormData, PriorityType } from '@/types/sector';
import type { DepartmentType } from '@/components/crm/Sidebar.types';

const initialState: SectorFormData = {
  name: '',
  type: 'support' as DepartmentType,
  icon: 'Headphones',
  color: 'blue',
  description: '',
  priority: 'normal' as PriorityType,
  is_active: true
};

export function useSectorForm() {
  const [form, setForm] = useState<SectorFormData>(initialState);

  const updateForm = (updates: Partial<SectorFormData>) => {
    setForm(prev => ({
      ...prev,
      ...updates
    }));
  };

  const setName = (name: string) => updateForm({ name });
  const setDescription = (description: string) => updateForm({ description });
  const setIcon = (icon: string) => updateForm({ icon });
  const setColor = (color: string) => updateForm({ color });
  const setPriority = (value: string) => {
    if (['high', 'normal', 'low'].includes(value)) {
      updateForm({ priority: value as PriorityType });
    }
  };

  const resetForm = () => {
    setForm(initialState);
  };

  return {
    form,
    updateForm,
    setName,
    setDescription,
    setIcon,
    setColor,
    setPriority,
    resetForm
  };
} 