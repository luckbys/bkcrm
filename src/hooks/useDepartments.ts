import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DepartmentType } from '../components/crm/Sidebar.types';

export interface Department {
  id: string;
  name: string;
  type: DepartmentType;
  icon?: string;
  color?: string;
  description?: string;
  priority: 'high' | 'normal' | 'low';
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  order?: number;
}

interface DepartmentFromDB {
  id: string;
  name: string;
  type: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  priority: 'high' | 'normal' | 'low';
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
  addDepartment: (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  reorderDepartments: (reorderedDepartments: Department[]) => Promise<void>;
}

export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reorderDepartments = async (reorderedSectors: Department[]) => {
    try {
      console.log('🔄 Reordenando departamentos localmente...');
      setLoading(true);
      setError(null);

      // Atualizar apenas o estado local com a nova ordem
      setDepartments(reorderedSectors);
      
      console.log('✅ Departamentos reordenados localmente');
    } catch (err) {
      console.error('❌ Erro ao reordenar departamentos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao reordenar departamentos';
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      console.log('🔄 Iniciando carregamento dos departamentos...');
      setLoading(true);
      setError(null);

      // Verificar usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Erro ao obter usuário:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      if (!user) {
        console.warn('⚠️ Usuário não autenticado');
        setDepartments([]); // Limpar departamentos se não houver usuário
        return;
      }

      console.log('👤 Usuário autenticado:', user.email);

      // Tentar buscar departamentos
      const { data, error: supabaseError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (supabaseError) {
        console.error('❌ Erro ao buscar departamentos:', supabaseError);
        throw new Error(`Erro ao buscar departamentos: ${supabaseError.message}`);
      }

      if (!data) {
        console.warn('⚠️ Nenhum dado retornado do Supabase');
        setDepartments([]);
        return;
      }

      console.log('📊 Dados brutos recebidos:', data.length, 'departamentos');

      const formattedDepartments: Department[] = data.map(dept => ({
        id: dept.id,
        name: dept.name,
        type: dept.type as DepartmentType,
        description: dept.description || '',
        color: dept.color || '#3B82F6', // Cor padrão se não definida
        icon: dept.icon || 'Headphones', // Ícone padrão se não definido
        priority: dept.priority || 'normal',
        is_active: dept.is_active,
        metadata: dept.metadata || {},
        created_at: dept.created_at,
        updated_at: dept.updated_at,
        order: 0 // Valor padrão já que não existe a coluna order
      }));

      console.log('✅ Departamentos formatados:', formattedDepartments.length);
      setDepartments(formattedDepartments);
      
    } catch (err) {
      console.error('❌ Erro no fetchDepartments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar departamentos';
      setError(new Error(errorMessage));
      setDepartments([]); // Limpar departamentos em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Função refreshDepartments para manter compatibilidade com a interface
  const refreshDepartments = async () => {
    await fetchDepartments();
  };

  // Carregar departamentos na montagem do componente
  useEffect(() => {
    console.log('🔄 useEffect: Carregando departamentos...');
    fetchDepartments();
  }, []);

  // Configurar listener para mudanças em tempo real
  useEffect(() => {
    console.log('🔄 Configurando listener de tempo real...');
    
    const subscription = supabase
      .channel('departments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'departments'
      }, (payload) => {
        console.log('🔔 Mudança detectada em departments:', payload);
        fetchDepartments(); // Recarregar dados quando houver mudanças
      })
      .subscribe((status) => {
        console.log('📡 Status da subscription:', status);
      });

    return () => {
      console.log('🔄 Limpando subscription de departments');
      subscription.unsubscribe();
    };
  }, []);

  const addDepartment = async (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
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
          type: department.type,
          description: department.description,
          color: department.color,
          icon: department.icon,
          is_active: department.is_active,
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
          ...(updates.is_active !== undefined && { is_active: updates.is_active }),
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

  return {
    departments,
    loading,
    error,
    refreshDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    reorderDepartments
  };
} 