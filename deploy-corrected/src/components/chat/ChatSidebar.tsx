import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, Phone, Mail, User } from 'lucide-react';
import { ChatParticipant, ChatConfiguration, ChatState } from '../../types/chat';

interface ChatSidebarProps {
  participant?: ChatParticipant;
  configuration: ChatConfiguration;
  state: ChatState;
  onClose: () => void;
  messagesCount: number;
  unreadCount: number;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  participant,
  configuration,
  state,
  onClose,
  messagesCount,
  unreadCount
}) => {
  return (
    <div className="w-80 border-l bg-gray-50 flex flex-col">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Informações</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-4">
        {/* Participante */}
        {participant && (
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{participant.name}</span>
              </div>
              {participant.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{participant.email}</span>
                </div>
              )}
              {participant.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{participant.phone}</span>
                </div>
              )}
              <Badge variant={participant.isOnline ? 'default' : 'secondary'}>
                {participant.isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Estatísticas */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Estatísticas</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total de mensagens:</span>
              <span className="font-medium">{messagesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Não lidas:</span>
              <span className="font-medium">{unreadCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Canal:</span>
              <span className="font-medium">{configuration.channel.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant={state.isConnected ? 'default' : 'destructive'}>
                {state.connectionStatus}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Configurações */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Configurações</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tempo real:</span>
              <Badge variant={configuration.settings.realTimeEnabled ? 'default' : 'secondary'}>
                {configuration.settings.realTimeEnabled ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Upload de arquivos:</span>
              <Badge variant={configuration.settings.allowedFileTypes.length > 0 ? 'default' : 'secondary'}>
                {configuration.settings.allowedFileTypes.length > 0 ? 'Permitido' : 'Bloqueado'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 