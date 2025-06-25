// 🎨 HEADER DO CHAT MODERNO
import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { 
  X, 
  Minimize2,
  Settings,
  Phone,
  Video,
  Search,
  Wifi,
  WifiOff,
  Activity,
  Minimize,
  Maximize
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChatParticipant, ChatChannel, ChatState } from '../../types/chat';

interface ChatHeaderProps {
  participant: ChatParticipant;
  channel: ChatChannel;
  state: ChatState;
  onClose: () => void;
  onMinimize?: () => void;
  onSettings?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  isCompactMode?: boolean;
  onToggleCompact?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  participant,
  channel,
  state,
  onClose,
  onMinimize,
  onSettings,
  onCall,
  onVideoCall,
  onSearch,
  searchQuery = '',
  isCompactMode = false,
  onToggleCompact
}) => {
  const getConnectionIcon = () => {
    switch (state.connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="flex flex-col border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
      {/* 📱 Linha principal */}
      <div className="flex items-center justify-between p-4">
        {/* 👤 Info do participante */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 ring-2 ring-blue-200">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                {participant.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* 🟢 Status online */}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full",
              participant.isOnline ? "bg-green-500" : "bg-gray-400"
            )} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {participant.name}
              </h2>
              <Badge variant="outline" className="text-xs">
                {channel.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {getConnectionIcon()}
              <span className="capitalize">
                {state.connectionStatus === 'connected' ? 'Online' : state.connectionStatus}
              </span>
              {state.isTyping && (
                <span className="text-blue-600 animate-pulse">• digitando...</span>
              )}
            </div>
          </div>
        </div>
        
        {/* 🎛️ Controles */}
        <div className="flex items-center gap-2">
          {onCall && (
            <Button variant="ghost" size="sm" onClick={onCall}>
              <Phone className="w-4 h-4" />
            </Button>
          )}
          
          {onVideoCall && (
            <Button variant="ghost" size="sm" onClick={onVideoCall}>
              <Video className="w-4 h-4" />
            </Button>
          )}
          
          {onToggleCompact && (
            <Button variant="ghost" size="sm" onClick={onToggleCompact}>
              {isCompactMode ? <Maximize className="w-4 h-4" /> : <Minimize className="w-4 h-4" />}
            </Button>
          )}
          
          {onSettings && (
            <Button variant="ghost" size="sm" onClick={onSettings}>
              <Settings className="w-4 h-4" />
            </Button>
          )}
          
          {onMinimize && (
            <Button variant="ghost" size="sm" onClick={onMinimize}>
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* 🔍 Barra de pesquisa */}
      {onSearch && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar mensagens..."
              className="pl-10 bg-white/80 border-gray-200 focus:bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}; 