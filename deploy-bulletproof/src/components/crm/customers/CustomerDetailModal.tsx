import { useState } from 'react';
import { Customer } from '@/types/customer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  MessageCircle,
  Edit,
  FileText,
  Star,
  Clock,
  Target,
  Award,
  Contact
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onContact: (customer: Customer, method: 'phone' | 'email' | 'whatsapp') => void;
}

export const CustomerDetailModal = ({ 
  customer, 
  isOpen, 
  onClose, 
  onEdit, 
  onContact 
}: CustomerDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!customer) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: Customer['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-red-100 text-red-800 border-red-200',
      prospect: 'bg-blue-100 text-blue-800 border-blue-200',
      blocked: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryColor = (category: Customer['category']) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      platinum: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Mock data para demonstração
  const mockInteractions = [
    {
      id: 1,
      type: 'email',
      description: 'Email de boas-vindas enviado',
      date: '2024-01-15',
      agent: 'Ana Costa'
    },
    {
      id: 2,
      type: 'phone',
      description: 'Ligação de follow-up realizada',
      date: '2024-01-10',
      agent: 'Carlos Silva'
    },
    {
      id: 3,
      type: 'whatsapp',
      description: 'Mensagem de suporte enviada',
      date: '2024-01-08',
      agent: 'Marina Santos'
    }
  ];

  const mockOrders = [
    {
      id: 1,
      description: 'Produto Premium',
      value: 2500.00,
      date: '2024-01-12',
      status: 'completed'
    },
    {
      id: 2,
      description: 'Serviço de Consultoria',
      value: 1800.00,
      date: '2024-01-05',
      status: 'completed'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {customer.name}
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`${getStatusColor(customer.status)} border`}>
                    {customer.status === 'active' ? 'Ativo' : 
                     customer.status === 'inactive' ? 'Inativo' : 
                     customer.status === 'prospect' ? 'Prospect' : 'Bloqueado'}
                  </Badge>
                  <Badge className={`${getCategoryColor(customer.category)} border`}>
                    {customer.category.charAt(0).toUpperCase() + customer.category.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(customer)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onContact(customer, 'phone')}
                  className="rounded-r-none border-r"
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onContact(customer, 'email')}
                  className="rounded-none border-r"
                >
                  <Mail className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onContact(customer, 'whatsapp')}
                  className="rounded-l-none"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="contact">Contato</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Métricas principais */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Valor Total</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(customer.totalValue)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Ticket Médio</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(customer.averageTicket)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total de Pedidos</p>
                        <p className="text-lg font-bold text-purple-600">
                          {customer.totalOrders}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Informações da empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Informações da Empresa</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Empresa</label>
                      <p className="text-gray-900">{customer.company}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Cargo</label>
                      <p className="text-gray-900">{customer.position}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Documento</label>
                      <p className="text-gray-900">{customer.document}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Canal</label>
                      <p className="text-gray-900 capitalize">{customer.channel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags e notas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Tags e Observações</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {customer.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Observações</label>
                    <p className="text-gray-900 mt-1 text-sm leading-relaxed">
                      {customer.notes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Contact className="w-5 h-5" />
                    <span>Informações de Contato</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{customer.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Telefone</label>
                        <p className="text-gray-900">{customer.phone}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <h4 className="font-medium text-gray-900">Endereço</h4>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-900">
                        {customer.address.street}, {customer.address.number}
                        {customer.address.complement && `, ${customer.address.complement}`}
                      </p>
                      <p className="text-sm text-gray-900">
                        {customer.address.neighborhood} - {customer.address.city}, {customer.address.state}
                      </p>
                      <p className="text-sm text-gray-600">
                        CEP: {customer.address.zipCode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Histórico de Interações</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockInteractions.map((interaction) => (
                      <div key={interaction.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {interaction.type === 'email' && <Mail className="w-4 h-4 text-blue-600" />}
                          {interaction.type === 'phone' && <Phone className="w-4 h-4 text-green-600" />}
                          {interaction.type === 'whatsapp' && <MessageCircle className="w-4 h-4 text-green-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {interaction.description}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatDate(interaction.date)} • {interaction.agent}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cliente desde</p>
                    <p className="font-bold text-gray-900">
                      {formatDate(customer.customerSince)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Última interação</p>
                    <p className="font-bold text-gray-900">
                      {formatDate(customer.lastInteraction)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Agente responsável</p>
                    <p className="font-bold text-gray-900">
                      {customer.responsibleAgent}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{order.description}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(order.value)}</p>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Concluído
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 