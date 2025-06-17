import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, CustomerFromDB } from '@/types/customer';

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: Error | null;
  refreshCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCustomers = async () => {
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

      // Garantir que o perfil do usuário existe
      await ensureUserProfile(user);

      console.log('Usuário atual:', { id: user.id, email: user.email });

      // ✅ CORREÇÃO: Usar tabela 'profiles' ao invés de 'customers'
      // Buscar apenas profiles com role 'customer'
      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          metadata,
          is_active,
          created_at,
          updated_at
        `)
        .eq('role', 'customer')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .returns<any[]>();

      if (supabaseError) throw supabaseError;

      const formattedCustomers: Customer[] = (data || []).map(profile => {
        const metadata = profile.metadata || {};
        return {
          id: profile.id,
          name: profile.name || 'Cliente',
          email: profile.email,
          phone: metadata.phone || '',
          document: metadata.document || '',
          documentType: metadata.document_type || 'cpf',
          company: metadata.company || '',
          position: metadata.position || '',
          address: metadata.address || {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
          },
          status: metadata.status || 'prospect',
          category: metadata.category || 'bronze',
          channel: metadata.channel || 'whatsapp',
          tags: metadata.tags || [],
          notes: metadata.notes || '',
          customerSince: profile.created_at,
          lastInteraction: metadata.last_whatsapp_contact || profile.created_at,
          totalOrders: metadata.total_orders || 0,
          totalValue: metadata.total_value || 0,
          averageTicket: metadata.average_ticket || 0,
          responsibleAgent: metadata.responsible_agent || '',
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        };
      });

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError(err instanceof Error ? err : new Error('Erro ao carregar clientes'));
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para garantir que o perfil do usuário existe
  const ensureUserProfile = async (user: any) => {
    try {
      // Verificar se o perfil já existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar perfil:', checkError);
        throw checkError;
      }

      // Se o perfil não existe, criar
      if (!existingProfile) {
        console.log('Criando perfil para usuário:', user.id);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            role: 'admin' // Default role
          });

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
          throw new Error(`Erro ao criar perfil: ${insertError.message}`);
        } else {
          console.log('Perfil criado com sucesso para o usuário');
        }
      }
    } catch (err) {
      console.error('Erro ao garantir perfil do usuário:', err);
      throw err;
    }
  };

  const refreshCustomers = async () => {
    await fetchCustomers();
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
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

      // Garantir que o perfil do usuário existe
      await ensureUserProfile(user);

      // Validar dados obrigatórios
      if (!customer.email || !customer.name) {
        throw new Error('Email e nome são obrigatórios');
      }

      // Verificar se o cliente já existe
      const { data: existingCustomer, error: searchError } = await supabase
        .from('profiles')
        .select('id, is_active')
        .eq('email', customer.email)
        .eq('role', 'customer')
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = não encontrado
        console.error('Erro ao buscar cliente:', searchError);
        throw new Error(searchError.message);
      }

      if (existingCustomer) {
        if (!existingCustomer.is_active) {
          // Reativar cliente
          const { error: reactivateError } = await supabase
            .from('profiles')
            .update({ is_active: true })
            .eq('id', existingCustomer.id);

          if (reactivateError) {
            console.error('Erro ao reativar cliente:', reactivateError);
            throw new Error(reactivateError.message);
          }
        } else {
          throw new Error('Cliente já cadastrado com este email');
        }
      } else {
        // Criar novo cliente na tabela profiles
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            name: customer.name,
            email: customer.email,
            role: 'customer',
            is_active: true,
            metadata: {
              phone: customer.phone,
              document: customer.document,
              document_type: customer.documentType,
              company: customer.company,
              position: customer.position,
              address: customer.address,
              status: customer.status,
              category: customer.category,
              channel: customer.channel,
              tags: customer.tags,
              notes: customer.notes,
              total_orders: customer.totalOrders,
              total_value: customer.totalValue,
              average_ticket: customer.averageTicket,
              responsible_agent: user.id,
              created_via: 'manual_form'
            }
          });

        if (insertError) {
          console.error('Erro ao criar cliente:', insertError);
          throw new Error(insertError.message);
        }
      }

      await refreshCustomers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar cliente';
      console.error('Erro completo:', err);
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
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

      console.log('Usuário atual:', { id: user.id, email: user.email });

      // Buscar metadata atual do cliente
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', id)
        .eq('role', 'customer')
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar cliente: ${fetchError.message}`);
      }

      const currentMetadata = currentProfile.metadata || {};
      
      // Atualizar metadata com novos valores
      const updatedMetadata = {
        ...currentMetadata,
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.document && { document: updates.document }),
        ...(updates.documentType && { document_type: updates.documentType }),
        ...(updates.company && { company: updates.company }),
        ...(updates.position && { position: updates.position }),
        ...(updates.address && { address: updates.address }),
        ...(updates.status && { status: updates.status }),
        ...(updates.category && { category: updates.category }),
        ...(updates.channel && { channel: updates.channel }),
        ...(updates.tags && { tags: updates.tags }),
        ...(updates.notes && { notes: updates.notes }),
        ...(updates.totalOrders && { total_orders: updates.totalOrders }),
        ...(updates.totalValue && { total_value: updates.totalValue }),
        ...(updates.averageTicket && { average_ticket: updates.averageTicket }),
        last_interaction: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.email && { email: updates.email }),
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('role', 'customer');

      if (updateError) {
        console.error('Erro ao atualizar cliente:', updateError);
        throw new Error(updateError.message);
      }

      await refreshCustomers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      console.error('Erro completo:', err);
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
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

      console.log('Usuário atual:', { id: user.id, email: user.email });

      // Soft delete - apenas marca como inativo
      const { error: deleteError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)
        .eq('role', 'customer');

      if (deleteError) {
        console.error('Erro ao excluir cliente:', deleteError);
        throw new Error(deleteError.message);
      }

      await refreshCustomers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      console.error('Erro completo:', err);
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    refreshCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer
  };
} 