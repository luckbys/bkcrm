import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { UseTicketChatReturn } from '../../../types/ticketChat';
import { useToast } from '../../../hooks/use-toast';

interface TicketChatModalsProps {
  chatState: UseTicketChatReturn;
}

export const TicketChatModals: React.FC<TicketChatModalsProps> = ({
  chatState
}) => {
  const { toast } = useToast();
  const [newAssignee, setNewAssignee] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    currentTicket,
    setCurrentTicket,
    showAssignModal,
    setShowAssignModal,
    showStatusModal,
    setShowStatusModal,
    showTagModal,
    setShowTagModal
  } = chatState;

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
    </>
  );
}; 