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
  Clock
} from 'lucide-react';

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
import { useDepartments, Department } from '@/hooks/useDepartments';

interface SidebarProps {
  sectors: Department[];
  selectedSector: Department | null;
  onSectorChange: (sector: Department) => void;
  collapsed: boolean;
  onToggle: () => void;
  onSectorUpdate?: () => void;
}

interface SectorFormData {
  name: string;
  icon: string;
  color: string;
  description: string;
  priority: 'alta' | 'normal' | 'baixa';
}

export const Sidebar = ({ sectors, selectedSector, onSectorChange, collapsed, onToggle, onSectorUpdate }: SidebarProps) => {
  const { toast } = useToast();
  const { addDepartment, updateDepartment, deleteDepartment } = useDepartments();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSector, setEditingSector] = useState<Department | null>(null);
  const [deletingSector, setDeletingSector] = useState<Department | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  
  const [ticketCounts, setTicketCounts] = useState<Record<string, { nonVisualized: number; total: number }>>({});
  
  const [sectorForm, setSectorForm] = useState<SectorFormData>({
    name: '',
    icon: 'Headphones',
    color: 'blue',
    description: '',
    priority: 'normal'
  });

  // Simulate real-time ticket count updates
  useEffect(() => {
    if (showAddModal || showEditModal || showDeleteDialog) {
      return;
    }

    const interval = setInterval(() => {
      if (showAddModal || showEditModal || showDeleteDialog) {
        return;
      }

      setTicketCounts(prev => {
        const updated = { ...prev };
        sectors.forEach(sector => {
          if (Math.random() > 0.8) {
            updated[sector.id] = {
              nonVisualized: Math.max(0, (prev[sector.id]?.nonVisualized || 0) + (Math.random() > 0.5 ? 1 : -1)),
              total: Math.max(1, (prev[sector.id]?.total || 1) + (Math.random() > 0.7 ? 1 : 0))
            };
          }
        });
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [sectors, showAddModal, showEditModal, showDeleteDialog]);

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

  const getSectorCounts = (sector: Department) => {
    return {
      nonVisualized: ticketCounts[sector.id]?.nonVisualized || 0,
      total: ticketCounts[sector.id]?.total || 0
    };
  };

  const handleAddSector = () => {
    setSectorForm({
      name: '',
      icon: 'Headphones',
      color: 'blue',
      description: '',
      priority: 'normal'
    });
    setShowAddModal(true);
  };

  const handleEditSector = (sector: Department) => {
    setEditingSector(sector);
    setSectorForm({
      name: sector.name,
      icon: sector.icon,
      color: sector.color,
      description: sector.description || '',
      priority: 'normal'
    });
    setShowEditModal(true);
  };

  const handleDeleteSector = (sector: Department) => {
    setDeletingSector(sector);
    setAdminPassword('');
    setShowDeleteDialog(true);
  };

  const validateAdminPassword = () => {
    const correctPassword = "admin123";
    if (adminPassword === correctPassword) {
      return true;
    } else {
      toast({
        title: "Senha incorreta",
        description: "A senha de administrador está incorreta.",
        variant: "destructive"
      });
      return false;
    }
  };

  const confirmDeleteSector = async () => {
    if (!validateAdminPassword() || !deletingSector) return;

    try {
      await deleteDepartment(deletingSector.id);
      
      toast({
        title: "Setor removido",
        description: `O setor "${deletingSector.name}" foi removido com sucesso.`,
      });

      onSectorUpdate?.();
      
      // Se o setor deletado era o selecionado, selecionar outro
      if (selectedSector?.id === deletingSector.id && sectors.length > 1) {
        const remainingSectors = sectors.filter(s => s.id !== deletingSector.id && s.isActive);
        if (remainingSectors.length > 0) {
          onSectorChange(remainingSectors[0]);
        }
      }
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

  const saveSector = async () => {
    if (!sectorForm.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o setor.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingSector) {
        await updateDepartment(editingSector.id, {
          name: sectorForm.name,
          description: sectorForm.description,
          color: sectorForm.color,
          icon: sectorForm.icon,
          isActive: true
        });
        
        toast({
          title: "Setor atualizado",
          description: `O setor "${sectorForm.name}" foi atualizado com sucesso.`,
        });
        
        setShowEditModal(false);
      } else {
        await addDepartment({
          name: sectorForm.name,
          description: sectorForm.description,
          color: sectorForm.color,
          icon: sectorForm.icon,
          isActive: true
        });
        
        toast({
          title: "Setor adicionado",
          description: `O setor "${sectorForm.name}" foi adicionado com sucesso.`,
        });
        
        setShowAddModal(false);
      }

      onSectorUpdate?.();
    } catch (error) {
      toast({
        title: editingSector ? "Erro ao atualizar setor" : "Erro ao adicionar setor",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setEditingSector(null);
      setSectorForm({
        name: '',
        icon: 'Headphones',
        color: 'blue',
        description: '',
        priority: 'normal'
      });
    }
  };

  // Componente para os campos do formulário
  const SectorFormFieldsComponent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Setor</Label>
        <Input
          id="name"
          value={sectorForm.name}
          onChange={(e) => setSectorForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Atendimento ao Cliente"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={sectorForm.description}
          onChange={(e) => setSectorForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição opcional do setor"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ícone</Label>
          <Select value={sectorForm.icon} onValueChange={(value) => setSectorForm(prev => ({ ...prev, icon: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Object.entries(availableIcons).map(([key, IconComponent]) => {
                const Icon = IconComponent as React.ComponentType<{ className?: string }>;
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="capitalize">{key.replace('-', ' ')}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={sectorForm.priority} onValueChange={(value) => setSectorForm(prev => ({ ...prev, priority: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cor do Setor</Label>
        <div className="grid grid-cols-5 gap-2">
          {availableColors.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-8 h-8 rounded-lg border-2 transition-all",
                color,
                sectorForm.color === color ? "border-foreground scale-110" : "border-border"
              )}
              onClick={() => setSectorForm(prev => ({ ...prev, color }))}
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

  if (collapsed) {
    return (
      <div className="h-full bg-gray-900 text-white p-2 flex flex-col">
        {/* Header minimizado */}
        <div className="flex items-center justify-center mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggle}
            className="text-white hover:bg-gray-800 p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Setores minimizados */}
        <div className="flex-1 space-y-2">
          {sectors.map((sector) => {
            const IconComponent = getIconComponent(sector.icon);
            const counts = getSectorCounts(sector);
            
            return (
              <div key={sector.id} className="relative">
                <Button
                  variant={selectedSector?.id === sector.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onSectorChange(sector)}
                  className={cn(
                    "w-full h-10 p-2 justify-center relative",
                    selectedSector?.id === sector.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                  title={sector.name}
                >
                  <IconComponent className="w-4 h-4" />
                </Button>
                
                {/* Badge com contadores */}
                {counts.nonVisualized > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] text-xs bg-red-500 hover:bg-red-600 px-1">
                    {counts.nonVisualized > 99 ? '99+' : counts.nonVisualized}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header da Sidebar */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Setores CRM</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleAddSector}
              className="text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggle}
              className="text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Setores */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sectors.map((sector) => {
          const IconComponent = getIconComponent(sector.icon);
          const counts = getSectorCounts(sector);
          
          return (
            <div key={sector.id} className="relative group">
              <Button
                variant={selectedSector?.id === sector.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-3 transition-all",
                  selectedSector?.id === sector.id
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
                onClick={() => onSectorChange(sector)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className={cn(
                    "flex items-center justify-center rounded-lg text-white text-xs font-medium w-8 h-8",
                    sector.color
                  )}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{sector.name}</div>
                    <div className="text-xs text-gray-400">
                      {counts.total} tickets • {counts.nonVisualized} não visualizados
                    </div>
                  </div>
                  
                  {counts.nonVisualized > 0 && (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
                      {counts.nonVisualized > 99 ? '99+' : counts.nonVisualized}
                    </Badge>
                  )}
                </div>
              </Button>

              {/* Menu de ações do setor */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleEditSector(sector)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar Setor
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteSector(sector)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover Setor
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

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
            <Button onClick={saveSector}>
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
            <Button onClick={saveSector}>
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
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 