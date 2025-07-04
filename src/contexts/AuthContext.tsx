import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'agent';
  department_id?: string;
  departments?: {
    id: string;
    name: string;
    is_active: boolean;
  }[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
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
          email: session.user.email!,
          role: session.user.user_metadata.role || 'agent',
          department_id: session.user.user_metadata.department_id,
          departments: session.user.user_metadata.departments,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
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

  const updateUser = async (data: Partial<User>) => {
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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
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