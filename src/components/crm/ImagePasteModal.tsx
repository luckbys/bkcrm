
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ImagePasteModalProps {
  image: string | null;
  onClose: () => void;
  onSend: (comment: string, isInternal: boolean) => void;
}

export const ImagePasteModal = ({ image, onClose, onSend }: ImagePasteModalProps) => {
  const [comment, setComment] = useState('');
  const [target, setTarget] = useState('client');

  const handleSend = () => {
    onSend(comment, target === 'internal');
  };

  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Imagem</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {image && (
            <div className="border rounded-lg p-2">
              <img 
                src={image} 
                alt="Imagem colada" 
                className="w-full h-40 object-cover rounded"
              />
            </div>
          )}

          <div>
            <Label htmlFor="comment">Comentário</Label>
            <Textarea
              id="comment"
              placeholder="Digite um comentário sobre a imagem..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label>Destino</Label>
            <RadioGroup value={target} onValueChange={setTarget} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client">Cliente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="internal" id="internal" />
                <Label htmlFor="internal">Anotação Interna</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSend}>
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
