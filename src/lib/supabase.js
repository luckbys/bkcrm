import { createClient } from '@supabase/supabase-js';
// Tenta obter as variáveis de ambiente de diferentes fontes
const getEnvVar = (key) => {
    // Tenta obter do import.meta.env primeiro
    if (import.meta.env[key]) {
        return import.meta.env[key];
    }
    // Tenta obter do window.env (caso esteja usando o env.js)
    if (typeof window !== 'undefined' && window.env && window.env[key]) {
        return window.env[key];
    }
    // Tenta obter do process.env (caso esteja usando Node.js)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    // Valores padrão para desenvolvimento local - CHAVES CORRETAS
    const defaults = {
        VITE_SUPABASE_URL: 'https://ajlgjjjvuglwgfnyqqvb.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU'
    };
    return defaults[key];
};
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
const enableRealtime = getEnvVar('VITE_ENABLE_REALTIME') !== 'false';
const debugMode = getEnvVar('VITE_DEBUG_MODE') === 'true';
console.log('🔧 Configuração Supabase:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    anonKeyLength: supabaseAnonKey?.length || 0,
    realtimeEnabled: enableRealtime,
    debugMode: debugMode,
    source: window.env ? 'window.env' : import.meta.env.VITE_SUPABASE_URL ? 'import.meta.env' : 'defaults'
});
if (!supabaseUrl || !supabaseAnonKey) {
    const error = 'Supabase URL e Anon Key são necessários.';
    console.error('❌', error);
    throw new Error(error);
}
// Configurações para Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
        storageKey: 'bkcrm-supabase-auth',
        flowType: 'pkce',
        debug: debugMode
    },
    realtime: enableRealtime ? {
        timeout: 20000,
        heartbeatIntervalMs: 15000,
        params: {
            eventsPerSecond: 10
        },
        headers: {
            'X-Client-Info': 'bkcrm-client',
            'User-Agent': 'BKCRM/1.0.0'
        }
    } : undefined,
    global: {
        headers: {
            'X-Client-Info': 'bkcrm-client',
            'apikey': supabaseAnonKey
        }
    }
});
// Conectar ao Realtime apenas se habilitado
if (enableRealtime) {
    let connectionAttempts = 0;
    const maxAttempts = 3;
    const connectRealtime = () => {
        try {
            console.log('🔗 Tentando conectar ao Supabase Realtime...');
            supabase.realtime.connect();
            // Verificar status da conexão após um tempo
            setTimeout(() => {
                const isConnected = supabase.realtime.isConnected?.() || false;
                if (isConnected) {
                    console.log('✅ Supabase Realtime: Conectado com sucesso');
                }
                else {
                    console.warn('⚠️ Supabase Realtime: Conexão não estabelecida');
                    // Tentar reconectar se ainda há tentativas
                    if (connectionAttempts < maxAttempts) {
                        connectionAttempts++;
                        console.log(`🔄 Tentativa de reconexão ${connectionAttempts}/${maxAttempts}`);
                        setTimeout(connectRealtime, 5000);
                    }
                    else {
                        console.log('📴 Máximo de tentativas atingido - Sistema funcionará sem tempo real');
                        window.realtimeDisabled = true;
                    }
                }
            }, 3000);
        }
        catch (error) {
            console.warn('⚠️ Erro ao inicializar Realtime:', error);
            console.log('📴 Sistema funcionará em modo offline para tempo real');
        }
    };
    // Iniciar conexão
    connectRealtime();
}
else {
    console.log('📴 Realtime desabilitado - Sistema funcionará com polling manual');
}
// Add authentication state listener com logs detalhados
supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state changed:', event, {
        hasSession: !!session,
        userEmail: session?.user?.email,
        accessToken: session?.access_token ? 'presente' : 'ausente',
        refreshToken: session?.refresh_token ? 'presente' : 'ausente'
    });
    if (event === 'SIGNED_IN') {
        console.log('✅ User signed in successfully:', session?.user?.email);
    }
    else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
    }
    else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Auth token refreshed');
    }
    else if (event === 'INITIAL_SESSION') {
        console.log('🔑 Initial session:', session ? 'encontrada' : 'não encontrada');
    }
});
// Funções auxiliares para autenticação com melhor tratamento de erros
export const signIn = async (email, password) => {
    console.log('🔐 Tentando fazer login com:', { email });
    try {
        // Verificar se o cliente Supabase está configurado corretamente
        console.log('📋 Configuração do cliente:', {
            url: supabaseUrl,
            hasKey: !!supabaseAnonKey,
            keyStart: supabaseAnonKey?.substring(0, 20) + '...',
        });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        console.log('📋 Resposta do login:', { data: !!data, error: error?.message });
        if (error) {
            console.error('❌ Erro no login:', error.message);
            // Tratar diferentes tipos de erro
            if (error.message.includes('Invalid API key')) {
                throw new Error('Chave da API do Supabase inválida. Verifique a configuração no dashboard do Supabase.');
            }
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('Email ou senha incorretos.');
            }
            if (error.message.includes('Email not confirmed')) {
                throw new Error('Email não confirmado. Verifique seu email e clique no link de confirmação.');
            }
            throw error;
        }
        console.log('✅ Login successful:', data.user?.email);
        return { data, error: null };
    }
    catch (error) {
        console.error('❌ Login failed:', error.message);
        return { data: null, error };
    }
};
export const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    return { data, error };
};
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};
export const getProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
};
export const updateProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    return { data, error };
};
export const createTicket = async (ticket) => {
    const { data, error } = await supabase
        .from('tickets')
        .insert([ticket])
        .select();
    return { data, error };
};
export const updateTicket = async (ticketId, updates) => {
    const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select();
    return { data, error };
};
export const getTickets = async (filters) => {
    let query = supabase.from('tickets').select('*');
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                query = query.eq(key, value);
            }
        });
    }
    const { data, error } = await query;
    return { data, error };
};
export const createMessage = async (message) => {
    const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select();
    return { data, error };
};
export const getMessages = async (ticketId) => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
    return { data, error };
};
export const uploadFile = async (bucket, path, file) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);
    return { data, error };
};
export const getFileUrl = (bucket, path) => {
    return supabase.storage.from(bucket).getPublicUrl(path);
};
// Função de diagnóstico melhorada
window.diagnoseSupabaseConnection = async () => {
    const status = {
        config: {
            url: supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
            anonKeyLength: supabaseAnonKey?.length || 0,
            realtimeEnabled: enableRealtime,
            debugMode: debugMode
        },
        realtime: {
            isConnected: enableRealtime ? (supabase.realtime.isConnected?.() || false) : 'disabled'
        },
        auth: await supabase.auth.getUser(),
        session: await supabase.auth.getSession(),
        timestamp: new Date().toISOString()
    };
    console.log('🔍 Diagnóstico Supabase completo:', status);
    return status;
};
// Função para testar conexão básica
window.testSupabaseConnection = async () => {
    try {
        console.log('🧪 Testando conexão com Supabase...');
        // Teste 1: Verificar se consegue acessar o endpoint de health
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });
        console.log('📡 Status da resposta:', response.status, response.statusText);
        if (response.ok) {
            console.log('✅ Conexão com Supabase funcionando');
            return { success: true, status: response.status };
        }
        else {
            console.error('❌ Falha na conexão:', response.status, response.statusText);
            return { success: false, status: response.status, error: response.statusText };
        }
    }
    catch (error) {
        console.error('❌ Erro no teste de conexão:', error.message);
        return { success: false, error: error.message };
    }
};
