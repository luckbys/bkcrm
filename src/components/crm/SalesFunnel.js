import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, DollarSign, TrendingUp, User, Phone, Mail, Edit, Trash2, Target, CheckCircle, FileText, MessageSquare, Save, X, Calendar, AlertTriangle, ArrowUp, ArrowRight, ArrowDown, Filter, RefreshCw, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
export const SalesFunnel = ({ sector }) => {
    const { toast } = useToast();
    // Estados
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState(null);
    const [draggedOpportunity, setDraggedOpportunity] = useState(null);
    const [dragOverStage, setDragOverStage] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedOpportunities, setSelectedOpportunities] = useState(new Set());
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [viewMode, setViewMode] = useState('card');
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [activityModal, setActivityModal] = useState({
        isOpen: false,
        opportunityId: null
    });
    const [filters, setFilters] = useState({
        responsible: '',
        priority: '',
        dateRange: '',
        minValue: '',
        maxValue: '',
        tags: '',
        source: '',
        lastActivity: ''
    });
    const [formData, setFormData] = useState({
        client: '',
        company: '',
        value: 0,
        stage: 'leads',
        probability: 20,
        responsible: '',
        priority: 'normal',
        description: '',
        phone: '',
        email: '',
        expectedCloseDate: '',
        tags: '',
        source: 'Website'
    });
    // Dados do funil com cores modernas
    const funnelStages = [
        {
            id: 'leads',
            name: 'Leads',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-700',
            icon: User,
            description: 'Primeiros contatos'
        },
        {
            id: 'qualified',
            name: 'Qualificados',
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
            borderColor: 'border-emerald-200',
            textColor: 'text-emerald-700',
            icon: CheckCircle,
            description: 'Leads validados'
        },
        {
            id: 'proposal',
            name: 'Propostas',
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-700',
            icon: FileText,
            description: 'Propostas enviadas'
        },
        {
            id: 'negotiation',
            name: 'Negociação',
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-700',
            icon: MessageSquare,
            description: 'Em negociação'
        },
        {
            id: 'closed',
            name: 'Fechados',
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
            borderColor: 'border-green-200',
            textColor: 'text-green-700',
            icon: Target,
            description: 'Vendas concluídas'
        }
    ];
    const [opportunities, setOpportunities] = useState([
        {
            id: 1,
            client: 'João Silva',
            company: 'TechCorp Ltda',
            value: 15000,
            stage: 'leads',
            probability: 20,
            responsible: 'Ana Costa',
            priority: 'alta',
            description: 'Interessado em solução enterprise para 100+ usuários',
            contact: { phone: '(11) 99999-9999', email: 'joao@techcorp.com' },
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            activities: [
                { id: 1, type: 'created', description: 'Oportunidade criada', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdBy: 'Ana Costa' },
                { id: 2, type: 'call', description: 'Ligação inicial - cliente interessado', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), createdBy: 'Ana Costa' }
            ],
            tags: ['Enterprise', 'Hot Lead', '100+ Users'],
            source: 'Website'
        },
        {
            id: 2,
            client: 'Maria Santos',
            company: 'Inovação Digital',
            value: 8500,
            stage: 'qualified',
            probability: 45,
            responsible: 'Carlos Silva',
            priority: 'normal',
            description: 'Procura solução para automação de processos',
            contact: { phone: '(11) 88888-8888', email: 'maria@inovacao.com' },
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            activities: [
                { id: 3, type: 'created', description: 'Oportunidade criada', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), createdBy: 'Carlos Silva' },
                { id: 4, type: 'email', description: 'Enviou proposta inicial', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdBy: 'Carlos Silva' }
            ],
            tags: ['Automação', 'SMB'],
            source: 'Indicação'
        },
        {
            id: 3,
            client: 'Pedro Costa',
            company: 'StartupXYZ',
            value: 3200,
            stage: 'proposal',
            probability: 65,
            responsible: 'Ana Costa',
            priority: 'normal',
            description: 'Startup em crescimento, precisa escalar operações',
            contact: { phone: '(11) 77777-7777', email: 'pedro@startupxyz.com' },
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            activities: [
                { id: 5, type: 'created', description: 'Oportunidade criada', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), createdBy: 'Ana Costa' },
                { id: 6, type: 'meeting', description: 'Reunião de apresentação', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), createdBy: 'Ana Costa' }
            ],
            tags: ['Startup', 'Crescimento', 'Escalabilidade'],
            source: 'LinkedIn'
        },
        {
            id: 4,
            client: 'Ana Oliveira',
            company: 'MegaCorp SA',
            value: 25000,
            stage: 'negotiation',
            probability: 80,
            responsible: 'Roberto Lima',
            priority: 'urgente',
            description: 'Grande oportunidade, multinacional interessada',
            contact: { phone: '(11) 66666-6666', email: 'ana@megacorp.com' },
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            lastActivity: new Date(),
            activities: [
                { id: 7, type: 'created', description: 'Oportunidade criada', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), createdBy: 'Roberto Lima' },
                { id: 8, type: 'call', description: 'Negociação de preços', createdAt: new Date(), createdBy: 'Roberto Lima' }
            ],
            tags: ['Enterprise', 'Multinacional', 'Alto Valor'],
            source: 'Event'
        },
        {
            id: 5,
            client: 'Lucas Mendes',
            company: 'DevSolutions',
            value: 5800,
            stage: 'closed',
            probability: 100,
            responsible: 'Fernanda Souza',
            priority: 'normal',
            description: 'Venda fechada, iniciar implementação',
            contact: { phone: '(11) 55555-5555', email: 'lucas@devsolutions.com' },
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            expectedCloseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            activities: [
                { id: 9, type: 'created', description: 'Oportunidade criada', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), createdBy: 'Fernanda Souza' },
                { id: 10, type: 'stage_change', description: 'Venda fechada com sucesso!', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), createdBy: 'Fernanda Souza' }
            ],
            tags: ['Fechado', 'Implementação'],
            source: 'Cold Call'
        }
    ]);
    // Filtrar oportunidades
    const filteredOpportunities = opportunities.filter(opp => {
        // Filtro de busca por texto
        const matchesSearch = searchQuery === '' || (opp.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opp.responsible.toLowerCase().includes(searchQuery.toLowerCase()));
        // Filtros avançados
        const matchesResponsible = !filters.responsible || filters.responsible === '' || filters.responsible === 'all' || opp.responsible === filters.responsible;
        const matchesPriority = !filters.priority || filters.priority === '' || filters.priority === 'all' || opp.priority === filters.priority;
        const matchesValueRange = (() => {
            const minValue = filters.minValue ? parseFloat(filters.minValue) : 0;
            const maxValue = filters.maxValue ? parseFloat(filters.maxValue) : Infinity;
            return opp.value >= minValue && opp.value <= maxValue;
        })();
        const matchesDateRange = (() => {
            if (!filters.dateRange || filters.dateRange === '' || filters.dateRange === 'all' || !opp.expectedCloseDate)
                return true;
            const today = new Date();
            const closeDate = opp.expectedCloseDate;
            switch (filters.dateRange) {
                case 'this_week':
                    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return closeDate <= weekFromNow;
                case 'this_month':
                    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                    return closeDate <= monthFromNow;
                case 'overdue':
                    return closeDate < today;
                default:
                    return true;
            }
        })();
        const matchesTags = !filters.tags || filters.tags === '' || opp.tags.some(tag => tag.toLowerCase().includes(filters.tags.toLowerCase()));
        const matchesSource = !filters.source || filters.source === '' || filters.source === 'all' || opp.source === filters.source;
        const matchesLastActivity = (() => {
            if (!filters.lastActivity || filters.lastActivity === '' || filters.lastActivity === 'all' || !opp.lastActivity)
                return true;
            const today = new Date();
            const activityDate = opp.lastActivity;
            switch (filters.lastActivity) {
                case 'today':
                    return activityDate.toDateString() === today.toDateString();
                case 'week':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return activityDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return activityDate >= monthAgo;
                case 'inactive':
                    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
                    return activityDate < twoWeeksAgo;
                default:
                    return true;
            }
        })();
        const matches = matchesSearch && matchesResponsible && matchesPriority && matchesValueRange &&
            matchesDateRange && matchesTags && matchesSource && matchesLastActivity;
        // Debug log para ver quais oportunidades passam no filtro
        if (!matches) {
            console.log('🚫 Oportunidade filtrada:', opp.client, {
                matchesSearch,
                matchesResponsible,
                matchesPriority,
                matchesValueRange,
                matchesDateRange,
                matchesTags,
                matchesSource,
                matchesLastActivity,
                filters
            });
        }
        return matches;
    });
    console.log('📊 Opportunities:', opportunities.length, 'Filtered:', filteredOpportunities.length);
    // Calcular estatísticas
    const totalValue = filteredOpportunities.reduce((sum, opp) => sum + opp.value, 0);
    const totalOpportunities = filteredOpportunities.length;
    const weightedValue = filteredOpportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);
    const conversionRate = opportunities.length > 0 ? (opportunities.filter(opp => opp.stage === 'closed').length / opportunities.length) * 100 : 0;
    // Funções utilitárias
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };
    const formatRelativeDate = (date) => {
        const now = new Date();
        const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffInDays < 0)
            return `${Math.abs(diffInDays)} dias atrasado`;
        if (diffInDays === 0)
            return 'Hoje';
        if (diffInDays === 1)
            return 'Amanhã';
        return `${diffInDays} dias`;
    };
    const getPriorityColor = (priority) => {
        const colors = {
            baixa: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
            normal: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
            alta: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300',
            urgente: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300'
        };
        return colors[priority] || colors.normal;
    };
    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgente': return _jsx(AlertTriangle, { className: "w-3 h-3" });
            case 'alta': return _jsx(ArrowUp, { className: "w-3 h-3" });
            case 'normal': return _jsx(ArrowRight, { className: "w-3 h-3" });
            case 'baixa': return _jsx(ArrowDown, { className: "w-3 h-3" });
            default: return _jsx(ArrowRight, { className: "w-3 h-3" });
        }
    };
    // Drag and Drop Handlers
    const handleDragStart = useCallback((e, opportunity) => {
        setDraggedOpportunity(opportunity);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', opportunity.id.toString());
        // Criar imagem de drag personalizada
        const dragImage = document.createElement('div');
        dragImage.innerHTML = `
      <div style="
        background: white; 
        border: 2px solid #3b82f6; 
        padding: 12px; 
        border-radius: 8px; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        font-family: system-ui;
        max-width: 250px;
      ">
        <div style="font-weight: bold; color: #1f2937; margin-bottom: 4px;">${opportunity.client}</div>
        <div style="font-size: 12px; color: #6b7280;">${opportunity.company} • ${formatCurrency(opportunity.value)}</div>
      </div>
    `;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 125, 50);
        // Remover elemento após um tempo
        setTimeout(() => document.body.removeChild(dragImage), 0);
        // Adicionar classe de transparência
        setTimeout(() => {
            e.target.style.opacity = '0.5';
        }, 0);
    }, []);
    const handleDragEnd = useCallback((e) => {
        e.target.style.opacity = '1';
        setDraggedOpportunity(null);
        setIsDragging(false);
        setDragOverStage(null);
    }, []);
    const handleDragOver = useCallback((e, stageId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverStage(stageId);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverStage(null);
        }
    }, []);
    const handleDrop = useCallback((e, targetStage) => {
        e.preventDefault();
        setDragOverStage(null);
        setIsDragging(false);
        if (draggedOpportunity && draggedOpportunity.stage !== targetStage) {
            // Atualizar probabilidade baseada no estágio
            const newProbability = targetStage === 'leads' ? 20 :
                targetStage === 'qualified' ? 40 :
                    targetStage === 'proposal' ? 60 :
                        targetStage === 'negotiation' ? 80 :
                            targetStage === 'closed' ? 100 : draggedOpportunity.probability;
            setOpportunities(prev => prev.map(opp => opp.id === draggedOpportunity.id
                ? { ...opp, stage: targetStage, probability: newProbability }
                : opp));
            const stageName = funnelStages.find(s => s.id === targetStage)?.name;
            toast({
                title: "✅ Oportunidade movida!",
                description: `${draggedOpportunity.client} foi movido para ${stageName}`,
            });
        }
        setDraggedOpportunity(null);
    }, [draggedOpportunity, funnelStages, toast]);
    // Handlers do Modal
    const openModal = (opportunity) => {
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
                description: opportunity.description,
                phone: opportunity.contact.phone,
                email: opportunity.contact.email,
                expectedCloseDate: opportunity.expectedCloseDate ? opportunity.expectedCloseDate.toISOString().split('T')[0] : '',
                tags: opportunity.tags.join(', '),
                source: opportunity.source
            });
        }
        else {
            setEditingOpportunity(null);
            setFormData({
                client: '',
                company: '',
                value: 0,
                stage: 'leads',
                probability: 20,
                responsible: '',
                priority: 'normal',
                description: '',
                phone: '',
                email: '',
                expectedCloseDate: '',
                tags: '',
                source: 'Website'
            });
        }
        setIsModalOpen(true);
    };
    const closeModal = () => {
        console.log('🔒 Fechando modal...');
        setIsModalOpen(false);
        setEditingOpportunity(null);
        console.log('🔒 Modal fechado');
    };
    const handleSave = () => {
        console.log('🔥 handleSave chamado', { formData, editingOpportunity });
        console.log('🔥 Validação - client:', formData.client, 'company:', formData.company);
        // Validação melhorada - temporariamente relaxada para debug
        if (!formData.client || formData.client.trim() === '') {
            console.log('❌ Validação falhou - cliente vazio');
            toast({
                title: "❌ Erro de validação",
                description: "O nome do cliente é obrigatório.",
                variant: "destructive"
            });
            return;
        }
        if (!formData.company || formData.company.trim() === '') {
            console.log('❌ Validação falhou - empresa vazia');
            toast({
                title: "❌ Erro de validação",
                description: "O nome da empresa é obrigatório.",
                variant: "destructive"
            });
            return;
        }
        console.log('✅ Validação passou, continuando...');
        if (editingOpportunity) {
            console.log('📝 Editando oportunidade existente');
            setOpportunities(prev => prev.map(opp => opp.id === editingOpportunity.id
                ? {
                    ...opp,
                    client: formData.client,
                    company: formData.company,
                    value: formData.value,
                    stage: formData.stage,
                    probability: formData.probability,
                    responsible: formData.responsible,
                    priority: formData.priority,
                    description: formData.description,
                    contact: { phone: formData.phone, email: formData.email },
                    expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate) : undefined,
                    tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                    source: formData.source
                }
                : opp));
            toast({
                title: "✅ Oportunidade atualizada!",
                description: `${formData.client} foi atualizado com sucesso.`,
            });
        }
        else {
            console.log('🆕 Criando nova oportunidade');
            const currentOpportunities = opportunities;
            console.log('📊 Oportunidades atuais:', currentOpportunities.length);
            const maxId = currentOpportunities.length > 0 ? Math.max(...currentOpportunities.map(o => o.id)) : 0;
            console.log('🔢 Próximo ID:', maxId + 1);
            const newOpportunity = {
                id: maxId + 1,
                client: formData.client,
                company: formData.company,
                value: formData.value || 0,
                stage: formData.stage,
                probability: formData.probability,
                responsible: formData.responsible,
                priority: formData.priority,
                description: formData.description,
                contact: { phone: formData.phone, email: formData.email },
                createdAt: new Date(),
                expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate) : undefined,
                lastActivity: new Date(),
                activities: [{
                        id: Date.now(),
                        type: 'created',
                        description: 'Oportunidade criada',
                        createdAt: new Date(),
                        createdBy: 'Usuário Atual'
                    }],
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                source: formData.source
            };
            console.log('🆕 Nova oportunidade criada:', newOpportunity);
            setOpportunities(prev => {
                const newList = [...prev, newOpportunity];
                console.log('📋 Lista atualizada:', newList.length, 'itens');
                console.log('📋 Última oportunidade:', newList[newList.length - 1]);
                return newList;
            });
            toast({
                title: "🎉 Oportunidade criada!",
                description: `${formData.client} foi adicionado ao funil na etapa ${funnelStages.find(s => s.id === formData.stage)?.name}.`,
            });
        }
        console.log('🔄 Fechando modal...');
        closeModal();
    };
    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja deletar esta oportunidade?')) {
            setOpportunities(prev => prev.filter(opp => opp.id !== id));
            setSelectedOpportunities(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
            toast({
                title: "🗑️ Oportunidade deletada",
                description: "A oportunidade foi removida do funil.",
            });
        }
    };
    // Funções para seleção múltipla
    const toggleOpportunitySelection = (id) => {
        setSelectedOpportunities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            }
            else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    const selectAllOpportunities = () => {
        setSelectedOpportunities(new Set(filteredOpportunities.map(opp => opp.id)));
    };
    const clearSelection = () => {
        setSelectedOpportunities(new Set());
    };
    const moveSelectedOpportunities = (targetStage) => {
        if (selectedOpportunities.size === 0)
            return;
        const newProbability = targetStage === 'leads' ? 20 :
            targetStage === 'qualified' ? 40 :
                targetStage === 'proposal' ? 60 :
                    targetStage === 'negotiation' ? 80 :
                        targetStage === 'closed' ? 100 : 20;
        setOpportunities(prev => prev.map(opp => selectedOpportunities.has(opp.id)
            ? { ...opp, stage: targetStage, probability: newProbability }
            : opp));
        const stageName = funnelStages.find(s => s.id === targetStage)?.name;
        toast({
            title: "✅ Oportunidades movidas!",
            description: `${selectedOpportunities.size} oportunidades foram movidas para ${stageName}`,
        });
        clearSelection();
    };
    const deleteSelectedOpportunities = () => {
        if (selectedOpportunities.size === 0)
            return;
        if (confirm(`Tem certeza que deseja deletar ${selectedOpportunities.size} oportunidades?`)) {
            setOpportunities(prev => prev.filter(opp => !selectedOpportunities.has(opp.id)));
            toast({
                title: "🗑️ Oportunidades deletadas",
                description: `${selectedOpportunities.size} oportunidades foram removidas.`,
            });
            clearSelection();
        }
    };
    // Limpar filtros
    const clearFilters = () => {
        setFilters({
            responsible: '',
            priority: '',
            dateRange: '',
            minValue: '',
            maxValue: '',
            tags: '',
            source: '',
            lastActivity: ''
        });
        setSearchQuery('');
    };
    // Funções para atividades
    const addActivity = (opportunityId, type, description) => {
        const newActivity = {
            id: Date.now(),
            type,
            description,
            createdAt: new Date(),
            createdBy: 'Usuário Atual' // Em produção viria do contexto de auth
        };
        setOpportunities(prev => prev.map(opp => opp.id === opportunityId
            ? {
                ...opp,
                activities: [...opp.activities, newActivity],
                lastActivity: new Date()
            }
            : opp));
        toast({
            title: "✅ Atividade adicionada!",
            description: `${type === 'note' ? 'Nota' : type === 'call' ? 'Ligação' : type === 'email' ? 'Email' : 'Reunião'} registrada com sucesso.`,
        });
    };
    // Obter ícone da atividade
    const getActivityIcon = (type) => {
        switch (type) {
            case 'call': return _jsx(Phone, { className: "w-3 h-3 text-blue-600" });
            case 'email': return _jsx(Mail, { className: "w-3 h-3 text-green-600" });
            case 'meeting': return _jsx(Calendar, { className: "w-3 h-3 text-purple-600" });
            case 'note': return _jsx(FileText, { className: "w-3 h-3 text-orange-600" });
            case 'stage_change': return _jsx(ArrowRight, { className: "w-3 h-3 text-indigo-600" });
            case 'created': return _jsx(Plus, { className: "w-3 h-3 text-gray-600" });
            default: return _jsx(FileText, { className: "w-3 h-3 text-gray-600" });
        }
    };
    // Verificar se há filtros ativos
    const hasActiveFilters = Object.values(filters).some(filter => filter !== '') || searchQuery !== '';
    // Atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Esc para fechar modal ou limpar seleção
            if (e.key === 'Escape') {
                if (isModalOpen) {
                    closeModal();
                }
                else if (selectedOpportunities.size > 0) {
                    clearSelection();
                }
            }
            // Ctrl+A para selecionar todos
            if (e.ctrlKey && e.key === 'a' && !isModalOpen) {
                e.preventDefault();
                selectAllOpportunities();
            }
            // Delete para deletar selecionados
            if (e.key === 'Delete' && selectedOpportunities.size > 0 && !isModalOpen) {
                deleteSelectedOpportunities();
            }
            // Ctrl+N para nova oportunidade
            if (e.ctrlKey && e.key === 'n' && !isModalOpen) {
                e.preventDefault();
                openModal();
            }
            // Ctrl+F para focar na busca
            if (e.ctrlKey && e.key === 'f' && !isModalOpen) {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Buscar"]');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, selectedOpportunities.size, selectAllOpportunities, clearSelection, deleteSelectedOpportunities, closeModal, openModal]);
    const handleAddCard = (stageId) => {
        console.log('🎯 handleAddCard chamado com stageId:', stageId);
        setEditingOpportunity(null);
        const newFormData = {
            client: '',
            company: '',
            value: 0,
            stage: stageId,
            probability: stageId === 'leads' ? 20 : stageId === 'qualified' ? 40 : stageId === 'proposal' ? 60 : stageId === 'negotiation' ? 80 : 100,
            responsible: '',
            priority: 'normal',
            description: '',
            phone: '',
            email: '',
            expectedCloseDate: '',
            tags: '',
            source: 'Website'
        };
        console.log('📝 FormData resetado:', newFormData);
        setFormData(newFormData);
        console.log('🚀 Abrindo modal...');
        setIsModalOpen(true);
    };
    return (_jsx(TooltipProvider, { children: _jsxs("div", { className: "space-y-6 p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent", children: ["Funil de Vendas - ", sector.name] }), _jsx("p", { className: "text-gray-600 mt-2 text-lg", children: "Gerencie suas oportunidades com drag & drop" })] }), _jsxs(Button, { onClick: () => openModal(), className: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200", children: [_jsx(Plus, { className: "w-5 h-5 mr-2" }), "Nova Oportunidade"] }), _jsxs(Button, { onClick: () => {
                                console.log('🔄 Reset de emergência - limpando todos os filtros');
                                setFilters({
                                    responsible: '',
                                    priority: '',
                                    dateRange: '',
                                    minValue: '',
                                    maxValue: '',
                                    tags: '',
                                    source: '',
                                    lastActivity: ''
                                });
                                setSearchQuery('');
                                console.log('✅ Filtros resetados');
                            }, variant: "outline", className: "border-red-300 text-red-600 hover:bg-red-50", children: [_jsx(RefreshCw, { className: "w-5 h-5 mr-2" }), "Reset Debug"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsx(Card, { className: "bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-green-700", children: "Valor Total" }), _jsx("p", { className: "text-3xl font-bold text-green-800", children: formatCurrency(totalValue) }), _jsx("p", { className: "text-xs text-green-600 mt-1", children: "Pipeline completo" })] }), _jsx("div", { className: "p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg", children: _jsx(DollarSign, { className: "w-8 h-8 text-white" }) })] }) }) }), _jsx(Card, { className: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-blue-700", children: "Valor Ponderado" }), _jsx("p", { className: "text-3xl font-bold text-blue-800", children: formatCurrency(weightedValue) }), _jsx("p", { className: "text-xs text-blue-600 mt-1", children: "Por probabilidade" })] }), _jsx("div", { className: "p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg", children: _jsx(TrendingUp, { className: "w-8 h-8 text-white" }) })] }) }) }), _jsx(Card, { className: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-purple-700", children: "Oportunidades" }), _jsx("p", { className: "text-3xl font-bold text-purple-800", children: totalOpportunities }), _jsx("p", { className: "text-xs text-purple-600 mt-1", children: "Total ativas" })] }), _jsx("div", { className: "p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-lg", children: _jsx(Target, { className: "w-8 h-8 text-white" }) })] }) }) }), _jsx(Card, { className: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-orange-700", children: "Taxa de Convers\u00E3o" }), _jsxs("p", { className: "text-3xl font-bold text-orange-800", children: [conversionRate.toFixed(1), "%"] }), _jsx("p", { className: "text-xs text-orange-600 mt-1", children: "Leads \u2192 Fechados" })] }), _jsx("div", { className: "p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg", children: _jsx(Target, { className: "w-8 h-8 text-white" }) })] }) }) })] }), _jsx(Card, { className: "shadow-lg border-0 bg-white/80 backdrop-blur-sm", children: _jsxs(CardContent, { className: "p-6 space-y-4", children: [_jsxs("div", { className: "flex flex-col lg:flex-row gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx(Input, { placeholder: "\uD83D\uDD0D Buscar por cliente, empresa, respons\u00E1vel ou descri\u00E7\u00E3o...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-12 pr-12 py-3 text-lg border-2 border-gray-200 focus:border-blue-400 rounded-xl transition-colors shadow-sm" }), searchQuery && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setSearchQuery(''), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-4 h-4" }) }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => setIsFiltersOpen(!isFiltersOpen), className: cn("px-4 py-3 h-auto border-2 transition-all duration-200", isFiltersOpen || hasActiveFilters
                                                    ? "border-blue-400 bg-blue-50 text-blue-700"
                                                    : "border-gray-200"), children: [_jsx(Filter, { className: "w-4 h-4 mr-2" }), "Filtros", hasActiveFilters && (_jsx(Badge, { className: "ml-2 bg-blue-600 text-white text-xs px-2 py-1", children: Object.values(filters).filter(f => f !== '').length + (searchQuery ? 1 : 0) }))] }), hasActiveFilters && (_jsxs(Button, { variant: "ghost", onClick: clearFilters, className: "px-4 py-3 h-auto text-gray-600 hover:text-gray-800", children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "Limpar"] }))] })] }), isFiltersOpen && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-gray-700 mb-2 block", children: "Respons\u00E1vel" }), _jsxs(Select, { value: filters.responsible, onValueChange: (value) => setFilters(prev => ({ ...prev, responsible: value })), children: [_jsx(SelectTrigger, { className: "bg-white", children: _jsx(SelectValue, { placeholder: "Todos" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Todos" }), _jsx(SelectItem, { value: "Ana Costa", children: "Ana Costa" }), _jsx(SelectItem, { value: "Carlos Silva", children: "Carlos Silva" }), _jsx(SelectItem, { value: "Roberto Lima", children: "Roberto Lima" }), _jsx(SelectItem, { value: "Fernanda Souza", children: "Fernanda Souza" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-gray-700 mb-2 block", children: "Prioridade" }), _jsxs(Select, { value: filters.priority, onValueChange: (value) => setFilters(prev => ({ ...prev, priority: value })), children: [_jsx(SelectTrigger, { className: "bg-white", children: _jsx(SelectValue, { placeholder: "Todas" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Todas" }), _jsx(SelectItem, { value: "urgente", children: "Urgente" }), _jsx(SelectItem, { value: "alta", children: "Alta" }), _jsx(SelectItem, { value: "normal", children: "Normal" }), _jsx(SelectItem, { value: "baixa", children: "Baixa" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-gray-700 mb-2 block", children: "Fonte" }), _jsxs(Select, { value: filters.source, onValueChange: (value) => setFilters(prev => ({ ...prev, source: value })), children: [_jsx(SelectTrigger, { className: "bg-white", children: _jsx(SelectValue, { placeholder: "Todas" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Todas" }), _jsx(SelectItem, { value: "Website", children: "Website" }), _jsx(SelectItem, { value: "Indica\u00E7\u00E3o", children: "Indica\u00E7\u00E3o" }), _jsx(SelectItem, { value: "LinkedIn", children: "LinkedIn" }), _jsx(SelectItem, { value: "Event", children: "Evento" }), _jsx(SelectItem, { value: "Cold Call", children: "Cold Call" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-gray-700 mb-2 block", children: "\u00DAltima Atividade" }), _jsxs(Select, { value: filters.lastActivity, onValueChange: (value) => setFilters(prev => ({ ...prev, lastActivity: value })), children: [_jsx(SelectTrigger, { className: "bg-white", children: _jsx(SelectValue, { placeholder: "Todas" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Todas" }), _jsx(SelectItem, { value: "today", children: "Hoje" }), _jsx(SelectItem, { value: "week", children: "Esta semana" }), _jsx(SelectItem, { value: "month", children: "Este m\u00EAs" }), _jsx(SelectItem, { value: "inactive", children: "Inativas (14+ dias)" })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-gray-700 mb-2 block", children: "Prazo de Fechamento" }), _jsxs(Select, { value: filters.dateRange, onValueChange: (value) => setFilters(prev => ({ ...prev, dateRange: value })), children: [_jsx(SelectTrigger, { className: "bg-white", children: _jsx(SelectValue, { placeholder: "Todos" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Todos" }), _jsx(SelectItem, { value: "overdue", children: "Em atraso" }), _jsx(SelectItem, { value: "this_week", children: "Esta semana" }), _jsx(SelectItem, { value: "this_month", children: "Este m\u00EAs" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-gray-700 mb-2 block", children: "Valor M\u00EDn." }), _jsx(Input, { type: "number", placeholder: "R$ 0", value: filters.minValue, onChange: (e) => setFilters(prev => ({ ...prev, minValue: e.target.value })), className: "bg-white" })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-gray-700 mb-2 block", children: "Valor M\u00E1x." }), _jsx(Input, { type: "number", placeholder: "R$ \u221E", value: filters.maxValue, onChange: (e) => setFilters(prev => ({ ...prev, maxValue: e.target.value })), className: "bg-white" })] })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-xl border border-gray-200", children: [_jsx(Label, { className: "text-sm font-medium text-gray-700 mb-2 block", children: "Tags (separadas por v\u00EDrgula)" }), _jsx(Input, { placeholder: "ex: Enterprise, Hot Lead, SMB...", value: filters.tags, onChange: (e) => setFilters(prev => ({ ...prev, tags: e.target.value })), className: "bg-white" })] })] })), selectedOpportunities.size > 0 && (_jsxs("div", { className: "flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { className: "text-blue-800 font-semibold", children: [selectedOpportunities.size, " oportunidade(s) selecionada(s)"] }), _jsx(Button, { variant: "outline", size: "sm", onClick: clearSelection, className: "border-blue-300 text-blue-700 hover:bg-blue-100", children: "Limpar sele\u00E7\u00E3o" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Select, { onValueChange: moveSelectedOpportunities, children: [_jsx(SelectTrigger, { className: "w-48 bg-white border-blue-300", children: _jsx(SelectValue, { placeholder: "Mover para..." }) }), _jsx(SelectContent, { children: funnelStages.map((stage) => (_jsx(SelectItem, { value: stage.id, children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(stage.icon, { className: "w-4 h-4" }), _jsx("span", { children: stage.name })] }) }, stage.id))) })] }), _jsxs(Button, { variant: "destructive", size: "sm", onClick: deleteSelectedOpportunities, className: "bg-red-600 hover:bg-red-700", children: [_jsx(Trash2, { className: "w-4 h-4 mr-2" }), "Deletar"] })] })] })), filteredOpportunities.length > 0 && selectedOpportunities.size === 0 && (_jsx("div", { className: "flex justify-end", children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: selectAllOpportunities, className: "text-blue-600 hover:text-blue-800 hover:bg-blue-50", children: ["Selecionar todas (", filteredOpportunities.length, ")"] }) }))] }) }), searchQuery && (_jsx(Card, { className: "bg-blue-50 border-blue-200", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Search, { className: "w-5 h-5 text-blue-600" }), _jsxs("span", { className: "text-blue-800 font-medium", children: [filteredOpportunities.length, " resultado(s) encontrado(s) para \"", searchQuery, "\""] })] }), _jsx("div", { className: "text-blue-700 font-semibold", children: formatCurrency(filteredOpportunities.reduce((sum, opp) => sum + opp.value, 0)) })] }) }) })), !hasActiveFilters && selectedOpportunities.size === 0 && (_jsx(Card, { className: "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full", children: _jsx(Zap, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-indigo-800 font-medium", children: "\uD83D\uDCA1 Dicas r\u00E1pidas" }), _jsx("p", { className: "text-sm text-indigo-600", children: "Arraste os cards \u2022 Ctrl+Click para sele\u00E7\u00E3o m\u00FAltipla \u2022 Ctrl+N: nova oportunidade \u2022 Ctrl+F: buscar \u2022 Esc: cancelar" })] })] }), _jsx("div", { className: "text-indigo-700 text-sm", children: _jsx(BarChart3, { className: "w-5 h-5" }) })] }) }) })), _jsx("div", { className: "w-full overflow-x-auto pb-4", children: _jsx("div", { className: "flex gap-4", style: { minHeight: 600 }, children: funnelStages.map((stage) => {
                            const stageOpportunities = filteredOpportunities.filter(opp => opp.stage === stage.id);
                            console.log(`🏛️ Coluna ${stage.name} (${stage.id}):`, stageOpportunities.length, 'oportunidades');
                            if (stageOpportunities.length > 0) {
                                console.log(`📋 Oportunidades em ${stage.name}:`, stageOpportunities.map(o => ({ id: o.id, client: o.client, stage: o.stage })));
                            }
                            return (_jsxs("div", { className: cn("flex flex-col bg-white rounded-xl border-2 shadow-md w-[320px] min-w-[320px] max-w-[340px] h-full", dragOverStage === stage.id ? "ring-4 ring-blue-300 ring-opacity-50 scale-105" : ""), onDragOver: (e) => handleDragOver(e, stage.id), onDragLeave: handleDragLeave, onDrop: (e) => handleDrop(e, stage.id), children: [_jsxs("div", { className: cn("p-4 border-b flex items-center justify-between sticky top-0 z-10 bg-white rounded-t-xl", stage.bgColor), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("p-2 rounded-lg bg-gradient-to-r", stage.color), children: _jsx(stage.icon, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: cn("font-bold text-base", stage.textColor), children: stage.name }), _jsx("p", { className: "text-xs text-gray-500", children: stage.description })] })] }), _jsx("span", { className: "bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full ml-2", children: stageOpportunities.length })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-2 space-y-3", children: [stageOpportunities.length === 0 && !searchQuery && (_jsxs("div", { className: "text-center py-8 text-gray-400 select-none", children: [_jsx(stage.icon, { className: "w-8 h-8 mx-auto mb-2 opacity-30" }), _jsxs("p", { className: "text-sm", children: ["Nenhuma oportunidade em ", _jsx("b", { children: stage.name })] })] })), stageOpportunities.map((opportunity) => (_jsxs("div", { draggable: true, onDragStart: (e) => handleDragStart(e, opportunity), onDragEnd: handleDragEnd, className: cn("bg-white border border-gray-200 rounded-lg shadow-sm p-3 cursor-move hover:shadow-lg transition-all duration-150 group relative", draggedOpportunity?.id === opportunity.id ? "opacity-50 scale-95" : "", selectedOpportunities.has(opportunity.id) ? "ring-2 ring-blue-400 border-blue-400" : ""), onClick: (e) => {
                                                    if (e.ctrlKey || e.metaKey) {
                                                        e.preventDefault();
                                                        toggleOpportunitySelection(opportunity.id);
                                                    }
                                                }, children: [_jsx("div", { className: "font-bold text-gray-900 text-sm truncate group-hover:text-blue-600", children: opportunity.client }), _jsx("div", { className: "text-xs text-gray-500 truncate mb-1", children: opportunity.company }), _jsx("div", { className: "text-xs text-gray-400 mb-2 line-clamp-2", children: opportunity.description }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsx("span", { className: "text-green-600 font-semibold text-sm", children: formatCurrency(opportunity.value) }), _jsxs("span", { className: "text-xs text-gray-500", children: [opportunity.probability, "%"] })] }), _jsxs("div", { className: "absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 p-0", onClick: (e) => { e.stopPropagation(); openModal(opportunity); }, children: _jsx(Edit, { className: "w-4 h-4 text-blue-600" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 p-0", onClick: (e) => { e.stopPropagation(); handleDelete(opportunity.id); }, children: _jsx(Trash2, { className: "w-4 h-4 text-red-600" }) })] })] }, opportunity.id)))] }), _jsx("div", { className: "p-3 border-t bg-gray-50 rounded-b-xl", children: _jsxs(Button, { variant: "ghost", className: "w-full text-gray-500 hover:text-gray-700 hover:bg-gray-100", onClick: () => handleAddCard(stage.id), children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), " Adicionar card"] }) })] }, stage.id));
                        }) }) }), _jsx(Dialog, { open: isModalOpen, onOpenChange: closeModal, children: _jsxs(DialogContent, { className: "sm:max-w-3xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { className: "text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent", children: editingOpportunity ? '✏️ Editar Oportunidade' : '🎯 Nova Oportunidade' }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 py-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "client", className: "text-sm font-medium text-gray-700", children: "Cliente *" }), _jsx(Input, { id: "client", value: formData.client, onChange: (e) => setFormData(prev => ({ ...prev, client: e.target.value })), placeholder: "Nome do cliente", className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "company", className: "text-sm font-medium text-gray-700", children: "Empresa *" }), _jsx(Input, { id: "company", value: formData.company, onChange: (e) => setFormData(prev => ({ ...prev, company: e.target.value })), placeholder: "Nome da empresa", className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "value", className: "text-sm font-medium text-gray-700", children: "Valor (R$) *" }), _jsx(Input, { id: "value", type: "number", value: formData.value, onChange: (e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) })), placeholder: "0", className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "probability", className: "text-sm font-medium text-gray-700", children: "Probabilidade (%)" }), _jsxs("div", { className: "mt-1 space-y-2", children: [_jsx(Input, { id: "probability", type: "number", min: "0", max: "100", value: formData.probability, onChange: (e) => setFormData(prev => ({ ...prev, probability: Number(e.target.value) })) }), _jsx(Progress, { value: formData.probability, className: "h-2" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "expectedCloseDate", className: "text-sm font-medium text-gray-700", children: "Data Esperada" }), _jsx(Input, { id: "expectedCloseDate", type: "date", value: formData.expectedCloseDate, onChange: (e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value })), className: "mt-1" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "stage", className: "text-sm font-medium text-gray-700", children: "Etapa" }), _jsxs(Select, { value: formData.stage, onValueChange: (value) => setFormData(prev => ({ ...prev, stage: value })), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: funnelStages.map((stage) => (_jsx(SelectItem, { value: stage.id, children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(stage.icon, { className: "w-4 h-4" }), _jsx("span", { children: stage.name })] }) }, stage.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "priority", className: "text-sm font-medium text-gray-700", children: "Prioridade" }), _jsxs(Select, { value: formData.priority, onValueChange: (value) => setFormData(prev => ({ ...prev, priority: value })), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "baixa", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(ArrowDown, { className: "w-4 h-4 text-green-500" }), _jsx("span", { children: "Baixa" })] }) }), _jsx(SelectItem, { value: "normal", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(ArrowRight, { className: "w-4 h-4 text-blue-500" }), _jsx("span", { children: "Normal" })] }) }), _jsx(SelectItem, { value: "alta", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(ArrowUp, { className: "w-4 h-4 text-orange-500" }), _jsx("span", { children: "Alta" })] }) }), _jsx(SelectItem, { value: "urgente", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-red-500" }), _jsx("span", { children: "Urgente" })] }) })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "responsible", className: "text-sm font-medium text-gray-700", children: "Respons\u00E1vel" }), _jsxs(Select, { value: formData.responsible, onValueChange: (value) => setFormData(prev => ({ ...prev, responsible: value })), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Selecione o respons\u00E1vel" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Ana Costa", children: "Ana Costa" }), _jsx(SelectItem, { value: "Carlos Silva", children: "Carlos Silva" }), _jsx(SelectItem, { value: "Roberto Lima", children: "Roberto Lima" }), _jsx(SelectItem, { value: "Fernanda Souza", children: "Fernanda Souza" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", className: "text-sm font-medium text-gray-700", children: "Telefone" }), _jsx(Input, { id: "phone", value: formData.phone, onChange: (e) => setFormData(prev => ({ ...prev, phone: e.target.value })), placeholder: "(11) 99999-9999", className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", className: "text-sm font-medium text-gray-700", children: "Email" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: (e) => setFormData(prev => ({ ...prev, email: e.target.value })), placeholder: "cliente@empresa.com", className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "source", className: "text-sm font-medium text-gray-700", children: "Fonte" }), _jsxs(Select, { value: formData.source, onValueChange: (value) => setFormData(prev => ({ ...prev, source: value })), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Website", children: "Website" }), _jsx(SelectItem, { value: "Indica\u00E7\u00E3o", children: "Indica\u00E7\u00E3o" }), _jsx(SelectItem, { value: "LinkedIn", children: "LinkedIn" }), _jsx(SelectItem, { value: "Event", children: "Evento" }), _jsx(SelectItem, { value: "Cold Call", children: "Cold Call" })] })] })] })] }), _jsxs("div", { className: "col-span-1 md:col-span-2", children: [_jsx(Label, { htmlFor: "description", className: "text-sm font-medium text-gray-700", children: "Descri\u00E7\u00E3o" }), _jsx(Input, { id: "description", value: formData.description, onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })), placeholder: "Descri\u00E7\u00E3o detalhada da oportunidade...", className: "mt-1" })] }), _jsxs("div", { className: "col-span-1 md:col-span-2", children: [_jsx(Label, { htmlFor: "tags", className: "text-sm font-medium text-gray-700", children: "Tags" }), _jsx(Input, { id: "tags", value: formData.tags, onChange: (e) => setFormData(prev => ({ ...prev, tags: e.target.value })), placeholder: "Enterprise, Hot Lead, SMB (separadas por v\u00EDrgula)", className: "mt-1" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Separe as tags com v\u00EDrgulas" })] })] }), _jsxs(DialogFooter, { className: "flex items-center justify-between pt-6 border-t", children: [_jsx("p", { className: "text-xs text-gray-500", children: "* Campos obrigat\u00F3rios" }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs(Button, { variant: "outline", onClick: closeModal, className: "border-gray-300", children: [_jsx(X, { className: "w-4 h-4 mr-2" }), "Cancelar"] }), _jsxs(Button, { onClick: () => {
                                                    console.log('🖱️ Botão Criar clicado!');
                                                    console.log('📝 FormData atual:', formData);
                                                    console.log('✅ Botão habilitado:', !(!formData.client || !formData.company));
                                                    handleSave();
                                                }, disabled: !formData.client || !formData.company, className: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), editingOpportunity ? 'Atualizar' : 'Criar'] })] })] })] }) }), _jsx(Dialog, { open: activityModal.isOpen, onOpenChange: (open) => setActivityModal({ isOpen: open, opportunityId: null }), children: _jsxs(DialogContent, { className: "sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { className: "text-xl font-bold text-purple-600", children: "\uD83D\uDCCB Atividades da Oportunidade" }) }), activityModal.opportunityId && (() => {
                                const opportunity = opportunities.find(o => o.id === activityModal.opportunityId);
                                if (!opportunity)
                                    return null;
                                return (_jsxs("div", { className: "space-y-4 flex-1 overflow-hidden", children: [_jsxs("div", { className: "bg-purple-50 p-4 rounded-lg border border-purple-200", children: [_jsx("h3", { className: "font-bold text-purple-800", children: opportunity.client }), _jsxs("p", { className: "text-purple-600 text-sm", children: [opportunity.company, " \u2022 ", formatCurrency(opportunity.value)] })] }), _jsx("div", { className: "flex-1 overflow-y-auto max-h-96 space-y-3", children: opportunity.activities.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(MessageSquare, { className: "w-12 h-12 mx-auto text-gray-300 mb-3" }), _jsx("p", { children: "Nenhuma atividade registrada" })] })) : (opportunity.activities
                                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                .map((activity) => (_jsxs("div", { className: "flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200", children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: getActivityIcon(activity.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 capitalize", children: activity.type === 'note' ? 'Nota' :
                                                                            activity.type === 'call' ? 'Ligação' :
                                                                                activity.type === 'email' ? 'Email' :
                                                                                    activity.type === 'meeting' ? 'Reunião' :
                                                                                        activity.type === 'stage_change' ? 'Mudança de Etapa' :
                                                                                            'Criação' }), _jsx("span", { className: "text-xs text-gray-500", children: formatDate(activity.createdAt) })] }), _jsx("p", { className: "text-sm text-gray-700 mt-1", children: activity.description }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["por ", activity.createdBy] })] })] }, activity.id)))) }), _jsxs("div", { className: "border-t pt-4", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Adicionar Nova Atividade" }), _jsxs("div", { className: "grid grid-cols-4 gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                const description = prompt("Descrição da nota:");
                                                                if (description)
                                                                    addActivity(opportunity.id, 'note', description);
                                                            }, className: "flex items-center space-x-1", children: [_jsx(FileText, { className: "w-3 h-3" }), _jsx("span", { children: "Nota" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                const description = prompt("Descrição da ligação:");
                                                                if (description)
                                                                    addActivity(opportunity.id, 'call', description);
                                                            }, className: "flex items-center space-x-1", children: [_jsx(Phone, { className: "w-3 h-3" }), _jsx("span", { children: "Liga\u00E7\u00E3o" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                const description = prompt("Descrição do email:");
                                                                if (description)
                                                                    addActivity(opportunity.id, 'email', description);
                                                            }, className: "flex items-center space-x-1", children: [_jsx(Mail, { className: "w-3 h-3" }), _jsx("span", { children: "Email" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                const description = prompt("Descrição da reunião:");
                                                                if (description)
                                                                    addActivity(opportunity.id, 'meeting', description);
                                                            }, className: "flex items-center space-x-1", children: [_jsx(Calendar, { className: "w-3 h-3" }), _jsx("span", { children: "Reuni\u00E3o" })] })] })] })] }));
                            })(), _jsx(DialogFooter, { children: _jsx(Button, { variant: "outline", onClick: () => setActivityModal({ isOpen: false, opportunityId: null }), children: "Fechar" }) })] }) })] }) }));
};
