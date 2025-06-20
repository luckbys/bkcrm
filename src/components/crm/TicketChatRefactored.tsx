import React, { useState, useCallback } from 'react';
import { 
  Send, 
  Minimize2, 
  X, 
  Phone, 
  Mail, 
  User, 
  MessageSquare, 
  Paperclip, 
  Smile, 
  Search, 
  Star, 
  Settings, 
  Copy, 
  Reply, 
  Heart, 
  FileText, 
  Image, 
  Mic, 
  Info 
} from 'lucide-react';
import { useTicketChat } from '../../hooks/useTicketChat';

interface TicketChatProps {
  ticket: any;
  onClose: () => void;
  onMinimize?: () => void;
}

const TicketChatRefactored: React.FC<TicketChatProps> = ({ ticket, onClose, onMinimize }) => {
  // 🚀 INTEGRAÇÃO COM SISTEMA REAL DE MENSAGENS
  const chatState = useTicketChat(ticket);

  // Estados locais para UX
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Templates de resposta rápida
  const quickTemplates = [
    { id: 1, title: 'Saudação', content: 'Olá! Como posso ajudá-lo hoje?', category: 'greeting' },
    { id: 2, title: 'Aguarde', content: 'Um momento, por favor. Estou verificando as informações...', category: 'status' },
    { id: 3, title: 'Informações', content: 'Preciso de algumas informações adicionais para melhor atendê-lo.', category: 'request' },
    { id: 4, title: 'Finalização', content: 'Obrigado por entrar em contato! Há mais alguma coisa em que posso ajudar?', category: 'closing' }
  ];

  // Emojis disponíveis
  const availableEmojis = ['👍', '❤️', '😊', '😢', '😮', '😡', '🎉', '👏', '🔥', '💯'];

  // 🚀 TODOS OS HOOKS useCallback ANTES DE QUALQUER RENDERIZAÇÃO CONDICIONAL
  // Funções de interação com mensagens
  const toggleStarMessage = useCallback((messageId: number) => {
    chatState.toggleMessageFavorite(messageId);
  }, [chatState]);

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const replyToMessage = useCallback((messageId: number) => {
    const messageToReply = chatState.realTimeMessages.find(m => m.id === messageId);
    if (messageToReply) {
      chatState.setMessage(`@${messageToReply.senderName}: `);
    }
  }, [chatState]);

  const handleTemplateSelect = useCallback((template: any) => {
    chatState.setMessage(template.content);
    setShowTemplates(false);
  }, [chatState]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    chatState.setMessage(chatState.message + emoji);
    setShowEmojiPicker(false);
  }, [chatState]);

  // Filtrar mensagens baseado na busca
  const getFilteredMessages = useCallback(() => {
    if (!chatState.messageSearchTerm) return chatState.realTimeMessages;
    return chatState.realTimeMessages.filter(msg => 
      msg.content.toLowerCase().includes(chatState.messageSearchTerm.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(chatState.messageSearchTerm.toLowerCase())
    );
  }, [chatState.realTimeMessages, chatState.messageSearchTerm]);

  // 🚀 RENDERIZAÇÃO CONDICIONAL APÓS TODOS OS HOOKS
  // Verificar se chat está carregado
  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Nenhum ticket selecionado</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (chatState.isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          </div>
          <p className="text-blue-700 font-medium mb-2">Carregando mensagens...</p>
          <p className="text-sm text-blue-600">Conectando com {chatState.currentTicket?.client || 'cliente'}</p>
        </div>
      </div>
    );
  }

  // Função para obter informações do cliente
  const clientInfo = chatState.extractClientInfo(chatState.currentTicket);

  // Funções de utilidade
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'atendimento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finalizado': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'whatsapp': return '📱';
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'web': return '🌐';
      default: return '💬';
    }
  };

  const formatTime = (date: Date | string | number) => {
    try {
      // Converter para Date se necessário
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Verificar se é uma data válida
      if (isNaN(dateObj.getTime())) {
        return 'Agora';
      }
      
      return dateObj.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.warn('⚠️ Erro ao formatar timestamp:', { date, error });
      return 'Agora';
    }
  };

  return (
    <div className="chat-container flex h-full w-full bg-gray-50 overflow-hidden">
      {/* Chat Principal */}
      <div className={`chat-main-content flex flex-col bg-white transition-all duration-300 h-full overflow-hidden ${
        chatState.showSidebar ? 'flex-1 min-w-0' : 'w-full'
      }`}>
        {/* Header - Altura fixa */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Informações do Cliente */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{clientInfo.clientName}</h3>
                <p className="text-blue-100 text-sm">
                  {getChannelIcon(chatState.currentTicket?.channel)} {chatState.currentTicket?.channel || 'Chat'} 
                  {clientInfo.isWhatsApp && ' • WhatsApp'}
                  {chatState.isRealtimeConnected ? ' • Online' : ' • Conectando...'}
                </p>
              </div>
            </div>

            {/* Controles do Header */}
            <div className="flex items-center space-x-2">
              {/* Barra de Busca */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar mensagens..."
                  value={chatState.messageSearchTerm}
                  onChange={(e) => chatState.setMessageSearchTerm(e.target.value)}
                  className={`bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-300 ${
                    chatState.showSidebar ? 'w-32 lg:w-40' : 'w-48 lg:w-64'
                  }`}
                />
                <Search className="absolute right-2 top-1.5 w-4 h-4 text-white/60" />
              </div>
              
              {/* Botões de Ação */}
              <button 
                onClick={chatState.toggleSidebar}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Informações do ticket"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {onMinimize && (
                <button 
                  onClick={onMinimize}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Minimizar"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={onClose}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Informações do Ticket */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <span>Ticket #{chatState.currentTicket?.id}</span>
              <span>{chatState.currentTicket?.subject || chatState.currentTicket?.title || 'Atendimento Geral'}</span>
              <span>Cliente: {clientInfo.clientName}</span>
              {clientInfo.isWhatsApp && (
                <span className="bg-green-500/20 px-2 py-1 rounded-full text-xs">
                  📱 WhatsApp
                </span>
              )}
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(chatState.currentTicket?.status)}`}>
              {chatState.currentTicket?.status || 'Ativo'}
            </div>
          </div>

          {/* Indicador de conexão em tempo real */}
          {chatState.lastUpdateTime && (
            <div className="mt-2 text-xs text-blue-200">
              Última atualização: {formatTime(chatState.lastUpdateTime)}
              {chatState.isRealtimeConnected && (
                <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              )}
            </div>
          )}
        </div>

        {/* Área de Mensagens */}
        <div className="chat-messages-area flex-1 p-4 overflow-y-auto bg-gray-50 min-h-0">
          <div className={`space-y-4 mx-auto transition-all duration-300 ${
            chatState.showSidebar ? 'max-w-2xl' : 'max-w-4xl'
          }`}>
            {/* Estado vazio */}
            {getFilteredMessages().length === 0 && !chatState.isLoadingHistory && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {chatState.messageSearchTerm ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem ainda'}
                </h3>
                <p className="text-gray-600">
                  {chatState.messageSearchTerm 
                    ? 'Tente ajustar sua busca para encontrar mensagens.'
                    : 'Inicie a conversa enviando uma mensagem.'
                  }
                </p>
              </div>
            )}

            {/* Mensagens REAIS do sistema */}
            {getFilteredMessages().map((msg) => {
              // Verificação de segurança para evitar erros
              if (!msg || !msg.id) {
                return null;
              }

              return (
              <div 
                key={msg.id}
                className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`group max-w-xs lg:max-w-md relative ${
                  msg.isInternal 
                    ? 'bg-amber-100 border-amber-300 border-2 border-dashed text-amber-800'
                    : msg.sender === 'agent' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border shadow-sm'
                } rounded-2xl px-4 py-3 hover:shadow-md transition-shadow`}>
                  
                  {/* Avatar para mensagens do cliente */}
                  {msg.sender === 'client' && (
                    <div className="absolute -left-8 top-1 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">
                      {clientInfo.clientName?.charAt(0) || 'C'}
                    </div>
                  )}

                  {/* Badge para nota interna */}
                  {msg.isInternal && (
                    <div className="absolute -top-2 -left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      PRIVADA
                    </div>
                  )}
                  
                  {/* Conteúdo da mensagem */}
                  <p className={`text-sm ${
                    msg.isInternal 
                      ? 'text-amber-800 font-medium' 
                      : msg.sender === 'agent' 
                        ? 'text-white' 
                        : 'text-gray-800'
                  }`}>
                    {msg.content || 'Mensagem sem conteúdo'}
                  </p>
                  
                  {/* Timestamp e status */}
                  <div className={`flex items-center justify-between mt-1 text-xs ${
                    msg.isInternal 
                      ? 'text-amber-600'
                      : msg.sender === 'agent' 
                        ? 'text-blue-100' 
                        : 'text-gray-500'
                  }`}>
                    <span>{formatTime(msg.timestamp || new Date())}</span>
                    <span className="ml-2">{msg.senderName || 'Usuário'}</span>
                    {msg.sender === 'agent' && (
                      <span className="ml-2">✓✓</span>
                    )}
                  </div>

                  {/* Estrela para mensagens favoritas */}
                  {chatState.favoriteMessages.has(msg.id) && (
                    <div className="absolute -top-1 -right-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    </div>
                  )}

                  {/* Ações no hover */}
                  <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg border p-1 flex space-x-1 z-10">
                    <button 
                      onClick={() => toggleStarMessage(msg.id)}
                      className={`p-1 hover:bg-gray-100 rounded text-xs transition-colors ${
                        chatState.favoriteMessages.has(msg.id) ? 'text-yellow-500' : 'text-gray-600'
                      }`}
                      title="Favoritar"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => copyMessage(msg.content)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-600 text-xs transition-colors"
                      title="Copiar"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => replyToMessage(msg.id)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-600 text-xs transition-colors"
                      title="Responder"
                    >
                      <Reply className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Área de Input - Altura fixa */}
        <div className="chat-input-area border-t bg-white p-4 flex-shrink-0 relative z-10">
          <div className={`mx-auto transition-all duration-300 ${
            chatState.showSidebar ? 'max-w-2xl' : 'max-w-4xl'
          }`}>
            {/* Templates de Resposta Rápida */}
            {showTemplates && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Templates de Resposta</h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="text-left p-2 bg-white rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-800">{template.title}</div>
                      <div className="text-xs text-gray-500 truncate">{template.content}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Picker de Emoji */}
            {showEmojiPicker && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Emojis</h4>
                <div className="flex flex-wrap gap-2">
                  {availableEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-lg hover:scale-110 transition-transform p-1 rounded hover:bg-white"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Barra de ferramentas */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {/* Toggle para nota interna */}
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={chatState.isInternal}
                      onChange={(e) => chatState.setIsInternal(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    <span className={`ml-2 text-sm font-medium ${chatState.isInternal ? 'text-amber-600' : 'text-gray-600'}`}>
                      {chatState.isInternal ? 'Nota Interna (Privada)' : 'Resposta ao Cliente'}
                    </span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-1 ml-4">
                  <button 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`p-2 rounded-lg transition-colors ${
                      showTemplates ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="Templates"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-lg transition-colors ${
                      showEmojiPicker ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="Emojis"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Anexar arquivo">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Gravar áudio">
                    <Mic className="w-4 h-4" />
                  </button>
                  
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Imagem">
                    <Image className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                {chatState.message.length}/1000 • {chatState.message.split(' ').filter(w => w.trim()).length} palavras
                {chatState.isSending && <span className="ml-2 text-blue-500">Enviando...</span>}
              </div>
            </div>

            {/* Input principal */}
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={chatState.message}
                  onChange={(e) => chatState.setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      chatState.handleSendMessage();
                    }
                  }}
                  placeholder={chatState.isInternal ? "Digite uma nota interna (apenas para a equipe)..." : "Digite sua mensagem para o cliente..."}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[48px] max-h-32 transition-all duration-300"
                  rows={1}
                  disabled={chatState.isSending}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
                
                {/* Indicador de caracteres */}
                {chatState.message.length > 800 && (
                  <div className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full font-medium ${
                    chatState.message.length > 950 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {1000 - chatState.message.length} restantes
                  </div>
                )}
              </div>
              
              {/* Botão de envio */}
              <button
                onClick={chatState.handleSendMessage}
                disabled={!chatState.message.trim() || chatState.isSending}
                className={`${
                  chatState.isInternal 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } disabled:bg-gray-300 text-white p-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center min-w-[48px] hover:scale-105 disabled:hover:scale-100`}
              >
                {chatState.isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Atalhos de teclado */}
            <div className="mt-2 text-xs text-gray-400 text-center">
              <span className="inline-flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600 font-mono">Enter</kbd>
                <span>Enviar</span>
                <span className="mx-2">•</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600 font-mono">Shift</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600 font-mono">Enter</kbd>
                <span>Nova linha</span>
                {chatState.isInternal && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-amber-600 font-medium">Modo: Nota Interna</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {chatState.showSidebar && (
        <>
          {/* Overlay para mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={chatState.toggleSidebar}
          ></div>
          
          {/* Sidebar */}
          <div className="chat-sidebar w-80 bg-white border-l border-gray-200 flex flex-col relative z-50 lg:relative lg:z-auto transition-all duration-300 fixed right-0 top-0 h-full lg:static lg:h-auto flex-shrink-0">
            {/* Header da Sidebar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Informações</h3>
                </div>
                <button
                  onClick={chatState.toggleSidebar}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Conteúdo da Sidebar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Informações do Cliente */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Cliente
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {clientInfo.clientName?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{clientInfo.clientName}</p>
                      <p className="text-xs text-gray-500">
                        {chatState.isRealtimeConnected ? 'Online' : 'Conectando...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    {clientInfo.clientPhone !== 'Telefone não informado' && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-3 h-3 mr-2" />
                        <span>{clientInfo.clientPhoneFormatted}</span>
                        {clientInfo.isWhatsApp && (
                          <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                            📱 WhatsApp
                          </span>
                        )}
                      </div>
                    )}
                    {chatState.currentTicket?.customerEmail && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-3 h-3 mr-2" />
                        <span>{chatState.currentTicket.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detalhes do Ticket */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Detalhes
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">ID</label>
                    <p className="font-medium">#{chatState.currentTicket?.id}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Assunto</label>
                    <p className="font-medium">{chatState.currentTicket?.subject || chatState.currentTicket?.title || 'Atendimento Geral'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Canal</label>
                    <div className="flex items-center space-x-2">
                      <span>{getChannelIcon(chatState.currentTicket?.channel)}</span>
                      <span className="font-medium">{chatState.currentTicket?.channel || 'Chat'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Status</label>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chatState.currentTicket?.status)}`}>
                      {chatState.currentTicket?.status || 'Ativo'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Última atualização</label>
                    <p className="font-medium">
                      {chatState.lastUpdateTime ? formatTime(chatState.lastUpdateTime) : 'Agora'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estatísticas do Chat */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 uppercase tracking-wide">Mensagens</p>
                    <p className="text-lg font-bold text-blue-700">{chatState.realTimeMessages.length}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 uppercase tracking-wide">Favoritas</p>
                    <p className="text-lg font-bold text-green-700">
                      {chatState.favoriteMessages.size}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 uppercase tracking-wide">Internas</p>
                    <p className="text-lg font-bold text-purple-700">
                      {chatState.realTimeMessages.filter(m => m.isInternal).length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    chatState.isRealtimeConnected ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className={`text-xs uppercase tracking-wide ${
                      chatState.isRealtimeConnected ? 'text-green-600' : 'text-red-600'
                    }`}>Status</p>
                    <p className={`text-lg font-bold ${
                      chatState.isRealtimeConnected ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {chatState.isRealtimeConnected ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Ações Rápidas</h4>
                <div className="space-y-2">
                  {clientInfo.isWhatsApp && clientInfo.clientPhone !== 'Telefone não informado' && (
                    <button className="w-full text-left p-2 hover:bg-green-50 rounded-lg transition-colors flex items-center space-x-2 border border-green-200">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Chamar no WhatsApp</span>
                    </button>
                  )}
                  <button 
                    onClick={() => chatState.setShowCustomerModal(true)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Atribuir Cliente</span>
                  </button>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Histórico Completo</span>
                  </button>
                  <button 
                    onClick={chatState.refreshMessages}
                    className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Atualizar Mensagens</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TicketChatRefactored; 