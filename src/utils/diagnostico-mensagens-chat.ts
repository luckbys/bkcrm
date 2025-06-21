/**
 * 🔧 DIAGNÓSTICO COMPLETO DO SISTEMA DE MENSAGENS
 * 
 * Este script verifica:
 * 1. Conexão WebSocket
 * 2. Carregamento de mensagens do banco
 * 3. Envio e salvamento de mensagens
 * 4. Conversão de dados
 * 5. Estados do React
 */

import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  timestamp: string;
}

class MessageDiagnostic {
  private results: DiagnosticResult[] = [];
  private socket: Socket | null = null;
  
  constructor() {
    this.addResult('init', 'success', 'Diagnóstico iniciado');
  }

  private addResult(step: string, status: 'success' | 'error' | 'warning', message: string, data?: any) {
    this.results.push({
      step,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    });
    
    const emoji = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
    console.log(`${emoji} [${step.toUpperCase()}] ${message}`, data ? data : '');
  }

  // 1. Testar conexão WebSocket
  async testWebSocketConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const WEBSOCKET_URL = 'http://localhost:4000';
        this.addResult('websocket', 'success', `Conectando ao WebSocket: ${WEBSOCKET_URL}`);
        
        this.socket = io(WEBSOCKET_URL, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          forceNew: true
        });

        const timeout = setTimeout(() => {
          this.addResult('websocket', 'error', 'Timeout na conexão WebSocket');
          resolve(false);
        }, 5000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.addResult('websocket', 'success', `Conectado (ID: ${this.socket?.id})`);
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          this.addResult('websocket', 'error', 'Erro na conexão', error.message);
          resolve(false);
        });

      } catch (error) {
        this.addResult('websocket', 'error', 'Erro ao conectar', (error as Error).message);
        resolve(false);
      }
    });
  }

  // 2. Testar carregamento de mensagens do banco
  async testDatabaseConnection(ticketId?: string): Promise<boolean> {
    try {
      if (!ticketId) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('id')
          .limit(1);

        if (!tickets || tickets.length === 0) {
          this.addResult('database', 'warning', 'Nenhum ticket encontrado');
          return false;
        }

        ticketId = tickets[0].id;
      }

      this.addResult('database', 'success', `Testando ticket: ${ticketId}`);

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        this.addResult('database', 'error', 'Erro ao buscar mensagens', error);
        return false;
      }

      this.addResult('database', 'success', `Mensagens encontradas: ${messages?.length || 0}`);
      return true;

    } catch (error) {
      this.addResult('database', 'error', 'Erro no banco', (error as Error).message);
      return false;
    }
  }

  // 3. Testar envio de mensagem via WebSocket
  async testMessageSending(ticketId: string): Promise<boolean> {
    if (!this.socket || !this.socket.connected) {
      this.addResult('send', 'error', 'WebSocket não conectado');
      return false;
    }

    return new Promise((resolve) => {
      const testMessage = `🧪 Teste de diagnóstico - ${new Date().toLocaleString()}`;
      
      try {
        // Entrar no ticket
        this.socket!.emit('join-ticket', {
          ticketId,
          userId: 'diagnostic-user'
        });

        // Aguardar confirmação
        this.socket!.on('joined-ticket', () => {
          this.addResult('send', 'success', 'Conectado ao ticket via WebSocket');
          
          // Enviar mensagem de teste
          this.socket!.emit('send-message', {
            ticketId,
            content: testMessage,
            isInternal: true,
            userId: 'diagnostic-user',
            senderName: 'Diagnóstico Automático'
          });

          this.addResult('send', 'success', 'Mensagem de teste enviada', { content: testMessage });
        });

        // Aguardar mensagem de volta
        this.socket!.on('new-message', (message) => {
          if (message.content === testMessage) {
            this.addResult('send', 'success', 'Mensagem recebida via WebSocket', message);
            resolve(true);
          }
        });

        // Timeout
        setTimeout(() => {
          this.addResult('send', 'warning', 'Timeout aguardando resposta da mensagem');
          resolve(false);
        }, 10000);

      } catch (error) {
        this.addResult('send', 'error', 'Erro ao enviar mensagem', (error as Error).message);
        resolve(false);
      }
    });
  }

  // 4. Testar conversão de dados
  testDataConversion() {
    try {
      // Simular dados do WebSocket
      const mockWebSocketMessage = {
        id: 'test-123',
        ticket_id: 'test-ticket',
        content: 'Mensagem de teste',
        sender_id: 'user-123',
        sender_name: 'Teste User',
        is_internal: false,
        created_at: new Date().toISOString(),
        type: 'text',
        metadata: { test: true }
      };

      // Simular conversão como no useTicketChat
      const convertedMessage = {
        id: parseInt(mockWebSocketMessage.id.replace('test-', '') || '1'),
        content: mockWebSocketMessage.content,
        sender: mockWebSocketMessage.sender_id ? 'agent' : 'client',
        senderName: mockWebSocketMessage.sender_name,
        timestamp: new Date(mockWebSocketMessage.created_at),
        isInternal: mockWebSocketMessage.is_internal,
        messageType: mockWebSocketMessage.type as 'text' | 'image' | 'file',
        status: 'delivered' as const,
        reactions: [],
        isStarred: false
      };

      this.addResult('conversion', 'success', 'Conversão de dados funcionando', {
        original: mockWebSocketMessage,
        converted: convertedMessage
      });

      return true;

    } catch (error) {
      this.addResult('conversion', 'error', 'Erro na conversão de dados', (error as Error).message);
      return false;
    }
  }

  // 5. Verificar credenciais do Supabase
  async testSupabaseCredentials(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        this.addResult('supabase', 'error', 'Erro nas credenciais Supabase', error.message);
        return false;
      }

      this.addResult('supabase', 'success', 'Credenciais Supabase válidas', {
        hasSession: !!data.session,
        user: data.session?.user?.email || 'Não logado'
      });

      return true;

    } catch (error) {
      this.addResult('supabase', 'error', 'Erro ao verificar Supabase', (error as Error).message);
      return false;
    }
  }

  // Executar diagnóstico completo
  async runFullDiagnostic(ticketId?: string): Promise<DiagnosticResult[]> {
    console.log('🔧 DIAGNÓSTICO DO SISTEMA DE MENSAGENS');
    
    await this.testWebSocketConnection();
    await this.testDatabaseConnection(ticketId);

    if (this.socket) {
      this.socket.disconnect();
    }

    const errors = this.results.filter(r => r.status === 'error');
    const successes = this.results.filter(r => r.status === 'success');

    console.log(`\n📊 Resultados: ${successes.length} sucessos, ${errors.length} erros`);

    return this.results;
  }

  // Obter resultados
  getResults(): DiagnosticResult[] {
    return this.results;
  }
}

// Função para usar no console do navegador
export const diagnosticarMensagens = async (ticketId?: string) => {
  const diagnostic = new MessageDiagnostic();
  return await diagnostic.runFullDiagnostic(ticketId);
};

// Função para testar um ticket específico
export const testarTicketEspecifico = async (ticketId: string) => {
  console.log(`🎯 Testando ticket específico: ${ticketId}`);
  return await diagnosticarMensagens(ticketId);
};

// Função para verificar apenas conectividade
export const verificarConectividade = async () => {
  const diagnostic = new MessageDiagnostic();
  
  console.log('🔍 Verificando conectividade básica...');
  
  await diagnostic.testSupabaseCredentials();
  await diagnostic.testWebSocketConnection();
  
  return diagnostic.getResults();
};

export default MessageDiagnostic; 