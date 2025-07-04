// config/api.ts
const config = {
    development: {
        API_BASE_URL: 'http://localhost:4000/api',
        WEBSOCKET_URL: 'http://localhost:4000',
        WEBHOOK_URL: 'http://localhost:4000/webhook',
        EVOLUTION_API_URL: 'https://press-evolution-api.jhkbgs.easypanel.host',
        SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://ajlgjjjvuglwgfnyqqvb.supabase.co',
        SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNzYyNjksImV4cCI6MjA1MDY1MjI2OX0.RP9Dt9TQ0dWVEyKsRjwm7-7qT1K6hPiXj8_gF8qMXCk'
    },
    production: {
        API_BASE_URL: 'https://webhook.bkcrm.devsible.com.br/api',
        WEBSOCKET_URL: 'https://webhook.bkcrm.devsible.com.br',
        WEBHOOK_URL: 'https://webhook.bkcrm.devsible.com.br/webhook',
        EVOLUTION_API_URL: 'https://press-evolution-api.jhkbgs.easypanel.host',
        SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://ajlgjjjvuglwgfnyqqvb.supabase.co',
        SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNzYyNjksImV4cCI6MjA1MDY1MjI2OX0.RP9Dt9TQ0dWVEyKsRjwm7-7qT1K6hPiXj8_gF8qMXCk'
    }
};
const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env.DEV;
export const API_CONFIG = isDevelopment ? config.development : config.production;
// URLs específicas para Evolution API
export const EVOLUTION_CONFIG = {
    BASE_URL: API_CONFIG.EVOLUTION_API_URL,
    GLOBAL_API_KEY: '429683C4C977415CAAFCCE10F7D57E11',
    WEBHOOK_URL: API_CONFIG.WEBHOOK_URL + '/evolution',
    DEFAULT_INSTANCE: 'atendimento-ao-cliente-suporte'
};
// Configuração de ambiente
export const APP_CONFIG = {
    ENV: isDevelopment ? 'development' : 'production',
    DEBUG: isDevelopment,
    VERSION: '1.0.0',
    API_TIMEOUT: 10000,
    WEBSOCKET_RECONNECT_ATTEMPTS: 5,
    WEBSOCKET_RECONNECT_DELAY: 1000
};
export default API_CONFIG;
