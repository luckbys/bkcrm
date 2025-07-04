import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
export function useUserDepartment() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    // Carregar informações do usuário e departamento
    const fetchUserInfo = useCallback(async () => {
        if (!user)
            return;
        try {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select(`
          id,
          name,
          email,
          role,
          department
        `)
                .eq('id', user.id)
                .single();
            if (fetchError)
                throw fetchError;
            setUserInfo(data);
        }
        catch (err) {
            console.error('Erro ao carregar informações do usuário:', err);
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [user]);
    // Atualizar departamento do usuário
    const updateUserDepartment = useCallback(async (departmentId) => {
        if (!user)
            throw new Error('Usuário não autenticado');
        try {
            setLoading(true);
            setError(null);
            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({ department: departmentId })
                .eq('id', user.id)
                .select(`
          id,
          name,
          email,
          role,
          department
        `)
                .single();
            if (updateError)
                throw updateError;
            setUserInfo(data);
            return data;
        }
        catch (err) {
            console.error('Erro ao atualizar departamento:', err);
            setError(err.message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, [user]);
    // Verificar se usuário pode ver todos os tickets (admin sem departamento)
    const canViewAllTickets = useCallback(() => {
        return userInfo?.role === 'admin' && !userInfo?.department;
    }, [userInfo]);
    // Verificar se usuário pode gerenciar departamentos
    const canManageDepartments = useCallback(() => {
        return userInfo?.role === 'admin';
    }, [userInfo]);
    // Verificar se usuário pertence a um departamento específico
    const belongsToDepartment = useCallback((departmentId) => {
        return userInfo?.department === departmentId;
    }, [userInfo]);
    // Carregar informações na inicialização
    useEffect(() => {
        if (user) {
            fetchUserInfo();
        }
    }, [user, fetchUserInfo]);
    return {
        // Dados
        userInfo,
        loading,
        error,
        // Ações
        refreshUserInfo: fetchUserInfo,
        updateUserDepartment,
        // Utilidades
        canViewAllTickets,
        canManageDepartments,
        belongsToDepartment,
    };
}
