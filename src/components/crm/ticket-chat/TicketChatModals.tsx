import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
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
  Settings,
  UserCheck,
  Tag,
  Loader2,
  X,
  User,
  Search,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { UseTicketChatReturn } from '../../../types/ticketChat';
import { useToast } from '../../../hooks/use-toast';
import { useCustomers } from '../../../hooks/useCustomers';
import { useTicketsDB } from '../../../hooks/useTicketsDB';
import { useTicketCustomerAssignment } from '../../../hooks/useTicketCustomerAssignment';
import { Customer } from '../../../types/customer';
import { PhoneValidationModal } from './PhoneValidationModal';

interface TicketChatModalsProps {
  chatState: UseTicketChatReturn;
}

export const TicketChatModals: React.FC<TicketChatModalsProps> = ({
  chatState
}) => {
  const { toast } = useToast();
  const { customers, loading: loadingCustomers } = useCustomers();
  const { assignCustomerToTicket } = useTicketsDB();
  const { assignCustomer, removeAssignment, verifyAssignment } = useTicketCustomerAssignment();
  const [newAssignee, setNewAssignee] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  const {
    currentTicket,
    setCurrentTicket,
    showAssignModal,
    setShowAssignModal,
    showStatusModal,
    setShowStatusModal,
    showTagModal,
    setShowTagModal,
    showCustomerModal,
    setShowCustomerModal
  } = chatState;

  // Filtrar clientes baseado na busca
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm) ||
    (customer.company && customer.company.toLowerCase().includes(customerSearchTerm.toLowerCase()))
  );

  // Resetar busca quando modal fecha
  useEffect(() => {
    if (!showCustomerModal) {
      setCustomerSearchTerm('');
      setSelectedCustomer(null);
    }
  }, [showCustomerModal]);

  return (
    <>
      {/* Status Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Alterar Status do Ticket
            </DialogTitle>
            <DialogDescription>
              Selecione o novo status para este ticket
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'pendente', label: 'Pendente', color: 'yellow' },
                { value: 'atendimento', label: 'Em Atendimento', color: 'blue' },
                { value: 'finalizado', label: 'Finalizado', color: 'green' },
                { value: 'cancelado', label: 'Cancelado', color: 'red' }
              ].map((status) => (
                <Button
                  key={status.value}
                  variant={newStatus === status.value ? "default" : "outline"}
                  onClick={() => setNewStatus(status.value)}
                  className="h-12 justify-start"
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full mr-2",
                    status.color === 'yellow' && "bg-yellow-500",
                    status.color === 'blue' && "bg-blue-500",
                    status.color === 'green' && "bg-green-500",
                    status.color === 'red' && "bg-red-500"
                  )} />
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowStatusModal(false);
                setNewStatus('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (newStatus && newStatus !== currentTicket.status) {
                  setCurrentTicket((prev: any) => ({ ...prev, status: newStatus }));
                  toast({
                    title: "✅ Status atualizado",
                    description: `Status alterado para "${newStatus}"`,
                  });
                }
                setShowStatusModal(false);
                setNewStatus('');
              }}
              disabled={!newStatus || newStatus === currentTicket.status || isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Alterar Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              Atribuir Agente
            </DialogTitle>
            <DialogDescription>
              Selecione um agente para responsabilizar por este ticket
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={newAssignee} onValueChange={setNewAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Não atribuído</SelectItem>
                <SelectItem value="agent1">João Silva</SelectItem>
                <SelectItem value="agent2">Maria Santos</SelectItem>
                <SelectItem value="agent3">Pedro Oliveira</SelectItem>
                <SelectItem value="agent4">Ana Costa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAssignModal(false);
                setNewAssignee('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                const assigneeValue = newAssignee === 'unassigned' ? 'Não atribuído' : newAssignee;
                setCurrentTicket((prev: any) => ({ ...prev, assignee: assigneeValue || 'Não atribuído' }));
                toast({
                  title: "✅ Agente atribuído",
                  description: newAssignee === 'unassigned' ? 'Atribuição removida' : `Ticket atribuído para ${assigneeValue}`,
                });
                setShowAssignModal(false);
                setNewAssignee('');
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Modal */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-600" />
              Adicionar Tag
            </DialogTitle>
            <DialogDescription>
              Adicione tags para categorizar este ticket
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Digite uma nova tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag.trim()) {
                  const updatedTags = [...(currentTicket?.tags || []), newTag.trim()];
                  setCurrentTicket((prev: any) => ({ ...prev, tags: updatedTags }));
                  setNewTag('');
                  toast({
                    title: "✅ Tag adicionada",
                    description: `Tag "${newTag.trim()}" foi adicionada`,
                  });
                }
              }}
            />
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Tags sugeridas:</p>
              <div className="flex flex-wrap gap-2">
                {['urgente', 'vip', 'técnico', 'comercial', 'suporte', 'reclamação'].map((suggestedTag) => (
                  <Button
                    key={suggestedTag}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!currentTicket?.tags?.includes(suggestedTag)) {
                        const updatedTags = [...(currentTicket?.tags || []), suggestedTag];
                        setCurrentTicket((prev: any) => ({ ...prev, tags: updatedTags }));
                        toast({
                          title: "✅ Tag adicionada",
                          description: `Tag "${suggestedTag}" foi adicionada`,
                        });
                      }
                    }}
                    className="h-8 text-xs"
                    disabled={currentTicket?.tags?.includes(suggestedTag)}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {suggestedTag}
                  </Button>
                ))}
              </div>
            </div>

            {currentTicket?.tags && currentTicket.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Tags atuais:</p>
                <div className="flex flex-wrap gap-2">
                  {currentTicket.tags.map((tag: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs px-2 py-1 bg-purple-100 text-purple-800 border border-purple-200 cursor-pointer hover:bg-purple-200"
                      onClick={() => {
                        const updatedTags = currentTicket.tags.filter((_: any, i: number) => i !== index);
                        setCurrentTicket((prev: any) => ({ ...prev, tags: updatedTags }));
                        toast({
                          title: "🗑️ Tag removida",
                          description: `Tag "${tag}" foi removida`,
                        });
                      }}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTagModal(false);
                setNewTag('');
              }}
            >
              Fechar
            </Button>
            <Button 
              onClick={() => {
                if (newTag.trim()) {
                  const updatedTags = [...(currentTicket?.tags || []), newTag.trim()];
                  setCurrentTicket((prev: any) => ({ ...prev, tags: updatedTags }));
                  toast({
                    title: "✅ Tag adicionada",
                    description: `Tag "${newTag.trim()}" foi adicionada`,
                  });
                }
                setShowTagModal(false);
                setNewTag('');
              }}
              disabled={!newTag.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Tag className="w-4 h-4 mr-2" />
              Adicionar Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Assignment Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Atribuir Cliente ao Ticket
            </DialogTitle>
            <DialogDescription>
              Selecione um cliente para associar a este ticket
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email, telefone ou empresa..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Cliente atualmente atribuído */}
            {currentTicket?.customer_id && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Cliente atual:</p>
                <p className="text-sm text-blue-700">{currentTicket?.client || 'Cliente não identificado'}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const ticketId = currentTicket?.originalId || currentTicket?.id;
                    
                    if (ticketId) {
                      // Usar hook especializado para remoção
                      await removeAssignment(ticketId, (updatedTicket) => {
                        // Callback de sucesso - atualizar estado local
                        setCurrentTicket((prev: any) => ({
                          ...prev,
                          ...updatedTicket,
                          customer_id: null,
                          client: 'Cliente Anônimo',
                          customerEmail: '',
                          customerPhone: ''
                        }));
                        
                        console.log('🔄 [REMOÇÃO] Estado local atualizado');
                      });
                    } else {
                      toast({
                        title: "❌ Erro",
                        description: "ID do ticket não encontrado",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="w-3 h-3 mr-1" />
                  Remover Cliente
                </Button>
              </div>
            )}

            {/* Lista de clientes */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {loadingCustomers ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Carregando clientes...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-4 text-center">
                  <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {customerSearchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredCustomers.slice(0, 10).map((customer) => (
                    <div
                      key={customer.id}
                      className={cn(
                        "p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                        selectedCustomer?.id === customer.id && "bg-blue-50 border-l-4 border-blue-500"
                      )}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{customer.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                customer.category === 'gold' && "border-yellow-300 text-yellow-700",
                                customer.category === 'silver' && "border-gray-300 text-gray-700",
                                customer.category === 'bronze' && "border-orange-300 text-orange-700",
                                customer.category === 'platinum' && "border-purple-300 text-purple-700"
                              )}
                            >
                              {customer.category}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span>{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer.company && (
                              <div className="flex items-center gap-2">
                                <Building className="w-3 h-3" />
                                <span>{customer.company}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {selectedCustomer?.id === customer.id && (
                          <div className="ml-2">
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredCustomers.length > 10 && (
                    <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                      Mostrando 10 de {filteredCustomers.length} clientes. Use a busca para refinar.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCustomerModal(false);
                setSelectedCustomer(null);
                setCustomerSearchTerm('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (selectedCustomer) {
                  console.log('🎯 Atribuindo cliente ao ticket:', {
                    selectedCustomer: selectedCustomer.name,
                    customerId: selectedCustomer.id,
                    currentTicket: currentTicket?.id,
                    originalId: currentTicket?.originalId
                  });

                  // Atualizar estado local
                  setCurrentTicket((prev: any) => ({ 
                    ...prev, 
                    customer_id: selectedCustomer.id,
                    client: selectedCustomer.name,
                    customerEmail: selectedCustomer.email,
                    customerPhone: selectedCustomer.phone
                  }));
                  
                  // Persistir no banco de dados com validação robusta
                  let persistenceSuccess = false;
                  const ticketId = currentTicket?.originalId || currentTicket?.id;
                  
                  if (ticketId) {
                    try {
                      // Usar o hook especializado para vinculação robusta
                      const assignmentResult = await assignCustomer(
                        ticketId, 
                        selectedCustomer,
                        (updatedTicket) => {
                          // Callback de sucesso - atualizar estado local com dados completos
                          setCurrentTicket((prev: any) => ({
                            ...prev,
                            ...updatedTicket,
                            customer_id: selectedCustomer.id,
                            client: selectedCustomer.name,
                            customerEmail: selectedCustomer.email,
                            customerPhone: selectedCustomer.phone,
                            // Forçar refresh para mostrar vinculação
                            _refreshToken: Date.now()
                          }));
                          
                          console.log('🔄 [VINCULAÇÃO] Estado local atualizado com dados do banco');
                          
                          // Recarregar dados do ticket para mostrar vinculação
                          setTimeout(async () => {
                            try {
                              console.log('🔄 [VINCULAÇÃO] Recarregando dados para verificar vinculação...');
                              
                              // Verificar se vinculação está visível
                              const verification = await verifyAssignment(ticketId);
                              if (verification.customerId) {
                                console.log('✅ [VINCULAÇÃO] Vinculação confirmada e visível');
                                
                                // Atualizar novamente o estado com dados verificados
                                setCurrentTicket((prev: any) => ({
                                  ...prev,
                                  customer_id: verification.customerId,
                                  client: (verification.customerData as any)?.name || selectedCustomer.name,
                                  customerEmail: (verification.customerData as any)?.email || selectedCustomer.email,
                                  customerPhone: selectedCustomer.phone,
                                  _lastVerified: Date.now()
                                }));
                              } else {
                                console.warn('⚠️ [VINCULAÇÃO] Vinculação não aparece ainda, pode aparecer após recarregar a página');
                              }
                            } catch (error) {
                              console.error('❌ [VINCULAÇÃO] Erro na verificação:', error);
                            }
                          }, 1500);
                        }
                      );
                      
                      persistenceSuccess = assignmentResult.success;
                      
                    } catch (error) {
                      console.error('❌ [VINCULAÇÃO] Erro ao atribuir cliente no banco:', error);
                      persistenceSuccess = false;
                      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                      toast({
                        title: "❌ Erro na vinculação",
                        description: `Não foi possível salvar no banco: ${errorMessage}`,
                        variant: "destructive"
                      });
                    }
                  } else {
                    console.warn('⚠️ [VINCULAÇÃO] Ticket não tem ID válido:', {
                      currentTicket: currentTicket?.id,
                      originalId: currentTicket?.originalId
                    });
                    toast({
                      title: "❌ ID inválido", 
                      description: "Ticket não tem ID válido para vinculação",
                      variant: "destructive"
                    });
                  }
                  
                  // Toast só se houve sucesso na persistência
                  if (persistenceSuccess) {
                    toast({
                      title: "✅ Cliente vinculado com sucesso",
                      description: `${selectedCustomer.name} foi vinculado ao ticket e salvo no banco de dados`,
                    });
                    
                    // Fechar modal apenas se salvou com sucesso
                    setShowCustomerModal(false);
                    setSelectedCustomer(null);
                    setCustomerSearchTerm('');
                  } else {
                    // Manter modal aberto em caso de erro para nova tentativa
                    console.warn('⚠️ [VINCULAÇÃO] Modal mantido aberto devido ao erro de persistência');
                  }
                } else {
                  // Se não há cliente selecionado, fechar modal
                  setShowCustomerModal(false);
                  setSelectedCustomer(null);
                  setCustomerSearchTerm('');
                }
              }}
              disabled={!selectedCustomer}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <User className="w-4 h-4 mr-2" />
              Atribuir Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Validation Modal */}
      <PhoneValidationModal
        isOpen={chatState.showPhoneValidationModal}
        onClose={() => chatState.setShowPhoneValidationModal(false)}
        ticketId={currentTicket?.originalId || currentTicket?.id || ''}
        currentPhone={chatState.extractClientInfo?.(currentTicket)?.clientPhone}
        customerName={currentTicket?.client || currentTicket?.customer_name}
        onPhoneValidated={(phone, phoneFormatted) => {
          // Continuar com o envio usando o telefone validado
          chatState.handleContinueSendAfterValidation?.(phone, phoneFormatted);
          chatState.setShowPhoneValidationModal(false);
        }}
      />
    </>
  );
}; 