// Indicador de Digitacao em Tempo Real
import React from 'react';
import { cn } from '../../lib/utils';

interface TypingIndicatorProps {
  isVisible: boolean;
  senderName?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  senderName = 'Cliente',
  className
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg mx-4 mb-2 transition-all duration-300",
      className
    )}>
      {/* Avatar */}
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-xs font-medium text-green-700">
          {senderName.charAt(0).toUpperCase()}
        </span>
      </div>
      
      {/* Typing Animation */}
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-600">{senderName} está digitando</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}; 