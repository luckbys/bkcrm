import { CustomerStats as Stats } from '@/types/customer';
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  TrendingUp,
  DollarSign,
  Calculator
} from 'lucide-react';

interface CustomerStatsProps {
  stats: Stats;
}

export const CustomerStats = ({ stats }: CustomerStatsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statsData = [
    {
      title: 'Total de Clientes',
      value: stats.total.toLocaleString('pt-BR'),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Clientes Ativos',
      value: stats.active.toLocaleString('pt-BR'),
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Prospects',
      value: stats.prospects.toLocaleString('pt-BR'),
      icon: UserPlus,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Novos Este Mês',
      value: stats.newThisMonth.toLocaleString('pt-BR'),
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Valor Total',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(stats.averageTicket),
      icon: Calculator,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.title}
            className={`
              ${stat.bgColor} p-4 rounded-xl border border-gray-200/50
              hover:shadow-lg transition-all duration-300 ease-in-out
              hover:scale-105 cursor-pointer group
              animate-in slide-in-from-bottom-3 duration-500
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-200">
                  {stat.value}
                </p>
              </div>
              <div className={`
                p-3 rounded-lg ${stat.bgColor}
                group-hover:scale-110 transition-all duration-200
                group-hover:shadow-md
              `}>
                <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            
            {/* Barra de progresso decorativa */}
            <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${stat.color} rounded-full
                  animate-in slide-in-from-left duration-1000
                `}
                style={{ 
                  width: '75%',
                  animationDelay: `${index * 200 + 500}ms`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}; 