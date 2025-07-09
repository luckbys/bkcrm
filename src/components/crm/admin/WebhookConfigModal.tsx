import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Webhook, Save, Trash2, TestTube2 } from 'lucide-react';

interface WebhookConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
  departmentName: string;
  currentWebhook: { url: string; enabled: boolean } | null;
  onSave: (webhookData: { url: string; enabled: boolean; events: string[] }) => Promise<void>;
  isLoading: boolean;
  onTest: () => Promise<void>;
  onRemove: () => Promise<void>;
  generateSuggestedUrl: () => string;
  getRecommendedEvents: () => string[];
}

export const WebhookConfigModal = ({ 
  isOpen, 
  onClose, 
  instanceName, 
  departmentName, 
  currentWebhook, 
  onSave, 
  isLoading, 
  onTest, 
  onRemove,
  generateSuggestedUrl,
  getRecommendedEvents
}: WebhookConfigModalProps) => {
  const [url, setUrl] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (currentWebhook) {
        setUrl(currentWebhook.url);
        setEnabled(currentWebhook.enabled);
      } else {
        setUrl(generateSuggestedUrl());
        setEnabled(true);
      }
    }
  }, [isOpen, currentWebhook, generateSuggestedUrl]);

  const handleSave = async () => {
    await onSave({ url, enabled, events: getRecommendedEvents() });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Webhook className="w-5 h-5 text-blue-600" />
            <span>Webhook - {instanceName}</span>
          </DialogTitle>
          <DialogDescription>
            Configure o webhook para receber eventos do WhatsApp no departamento {departmentName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL do Webhook</Label>
            <Input
              id="webhookUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://seu-domonio.com/webhook"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="webhookEnabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="webhookEnabled">Ativar Webhook</Label>
          </div>
        </div>
        
        <DialogFooter className="justify-between">
          <div>
            <Button variant="outline" onClick={onTest} disabled={isLoading}>
              <TestTube2 className="w-4 h-4 mr-2" />
              Testar
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="destructive" onClick={onRemove} disabled={isLoading}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};