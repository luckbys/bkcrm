import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartCard } from './dashboard/ChartCard';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Target,
  DollarSign,
  Activity,
  Eye,
  Filter,
  RefreshCw,
  Download,
  Star,
  Zap,
  ArrowUp,
  ArrowDown,
  Plus,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTicketsDB } from '@/hooks/useTicketsDB';
import { useDepartments } from '@/hooks/useDepartments';
import { CardSkeleton, LoadingSpinner } from '@/components/ui/loading';

interface DashboardProps {
  onViewChange?: (view: string) => void;
  onOpenAddTicket?: () => void;
}

export const Dashboard = ({ onViewChange, onOpenAddTicket }: DashboardProps = { onViewChange: () => {}, onOpenAddTicket: () => {} }) => {
  const { user } = useAuth();
  const { tickets, loading: ticketsLoading } = useTicketsDB();
  const { departments } = useDepartments();
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, 90d
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para métricas calculadas
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
    activeAgents: 0,
    totalCustomers: 0,
    conversionRate: 0
  });

  // Calcular métricas baseadas nos dados
  useEffect(() => {
    if (tickets.length > 0) {
      const now = new Date();
      const timeRangeMs = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };

      const cutoffDate = new Date(now.getTime() - timeRangeMs[timeRange as keyof typeof timeRangeMs]);
      const filteredTickets = tickets.filter(ticket => 
        new Date(ticket.created_at) >= cutoffDate
      );

      const pending = filteredTickets.filter(t => t.status === 'pendente').length;
      const resolved = filteredTickets.filter(t => t.status === 'finalizado').length;
      const inProgress = filteredTickets.filter(t => t.status === 'atendimento').length;

      // Simular algumas métricas (em produção seria calculado do banco)
      setMetrics({
        totalTickets: filteredTickets.length,
        pendingTickets: pending,
        resolvedTickets: resolved,
        averageResponseTime: Math.floor(Math.random() * 180) + 60, // 60-240 min
        customerSatisfaction: 4.2 + Math.random() * 0.6, // 4.2-4.8
        activeAgents: departments.filter(d => d.isActive).length * 3, // Simular agentes
        totalCustomers: Math.floor(filteredTickets.length * 1.5), // Estimativa
        conversionRate: 65 + Math.random() * 20 // 65-85%
      });
    }
  }, [tickets, timeRange, departments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const timeRangeOptions = [
    { value: '24h', label: 'Últimas 24h' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' }
  ];

  const getMetricTrend = (value: number) => {
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    const percentage = Math.floor(Math.random() * 20) + 1;
    return { trend, percentage };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral das operações do CRM • {user?.email}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filtro de período */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {/* Botões de ação */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Tickets */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">
                Total de Tickets
              </CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-900">
                {metrics.totalTickets.toLocaleString()}
              </div>
              <div className="flex items-center text-sm">
                {getMetricTrend(metrics.totalTickets).trend === 'up' ? (
                  <ArrowUp className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span className={cn(
                  "font-medium",
                  getMetricTrend(metrics.totalTickets).trend === 'up' ? "text-green-600" : "text-red-600"
                )}>
                  {getMetricTrend(metrics.totalTickets).percentage}%
                </span>
                <span className="text-gray-600 ml-1">vs período anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Pendentes */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-700">
                Tickets Pendentes
              </CardTitle>
              <div className="p-2 bg-amber-500 rounded-lg">
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-amber-900">
                {metrics.pendingTickets}
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-amber-200 text-amber-800">
                  Urgente
                </Badge>
                <span className="text-xs text-gray-600">
                  {metrics.totalTickets > 0 ? Math.round((metrics.pendingTickets / metrics.totalTickets) * 100) : 0}% do total
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Resolvidos */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700">
                Tickets Resolvidos
              </CardTitle>
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-900">
                {metrics.resolvedTickets}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Taxa de Resolução</span>
                  <span>{metrics.totalTickets > 0 ? Math.round((metrics.resolvedTickets / metrics.totalTickets) * 100) : 0}%</span>
                </div>
                <Progress 
                  value={metrics.totalTickets > 0 ? (metrics.resolvedTickets / metrics.totalTickets) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Satisfação do Cliente */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700">
                Satisfação do Cliente
              </CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-900">
                {metrics.customerSatisfaction.toFixed(1)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={cn(
                        "w-3 h-3",
                        star <= Math.floor(metrics.customerSatisfaction) 
                          ? "text-yellow-400 fill-current" 
                          : "text-gray-300"
                      )} 
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600">
                  Excelente
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tempo Médio de Resposta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Tempo Médio de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {Math.floor(metrics.averageResponseTime / 60)}h {metrics.averageResponseTime % 60}m
                </div>
                <p className="text-sm text-gray-600">
                  Tempo médio para primeira resposta
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Excelente (&lt; 1h)</span>
                  <span className="text-sm font-medium">32%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bom (1-4h)</span>
                  <span className="text-sm font-medium">48%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Regular (&gt; 4h)</span>
                  <span className="text-sm font-medium">20%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agentes Ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Equipe Ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.activeAgents}
                  </div>
                  <p className="text-xs text-gray-600">Agentes Online</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {departments.filter(d => d.isActive).length}
                  </div>
                  <p className="text-xs text-gray-600">Departamentos</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Online</span>
                  </div>
                  <span className="text-sm font-medium">{Math.floor(metrics.activeAgents * 0.7)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Ocupado</span>
                  </div>
                  <span className="text-sm font-medium">{Math.floor(metrics.activeAgents * 0.2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm">Offline</span>
                  </div>
                  <span className="text-sm font-medium">{Math.floor(metrics.activeAgents * 0.1)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Canais de Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Canais de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Chat Online', value: 45, color: 'bg-green-500', icon: Phone },
                { name: 'Email', value: 25, color: 'bg-blue-500', icon: Mail },
                { name: 'Chat Web', value: 20, color: 'bg-purple-500', icon: MessageSquare },
                { name: 'Telefone', value: 10, color: 'bg-orange-500', icon: Phone }
              ].map((channel) => (
                <div key={channel.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <channel.icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">{channel.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{channel.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn("h-2 rounded-full", channel.color)}
                      style={{ width: `${channel.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Tickets por Status */}
        <ChartCard
          title="Tickets por Status"
          type="bar"
          showTrend={true}
          trendValue={15}
          trendDirection="up"
          data={[
            { label: 'Pendentes', value: metrics.pendingTickets, color: 'bg-amber-500' },
            { label: 'Em Atendimento', value: Math.floor(metrics.totalTickets * 0.4), color: 'bg-blue-500' },
            { label: 'Resolvidos', value: metrics.resolvedTickets, color: 'bg-green-500' },
            { label: 'Cancelados', value: Math.floor(metrics.totalTickets * 0.05), color: 'bg-red-500' }
          ]}
        />

        {/* Gráfico de Performance dos Agentes */}
        <ChartCard
          title="Performance dos Agentes"
          type="bar"
          showTrend={true}
          trendValue={8}
          trendDirection="up"
          data={[
            { label: 'Ana Costa', value: 42, color: 'bg-green-500' },
            { label: 'Carlos Silva', value: 38, color: 'bg-blue-500' },
            { label: 'Maria Santos', value: 35, color: 'bg-purple-500' },
            { label: 'João Oliveira', value: 31, color: 'bg-orange-500' }
          ]}
        />
      </div>

      {/* Gráficos Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tendência Semanal */}
        <ChartCard
          title="Tendência Semanal"
          type="line"
          showTrend={true}
          trendValue={12}
          trendDirection="up"
          data={[
            { label: 'Seg', value: 25, color: 'bg-blue-500' },
            { label: 'Ter', value: 32, color: 'bg-blue-500' },
            { label: 'Qua', value: 28, color: 'bg-blue-500' },
            { label: 'Qui', value: 45, color: 'bg-blue-500' },
            { label: 'Sex', value: 38, color: 'bg-blue-500' },
            { label: 'Sáb', value: 18, color: 'bg-blue-500' },
            { label: 'Dom', value: 12, color: 'bg-blue-500' }
          ]}
        />

        {/* Distribuição por Prioridade */}
        <ChartCard
          title="Distribuição por Prioridade"
          type="pie"
          data={[
            { label: 'Alta', value: 15, color: 'bg-red-500' },
            { label: 'Normal', value: 65, color: 'bg-blue-500' },
            { label: 'Baixa', value: 20, color: 'bg-green-500' }
          ]}
        />

        {/* Satisfação por Departamento */}
        <ChartCard
          title="Satisfação por Departamento"
          type="bar"
          showTrend={true}
          trendValue={5}
          trendDirection="up"
          data={[
            { label: 'Vendas', value: 4.8, color: 'bg-green-500' },
            { label: 'Suporte', value: 4.6, color: 'bg-blue-500' },
            { label: 'Financeiro', value: 4.4, color: 'bg-purple-500' },
            { label: 'Técnico', value: 4.2, color: 'bg-orange-500' }
          ]}
        />
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => onOpenAddTicket?.()}
            >
              <Plus className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Novo Ticket</span>
              <span className="text-xs text-gray-600">Criar atendimento</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => onViewChange?.('clientes')}
            >
              <Users className="w-6 h-6 text-green-600" />
              <span className="font-medium">Clientes</span>
              <span className="text-xs text-gray-600">Gerenciar base</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => onViewChange?.('admin')}
            >
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <span className="font-medium">Relatórios</span>
              <span className="text-xs text-gray-600">Análises detalhadas</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => onViewChange?.('admin')}
            >
              <Settings className="w-6 h-6 text-gray-600" />
              <span className="font-medium">Configurações</span>
              <span className="text-xs text-gray-600">Sistema</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 