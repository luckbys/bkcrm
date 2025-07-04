import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
export function useDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({});
    const [stats, setStats] = useState({});
    // Carrega os departamentos do Supabase
    const loadDepartments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            let query = supabase
                .from('departments')
                .select('*')
                .order('name');
            // Aplica filtros
            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
            }
            if (filters.priority) {
                query = query.eq('priority', filters.priority);
            }
            const { data, error: supabaseError } = await query;
            if (supabaseError)
                throw supabaseError;
            // Carrega estatísticas dos tickets para cada departamento
            const departmentStats = {};
            for (const dept of data || []) {
                try {
                    const { data: ticketStats, error: ticketError } = await supabase
                        .from('tickets')
                        .select('id, status, is_read')
                        .eq('department_id', dept.id);
                    if (ticketError) {
                        console.warn(`⚠️ Erro ao carregar estatísticas para departamento ${dept.name}:`, ticketError);
                        // Usar valores padrão em caso de erro
                        departmentStats[dept.id] = {
                            totalTickets: 0,
                            unreadTickets: 0,
                            resolvedTickets: 0
                        };
                    }
                    else if (ticketStats) {
                        departmentStats[dept.id] = {
                            totalTickets: ticketStats.length,
                            unreadTickets: ticketStats.filter(t => !t.is_read).length,
                            resolvedTickets: ticketStats.filter(t => t.status === 'resolved').length
                        };
                    }
                }
                catch (error) {
                    console.warn(`⚠️ Erro ao processar estatísticas para departamento ${dept.name}:`, error);
                    // Usar valores padrão em caso de erro
                    departmentStats[dept.id] = {
                        totalTickets: 0,
                        unreadTickets: 0,
                        resolvedTickets: 0
                    };
                }
            }
            // Formata os departamentos com as estatísticas
            const formattedDepartments = (data || []).map(dept => ({
                ...dept,
                totalTickets: departmentStats[dept.id]?.totalTickets || 0,
                unreadTickets: departmentStats[dept.id]?.unreadTickets || 0,
                resolvedTickets: departmentStats[dept.id]?.resolvedTickets || 0,
                priority: dept.priority || 'medium',
                createdAt: new Date(dept.created_at),
                updatedAt: new Date(dept.updated_at)
            }));
            // Se não há departamentos, criar alguns de exemplo
            if (formattedDepartments.length === 0) {
                console.log('🔍 [useDepartments] Nenhum departamento encontrado, criando exemplos...');
                const exampleDepartments = [
                    {
                        id: 'example-1',
                        name: 'Atendimento',
                        totalTickets: 15,
                        unreadTickets: 3,
                        resolvedTickets: 12,
                        priority: 'high',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                    {
                        id: 'example-2',
                        name: 'Vendas',
                        totalTickets: 8,
                        unreadTickets: 2,
                        resolvedTickets: 6,
                        priority: 'medium',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                    {
                        id: 'example-3',
                        name: 'Suporte Técnico',
                        totalTickets: 22,
                        unreadTickets: 5,
                        resolvedTickets: 17,
                        priority: 'high',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ];
                setDepartments(exampleDepartments);
            }
            else {
                setDepartments(formattedDepartments);
            }
            setStats(departmentStats);
            setLoading(false);
        }
        catch (err) {
            console.error('Erro ao carregar departamentos:', err);
            setError('Erro ao carregar departamentos');
            // Em caso de erro, também criar departamentos de exemplo
            console.log('🔍 [useDepartments] Erro no banco, usando departamentos de exemplo...');
            const exampleDepartments = [
                {
                    id: 'example-1',
                    name: 'Atendimento',
                    totalTickets: 15,
                    unreadTickets: 3,
                    resolvedTickets: 12,
                    priority: 'high',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'example-2',
                    name: 'Vendas',
                    totalTickets: 8,
                    unreadTickets: 2,
                    resolvedTickets: 6,
                    priority: 'medium',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'example-3',
                    name: 'Suporte Técnico',
                    totalTickets: 22,
                    unreadTickets: 5,
                    resolvedTickets: 17,
                    priority: 'high',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];
            setDepartments(exampleDepartments);
            setLoading(false);
        }
    }, [filters]);
    // Carrega os departamentos quando os filtros mudam
    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);
    // Adiciona um novo departamento
    const addDepartment = async (name, priority = 'medium', description, icon) => {
        try {
            const { data, error } = await supabase
                .from('departments')
                .insert([{
                    name,
                    priority,
                    ...(description && { description }),
                    ...(icon && { icon })
                }])
                .select()
                .single();
            if (error)
                throw error;
            await loadDepartments();
            return data;
        }
        catch (err) {
            console.error('Erro ao adicionar departamento:', err);
            throw err;
        }
    };
    // Atualiza um departamento
    const updateDepartment = async (id, updates) => {
        try {
            const { error } = await supabase
                .from('departments')
                .update(updates)
                .eq('id', id);
            if (error)
                throw error;
            await loadDepartments();
        }
        catch (err) {
            console.error('Erro ao atualizar departamento:', err);
            throw err;
        }
    };
    // Arquiva um departamento
    const archiveDepartment = async (id) => {
        try {
            const { error } = await supabase
                .from('departments')
                .update({ is_active: false })
                .eq('id', id);
            if (error)
                throw error;
            await loadDepartments();
        }
        catch (err) {
            console.error('Erro ao arquivar departamento:', err);
            throw err;
        }
    };
    // Atualiza os filtros
    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };
    // Limpa os filtros
    const clearFilters = () => {
        setFilters({});
    };
    return {
        departments,
        loading,
        error,
        stats,
        filters,
        addDepartment,
        updateDepartment,
        archiveDepartment,
        updateFilters,
        clearFilters,
        refresh: loadDepartments
    };
}
