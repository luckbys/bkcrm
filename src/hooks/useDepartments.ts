import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Department {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

interface DepartmentFromDB {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: any;
}

interface UseDepartmentsReturn {
  departments: Department[];
  loading: boolean;
  error: Error | null;
  refreshDepartments: () => Promise<void>;
  addDepartment: (department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
}

export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Erro ao obter usuário:', authError);
        throw authError;
      }
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Carregando departamentos...');

      const { data, error: supabaseError } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true })
        .returns<DepartmentFromDB[]>();

      if (supabaseError) throw supabaseError;

      const formattedDepartments: Department[] = (data || []).map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description || undefined,
        color: dept.color,
        icon: dept.icon,
        isActive: dept.is_active,
        createdAt: dept.created_at,
        updatedAt: dept.updated_at,
        metadata: dept.metadata
      }));

      setDepartments(formattedDepartments);
      console.log('Departamentos carregados:', formattedDepartments.length);
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err);
      setError(err instanceof Error ? err : new Error('Erro ao carregar departamentos'));
    } finally {
      setLoading(false);
    }
  };

  const refreshDepartments = async () => {
    await fetchDepartments();
  };

  const addDepartment = async (department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Erro ao obter usuário:', authError);
        throw authError;
      }
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Validar dados obrigatórios
      if (!department.name) {
        throw new Error('Nome é obrigatório');
      }

      // Verificar se o departamento já existe
      const { data: existingDepartment, error: searchError } = await supabase
        .from('departments')
        .select('id')
        .eq('name', department.name)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Erro ao buscar departamento:', searchError);
        throw new Error(searchError.message);
      }

      if (existingDepartment) {
        throw new Error('Já existe um departamento com este nome');
      }

      // Criar novo departamento
      const { error: insertError } = await supabase
        .from('departments')
        .insert({
          name: department.name,
          description: department.description,
          color: department.color,
          icon: department.icon,
          is_active: department.isActive,
          metadata: department.metadata || {}
        });

      if (insertError) {
        console.error('Erro ao criar departamento:', insertError);
        throw new Error(insertError.message);
      }

      await refreshDepartments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar departamento';
      console.error('Erro completo:', err);
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Erro ao obter usuário:', authError);
        throw authError;
      }
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Atualizando departamento:', { id, updates });

      const { error: updateError } = await supabase
        .from('departments')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.color && { color: updates.color }),
          ...(updates.icon && { icon: updates.icon }),
          ...(updates.isActive !== undefined && { is_active: updates.isActive }),
          ...(updates.metadata && { metadata: updates.metadata })
        })
        .eq('id', id);

      if (updateError) {
        console.error('Erro ao atualizar departamento:', updateError);
        throw new Error(updateError.message);
      }

      await refreshDepartments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar departamento';
      console.error('Erro completo:', err);
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Erro ao obter usuário:', authError);
        throw authError;
      }
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Deletando departamento:', { id });

      // Soft delete - apenas marca como inativo
      const { error: deleteError } = await supabase
        .from('departments')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) {
        console.error('Erro ao excluir departamento:', deleteError);
        throw new Error(deleteError.message);
      }

      await refreshDepartments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir departamento';
      console.error('Erro completo:', err);
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return {
    departments,
    loading,
    error,
    refreshDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment
  };
} 