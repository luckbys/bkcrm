import React from 'react';
import { EnhancedMinimizedChat } from './EnhancedMinimizedChat';
import { useMinimizedChatManager } from '../../../hooks/useMinimizedChatManager';
import './minimized-chats-fixed.css';

export const MinimizedChatsContainer: React.FC = () => {
  const { 
    chats, 
    expandChat, 
    removeChat, 
    togglePin, 
    toggleVisibility 
  } = useMinimizedChatManager();

  // Não renderizar nada se não houver chats
  if (chats.length === 0) {
    return null;
  }

  // Estilos para o container que garante que não interfira com o posicionamento fixo
  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none', // Permite cliques através do container
    zIndex: 9998, // Menor que os chats individuais
    overflow: 'visible',
  };

  return (
    <div 
      style={containerStyles}
      className="minimized-chats-container"
      data-testid="minimized-chats-container"
    >
      {chats.map((chat, index) => (
        <EnhancedMinimizedChat
          key={chat.id}
          ticketId={chat.id}
          title={chat.ticket?.client || 'Cliente'}
          lastMessage={chat.lastMessage?.content || chat.ticket?.lastMessage}
          unreadCount={chat.unreadCount || 0}
          position={chat.position}
          index={index} // Índice para posicionamento vertical
          onExpand={expandChat}
          onClose={removeChat}
          onTogglePin={togglePin}
          onToggleVisibility={toggleVisibility}
          isWhatsAppConnected={true} // TODO: Integrar com status real
        />
      ))}
    </div>
  );
}; 