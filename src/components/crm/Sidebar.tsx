import React from 'react';
import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  MoreHorizontal,
  ClipboardCheck,
  Headphones,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Shield,
  Heart,
  Target,
  Briefcase,
  Home,
  Building,
  Package,
  Truck,
  CreditCard,
  UserCheck,
  HelpCircle,
  Code,
  Database,
  Cloud,
  Laptop,
  Smartphone,
  Monitor,
  Wifi,
  Lock,
  Key,
  Award,
  Flag,
  Bookmark,
  Tag,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Megaphone,
  Settings,
  Cog
} from 'lucide-react';

import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useDepartments } from '@/hooks/useDepartments';
import { supabase } from '@/lib/supabase';
import type { SectorFormData, PriorityType } from '@/types/sector';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { sidebarStyles as styles } from './Sidebar.styles';
import { 
  PRIORITY_LABELS, 
  PRIORITY_ICONS, 
  DEPARTMENT_ICONS, 
  DEPARTMENT_COLORS,
  USER_STATUS,
  ERROR_MESSAGES 
} from './Sidebar.constants';
import type { 
  SidebarProps,
  DepartmentType,
  DepartmentColor,
  UserStatusType,
  Department
} from './Sidebar.types';
import { useSectorForm } from '@/hooks/useSectorForm';
import { Textarea } from '@/components/ui/textarea';

const departmentTypeToIcon: Record<string, React.ElementType> = {
  default: Briefcase,
  support: Headphones,
  sales: ShoppingCart,
  marketing: Megaphone || Tag,
  development: Code,
  finance: CreditCard,
  hr: Users,
  legal: Shield,
  operations: Settings || Cog,
  logistics: Truck
};

const getDepartmentIcon = (department: Department) => {
  const Icon = departmentTypeToIcon[department.type] || Briefcase;
  return <Icon className="w-5 h-5" />;
};

const getDepartmentColor = (department: Department): string => {
  return DEPARTMENT_COLORS[department.type as DepartmentColor];
};

const initialSectorForm = {
  name: '',
  type: 'support' as DepartmentType,
  icon: 'Headphones',
  color: 'blue',
  description: '',
  priority: 'normal' as PriorityType,
  is_active: true
} satisfies SectorFormData;

const isPriorityType = (value: string): value is PriorityType => {
  return ['high', 'normal', 'low'].includes(value);
};

