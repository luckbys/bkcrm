import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  Building2, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface DepartmentStatsCardProps {
  departments: {
    id: string
    name: string
    totalTickets: number
    unreadTickets: number
    resolvedTickets: number
    priority: 'high' | 'medium' | 'low'
  }[]
  className?: string
}

export const DepartmentStatsCard: React.FC<DepartmentStatsCardProps> = ({
  departments,
  className
}) => {
  // Calcular estatísticas gerais
  const stats = React.useMemo(() => {
    const total = departments.reduce(
      (acc, dept) => ({
        departments: acc.departments + 1,
        totalTickets: acc.totalTickets + dept.totalTickets,
        unreadTickets: acc.unreadTickets + dept.unreadTickets,
        resolvedTickets: acc.resolvedTickets + dept.resolvedTickets,
        highPriority: acc.highPriority + (dept.priority === 'high' ? 1 : 0),
        mediumPriority: acc.mediumPriority + (dept.priority === 'medium' ? 1 : 0),
        lowPriority: acc.lowPriority + (dept.priority === 'low' ? 1 : 0)
      }),
      { 
        departments: 0, 
        totalTickets: 0, 
        unreadTickets: 0, 
        resolvedTickets: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0
      }
    )

    const resolutionRate = total.totalTickets > 0 ? (total.resolvedTickets / total.totalTickets) * 100 : 0
    const pendingTickets = total.totalTickets - total.resolvedTickets
    const urgentDepartments = departments.filter(d => d.priority === 'high' && d.unreadTickets > 0).length

    return {
      ...total,
      resolutionRate,
      pendingTickets,
      urgentDepartments
    }
  }, [departments])

  // Top 3 departamentos por tickets não lidos
  const topDepartments = React.useMemo(() => {
    return departments
      .filter(d => d.unreadTickets > 0)
      .sort((a, b) => b.unreadTickets - a.unreadTickets)
      .slice(0, 3)
  }, [departments])

  const getHealthStatus = () => {
    if (stats.unreadTickets === 0) return { color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Excelente' }
    if (stats.unreadTickets <= stats.totalTickets * 0.1) return { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Bom' }
    if (stats.unreadTickets <= stats.totalTickets * 0.3) return { color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Atenção' }
    return { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Crítico' }
  }

  const healthStatus = getHealthStatus()

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Visão Geral dos Departamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Departamentos</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {stats.departments}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Tickets Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalTickets}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Não Lidos</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {stats.unreadTickets}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Resolvidos</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {stats.resolvedTickets}
            </p>
          </div>
        </div>

        {/* Status de saúde */}
        <div className={cn("p-3 rounded-lg border", healthStatus.bg)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status Geral
              </p>
              <p className={cn("text-lg font-bold", healthStatus.color)}>
                {healthStatus.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Taxa de Resolução</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.resolutionRate.toFixed(1)}%
              </p>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progresso</span>
              <span>{stats.resolvedTickets}/{stats.totalTickets}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.resolutionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Distribuição por prioridade */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Distribuição por Prioridade
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-lg font-bold text-red-600">{stats.highPriority}</p>
              <p className="text-xs text-red-500">Alta</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-lg font-bold text-yellow-600">{stats.mediumPriority}</p>
              <p className="text-xs text-yellow-500">Média</p>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-lg font-bold text-green-600">{stats.lowPriority}</p>
              <p className="text-xs text-green-500">Baixa</p>
            </div>
          </div>
        </div>

        {/* Top departamentos com tickets não lidos */}
        {topDepartments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Requer Atenção
            </h4>
            <div className="space-y-2">
              {topDepartments.map((dept, index) => (
                <div key={dept.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 w-4">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {dept.name}
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {dept.unreadTickets}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertas importantes */}
        {stats.urgentDepartments > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                {stats.urgentDepartments} departamento{stats.urgentDepartments > 1 ? 's' : ''} de alta prioridade com tickets não lidos
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DepartmentStatsCard 