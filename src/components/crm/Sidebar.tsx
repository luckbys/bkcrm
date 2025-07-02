import React, { useState, useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { 
  Building2,
  Plus,
  Search,
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Filter,
  Star,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  Edit,
  Trash2,
  Headphones,
  Phone,
  DollarSign,
  UserCheck,
  Megaphone,
  Shield,
  Zap,
  Heart,
  Briefcase,
  Home,
  Globe,
  Mail,
  Calendar,
  FileText,
  Database,
  Server,
  Wifi,
  Camera,
  ShoppingCart,
  Truck,
  CreditCard,
  Lock,
  Key,
  Eye,
  Archive,
  Flag,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Target
} from 'lucide-react'
import { styles as sidebarStyles } from './Sidebar.styles'
import { useDepartments } from '../../hooks/useDepartments'
import type { Department } from '../../types/department'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import DepartmentCreateModal from './DepartmentCreateModal'

interface SidebarProps {
  onDepartmentSelect?: (department: Department) => void
  selectedDepartmentId?: string
  className?: string
  onCollapsedChange?: (collapsed: boolean) => void
}

// Função para determinar cor baseada na prioridade
const getPriorityColor = (priority: Department['priority']) => {
  switch (priority) {
    case 'high': return 'red'
    case 'medium': return 'yellow'
    case 'low': return 'green'
    default: return 'gray'
  }
}

// Função para determinar cor baseada no status dos tickets
const getStatusColor = (unreadTickets: number, totalTickets: number) => {
  if (totalTickets === 0) return 'gray'
  if (unreadTickets === 0) return 'green'
  if (unreadTickets >= totalTickets * 0.7) return 'red'
  return 'yellow'
}

// Mapeamento de ícones por nome
const iconMap: Record<string, React.ComponentType<any>> = {
  Building2,
  Users,
  Headphones,
  Phone,
  DollarSign,
  UserCheck,
  Megaphone,
  Settings,
  Shield,
  Zap,
  Heart,
  Star,
  Briefcase,
  Home,
  Globe,
  Mail,
  Calendar,
  FileText,
  Database,
  Server,
  Wifi,
  Camera,
  ShoppingCart,
  Truck,
  CreditCard,
  Lock,
  Key,
  Eye,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Archive,
  Flag,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  MessageSquare,
  Target,
  AlertCircle,
  Clock,
  CheckCircle
}

// Função para renderizar o ícone do departamento
const renderDepartmentIcon = (iconName?: string) => {
  const IconComponent = iconName ? iconMap[iconName] : Building2
  return IconComponent ? <IconComponent className="w-4 h-4" /> : <Building2 className="w-4 h-4" />
}

export const Sidebar: React.FC<SidebarProps> = ({
  onDepartmentSelect,
  selectedDepartmentId,
  className = '',
  onCollapsedChange
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Department['priority'] | 'all'>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const { departments, loading, error, addDepartment, updateDepartment, archiveDepartment, refresh } = useDepartments()
  
  // Debug log para verificar os departamentos carregados
  console.log('🔍 [Sidebar] Departamentos carregados:', departments.length, departments)

  // Filtrar departamentos baseado na busca e filtros
  const filteredDepartments = useMemo(() => {
    let filtered = departments

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(dept => dept.priority === priorityFilter)
    }

    // Filtro de não lidos
    if (showUnreadOnly) {
      filtered = filtered.filter(dept => dept.unreadTickets > 0)
    }

    // Ordenar por prioridade e tickets não lidos
    const sorted = filtered.sort((a, b) => {
      // Primeiro por prioridade (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Depois por tickets não lidos
      return b.unreadTickets - a.unreadTickets
    })
    
    console.log('🔍 [Sidebar] Departamentos filtrados:', sorted.length, sorted)
    return sorted
  }, [departments, searchTerm, priorityFilter, showUnreadOnly])

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    return departments.reduce(
      (acc, dept) => ({
        totalDepartments: acc.totalDepartments + 1,
        totalTickets: acc.totalTickets + dept.totalTickets,
        unreadTickets: acc.unreadTickets + dept.unreadTickets,
        resolvedTickets: acc.resolvedTickets + dept.resolvedTickets
      }),
      { totalDepartments: 0, totalTickets: 0, unreadTickets: 0, resolvedTickets: 0 }
    )
  }, [departments])

  const handleDepartmentClick = (department: Department) => {
    console.log('🎯 [Sidebar] Departamento clicado:', department)
    console.log('🎯 [Sidebar] onDepartmentSelect está definido?', typeof onDepartmentSelect)
    
    if (onDepartmentSelect) {
      console.log('🎯 [Sidebar] Chamando onDepartmentSelect...')
      onDepartmentSelect(department)
    } else {
      console.warn('⚠️ [Sidebar] onDepartmentSelect não está definido!')
    }
  }

  const handleAddDepartment = () => {
    setShowCreateModal(true)
  }

  const handleCreateDepartment = async (name: string, priority: Department['priority'], description?: string, icon?: string) => {
    setIsCreating(true)
    try {
      await addDepartment(name, priority, description, icon)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Erro ao criar departamento:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditDepartment = async (name: string, priority: Department['priority'], description?: string, icon?: string) => {
    if (!editingDepartment) return
    
    setIsEditing(true)
    try {
      await updateDepartment(editingDepartment.id, { 
        name, 
        priority,
        ...(description && { description }),
        ...(icon && { icon })
      })
      setShowEditModal(false)
      setEditingDepartment(null)
    } catch (error) {
      console.error('Erro ao editar departamento:', error)
      throw error
    } finally {
      setIsEditing(false)
    }
  }

  const handleDepartmentAction = async (action: string, department: Department) => {
    try {
      switch (action) {
        case 'edit':
          setEditingDepartment(department)
          setShowEditModal(true)
          break
        case 'delete':
          if (confirm(`Tem certeza que deseja remover o departamento "${department.name}"?\n\nEsta ação não pode ser desfeita.`)) {
            await archiveDepartment(department.id)
          }
          break
        case 'priority-high':
          await updateDepartment(department.id, { priority: 'high' })
          break
        case 'priority-medium':
          await updateDepartment(department.id, { priority: 'medium' })
          break
        case 'priority-low':
          await updateDepartment(department.id, { priority: 'low' })
          break
      }
    } catch (error) {
      console.error('Erro na ação do departamento:', error)
    }
  }

  const toggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }

  if (loading) {
    return (
      <div className={sidebarStyles.container({ collapsed: true })}>
        <div className={sidebarStyles.loadingState()}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="mt-2 text-xs">Carregando departamentos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={sidebarStyles.container({ collapsed: true })}>
        <div className={sidebarStyles.errorState()}>
          <AlertCircle className="w-5 h-5 mb-2" />
          <span className="text-xs text-center">Erro ao carregar departamentos</span>
          <Button size="sm" variant="outline" onClick={refresh} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

    return (
    <TooltipProvider>
      <div className={sidebarStyles.container({ collapsed })}>
        {/* Header com estatísticas gerais */}
        <div className={sidebarStyles.header({ collapsed })}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold text-gray-800 dark:text-gray-200">Departamentos</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalStats.totalDepartments} setores • {totalStats.unreadTickets} não lidos
                  </p>
          </div>
        </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAddDepartment}
                      className="w-6 h-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Adicionar departamento</TooltipContent>
                </Tooltip>
                <button
                  onClick={toggleCollapse}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center relative">
                <Building2 className="w-3 h-3 text-white" />
                {totalStats.unreadTickets > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">
                      {totalStats.unreadTickets > 9 ? '9+' : totalStats.unreadTickets}
                    </span>
        </div>
                )}
      </div>
        <button
                onClick={toggleCollapse}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
        >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
            </>
          )}
      </div>

        {/* Área de busca e filtros */}
        {!collapsed && (
          <div className={sidebarStyles.searchArea({ collapsed: false })}>
            {/* Campo de busca */}
            <div className="flex items-center gap-2 w-full bg-gray-100/80 dark:bg-gray-800/80 rounded-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50 mb-2">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar departamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 p-0 h-auto"
              />
            </div>

            {/* Filtros */}
            <div className="flex items-center justify-between gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    {priorityFilter === 'all' ? 'Todos' : priorityFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
                    Todas as prioridades
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPriorityFilter('high')}>
                    <AlertCircle className="w-3 h-3 mr-2 text-red-500" />
                    Alta prioridade
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>
                    <Clock className="w-3 h-3 mr-2 text-yellow-500" />
                    Média prioridade
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('low')}>
                    <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                    Baixa prioridade
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant={showUnreadOnly ? "default" : "outline"}
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className="h-7 text-xs"
              >
                Não lidos
              </Button>
            </div>
          </div>
        )}

        {/* Lista de departamentos */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <Building2 className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs text-center">
                {searchTerm || priorityFilter !== 'all' || showUnreadOnly
                  ? 'Nenhum departamento encontrado'
                  : 'Nenhum departamento criado'}
              </span>
        </div>
          ) : (
            filteredDepartments.map((department) => {
              const isSelected = selectedDepartmentId === department.id
              const statusColor = getStatusColor(department.unreadTickets, department.totalTickets)
              const priorityColor = getPriorityColor(department.priority)
              
              if (collapsed) {
                return (
                  <Tooltip key={department.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={sidebarStyles.departmentCard({ 
                          collapsed: true, 
                          active: isSelected 
                        })}
                        onClick={() => handleDepartmentClick(department)}
                      >
                        <div className={cn(
                          sidebarStyles.departmentIcon({ type: statusColor }),
                          "relative"
                        )}>
                          {renderDepartmentIcon(department.icon)}
                          {department.unreadTickets > 0 && (
                            <div className={sidebarStyles.countBadge({ 
                              variant: statusColor === 'red' ? 'danger' : 
                                      statusColor === 'yellow' ? 'warning' : 'primary'
                            })}>
                              {department.unreadTickets > 99 ? '99+' : department.unreadTickets}
                              </div>
                          )}
                          {/* Indicador de prioridade */}
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-900",
                            priorityColor === 'red' && "bg-red-500",
                            priorityColor === 'yellow' && "bg-yellow-500",
                            priorityColor === 'green' && "bg-green-500",
                            priorityColor === 'gray' && "bg-gray-500"
                          )} />
                              </div>
                    </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="z-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{department.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {department.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {department.totalTickets} tickets total
                          </div>
                          {department.unreadTickets > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="w-3 h-3" />
                              {department.unreadTickets} não lidos
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle className="w-3 h-3" />
                            {department.resolvedTickets} resolvidos
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <div
                  key={department.id}
                  className={sidebarStyles.departmentCard({ 
                    collapsed: false, 
                    active: isSelected 
                  })}
                  onClick={() => handleDepartmentClick(department)}
                >
                  <div className={cn(
                    sidebarStyles.departmentIcon({ type: statusColor }),
                    "relative"
                  )}>
                    {renderDepartmentIcon(department.icon)}
                    {/* Indicador de prioridade */}
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-900",
                      priorityColor === 'red' && "bg-red-500",
                      priorityColor === 'yellow' && "bg-yellow-500",
                      priorityColor === 'green' && "bg-green-500",
                      priorityColor === 'gray' && "bg-gray-500"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {department.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        {department.priority === 'high' && (
                          <Star className="w-3 h-3 text-red-500" />
                        )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDepartmentAction('edit', department)}>
                              <Edit className="w-3 h-3 mr-2 text-blue-500" />
                              Editar departamento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDepartmentAction('priority-high', department)}>
                              <AlertCircle className="w-3 h-3 mr-2 text-red-500" />
                              Prioridade alta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDepartmentAction('priority-medium', department)}>
                              <Clock className="w-3 h-3 mr-2 text-yellow-500" />
                              Prioridade média
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDepartmentAction('priority-low', department)}>
                              <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                              Prioridade baixa
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                              onClick={() => handleDepartmentAction('delete', department)}
                        className="text-red-600"
                                >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Remover departamento
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="w-3 h-3" />
                        {department.totalTickets}
                      </div>
                      {department.unreadTickets > 0 && (
                        <Badge variant="destructive" className="text-xs h-4 px-1">
                          {department.unreadTickets} novos
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        {department.resolvedTickets}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Rodapé com estatísticas resumidas */}
        <div className="p-3 border-t border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/30 to-white/30 dark:bg-gradient-to-r dark:from-gray-800/30 dark:to-gray-900/30 rounded-b-2xl">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-300">{totalStats.totalTickets} tickets</span>
                  {totalStats.unreadTickets > 0 && (
                    <Badge variant="destructive" className="text-xs h-4 px-1">
                      {totalStats.unreadTickets}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${totalStats.totalTickets > 0 ? (totalStats.resolvedTickets / totalStats.totalTickets) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {totalStats.totalTickets > 0 ? Math.round((totalStats.resolvedTickets / totalStats.totalTickets) * 100) : 0}%
                </span>
                          </div>
                        </div>
          ) : (
            <div className="flex justify-center">
              <div className={cn(
                "w-2 h-2 rounded-full",
                totalStats.unreadTickets > 0 ? "bg-red-500" : "bg-green-500"
              )} />
            </div>
          )}
        </div>

        {/* Modal de criação de departamento */}
        <DepartmentCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDepartment}
          isLoading={isCreating}
                />

        {/* Modal de edição de departamento */}
        <DepartmentCreateModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingDepartment(null)
          }}
          onSubmit={handleEditDepartment}
          isLoading={isEditing}
          editMode={true}
          initialData={editingDepartment ? {
            name: editingDepartment.name,
            priority: editingDepartment.priority,
            description: editingDepartment.description || ''
          } : undefined}
                />
              </div>
    </TooltipProvider>
  )
}

export default Sidebar 