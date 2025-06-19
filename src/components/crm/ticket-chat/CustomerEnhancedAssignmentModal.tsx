import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Separator } from '../../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { 
  Search,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  Star,
  Plus,
  UserPlus,
  Sync,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  History,
  MessageSquare,
  WhatsApp,
  Flag
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useToast } from '../../../hooks/use-toast';
import { useCustomers } from '../../../hooks/useCustomers';
import { useTicketsDB } from '../../../hooks/useTicketsDB';
import { Customer } from '../../../types/customer';

interface CustomerEnhancedAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTicket: any;
  onTicketUpdate: (updates: any) => void;
}

interface CustomerSuggestion {
  customer: Customer;
  score: number;
  reasons: string[];
  matchType: 'exact' | 'partial' | 'fuzzy';
}

interface CustomerCreationData {
  name: string;
  phone: string;
  email: string;
  company?: string;
  category: 'bronze' | 'silver' | 'gold' | 'platinum';
  notes?: string;
}

export const CustomerEnhancedAssignmentModal: React.FC<CustomerEnhancedAssignmentModalProps> = ({
  isOpen,
  onClose,
  currentTicket,
  onTicketUpdate
}) => {
  const { toast } = useToast();
  const { customers, loading: loadingCustomers, addCustomer, refreshCustomers } = useCustomers();
  const { assignCustomerToTicket } = useTicketsDB();

  // Estados principais
  const [activeTab, setActiveTab] = useState<'search' | 'create' | 'history'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [autoDetectedData, setAutoDetectedData] = useState<Partial<CustomerCreationData> | null>(null);
  const [newCustomerData, setNewCustomerData] = useState<CustomerCreationData>({
    name: '',
    phone: '',
    email: '',
    company: '',
    category: 'bronze',
    notes: ''
  });

  // Extrair dados do ticket atual para auto-preenchimento
  const extractDataFromTicket = useCallback(() => {
    if (!currentTicket) return null;

    const metadata = currentTicket.metadata || {};
    const isWhatsApp = Boolean(
      metadata.is_whatsapp ||
      metadata.whatsapp_phone ||
      metadata.enhanced_processing ||
      currentTicket.channel === 'whatsapp'
    );

    let extractedData: Partial<CustomerCreationData> = {};

    if (isWhatsApp) {
      // Extrair nome
      extractedData.name = metadata.client_name ||
                          metadata.whatsapp_name ||
                          (typeof metadata.anonymous_contact === 'object' 
                            ? metadata.anonymous_contact?.name 
                            : metadata.anonymous_contact) ||
                          currentTicket.client ||
                          '';

      // Extrair telefone
      extractedData.phone = metadata.client_phone ||
                           metadata.whatsapp_phone ||
                           (typeof metadata.anonymous_contact === 'object' 
                             ? metadata.anonymous_contact?.phone 
                             : null) ||
                           currentTicket.phone ||
                           '';

      // Gerar email temporário se não tiver
      if (extractedData.phone && !extractedData.email) {
        extractedData.email = `whatsapp-${extractedData.phone.replace(/\D/g, '')}@auto-generated.com`;
      }

      // Determinar categoria baseada em dados do WhatsApp
      if (metadata.enhanced_processing) {
        extractedData.category = 'silver'; // Cliente com dados enriquecidos
      } else {
        extractedData.category = 'bronze'; // Cliente básico
      }

      // Adicionar notas automáticas
      extractedData.notes = `Cliente criado automaticamente via WhatsApp\nInstância: ${metadata.instance_name || 'N/A'}\nPrimeira mensagem: ${new Date().toLocaleDateString('pt-BR')}`;
    } else {
      // Ticket não-WhatsApp
      extractedData.name = currentTicket.client || currentTicket.customer_name || '';
      extractedData.phone = currentTicket.customerPhone || currentTicket.customer_phone || '';
      extractedData.email = currentTicket.customerEmail || currentTicket.customer_email || '';
      extractedData.category = 'bronze';
      extractedData.notes = `Cliente criado automaticamente via ${currentTicket.channel || 'sistema'}`;
    }

    return extractedData;
  }, [currentTicket]);

  // Busca inteligente com scoring
  const performIntelligentSearch = useCallback((query: string) => {
    if (!query.trim() || !customers.length) {
      setSuggestions([]);
      return;
    }

    const searchResults: CustomerSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    customers.forEach(customer => {
      let score = 0;
      const reasons: string[] = [];
      let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';

      // Busca por nome
      if (customer.name.toLowerCase() === lowerQuery) {
        score += 100;
        matchType = 'exact';
        reasons.push('Nome exato');
      } else if (customer.name.toLowerCase().includes(lowerQuery)) {
        score += 70;
        matchType = 'partial';
        reasons.push('Nome similar');
      }

      // Busca por telefone
      const customerPhone = customer.phone.replace(/\D/g, '');
      const queryPhone = query.replace(/\D/g, '');
      if (queryPhone.length >= 10 && customerPhone.includes(queryPhone)) {
        score += 90;
        if (matchType === 'fuzzy') matchType = 'partial';
        reasons.push('Telefone corresponde');
      }

      // Busca por email
      if (customer.email.toLowerCase() === lowerQuery) {
        score += 80;
        if (matchType === 'fuzzy') matchType = 'exact';
        reasons.push('Email exato');
      } else if (customer.email.toLowerCase().includes(lowerQuery)) {
        score += 50;
        if (matchType === 'fuzzy') matchType = 'partial';
        reasons.push('Email similar');
      }

      // Busca por empresa
      if (customer.company && customer.company.toLowerCase().includes(lowerQuery)) {
        score += 40;
        reasons.push('Empresa similar');
      }

      // Busca por documento
      if (customer.document && customer.document.replace(/\D/g, '').includes(query.replace(/\D/g, ''))) {
        score += 60;
        reasons.push('Documento corresponde');
      }

      // Adicionar se tiver relevância mínima
      if (score >= 20) {
        searchResults.push({
          customer,
          score,
          reasons,
          matchType
        });
      }
    });

    // Ordenar por score e limitar resultados
    const sortedResults = searchResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setSuggestions(sortedResults);
  }, [customers]);

  // Criar novo cliente
  const handleCreateCustomer = async () => {
    try {
      setIsProcessing(true);

      // Validações
      if (!newCustomerData.name.trim()) {
        toast({
          title: "❌ Nome obrigatório",
          description: "Por favor, informe o nome do cliente",
          variant: "destructive"
        });
        return;
      }

      if (!newCustomerData.email.trim()) {
        toast({
          title: "❌ Email obrigatório", 
          description: "Por favor, informe o email do cliente",
          variant: "destructive"
        });
        return;
      }

      // Dados completos do cliente
      const customerData = {
        ...newCustomerData,
        document: '',
        documentType: 'cpf' as const,
        position: '',
        address: {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: ''
        },
        status: 'active' as const,
        channel: currentTicket?.channel || 'whatsapp',
        tags: currentTicket?.channel === 'whatsapp' ? ['whatsapp', 'auto-created'] : ['auto-created'],
        customerSince: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
        totalOrders: 0,
        totalValue: 0,
        averageTicket: 0,
        responsibleAgent: ''
      };

      // Criar cliente
      await addCustomer(customerData);
      
      // Recarregar lista
      await refreshCustomers();

      // Buscar cliente recém-criado
      const updatedCustomers = await new Promise(resolve => {
        setTimeout(() => resolve(customers), 1000);
      });

      // Encontrar cliente criado por email
      const createdCustomer = customers.find(c => c.email === newCustomerData.email);
      
      if (createdCustomer) {
        setSelectedCustomer(createdCustomer);
        setActiveTab('search');
        
        toast({
          title: "✅ Cliente criado",
          description: `${newCustomerData.name} foi cadastrado com sucesso`,
        });
      }

    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      toast({
        title: "❌ Erro na criação",
        description: "Não foi possível criar o cliente. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Atribuir cliente ao ticket
  const handleAssignCustomer = async () => {
    if (!selectedCustomer || !currentTicket) return;

    try {
      setIsProcessing(true);

      console.log('🎯 Vinculando cliente ao ticket:', {
        customer: selectedCustomer.name,
        customerId: selectedCustomer.id,
        ticketId: currentTicket.id || currentTicket.originalId
      });

      // Atualizar no banco
      const ticketId = currentTicket.originalId || currentTicket.id;
      if (ticketId) {
        await assignCustomerToTicket(ticketId, {
          customer_id: selectedCustomer.id
        });
      }

      // Atualizar estado local
      onTicketUpdate({
        customer_id: selectedCustomer.id,
        client: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        customerPhone: selectedCustomer.phone,
        // Adicionar metadados da vinculação
        metadata: {
          ...currentTicket.metadata,
          assigned_customer: {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            email: selectedCustomer.email,
            phone: selectedCustomer.phone,
            category: selectedCustomer.category,
            assigned_at: new Date().toISOString(),
            assigned_via: 'enhanced_modal'
          }
        }
      });

      toast({
        title: "✅ Cliente vinculado",
        description: `Ticket atribuído para ${selectedCustomer.name}`,
      });

      onClose();

    } catch (error) {
      console.error('❌ Erro ao vincular cliente:', error);
      toast({
        title: "❌ Erro na vinculação",
        description: "Não foi possível vincular o cliente ao ticket",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Sincronizar dados automáticamente
  const handleSyncWithTicket = () => {
    const extractedData = extractDataFromTicket();
    if (extractedData) {
      setAutoDetectedData(extractedData);
      setNewCustomerData(prev => ({
        ...prev,
        ...extractedData
      }));
      
      // Buscar automaticamente pelo nome ou telefone
      if (extractedData.name) {
        setSearchTerm(extractedData.name);
        performIntelligentSearch(extractedData.name);
      } else if (extractedData.phone) {
        setSearchTerm(extractedData.phone);
        performIntelligentSearch(extractedData.phone);
      }

      toast({
        title: "🔄 Dados sincronizados",
        description: "Informações do ticket foram carregadas automaticamente",
      });
    }
  };

  // Efeitos
  useEffect(() => {
    if (isOpen) {
      // Auto-sincronizar dados na abertura
      handleSyncWithTicket();
    } else {
      // Reset ao fechar
      setSearchTerm('');
      setSelectedCustomer(null);
      setSuggestions([]);
      setNewCustomerData({
        name: '',
        phone: '',
        email: '',
        company: '',
        category: 'bronze',
        notes: ''
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      performIntelligentSearch(searchTerm);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, performIntelligentSearch]);

  // Função para formatar telefone
  const formatPhoneNumber = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 13 && clean.startsWith('55')) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 9)}-${clean.substring(9)}`;
    }
    return phone;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Vinculação Inteligente de Cliente
          </DialogTitle>
          <DialogDescription>
            Sistema avançado para buscar, criar e vincular clientes aos tickets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Ticket Atual */}
          {currentTicket && (
            <Card className="border-blue-100 bg-blue-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-blue-800">Ticket #{currentTicket.id?.toString().slice(-6) || 'N/A'}</h4>
                    {currentTicket.channel === 'whatsapp' && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <WhatsApp className="w-3 h-3 mr-1" />
                        WhatsApp
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncWithTicket}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <Sync className="w-3 h-3 mr-1" />
                    Sincronizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Cliente atual:</span>
                    <p className="text-gray-900">{currentTicket.client || 'Não identificado'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Telefone:</span>
                    <p className="text-gray-900">{currentTicket.customerPhone || 'Não informado'}</p>
                  </div>
                </div>
                {autoDetectedData && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-1 text-green-700 text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Dados detectados automaticamente
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs de Navegação */}
          <Tabs value={activeTab} onValueChange={setActiveTab as any}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Buscar Cliente
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Criar Novo
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            {/* Tab: Buscar Cliente */}
            <TabsContent value="search" className="space-y-4">
              {/* Barra de Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, telefone, email, empresa ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Resultados da Busca */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loadingCustomers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Carregando clientes...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map(({ customer, score, reasons, matchType }) => (
                    <Card
                      key={customer.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        selectedCustomer?.id === customer.id 
                          ? "ring-2 ring-blue-500 bg-blue-50" 
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                              <AvatarFallback>
                                {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    customer.category === 'platinum' && "border-purple-300 text-purple-700",
                                    customer.category === 'gold' && "border-yellow-300 text-yellow-700",
                                    customer.category === 'silver' && "border-gray-300 text-gray-700",
                                    customer.category === 'bronze' && "border-orange-300 text-orange-700"
                                  )}
                                >
                                  {customer.category}
                                </Badge>
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    matchType === 'exact' && "border-green-300 text-green-700 bg-green-50",
                                    matchType === 'partial' && "border-blue-300 text-blue-700 bg-blue-50",
                                    matchType === 'fuzzy' && "border-gray-300 text-gray-700"
                                  )}
                                >
                                  {score}% match
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {customer.email}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {formatPhoneNumber(customer.phone)}
                                </div>
                                {customer.company && (
                                  <div className="flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {customer.company}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-2">
                                {reasons.map((reason, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {customer.tags.includes('whatsapp') && (
                              <WhatsApp className="w-4 h-4 text-green-600" />
                            )}
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : searchTerm ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum cliente encontrado para "{searchTerm}"</p>
                    <p className="text-sm mt-1">Tente criar um novo cliente na aba "Criar Novo"</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Digite para buscar clientes existentes</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Criar Novo Cliente */}
            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nome *</label>
                  <Input
                    placeholder="Nome completo do cliente"
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Telefone</label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <Input
                    type="email"
                    placeholder="cliente@email.com"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Empresa</label>
                  <Input
                    placeholder="Nome da empresa"
                    value={newCustomerData.company}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Categoria</label>
                  <Select 
                    value={newCustomerData.category} 
                    onValueChange={(value: any) => setNewCustomerData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Observações</label>
                  <Input
                    placeholder="Informações adicionais sobre o cliente"
                    value={newCustomerData.notes}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateCustomer}
                disabled={isProcessing || !newCustomerData.name.trim() || !newCustomerData.email.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando Cliente...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar e Vincular Cliente
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab: Histórico */}
            <TabsContent value="history" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Histórico de vinculações</p>
                <p className="text-sm mt-1">Funcionalidade em desenvolvimento</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          {selectedCustomer && (
            <Button
              onClick={handleAssignCustomer}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Vincular {selectedCustomer.name}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 