export function Sidebar({
  departments = [],
  isLoading,
  error,
  activeDepartment,
  onSelectDepartment
}: SidebarProps) {
  const { toast } = useToast();
  const { addDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { user } = useAuth();
  const userStatus: UserStatusType = 'online'; // TODO: Implementar lógica de status
  const { 
    form: sectorForm, 
    updateForm: setSectorForm, 
    setName,
    setDescription,
    setIcon,
    setColor,
    setPriority, 
    resetForm 
  } = useSectorForm();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSector, setEditingSector] = useState<Department | null>(null);
  const [deletingSector, setDeletingSector] = useState<Department | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [ticketCounts, setTicketCounts] = useState<Record<string, { nonVisualized: number; total: number }>>({});
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedSectors = Array.from(departments);
    const [removed] = reorderedSectors.splice(result.source.index, 1);
    reorderedSectors.splice(result.destination.index, 0, removed);

    onSelectDepartment(reorderedSectors[result.destination.index]);
  };

  const filteredSectors = departments?.filter(sector => 
    sector?.name?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
  ) || [];

  // Fetch real-time ticket counts
  useEffect(() => {
    const fetchTicketCounts = async () => {
      try {
        const { data: tickets, error } = await supabase
          .from('tickets')
          .select('department_id, status, is_visualized');

        if (error) throw error;

        const counts: Record<string, { nonVisualized: number; total: number }> = {};
        
        tickets?.forEach(ticket => {
          if (!counts[ticket.department_id]) {
            counts[ticket.department_id] = { nonVisualized: 0, total: 0 };
          }
          
          counts[ticket.department_id].total++;
          
          if (!ticket.is_visualized) {
            counts[ticket.department_id].nonVisualized++;
          }
        });

        setTicketCounts(counts);
      } catch (error) {
        console.error("Erro ao buscar contagem de tickets:", error);
        toast({
          title: "Erro ao carregar tickets",
          description: "Não foi possível carregar a contagem de tickets.",
          variant: "destructive",
        });
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchTicketCounts();
    const interval = setInterval(fetchTicketCounts, 5000);

    return () => clearInterval(interval);
  }, [toast]);

  const availableIcons = {
    'clipboard-check': ClipboardCheck,
    'headphones': Headphones,
    'shopping-cart': ShoppingCart,
    'chart-bar': BarChart3,
    'trending-up': TrendingUp,
    'users': Users,
    'message-square': MessageSquare,
    'phone': Phone,
    'mail': Mail,
    'globe': Globe,
    'shield': Shield,
    'heart': Heart,
    'target': Target,
    'briefcase': Briefcase,
    'home': Home,
    'building': Building,
    'package': Package,
    'truck': Truck,
    'credit-card': CreditCard,
    'user-check': UserCheck,
    'help-circle': HelpCircle,
    'code': Code,
    'database': Database,
    'cloud': Cloud,
    'laptop': Laptop,
    'smartphone': Smartphone,
    'monitor': Monitor,
    'wifi': Wifi,
    'lock': Lock,
    'key': Key,
    'award': Award,
    'flag': Flag,
    'bookmark': Bookmark,
    'tag': Tag,
    'calendar': Calendar,
    'clock': Clock
  };

  const availableColors = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
    'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-lime-500', 'bg-rose-500'
  ];

  const getIconComponent = (iconName: string) => {
    return availableIcons[iconName as keyof typeof availableIcons] || ClipboardCheck;
  };

  const getSectorCounts = (department: Department) => {
    return {
      nonVisualized: ticketCounts[department.id]?.nonVisualized || 0,
      total: ticketCounts[department.id]?.total || 0
    };
  };

  const handleAddSector = async () => {
    if (!sectorForm.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o setor.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newDepartment: Omit<Department, 'id' | 'created_at' | 'updated_at'> = {
        name: sectorForm.name,
        type: sectorForm.type,
        icon: sectorForm.icon,
        color: sectorForm.color,
        description: sectorForm.description,
        priority: sectorForm.priority,
        is_active: true
      };

      await addDepartment(newDepartment);
      
      toast({
        title: "Setor criado",
        description: "O setor foi criado com sucesso.",
      });
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao criar setor:", error);
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar o setor.",
        variant: "destructive"
      });
    }
  };

  const handleEditSector = (department: Department) => {
    setEditingSector(department);
    setSectorForm({
      id: department.id,
      name: department.name,
      type: department.type,
      icon: department.icon || 'Headphones',
      color: department.color || 'blue',
      description: department.description || '',
      priority: department.priority as PriorityType,
      is_active: department.is_active
    });
    setShowEditModal(true);
  };

  const handleDeleteSector = (department: Department) => {
    setDeletingSector(department);
    setShowDeleteDialog(true);
  };

  const validateAdminPassword = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        return true;
      } else {
        toast({
          title: "Senha incorreta",
          description: data.message || "A senha de administrador está incorreta.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Erro ao validar senha do administrador:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível validar a senha do administrador. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const confirmDeleteSector = async () => {
    const isValidPassword = await validateAdminPassword();
    if (!isValidPassword || !deletingSector) return;

    try {
      await deleteDepartment(deletingSector.id);
      
      toast({
        title: "Setor removido",
        description: `O setor "${deletingSector.name}" foi removido com sucesso.`,
      });

      onSelectDepartment(departments[departments.length - 2]);
    } catch (error) {
      toast({
        title: "Erro ao remover setor",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setDeletingSector(null);
      setAdminPassword('');
    }
  };

  const handleUpdateSector = async (sector: Department) => {
    try {
      if (!editingSector) return;

      const updates: Partial<Department> = {
          name: sectorForm.name,
        type: sectorForm.type,
        icon: sectorForm.icon,
        color: sectorForm.color,
          description: sectorForm.description,
        priority: sectorForm.priority,
        is_active: sector.is_active
      };

      await updateDepartment(editingSector.id, updates);
        
        toast({
        title: "Departamento atualizado",
        description: "As alterações foram salvas com sucesso.",
        });
        
        setShowEditModal(false);
      setEditingSector(null);
      resetForm();
      
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o departamento.",
        variant: "destructive",
      });
    }
  };

  // Componente para os campos do formulário
  const SectorFormFieldsComponent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input
          value={sectorForm.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do setor"
        />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={sectorForm.description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição do setor"
        />
      </div>

        <div className="space-y-2">
          <Label>Ícone</Label>
        <Select value={sectorForm.icon} onValueChange={setIcon}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um ícone" />
            </SelectTrigger>
          <SelectContent>
            {Object.keys(availableIcons).map((icon) => (
              <SelectItem key={icon} value={icon}>
                {icon}
                  </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
        <Select value={sectorForm.priority} onValueChange={setPriority}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="grid grid-cols-5 gap-2">
          {availableColors.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "h-8 w-8 rounded-full",
                color,
                sectorForm.color === color && "ring-2 ring-offset-2 ring-black"
              )}
              onClick={() => setColor(color)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
        <div className={cn(
          "flex items-center justify-center rounded-lg text-white text-xs font-medium w-8 h-8",
          sectorForm.color
        )}>
          {(() => {
            const IconComponent = getIconComponent(sectorForm.icon);
            return <IconComponent className="w-4 h-4" />;
          })()}
        </div>
        <div>
          <div className="font-medium text-sm">{sectorForm.name || 'Nome do Setor'}</div>
          <div className="text-2xs text-muted-foreground">{sectorForm.description || 'Descrição do setor'}</div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <AlertCircle className={styles.errorIcon} />
          <p className={styles.errorText}>{ERROR_MESSAGES.loading}</p>
        </div>
                <Button
          variant="outline" 
          className="w-full"
          onClick={() => window.location.reload()}
        >
          {ERROR_MESSAGES.retry}
                </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingHeader}>
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={styles.loadingSkeleton} />
        ))}
              </div>
            );
  }

  if (!departments.length) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyMessage}>
          <p className={styles.emptyTitle}>{ERROR_MESSAGES.empty}</p>
          <p className={styles.emptySubtitle}>{ERROR_MESSAGES.emptySubtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <aside
      className={
        styles.root +
        ' fixed md:static top-0 left-0 z-30 bg-slate-900 glass-effect shadow-xl border border-white/20 rounded-none md:rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ' +
        (isCollapsed ? 'w-16 min-w-[64px] max-w-[64px]' : 'w-72 min-w-[240px] max-w-[320px]') +
        ' h-screen pt-6 md:pt-8'
      }
      style={{ height: '100vh', minHeight: 0 }}
    >
      {/* Botão de expandir/colapsar */}
      <div className="flex items-center justify-end px-2 pb-2">
        <button
          className="bg-white/20 hover:bg-white/40 rounded-full p-1 transition"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      {/* Header com informações do usuário */}
      {!isCollapsed && (
        <div className={styles.header + ' bg-white/10 backdrop-blur-md border-b border-white/20 mt-0'}>
          <div className={styles.userContainer}>
            <div className={styles.userAvatar + ' bg-gradient-to-br from-blue-500 to-slate-700 shadow-lg rounded-full p-1'}>
              <User className={styles.userIcon + ' text-blue-400'} />
            </div>
            <div>
              <p className={styles.userName + ' text-slate-100'}>
                {user?.email?.split('@')[0] || 'Usuário'}
              </p>
              <p className={cn(styles.userStatus, USER_STATUS[userStatus].color, 'flex items-center gap-1')}> 
                <span className={'inline-block w-2 h-2 rounded-full ' + USER_STATUS[userStatus].color}></span>
                {USER_STATUS[userStatus].label}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Lista de departamentos com scroll */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className={styles.scrollArea + ' custom-scrollbar flex-1'}>
          <div className={styles.departmentList + ' space-y-3'}>
            {filteredSectors.map((department, index) => (
              <div
                key={department.id}
                            className={cn(
                  styles.departmentButton({
                    active: activeDepartment?.id === department.id
                  }),
                  'group transition-all duration-300 border border-transparent hover:border-blue-400/40 shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-400',
                  'cursor-pointer',
                  isCollapsed ? 'justify-center px-2' : ''
                )}
                onClick={() => onSelectDepartment(department)}
                tabIndex={0}
                aria-selected={activeDepartment?.id === department.id}
                role="button"
              >
                <div className={styles.departmentContent + ' gap-3'}>
                  <div className={styles.departmentIcon(getDepartmentColor(department)) + ' shadow-md'}>
                    {getDepartmentIcon(department)}
                              </div>
                  {!isCollapsed && (
                    <div className={styles.departmentInfo}>
                      <span className={styles.departmentName + ' text-base'}>{department.name}</span>
                      <div className={styles.departmentMeta + ' gap-2'}>
                        <Badge variant="outline" className={cn(styles.badge({ priority: department.priority }), 'rounded-full px-2 py-0.5')}> 
                          {PRIORITY_ICONS[department.priority]} {PRIORITY_LABELS[department.priority]}
                        </Badge>
                        {ticketCounts[department.id] && (
                          <Badge variant="secondary" className={styles.ticketCount + ' rounded-full px-2 py-0.5 bg-white/20 text-white'}>
                            {ticketCounts[department.id].nonVisualized}/{ticketCounts[department.id].total}
                                  </Badge>
                                )}
                              </div>
                    </div>
                              )}
                            </div>
                {!isCollapsed && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={styles.departmentActions + ' ml-auto'}>
                        <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditSector(department)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteSector(department)}
                                >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                )}
              </div>
            ))}
                          </div>
        </ScrollArea>
                        </div>
      {/* Botão Novo Setor fixo na base */}
      {!isLoading && departments.length > 0 && !isCollapsed && (
        <div className="sticky bottom-0 left-0 w-full bg-gradient-to-t from-slate-900/90 to-transparent pt-4 pb-2 px-4 z-10">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-xl text-base font-semibold py-3"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Novo Setor
          </Button>
            </div>
          )}
      {/* Modais */}
      {/* Modal Adicionar Setor */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Setor</DialogTitle>
            <DialogDescription>
              Configure as informações do novo setor do CRM
            </DialogDescription>
          </DialogHeader>
          <SectorFormFieldsComponent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleAddSector}>
              Adicionar Setor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Setor */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
            <DialogDescription>
              Altere as configurações do setor selecionado
            </DialogDescription>
          </DialogHeader>
          <SectorFormFieldsComponent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={() => handleUpdateSector(departments[departments.length - 1])}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Remoção */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O setor "{deletingSector?.name}" será removido permanentemente.
              
              <div className="mt-4 space-y-2">
                <Label htmlFor="admin-password">Digite a senha de administrador:</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Senha de administrador"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSector}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
} 