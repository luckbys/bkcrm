import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { WhatsAppSettings, WhatsAppInstance } from '@/types/whatsapp.types';
import { Loader2, Settings2 } from 'lucide-react';

interface WhatsAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: WhatsAppInstance;
}

const WhatsAppSettingsModal: React.FC<WhatsAppSettingsModalProps> = ({
  isOpen,
  onClose,
  instance
}) => {
  const { toast } = useToast();
  const { updateSettings } = useWhatsAppInstances();
  const [isSaving, setIsSaving] = useState(false);

  // Estado local para as configurações
  const [settings, setSettings] = useState<WhatsAppSettings>({
    always_online: instance.always_online ?? true,
    groups_ignore: instance.groups_ignore ?? true,
    read_messages: instance.read_messages ?? true,
    read_status: instance.read_status ?? true,
    reject_call: instance.reject_call ?? true,
    sync_full_history: instance.sync_full_history ?? false
  });

  // Atualizar configuração
  const handleToggle = (key: keyof WhatsAppSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Salvar configurações
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(instance.instanceName, settings);
      toast({
        title: "Configurações salvas",
        description: "As configurações do WhatsApp foram atualizadas",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Falha ao atualizar configurações",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Configurações do WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Configurações de Presença */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Presença</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="always_online" className="flex flex-col">
                <span>Sempre Online</span>
                <span className="text-xs text-muted-foreground">
                  Manter status online
                </span>
              </Label>
              <Switch
                id="always_online"
                checked={settings.always_online}
                onCheckedChange={() => handleToggle('always_online')}
              />
            </div>
          </div>

          <Separator />

          {/* Configurações de Mensagens */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Mensagens</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="read_messages" className="flex flex-col">
                  <span>Marcar como Lido</span>
                  <span className="text-xs text-muted-foreground">
                    Marcar mensagens como lidas automaticamente
                  </span>
                </Label>
                <Switch
                  id="read_messages"
                  checked={settings.read_messages}
                  onCheckedChange={() => handleToggle('read_messages')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="read_status" className="flex flex-col">
                  <span>Visualizar Status</span>
                  <span className="text-xs text-muted-foreground">
                    Marcar status como visualizados
                  </span>
                </Label>
                <Switch
                  id="read_status"
                  checked={settings.read_status}
                  onCheckedChange={() => handleToggle('read_status')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações de Grupos e Chamadas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Grupos e Chamadas</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="groups_ignore" className="flex flex-col">
                  <span>Ignorar Grupos</span>
                  <span className="text-xs text-muted-foreground">
                    Não processar mensagens de grupos
                  </span>
                </Label>
                <Switch
                  id="groups_ignore"
                  checked={settings.groups_ignore}
                  onCheckedChange={() => handleToggle('groups_ignore')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reject_call" className="flex flex-col">
                  <span>Rejeitar Chamadas</span>
                  <span className="text-xs text-muted-foreground">
                    Rejeitar chamadas automaticamente
                  </span>
                </Label>
                <Switch
                  id="reject_call"
                  checked={settings.reject_call}
                  onCheckedChange={() => handleToggle('reject_call')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações de Histórico */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Histórico</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sync_full_history" className="flex flex-col">
                <span>Sincronizar Histórico</span>
                <span className="text-xs text-muted-foreground">
                  Importar histórico completo de conversas
                </span>
              </Label>
              <Switch
                id="sync_full_history"
                checked={settings.sync_full_history}
                onCheckedChange={() => handleToggle('sync_full_history')}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppSettingsModal; 