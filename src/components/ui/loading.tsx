import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Wifi, Smartphone, MessageSquare, Users, Activity, Server, Database } from 'lucide-react';

// Spinner básico moderno
const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-blue-600', 
        sizeClasses[size], 
        className
      )} 
    />
  );
};

// Loading com glassmorphism
const GlassLoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const spinnerSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  return (
    <div className={cn(
      'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl flex items-center justify-center shadow-xl',
      sizeClasses[size],
      className
    )}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
        <Loader2 className={cn('animate-spin text-white', spinnerSizes[size])} />
      </div>
    </div>
  );
};

// Loading com contexto (WhatsApp, CRM, etc.)
const ContextualLoadingSpinner: React.FC<{
  type: 'whatsapp' | 'crm' | 'chat' | 'users' | 'activity' | 'server' | 'database';
  message?: string;
  className?: string;
}> = ({ type, message, className }) => {
  const iconMap = {
    whatsapp: Smartphone,
    crm: Server,
    chat: MessageSquare,
    users: Users,
    activity: Activity,
    server: Server,
    database: Database
  };

  const colorMap = {
    whatsapp: 'from-green-500 to-green-600',
    crm: 'from-blue-500 to-blue-600',
    chat: 'from-purple-500 to-purple-600',
    users: 'from-indigo-500 to-indigo-600',
    activity: 'from-orange-500 to-orange-600',
    server: 'from-gray-500 to-gray-600',
    database: 'from-red-500 to-red-600'
  };

  const Icon = iconMap[type];

  return (
    <div className={cn(
      'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center shadow-xl',
      className
    )}>
      <div className="relative mb-4">
        <div className={cn(
          'w-16 h-16 mx-auto bg-gradient-to-br rounded-full flex items-center justify-center relative',
          colorMap[type]
        )}>
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
          <Icon className="w-8 h-8 text-white relative z-10" />
        </div>
        
        {/* Anel de loading */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
        </div>
      </div>
      
      {message && (
        <p className="text-gray-700 text-sm font-medium">{message}</p>
      )}
    </div>
  );
};

// Loading de página inteira
const PageLoadingSpinner: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Carregando...', className }) => {
  return (
    <div className={cn(
      'fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center z-50',
      className
    )}>
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-white/20 backdrop-blur-lg border border-white/30 rounded-3xl flex items-center justify-center shadow-2xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-30"></div>
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
          </div>
          
          {/* Múltiplos anéis de loading */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-36 h-36 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin animation-delay-0"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-44 h-44 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin animation-delay-300"></div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">BKCRM</h2>
        <p className="text-gray-600 text-lg">{message}</p>
        
        {/* Pontos de loading */}
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>
    </div>
  );
};

// Loading para botões
const ButtonLoadingSpinner: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Carregando...</span>
    </div>
  );
};

// Loading com progresso
const ProgressLoadingSpinner: React.FC<{
  progress: number;
  message?: string;
  className?: string;
}> = ({ progress, message, className }) => {
  return (
    <div className={cn(
      'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center shadow-xl',
      className
    )}>
      <div className="relative mb-4">
        <div className="w-20 h-20 mx-auto relative">
          {/* Círculo de progresso */}
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              strokeDasharray={`${progress}, 100`}
              className="transition-all duration-300"
            />
          </svg>
          
          {/* Porcentagem no centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-900">{progress}%</span>
          </div>
        </div>
      </div>
      
      {message && (
        <p className="text-gray-700 text-sm font-medium">{message}</p>
      )}
    </div>
  );
};

// Loading skeleton para cards
const CardSkeleton: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn(
      'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl',
      className
    )}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-3 bg-white/20 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-white/20 rounded"></div>
          <div className="h-3 bg-white/20 rounded w-5/6"></div>
          <div className="h-3 bg-white/20 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton para lista
const ListSkeleton: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 3, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-lg">
          <div className="animate-pulse flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading skeleton para tabela
const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="animate-pulse mb-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="h-4 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="animate-pulse">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div key={colIndex} className="h-3 bg-white/20 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading para formulários
const FormLoadingSpinner: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Processando...', className }) => {
  return (
    <div className={cn(
      'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center shadow-xl',
      className
    )}>
      <div className="relative mb-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
        
        {/* Pulso de fundo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full animate-ping"></div>
        </div>
      </div>
      
      <p className="text-gray-700 font-medium">{message}</p>
      
      {/* Barra de progresso animada */}
      <div className="mt-4 w-full bg-white/20 rounded-full h-2 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-blue-600 h-full rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

// Loading para conexão (específico para WhatsApp)
const ConnectionLoadingSpinner: React.FC<{
  step?: string;
  className?: string;
}> = ({ step = 'Conectando...', className }) => {
  return (
    <div className={cn(
      'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center shadow-xl',
      className
    )}>
      <div className="relative mb-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
          <Wifi className="w-10 h-10 text-white" />
        </div>
        
        {/* Ondas de conexão */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 border-4 border-green-300 border-t-green-500 rounded-full animate-spin"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 border-2 border-green-200 border-t-green-400 rounded-full animate-spin animation-delay-300"></div>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Estabelecendo Conexão</h3>
      <p className="text-gray-600">{step}</p>
      
      {/* Indicador de atividade */}
      <div className="flex justify-center space-x-2 mt-4">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce animation-delay-200"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce animation-delay-400"></div>
      </div>
    </div>
  );
};

// Loading overlay para componentes
const LoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, message = 'Carregando...', children, className }) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
        <div className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl p-6 text-center shadow-xl">
          <GlassLoadingSpinner size="md" className="mb-4" />
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Componente de loading adaptável
const AdaptiveLoadingSpinner: React.FC<{
  type?: 'minimal' | 'standard' | 'detailed' | 'glassmorphism';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}> = ({ type = 'standard', size = 'md', message, className }) => {
  switch (type) {
    case 'minimal':
      return <LoadingSpinner size={size} className={className} />;
    
    case 'glassmorphism':
      return <GlassLoadingSpinner size={size} className={className} />;
    
    case 'detailed':
      return <ContextualLoadingSpinner type="crm" message={message} className={className} />;
    
    default:
      return (
        <div className={cn('flex items-center justify-center p-4', className)}>
          <LoadingSpinner size={size} />
          {message && <span className="ml-2 text-gray-600">{message}</span>}
        </div>
      );
  }
};

// Export de todos os componentes
export {
  LoadingSpinner,
  GlassLoadingSpinner,
  ContextualLoadingSpinner,
  PageLoadingSpinner,
  ButtonLoadingSpinner,
  ProgressLoadingSpinner,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  FormLoadingSpinner,
  ConnectionLoadingSpinner,
  LoadingOverlay,
  AdaptiveLoadingSpinner
}; 