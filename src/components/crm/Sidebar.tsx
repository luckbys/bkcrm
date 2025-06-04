import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Headphones, 
  ShoppingCart, 
  ClipboardCheck, 
  BarChart3, 
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
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
import { cn } from '@/lib/utils';

interface SidebarProps {
  sectors: any[];
  selectedSector: any;
  onSectorChange: (sector: any) => void;
  collapsed: boolean;
  onToggle: () => void;
  onSectorUpdate?: (sectors: any[]) => void;
}

interface SectorFormData {
  name: string;
  icon: string;
  color: string;
  description: string;
  priority: 'alta' | 'normal' | 'baixa';
}

const toast = (options: any) => {
  console.log('Toast:', options);
  // Implementação simples de toast
};

export const Sidebar = ({ sectors, selectedSector, onSectorChange, collapsed, onToggle, onSectorUpdate }: SidebarProps) => {
  const [ticketCounts, setTicketCounts] = useState<Record<number, { nonVisualized: number; total: number }>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSector, setEditingSector] = useState<any>(null);
  const [deletingSector, setDeletingSector] = useState<any>(null);
  const [adminPassword, setAdminPassword] = useState('');
  
  const [sectorForm, setSectorForm] = useState<SectorFormData>({
    name: '',
    icon: 'clipboard-check',
    color: 'bg-blue-500',
    description: '',
    priority: 'normal'
  });

  // Simulate real-time ticket count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTicketCounts(prev => {
        const updated = { ...prev };
        sectors.forEach(sector => {
          if (Math.random() > 0.8) {
            updated[sector.id] = {
              nonVisualized: Math.max(0, (prev[sector.id]?.nonVisualized || sector.nonVisualized) + (Math.random() > 0.5 ? 1 : -1)),
              total: Math.max(1, (prev[sector.id]?.total || sector.total) + (Math.random() > 0.7 ? 1 : 0))
            };
          }
        });
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [sectors]);

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

  const getSectorCounts = (sector: any) => {
    return ticketCounts[sector.id] || { nonVisualized: sector.nonVisualized, total: sector.total };
  };

  const handleAddSector = () => {
    setSectorForm({
      name: '',
      icon: 'clipboard-check',
      color: 'bg-blue-500',
      description: '',
      priority: 'normal'
    });
    setShowAddModal(true);
  };

  const handleEditSector = (sector: any) => {
    setEditingSector(sector);
    setSectorForm({
      name: sector.name,
      icon: sector.icon,
      color: sector.color,
      description: sector.description || '',
      priority: sector.priority || 'normal'
    });
    setShowEditModal(true);
  };

  const handleDeleteSector = (sector: any) => {
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

  const confirmDeleteSector = () => {
    if (!validateAdminPassword()) return;

    const updatedSectors = sectors.filter(s => s.id !== deletingSector.id);
    onSectorUpdate?.(updatedSectors);
    
    toast({
      title: "Setor removido",
      description: `O setor "${deletingSector.name}" foi removido com sucesso.`,
    });

    setShowDeleteDialog(false);
    setDeletingSector(null);
    setAdminPassword('');

    // Se o setor deletado era o selecionado, selecionar o primeiro disponível
    if (selectedSector.id === deletingSector.id && updatedSectors.length > 0) {
      onSectorChange(updatedSectors[0]);
    }
  };

  const saveSector = () => {
    if (!sectorForm.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o setor.",
        variant: "destructive"
      });
      return;
    }

    if (editingSector) {
      const updatedSectors = sectors.map(s => 
        s.id === editingSector.id 
          ? { ...s, ...sectorForm }
          : s
      );
      onSectorUpdate?.(updatedSectors);
      
      toast({
        title: "Setor atualizado",
        description: `O setor "${sectorForm.name}" foi atualizado com sucesso.`,
      });
      
      setShowEditModal(false);
    } else {
      const newSector = {
        id: Math.max(...sectors.map(s => s.id)) + 1,
        ...sectorForm,
        nonVisualized: 0,
        total: 0
      };
      
      const updatedSectors = [...sectors, newSector];
      onSectorUpdate?.(updatedSectors);
      
      toast({
        title: "Setor adicionado",
        description: `O setor "${sectorForm.name}" foi adicionado com sucesso.`,
      });
      
      setShowAddModal(false);
    }

    setEditingSector(null);
  };

  const SectorFormFields = () => (
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
              {Object.entries(availableIcons).map(([key, IconComponent]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4" />
                    <span className="capitalize">{key.replace('-', ' ')}</span>
                  </div>
                </SelectItem>
              ))}
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

  return (
    <div 
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-lg",
        collapsed ? "w-16" : "w-72"
      )}
      style={{
        width: collapsed ? '64px' : '288px',
        minWidth: collapsed ? '64px' : '288px',
        maxWidth: collapsed ? '64px' : '288px'
      }}
    >
      {/* Toggle Button */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Toggle button clicked - current state:', collapsed);
              onToggle();
            }}
            className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 rounded-md"
            title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>

          {!collapsed && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddSector}
                className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                title="Adicionar Setor"
              >
                <Plus className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    title="Configurações"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleAddSector}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Setor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-muted-foreground" disabled>
                    <Shield className="w-4 h-4 mr-2" />
                    Configurações Avançadas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Sectors List */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="p-2 space-y-1">
          {sectors.map((sector) => {
            const IconComponent = getIconComponent(sector.icon);
            const counts = getSectorCounts(sector);
            const isSelected = selectedSector.id === sector.id;

            return (
              <div key={sector.id} className="relative group">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left transition-all duration-200 h-auto p-0 rounded-lg border",
                    collapsed ? "px-2 py-3" : "px-3 py-3",
                    isSelected 
                      ? "bg-blue-50 border-blue-200 text-blue-900 shadow-sm" 
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                  )}
                  onClick={() => onSectorChange(sector)}
                  title={collapsed ? `${sector.name} - ${counts.nonVisualized} não visualizados` : undefined}
                >
                  <div className="flex items-center w-full">
                    <div className={cn(
                      "flex items-center justify-center rounded-lg text-white text-xs font-medium shadow-sm transition-all duration-200",
                      sector.color,
                      collapsed ? "w-8 h-8" : "w-10 h-10 mr-3"
                    )}>
                      <IconComponent className={cn(collapsed ? "w-4 h-4" : "w-5 h-5")} />
                      
                      {collapsed && counts.nonVisualized > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-2xs rounded-full flex items-center justify-center border-2 border-white animate-pulse font-bold shadow-md">
                          {counts.nonVisualized > 9 ? '9+' : counts.nonVisualized}
                        </div>
                      )}
                    </div>
                    
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-sm font-semibold truncate transition-colors",
                            isSelected ? "text-blue-900" : "text-gray-800"
                          )}>
                            {sector.name}
                          </span>
                          <div className="flex items-center space-x-1.5 ml-2">
                            {counts.nonVisualized > 0 && (
                              <Badge 
                                className="text-2xs px-2 py-0.5 bg-red-500 text-white border-0 animate-pulse shadow-sm"
                              >
                                {counts.nonVisualized}
                              </Badge>
                            )}
                            <Badge 
                              variant="secondary" 
                              className="text-2xs px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-300"
                            >
                              {counts.total}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-2xs text-gray-500 mt-1 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          {counts.nonVisualized} não visualizados de {counts.total}
                        </div>
                      </div>
                    )}
                  </div>
                </Button>

                {/* Actions Menu */}
                {!collapsed && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSector(sector)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Setor
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteSector(sector)}
                          className="text-red-600 focus:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Setor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                
                {/* Tooltip rico para modo collapsed */}
                {collapsed && (
                  <div className="absolute left-full top-0 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none">
                    <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-xl border border-gray-700 whitespace-nowrap animate-scale-in">
                      <div className="font-semibold">{sector.name}</div>
                      <div className="text-xs text-gray-300 mt-1">
                        {counts.nonVisualized} não visualizados de {counts.total}
                      </div>
                      <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2">
                        <div className="w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-2xs text-gray-600 font-medium flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            📊 {sectors.length} Setores Ativos
          </div>
          <div className="text-2xs text-gray-500 mt-1 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Atualizando em tempo real
          </div>
        </div>
      )}
      
      {/* Mini indicator quando collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <div className="w-6 h-1 bg-blue-500 rounded-full mx-auto"></div>
            <p className="text-2xs text-gray-600 mt-1 font-medium">
              {sectors.length}
            </p>
          </div>
        </div>
      )}

      {/* Add Sector Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Adicionar Novo Setor</span>
            </DialogTitle>
          </DialogHeader>
          <SectorFormFields />
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

      {/* Edit Sector Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5" />
              <span>Editar Setor</span>
            </DialogTitle>
          </DialogHeader>
          <SectorFormFields />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <span>Confirmar Exclusão</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Você está prestes a excluir o setor <strong>"{deletingSector?.name}"</strong>. 
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-red-700 text-sm font-medium mb-2">
                  <Shield className="w-4 h-4" />
                  <span>Autenticação Necessária</span>
                </div>
                <Label htmlFor="admin-password" className="text-sm">
                  Digite a senha de administrador:
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Senha de administrador"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Senha padrão: admin123
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setAdminPassword('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSector}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!adminPassword.trim()}
            >
              Excluir Setor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
