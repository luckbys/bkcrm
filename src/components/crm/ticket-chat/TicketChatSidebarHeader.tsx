import React from 'react';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { RefreshCw, X, FileText, Activity, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TicketChatSidebarHeaderProps {
  ticketProgress: number;
  onRefresh?: () => void;
  onClose?: () => void;
  isConnected?: boolean;
  connectionQuality?: 'excellent' | 'good' | 'poor';
}

export const TicketChatSidebarHeader: React.FC<TicketChatSidebarHeaderProps> = ({
  ticketProgress,
  onRefresh,
  onClose,
  isConnected = true,
  connectionQuality = 'excellent'
}) => {
  const connectionColors = {
    excellent: 'text-green-400',
    good: 'text-yellow-400', 
    poor: 'text-red-400'
  };

  const connectionLabels = {
    excellent: 'Excelente',
    good: 'Boa',
    poor: 'Ruim'
  };

  return (
    <div className="relative p-4 border-b border-gray-200/50 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 shadow-lg">
                <FileText className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              {/* Connection indicator */}
              <div className={cn(
                "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
              )}></div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white drop-shadow-sm">
                Detalhes do Ticket
              </h3>
              <div className="flex items-center space-x-2 text-xs text-blue-100">
                <Activity className="w-3 h-3" />
                <span>Conexão: {connectionLabels[connectionQuality]}</span>
                <div className={cn("w-1 h-1 rounded-full", connectionColors[connectionQuality])}></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 rounded-lg backdrop-blur-sm"
                    onClick={onRefresh}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar informações</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 rounded-lg backdrop-blur-sm"
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ações rápidas</p>
              </TooltipContent>
            </Tooltip>
            
            {onClose && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-red-500/50 transition-all duration-200 rounded-lg backdrop-blur-sm"
                    onClick={onClose}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fechar sidebar</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-100 font-medium flex items-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 animate-pulse"></div>
              Progresso do Atendimento
            </span>
            <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {ticketProgress}%
            </span>
          </div>
          
          <div className="relative">
            <Progress 
              value={ticketProgress} 
              className="h-2.5 bg-white/20 overflow-hidden rounded-full border border-white/30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 animate-pulse rounded-full"></div>
          </div>
          
          <div className="flex justify-between text-xs text-blue-100 mt-1">
            <span>Início</span>
            <span>Em andamento</span>
            <span>Finalizado</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 