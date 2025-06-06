import React, { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se há uma sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Sessão atual:', session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Mudança de estado de autenticação:', { event: _event, session });
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Tentando fazer login com:', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Resposta do login:', { data, error });

    if (error) {
      console.error('Erro no login:', error);
      throw error;
    }

    console.log('Login bem-sucedido:', data.user);
  };

  const signUp = async (email: string, password: string) => {
    console.log('Tentando registrar com:', { email });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('Resposta do registro:', { data, error });

    if (error) {
      console.error('Erro no registro:', error);
      throw error;
    }

    console.log('Registro bem-sucedido:', data.user);
  };

  const signOut = async () => {
    console.log('Tentando fazer logout');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erro no logout:', error);
      throw error;
    }

    console.log('Logout bem-sucedido');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 