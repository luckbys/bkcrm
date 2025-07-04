import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Verificar sessão atual
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    role: session.user.user_metadata.role || 'agent',
                    department_id: session.user.user_metadata.department_id,
                    departments: session.user.user_metadata.departments,
                });
            }
            setLoading(false);
        });
        // Escutar mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    role: session.user.user_metadata.role || 'agent',
                    department_id: session.user.user_metadata.department_id,
                    departments: session.user.user_metadata.departments,
                });
            }
            else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            throw error;
        }
    };
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
    };
    const updateUser = async (data) => {
        const { error } = await supabase.auth.updateUser({
            data: {
                ...data,
            },
        });
        if (error) {
            throw error;
        }
        setUser(prev => prev ? { ...prev, ...data } : null);
    };
    return (_jsx(AuthContext.Provider, { value: { user, loading, signIn, signOut, updateUser }, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
