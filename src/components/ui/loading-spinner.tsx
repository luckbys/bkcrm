import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'gradient';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  text
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={cn(
            'rounded-full bg-primary animate-pulse',
            sizeClasses[size]
          )} />
        );
      
      case 'gradient':
        return (
          <div className={cn(
            'rounded-full animated-gradient',
            sizeClasses[size]
          )} />
        );
      
      default:
        return (
          <Loader2 className={cn(
            'animate-spin text-primary',
            sizeClasses[size]
          )} />
        );
    }
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        {renderSpinner()}
        {text && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

export { LoadingSpinner };

// Componente de loading para tela cheia
export const FullScreenLoading: React.FC<{
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
}> = ({ 
  text = 'Carregando departamentos...', 
  variant = 'gradient'
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="relative">
        {/* Background com efeito glassmorphism */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl" />
        
        {/* Conteúdo */}
        <div className="relative p-8">
          <LoadingSpinner 
            size="xl" 
            variant={variant} 
            text={text}
          />
        </div>
        
        {/* Efeitos de brilho */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

// Componente de loading para sidebar
export const SidebarLoading: React.FC<{
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
}> = ({ 
  text = 'Carregando...', 
  variant = 'default' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <LoadingSpinner 
        size="md" 
        variant={variant} 
        text={text}
      />
    </div>
  );
};

// Componente de loading para conteúdo
export const ContentLoading: React.FC<{
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
}> = ({ 
  text = 'Carregando conteúdo...', 
  variant = 'default' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6">
      <LoadingSpinner 
        size="lg" 
        variant={variant} 
        text={text}
      />
    </div>
  );
}; 