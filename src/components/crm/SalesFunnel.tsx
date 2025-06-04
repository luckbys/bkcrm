import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { TicketChat } from './TicketChat';
import { 
  Search,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  User,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  Target,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Save,
  X,
  Copy,
  Share,
  BarChart3,
  PieChart,
  FileText,
  Calendar as CalendarIcon,
  MapPin,
  Building,
  Tag,
  History,
  MessageSquare,
  Video,
  PhoneCall,
  ExternalLink,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  Archive,
  AlertTriangle,
  Info,
  Loader2,
  CheckCheck,
  Grid3X3,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesFunnelProps {
  sector: any;
}

interface Opportunity {
  id: number;
  client: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  responsible: string;
  createdAt: Date;
  updatedAt: Date;
  nextAction: string;
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  source: string;
  tags: string[];
  description: string;
  contact: {
    phone: string;
    email: string;
  };
  address?: string;
  website?: string;
  expectedCloseDate?: Date;
  lastContactDate?: Date;
  notes?: string;
}

interface OpportunityFormData {
  client: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  responsible: string;
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  source: string;
  tags: string[];
  description: string;
  phone: string;
  email: string;
  address?: string;
  website?: string;
  expectedCloseDate?: Date;
  nextAction: string;
  notes?: string;
}

export const SalesFunnel = ({ sector }: SalesFunnelProps) => {
  // Hook do toast
  const { toast } = useToast();
  
  // Estados principais
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedResponsible, setSelectedResponsible] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  
  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OpportunityFormData>({
    client: '',
    company: '',
    value: 0,
    stage: 'leads',
    probability: 20,
    responsible: '',
    priority: 'normal',
    source: '',
    tags: [],
    description: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    expectedCloseDate: undefined,
    nextAction: '',
    notes: ''
  });

  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'probability' | 'date' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Estados do chat
  const [selectedOpportunityForChat, setSelectedOpportunityForChat] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Dados do funil
  const funnelStages = [
    { 
      id: 'leads', 
      name: 'Leads', 
      color: 'bg-blue-500', 
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Primeiros contatos',
      icon: User
    },
    { 
      id: 'qualified', 
      name: 'Qualificados', 
      color: 'bg-green-500', 
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Leads validados',
      icon: CheckCircle
    },
    { 
      id: 'proposal', 
      name: 'Propostas', 
      color: 'bg-orange-500', 
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Propostas enviadas',
      icon: FileText
    },
    { 
      id: 'negotiation', 
      name: 'Negociação', 
      color: 'bg-purple-500', 
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Em negociação',
      icon: MessageSquare
    },
    { 
      id: 'closed', 
      name: 'Fechados', 
      color: 'bg-emerald-500', 
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: 'Vendas concluídas',
      icon: Target
    }
  ];

  // Mock de oportunidades expandido
  const [opportunities, setOpportunities] = useState<Opportunity[]>([
    {
      id: 1,
      client: 'João Silva',
      company: 'TechCorp Ltda',
      value: 15000,
      stage: 'leads',
      probability: 20,
      responsible: 'Ana Costa',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      nextAction: 'Agendar demo do produto',
      priority: 'alta',
      source: 'Website',
      tags: ['novo', 'enterprise'],
      description: 'Interessado em solução enterprise para 100+ usuários',
      contact: { phone: '(11) 99999-9999', email: 'joao@techcorp.com' },
      address: 'São Paulo, SP',
      website: 'www.techcorp.com',
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      notes: 'Cliente muito interessado, tem budget aprovado'
    },
    {
      id: 2,
      client: 'Maria Santos',
      company: 'Inovação Digital',
      value: 8500,
      stage: 'qualified',
      probability: 45,
      responsible: 'Carlos Silva',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextAction: 'Enviar proposta personalizada',
      priority: 'normal',
      source: 'LinkedIn',
      tags: ['mid-market', 'recorrente'],
      description: 'Procura solução para automação de processos',
      contact: { phone: '(11) 88888-8888', email: 'maria@inovacao.com' },
      address: 'Rio de Janeiro, RJ',
      expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 3,
      client: 'Pedro Costa',
      company: 'StartupXYZ',
      value: 3200,
      stage: 'proposal',
      probability: 65,
      responsible: 'Ana Costa',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000),
      nextAction: 'Follow-up da proposta',
      priority: 'normal',
      source: 'Indicação',
      tags: ['startup', 'growth'],
      description: 'Startup em crescimento, precisa escalar operações',
      contact: { phone: '(11) 77777-7777', email: 'pedro@startupxyz.com' },
      address: 'São Paulo, SP',
      website: 'www.startupxyz.com',
      expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 4,
      client: 'Ana Oliveira',
      company: 'MegaCorp SA',
      value: 25000,
      stage: 'negotiation',
      probability: 80,
      responsible: 'Roberto Lima',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000),
      nextAction: 'Reunião com decisores',
      priority: 'urgente',
      source: 'Cold Email',
      tags: ['enterprise', 'high-value'],
      description: 'Grande oportunidade, multinacional interessada',
      contact: { phone: '(11) 66666-6666', email: 'ana@megacorp.com' },
      address: 'São Paulo, SP',
      website: 'www.megacorp.com',
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      lastContactDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
      notes: 'Decisão final na próxima semana'
    },
    {
      id: 5,
      client: 'Lucas Mendes',
      company: 'DevSolutions',
      value: 5800,
      stage: 'closed',
      probability: 100,
      responsible: 'Fernanda Souza',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 60 * 60 * 1000),
      nextAction: 'Implementação',
      priority: 'normal',
      source: 'Google Ads',
      tags: ['fechado', 'implementação'],
      description: 'Venda fechada, iniciar implementação',
      contact: { phone: '(11) 55555-5555', email: 'lucas@devsolutions.com' },
      address: 'Belo Horizonte, MG',
      website: 'www.devsolutions.com',
      expectedCloseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      notes: 'Cliente muito satisfeito, possível upsell futuro'
    }
  ]);

  // Computeds
  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities;

    if (searchQuery) {
      filtered = filtered.filter(opp => 
        opp.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedStage !== 'all') {
      filtered = filtered.filter(opp => opp.stage === selectedStage);
    }

    if (selectedResponsible !== 'all') {
      filtered = filtered.filter(opp => opp.responsible === selectedResponsible);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(opp => opp.priority === selectedPriority);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'value':
          aValue = a.value;
          bValue = b.value;
          break;
        case 'probability':
          aValue = a.probability;
          bValue = b.probability;
          break;
        case 'date':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case 'priority':
          const priorityOrder = { 'urgente': 4, 'alta': 3, 'normal': 2, 'baixa': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [opportunities, searchQuery, selectedStage, selectedResponsible, selectedPriority, sortBy, sortOrder]);

  const stageStats = useMemo(() => {
    return funnelStages.map(stage => {
      const stageOpportunities = filteredOpportunities.filter(opp => opp.stage === stage.id);
      const totalValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);
      const avgProbability = stageOpportunities.length > 0 
        ? stageOpportunities.reduce((sum, opp) => sum + opp.probability, 0) / stageOpportunities.length 
        : 0;
      
      return {
        ...stage,
        count: stageOpportunities.length,
        totalValue,
        avgProbability,
        opportunities: stageOpportunities
      };
    });
  }, [funnelStages, filteredOpportunities]);

  const totalValue = filteredOpportunities.reduce((sum, opp) => sum + opp.value, 0);
  const totalLeads = filteredOpportunities.filter(opp => opp.stage === 'leads').length;
  const totalClosed = filteredOpportunities.filter(opp => opp.stage === 'closed').length;
  const conversionRate = totalLeads > 0 ? (totalClosed / totalLeads) * 100 : 0;
  const avgDealSize = filteredOpportunities.length > 0 ? totalValue / filteredOpportunities.length : 0;

  // Handlers
  const getPriorityColor = (priority: string) => {
    const colors = {
      baixa: 'bg-green-100 text-green-800 border-green-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      alta: 'bg-orange-100 text-orange-800 border-orange-200',
      urgente: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return <AlertTriangle className="w-3 h-3" />;
      case 'alta':
        return <ArrowUp className="w-3 h-3" />;
      case 'normal':
        return <ArrowRight className="w-3 h-3" />;
      case 'baixa':
        return <ArrowDown className="w-3 h-3" />;
      default:
        return <ArrowRight className="w-3 h-3" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min atrás`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h atrás`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = useCallback((e: React.DragEvent, opportunity: Opportunity) => {
    setDraggedOpportunity(opportunity);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', opportunity.id.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Só remove o drag over se realmente saiu da área (não de um filho)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStage(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    setIsDragging(false);
    
    if (draggedOpportunity && draggedOpportunity.stage !== targetStage) {
      setIsLoading(true);
      
      try {
        // Simular API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Atualizar a oportunidade
        setOpportunities(prev => 
          prev.map(opp => 
            opp.id === draggedOpportunity.id 
              ? { 
                  ...opp, 
                  stage: targetStage, 
                  updatedAt: new Date(),
                  // Ajustar probabilidade baseada no estágio
                  probability: targetStage === 'leads' ? 20 :
                              targetStage === 'qualified' ? 40 :
                              targetStage === 'proposal' ? 60 :
                              targetStage === 'negotiation' ? 80 :
                              targetStage === 'closed' ? 100 : opp.probability
                }
              : opp
          )
        );

        toast({
          title: "Oportunidade movida!",
          description: `${draggedOpportunity.client} foi movido para ${funnelStages.find(s => s.id === targetStage)?.name}`,
        });

      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao mover oportunidade. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    setDraggedOpportunity(null);
  }, [draggedOpportunity, funnelStages, toast]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOpportunity(null);
    setIsDragging(false);
    setDragOverStage(null);
  }, []);

  // Modal Handlers
  const openModal = useCallback((opportunity?: Opportunity) => {
    if (opportunity) {
      setEditingOpportunity(opportunity);
      setFormData({
        client: opportunity.client,
        company: opportunity.company,
        value: opportunity.value,
        stage: opportunity.stage,
        probability: opportunity.probability,
        responsible: opportunity.responsible,
        priority: opportunity.priority,
        source: opportunity.source,
        tags: opportunity.tags,
        description: opportunity.description,
        phone: opportunity.contact.phone,
        email: opportunity.contact.email,
        address: opportunity.address || '',
        website: opportunity.website || '',
        expectedCloseDate: opportunity.expectedCloseDate,
        nextAction: opportunity.nextAction,
        notes: opportunity.notes || ''
      });
    } else {
      setEditingOpportunity(null);
      setFormData({
        client: '',
        company: '',
        value: 0,
        stage: 'leads',
        probability: 20,
        responsible: '',
        priority: 'normal',
        source: '',
        tags: [],
        description: '',
        phone: '',
        email: '',
        address: '',
        website: '',
        expectedCloseDate: undefined,
        nextAction: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingOpportunity(null);
  }, []);

  const handleSaveOpportunity = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (editingOpportunity) {
        // Editar oportunidade existente
        setOpportunities(prev => 
          prev.map(opp => 
            opp.id === editingOpportunity.id 
              ? {
                  ...opp,
                  ...formData,
                  contact: {
                    phone: formData.phone,
                    email: formData.email
                  },
                  updatedAt: new Date()
                }
              : opp
          )
        );
        
        toast({
          title: "Oportunidade atualizada!",
          description: `${formData.client} foi atualizado com sucesso.`,
        });
      } else {
        // Criar nova oportunidade
        const newOpportunity: Opportunity = {
          id: Math.max(...opportunities.map(o => o.id)) + 1,
          ...formData,
          contact: {
            phone: formData.phone,
            email: formData.email
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          lastContactDate: new Date()
        };
        
        setOpportunities(prev => [...prev, newOpportunity]);
        
        toast({
          title: "Oportunidade criada!",
          description: `${formData.client} foi adicionado ao funil.`,
        });
      }
      
      closeModal();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar oportunidade. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [editingOpportunity, formData, opportunities, closeModal]);

  // Contact Handlers
  const handleCall = useCallback((phone: string) => {
    window.open(`tel:${phone}`, '_self');
    toast({
      title: "Iniciando chamada",
      description: `Ligando para ${phone}`,
    });
  }, []);

  const handleEmail = useCallback((email: string, subject?: string) => {
    const mailtoLink = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
    window.open(mailtoLink, '_self');
    toast({
      title: "Abrindo cliente de email",
      description: `Enviando email para ${email}`,
    });
  }, []);

  const handleWhatsApp = useCallback((opportunity: Opportunity) => {
    // Converter oportunidade para formato de ticket
    const ticketData = {
      id: opportunity.id,
      client: opportunity.client,
      subject: `Chat sobre oportunidade - ${opportunity.company}`,
      status: 'atendimento',
      channel: 'whatsapp',
      lastMessage: 'Iniciando conversa',
      priority: opportunity.priority,
      contact: opportunity.contact,
      description: opportunity.description,
      company: opportunity.company
    };
    
    setSelectedOpportunityForChat(ticketData);
    setIsChatOpen(true);
    
    toast({
      title: "Chat iniciado",
      description: `Iniciando conversa com ${opportunity.client}`,
    });
  }, [toast]);

  const handleDeleteOpportunity = useCallback(async (opportunityId: number) => {
    if (!confirm('Tem certeza que deseja deletar esta oportunidade?')) return;
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
      
      toast({
        title: "Oportunidade deletada",
        description: "A oportunidade foi removida do funil.",
      });
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar oportunidade. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Other Handlers
  const handleSort = useCallback((field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy]);

  const handleCloseChatWhatsApp = useCallback(() => {
    setIsChatOpen(false);
    setSelectedOpportunityForChat(null);
  }, []);

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Funil de Vendas - {sector.name}</h1>
          <p className="text-gray-600 mt-1">Gerencie suas oportunidades de forma visual e eficiente</p>
        </div>
        
        <div className="flex items-center space-x-3">
            <Tooltip>
              <TooltipTrigger asChild>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atualizar dados do funil</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver relatórios detalhados</p>
              </TooltipContent>
            </Tooltip>
            
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
            
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => openModal()}
            >
            <Plus className="w-4 h-4 mr-2" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Valor Total</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalValue)}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    +12% vs mês anterior
                  </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-green-900">{conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-green-600 mt-1">
                    {conversionRate > 15 ? '+5%' : '-2%'} vs mês anterior
                  </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Oportunidades</p>
                <p className="text-2xl font-bold text-purple-900">{filteredOpportunities.length}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {filteredOpportunities.length} ativas
                  </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Ticket Médio</p>
                <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(avgDealSize)}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    +8% vs mês anterior
                </p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                  placeholder="Buscar por cliente, empresa, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center space-x-2">
                <Select
                  value={selectedStage}
                  onValueChange={setSelectedStage}
                >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Etapas</SelectItem>
                  {funnelStages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center space-x-2">
                          <stage.icon className="w-4 h-4" />
                          <span>{stage.name}</span>
                        </div>
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Ana Costa">Ana Costa</SelectItem>
                  <SelectItem value="Carlos Silva">Carlos Silva</SelectItem>
                  <SelectItem value="Roberto Lima">Roberto Lima</SelectItem>
                  <SelectItem value="Fernanda Souza">Fernanda Souza</SelectItem>
                </SelectContent>
              </Select>

                <Select
                  value={selectedPriority}
                  onValueChange={setSelectedPriority}
                >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="urgente">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span>Urgente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="alta">
                      <div className="flex items-center space-x-2">
                        <ArrowUp className="w-4 h-4 text-orange-500" />
                        <span>Alta</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="normal">
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                        <span>Normal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="baixa">
                      <div className="flex items-center space-x-2">
                        <ArrowDown className="w-4 h-4 text-green-500" />
                        <span>Baixa</span>
                      </div>
                    </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="rounded-r-none"
                >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                  Kanban
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                    <List className="w-4 h-4 mr-1" />
                  Lista
                </Button>
              </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(showFilters && "bg-gray-100")}
                >
                  <FilterIcon className="w-4 h-4" />
                </Button>
            </div>
          </div>

            {/* Filtros Avançados */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Ordenar por</Label>
                    <div className="flex items-center space-x-1 mt-1">
                      <Button
                        variant={sortBy === 'value' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleSort('value')}
                      >
                        Valor
                        {sortBy === 'value' && (
                          sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                      <Button
                        variant={sortBy === 'probability' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleSort('probability')}
                      >
                        Probabilidade
                        {sortBy === 'probability' && (
                          sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                      <Button
                        variant={sortBy === 'date' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleSort('date')}
                      >
                        Data
                        {sortBy === 'date' && (
                          sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Origem</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Todas as origens" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="indicacao">Indicação</SelectItem>
                        <SelectItem value="cold-email">Cold Email</SelectItem>
                        <SelectItem value="google-ads">Google Ads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Período</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Último mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-week">Última semana</SelectItem>
                        <SelectItem value="last-month">Último mês</SelectItem>
                        <SelectItem value="last-quarter">Último trimestre</SelectItem>
                        <SelectItem value="last-year">Último ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
          <div className={cn(
            "grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]",
            isDragging && "select-none"
          )}>
          {stageStats.map((stage) => (
            <div
              key={stage.id}
              className={cn(
                "flex flex-col rounded-lg border-2 transition-all duration-200",
                dragOverStage === stage.id 
                  ? cn("border-solid border-blue-400 shadow-lg bg-blue-50/50")
                  : stage.borderColor + " border-dashed",
                "hover:shadow-md relative"
              )}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Cabeçalho da Coluna */}
              <div className={cn("p-4 rounded-t-lg", stage.bgColor)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <stage.icon className={cn("w-5 h-5", stage.textColor)} />
                  <h3 className={cn("font-semibold", stage.textColor)}>{stage.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {stage.count}
                  </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              // Menu de ações
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Adicionar oportunidade em {stage.name}</p>
                        </TooltipContent>
                      </Tooltip>
                </div>
                  </div>
                  
                <p className="text-xs text-gray-600 mb-3">{stage.description}</p>
                
                {/* Estatísticas da Coluna */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Valor Total:</span>
                    <span className={cn("font-medium", stage.textColor)}>
                      {formatCurrency(stage.totalValue)}
                    </span>
                  </div>
                  {stage.count > 0 && (
                      <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Prob. Média:</span>
                      <span className={cn("font-medium", stage.textColor)}>
                        {stage.avgProbability.toFixed(0)}%
                      </span>
                    </div>
                        <Progress 
                          value={stage.avgProbability} 
                          className="h-2" 
                        />
                      </>
                  )}
                </div>
              </div>

              {/* Cards das Oportunidades */}
                <div 
                  className="flex-1 p-3 space-y-3 bg-gray-50/50 overflow-y-auto max-h-[600px] min-h-[200px]"
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  {stage.opportunities.map((opportunity) => (
                    <Card
                      key={opportunity.id}
                      className={cn(
                        "cursor-move hover:shadow-lg transition-all duration-200 bg-white",
                        draggedOpportunity?.id === opportunity.id && "opacity-50 scale-95",
                        "border-l-4",
                        opportunity.priority === 'urgente' ? 'border-l-red-500' :
                        opportunity.priority === 'alta' ? 'border-l-orange-500' :
                        opportunity.priority === 'normal' ? 'border-l-blue-500' : 'border-l-green-500',
                        "select-none"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, opportunity)}
                      onDragEnd={handleDragEnd}
                      style={{ 
                        cursor: isDragging ? 'grabbing' : 'grab'
                      }}
                    >
                    <CardContent className="p-4">
                      {/* Header do Card */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{opportunity.client}</h4>
                          <p className="text-sm text-gray-600 truncate">{opportunity.company}</p>
                            {opportunity.address && (
                              <div className="flex items-center space-x-1 mt-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{opportunity.address}</span>
                        </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Badge className={cn("text-xs flex items-center space-x-1", getPriorityColor(opportunity.priority))}>
                              {getPriorityIcon(opportunity.priority)}
                              <span>{opportunity.priority}</span>
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Menu de ações
                              }}
                            >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                          </div>
                      </div>

                      {/* Valor e Probabilidade */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(opportunity.value)}
                        </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-300",
                                  opportunity.probability >= 80 ? "bg-green-500" :
                                  opportunity.probability >= 60 ? "bg-blue-500" :
                                  opportunity.probability >= 40 ? "bg-yellow-500" : "bg-red-500"
                                )}
                              style={{ width: `${opportunity.probability}%` }}
                            />
                          </div>
                            <span className="text-xs text-gray-600 font-medium">{opportunity.probability}%</span>
                        </div>
                      </div>

                        {/* Tags */}
                        {opportunity.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {opportunity.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="w-2 h-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                            {opportunity.tags.length > 3 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs">
                                    +{opportunity.tags.length - 3}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{opportunity.tags.slice(3).join(', ')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                        </div>
                        )}

                        {/* Descrição */}
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {opportunity.description}
                        </p>

                      <Separator className="my-3" />

                        {/* Responsável e Data */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                              {opportunity.responsible.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-600">{opportunity.responsible}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-gray-500 cursor-help">
                                  {formatRelativeDate(opportunity.updatedAt)}
                          </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Última atualização: {formatDate(opportunity.updatedAt)}</p>
                              </TooltipContent>
                            </Tooltip>
                        </div>
                      </div>

                        {/* Data esperada de fechamento */}
                        {opportunity.expectedCloseDate && (
                          <div className="flex items-center space-x-2 mb-3">
                            <CalendarIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              Previsão: {formatDate(opportunity.expectedCloseDate)}
                            </span>
                            {opportunity.expectedCloseDate < new Date() && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                Atrasado
                              </Badge>
                            )}
                          </div>
                        )}

                      {/* Próxima Ação */}
                        <div className="bg-gray-50 rounded-md p-2 mb-3">
                          <div className="flex items-center space-x-1 mb-1">
                            <AlertCircle className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-medium text-gray-700">Próxima ação:</span>
                          </div>
                          <p className="text-xs text-gray-600">{opportunity.nextAction}</p>
                      </div>

                      {/* Ações do Card */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleCall(opportunity.contact.phone);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Phone className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ligar para {opportunity.contact.phone}</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleWhatsApp(opportunity);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>WhatsApp</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleEmail(opportunity.contact.email, `Proposta para ${opportunity.company}`);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Mail className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Email para {opportunity.contact.email}</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            {opportunity.website && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      window.open(opportunity.website?.startsWith('http') ? opportunity.website : `https://${opportunity.website}`, '_blank');
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visitar website</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    openModal(opportunity);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar oportunidade</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDeleteOpportunity(opportunity.id);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Deletar oportunidade</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Botão para adicionar nova oportunidade */}
                <Button
                  variant="ghost"
                    className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, stage: stage.id }));
                      openModal();
                    }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                    Adicionar em {stage.name}
                </Button>

                {/* Área de drop visual quando arrastando */}
                {isDragging && dragOverStage === stage.id && (
                  <div className="w-full h-20 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-medium animate-pulse">
                    <div className="flex items-center space-x-2">
                      <ArrowDown className="w-5 h-5" />
                      <span>Solte aqui para mover para {stage.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista em Lista */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lista de Oportunidades</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-normal text-gray-600">
                    {filteredOpportunities.length} oportunidades
                  </span>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openModal(opportunity)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {opportunity.client.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{opportunity.client}</h4>
                          <Badge className={cn("text-xs flex items-center space-x-1", getPriorityColor(opportunity.priority))}>
                            {getPriorityIcon(opportunity.priority)}
                            <span>{opportunity.priority}</span>
                        </Badge>
                    <Badge 
                      variant="outline" 
                      className={cn(
                              "text-xs",
                        funnelStages.find(s => s.id === opportunity.stage)?.textColor
                      )}
                    >
                      {funnelStages.find(s => s.id === opportunity.stage)?.name}
                    </Badge>
                    </div>
                        <p className="text-sm text-gray-600 mb-1">{opportunity.company}</p>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{opportunity.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{opportunity.responsible}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatRelativeDate(opportunity.updatedAt)}</span>
                          </div>
                          {opportunity.expectedCloseDate && (
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-3 h-3" />
                              <span>Previsão: {formatDate(opportunity.expectedCloseDate)}</span>
                            </div>
                          )}
                  </div>

                        {opportunity.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {opportunity.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right mr-4">
                      <div className="text-xl font-bold text-green-600 mb-1">
                        {formatCurrency(opportunity.value)}
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all",
                              opportunity.probability >= 80 ? "bg-green-500" :
                              opportunity.probability >= 60 ? "bg-blue-500" :
                              opportunity.probability >= 40 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${opportunity.probability}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {opportunity.probability}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCall(opportunity.contact.phone)}
                          >
                            <Phone className="w-4 h-4" />
                    </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ligar para {opportunity.contact.phone}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleWhatsApp(opportunity)}
                          >
                            <MessageSquare className="w-4 h-4" />
                    </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>WhatsApp</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEmail(opportunity.contact.email, `Proposta para ${opportunity.company}`)}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Email para {opportunity.contact.email}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
                
                {filteredOpportunities.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma oportunidade encontrada
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Tente ajustar seus filtros ou crie uma nova oportunidade.
                    </p>
                    <Button onClick={() => openModal()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Oportunidade
                    </Button>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

        {/* Modal de Edição/Criação */}
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {editingOpportunity ? (
                  <>
                    <Edit className="w-5 h-5" />
                    <span>Editar Oportunidade</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Nova Oportunidade</span>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Coluna Esquerda - Informações Básicas */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Informações do Cliente</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="client" className="text-xs text-gray-600">Nome do Cliente *</Label>
                      <Input
                        id="client"
                        placeholder="João Silva"
                        value={formData.client}
                        onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                        className="mt-1"
                      />
    </div>
                    <div>
                      <Label htmlFor="company" className="text-xs text-gray-600">Empresa *</Label>
                      <Input
                        id="company"
                        placeholder="TechCorp Ltda"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contato</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="phone" className="text-xs text-gray-600">Telefone *</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs text-gray-600">Email *</Label>
                      <Input
                        id="email"
                        placeholder="cliente@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="address" className="text-xs text-gray-600">Endereço</Label>
                    <Input
                      id="address"
                      placeholder="São Paulo, SP"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website" className="text-xs text-gray-600">Website</Label>
                    <Input
                      id="website"
                      placeholder="www.empresa.com"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-xs text-gray-600">Descrição *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva a oportunidade e necessidades do cliente..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-xs text-gray-600">Notas Internas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Anotações internas sobre o cliente/oportunidade..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 min-h-[60px]"
                  />
                </div>
              </div>

              {/* Coluna Direita - Detalhes da Oportunidade */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Detalhes da Oportunidade</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="value" className="text-xs text-gray-600">Valor (R$) *</Label>
                      <Input
                        id="value"
                        type="number"
                        placeholder="15000"
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="probability" className="text-xs text-gray-600">Probabilidade (%)</Label>
                      <div className="mt-1 space-y-2">
                        <Input
                          id="probability"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.probability}
                          onChange={(e) => setFormData(prev => ({ ...prev, probability: Number(e.target.value) }))}
                        />
                        <Progress value={formData.probability} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Etapa *</Label>
                    <Select
                      value={formData.stage}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {funnelStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            <div className="flex items-center space-x-2">
                              <stage.icon className="w-4 h-4" />
                              <span>{stage.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Prioridade *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'baixa' | 'normal' | 'alta' | 'urgente' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">
                          <div className="flex items-center space-x-2">
                            <ArrowDown className="w-4 h-4 text-green-500" />
                            <span>Baixa</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="normal">
                          <div className="flex items-center space-x-2">
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                            <span>Normal</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="alta">
                          <div className="flex items-center space-x-2">
                            <ArrowUp className="w-4 h-4 text-orange-500" />
                            <span>Alta</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="urgente">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span>Urgente</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="responsible" className="text-xs text-gray-600">Responsável</Label>
                    <Select
                      value={formData.responsible}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, responsible: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ana Costa">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-xs">AC</AvatarFallback>
                            </Avatar>
                            <span>Ana Costa</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Carlos Silva">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-xs">CS</AvatarFallback>
                            </Avatar>
                            <span>Carlos Silva</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Roberto Lima">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-xs">RL</AvatarFallback>
                            </Avatar>
                            <span>Roberto Lima</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Fernanda Souza">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-xs">FS</AvatarFallback>
                            </Avatar>
                            <span>Fernanda Souza</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="source" className="text-xs text-gray-600">Origem</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Como conheceu?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Indicação">Indicação</SelectItem>
                        <SelectItem value="Cold Email">Cold Email</SelectItem>
                        <SelectItem value="Google Ads">Google Ads</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                        <SelectItem value="Evento">Evento</SelectItem>
                        <SelectItem value="Telefone">Telefone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="expectedCloseDate" className="text-xs text-gray-600">Data Prevista de Fechamento</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate ? formData.expectedCloseDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      expectedCloseDate: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tags" className="text-xs text-gray-600">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="enterprise, startup, saas (separado por vírgula)"
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
                    }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separe as tags por vírgula</p>
                </div>

                <div>
                  <Label htmlFor="nextAction" className="text-xs text-gray-600">Próxima Ação *</Label>
                  <Input
                    id="nextAction"
                    placeholder="Agendar demo do produto"
                    value={formData.nextAction}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextAction: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                {/* Preview das Tags */}
                {formData.tags.length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-600">Preview das Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between pt-6 border-t">
              <div className="text-xs text-gray-500">
                * Campos obrigatórios
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={closeModal} disabled={isLoading}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveOpportunity} 
                  disabled={isLoading || !formData.client || !formData.company || !formData.phone || !formData.email || !formData.description || !formData.nextAction}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingOpportunity ? 'Atualizar' : 'Criar'} Oportunidade
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Chat WhatsApp */}
        {isChatOpen && selectedOpportunityForChat && (
          <TicketChat 
            ticket={selectedOpportunityForChat}
            onClose={handleCloseChatWhatsApp}
          />
        )}
      </div>
    </TooltipProvider>
  );
}; 