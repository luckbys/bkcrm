import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TicketChatSidebarSectionProps {
  id: string;
  title: string;
  icon: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  gradientFrom?: string;
  gradientTo?: string;
  hoverColor?: string;
  priority?: 'low' | 'medium' | 'high';
}

export const TicketChatSidebarSection: React.FC<TicketChatSidebarSectionProps> = ({
  id,
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  badge,
  badgeVariant = 'default',
  gradientFrom = 'from-blue-500',
  gradientTo = 'to-blue-600',
  hoverColor = 'hover:text-blue-600',
  priority = 'medium'
}) => {
  const priorityStyles = {
    low: 'border-gray-200/60 shadow-sm',
    medium: 'border-gray-200/80 shadow-md',
    high: 'border-orange-200/80 shadow-lg ring-1 ring-orange-100'
  };

  const priorityGlow = {
    low: '',
    medium: '',
    high: 'shadow-orange-100/50'
  };

  return (
    <Card className={cn(
      "transition-all duration-300 group cursor-pointer",
      "bg-white/60 backdrop-blur-sm hover:bg-white/80",
      "hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5",
      priorityStyles[priority],
      priorityGlow[priority],
      isExpanded && "ring-2 ring-blue-100 shadow-xl"
    )}>
      <CardHeader 
        className="pb-2 cursor-pointer select-none transition-all duration-200"
        onClick={onToggle}
      >
        <CardTitle className={cn(
          "text-sm font-semibold text-gray-700 flex items-center justify-between transition-all duration-200",
          hoverColor,
          isExpanded && "text-blue-600"
        )}>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "p-1.5 rounded-lg transition-all duration-300 group-hover:scale-110",
              `bg-gradient-to-br ${gradientFrom} ${gradientTo}`,
              isExpanded && "scale-110 shadow-lg"
            )}>
              <div className="w-3.5 h-3.5 text-white">
                {icon}
              </div>
            </div>
            <span className="font-semibold">{title}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {badge && (
              <Badge 
                variant={badgeVariant} 
                className={cn(
                  "text-xs px-2 py-0.5 transition-all duration-200",
                  "group-hover:scale-105",
                  isExpanded && "scale-105"
                )}
              >
                {badge}
              </Badge>
            )}
            
            <div className={cn(
              "transition-all duration-300 p-1 rounded-full",
              "group-hover:bg-gray-100",
              isExpanded && "bg-blue-100 rotate-180"
            )}>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className={cn(
          "pt-0 animate-in slide-in-from-top-2 duration-500 ease-out",
          "fade-in-0"
        )}>
          <div className="space-y-3">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}; 