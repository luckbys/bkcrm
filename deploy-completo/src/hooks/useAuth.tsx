import React, { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
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
    console.log('🔐 Tentando fazer login com:', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('📋 Resposta do login:', { data, error });

    if (error) {
      console.error('❌ Erro no login:', error);
      
      // Tratamento específico de erros de login
      if (error.message.includes('Email not confirmed')) {
        throw new Error('📧 Email ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação. Você pode reenviar o email de confirmação se necessário.');
      } else if (error.message.includes('Invalid login credentials')) {
        throw new Error('🔒 Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
      } else if (error.message.includes('Too many requests')) {
        throw new Error('⏰ Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.');
      } else if (error.message.includes('User not found')) {
        throw new Error('👤 Usuário não encontrado. Verifique o email ou registre-se primeiro.');
      } else {
        throw error;
      }
    }

    console.log('✅ Login bem-sucedido:', data.user);
  };

  const signUp = async (email: string, password: string, name?: string) => {
    console.log('🚀 Tentando registrar com:', { email, name });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          }
        }
      });

      console.log('📋 Resposta do registro:', { data, error });

      if (error) {
        console.error('❌ Erro no registro Supabase:', error);
        
        // Tratamento específico de erros
        if (error.message.includes('Database error saving new user')) {
          throw new Error('❌ Erro de configuração do banco de dados. Execute o script de correção SQL no painel do Supabase: CORRECAO_REGISTRO_PROFILES.sql');
        } else if (error.message.includes('User already registered')) {
          throw new Error('📧 Este email já está cadastrado. Tente fazer login ou recuperar a senha.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('📧 Email inválido. Verifique o formato do email.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('🔒 Senha muito fraca. Use pelo menos 8 caracteres com letras, números e símbolos.');
        } else {
          throw error;
        }
      }

      if (data.user) {
        console.log('✅ Usuário criado com sucesso:', data.user.id);
        
        if (data.user.email_confirmed_at) {
          console.log('✅ Email já confirmado automaticamente');
        } else {
          console.log('📧 Email de confirmação enviado para:', data.user.email);
          console.log('⚠️ Verifique sua caixa de entrada (incluindo spam) e clique no link de confirmação');
        }
        
        // O trigger automático do banco criará o perfil
        console.log('🔄 Trigger automático criará o perfil...');
      } else {
        throw new Error('💥 Falha na criação do usuário. Tente novamente.');
      }
    } catch (error: any) {
      console.error('💥 Erro completo no registro:', error);
      throw error;
    }
  };

  const resendConfirmation = async (email: string) => {
    console.log('📧 Reenviando email de confirmação para:', email);
    
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('❌ Erro ao reenviar confirmação:', error);
        
        if (error.message.includes('User already confirmed')) {
          throw new Error('✅ Este email já foi confirmado. Tente fazer login.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('⏰ Muitos emails enviados. Aguarde alguns minutos antes de tentar novamente.');
        } else if (error.message.includes('User not found')) {
          throw new Error('👤 Email não encontrado. Verifique se você se registrou com este email.');
        } else {
          throw error;
        }
      }

      console.log('✅ Email de confirmação reenviado com sucesso');
    } catch (error: any) {
      console.error('💥 Erro ao reenviar confirmação:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 Tentando fazer logout');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }

    console.log('✅ Logout bem-sucedido');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp, resendConfirmation }}>
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