
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Send, X, Image, MessageCircle, FileText } from 'lucide-react';

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
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center text-lg font-semibold">
              <Image className="w-5 h-5 mr-2 text-blue-600" />
              Enviar Imagem
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {image && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
              <img 
                src={image} 
                alt="Imagem colada" 
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium text-gray-700">
              Comentário
            </Label>
            <Textarea
              id="comment"
              placeholder="Digite um comentário sobre a imagem..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Destino</Label>
            <RadioGroup 
              value={target} 
              onValueChange={setTarget} 
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="client" id="client" className="text-blue-600" />
                <Label 
                  htmlFor="client" 
                  className="flex items-center cursor-pointer flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
                  <div>
                    <div className="font-medium">Cliente</div>
                    <div className="text-xs text-gray-500">Enviar imagem diretamente ao cliente</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="internal" id="internal" className="text-orange-600" />
                <Label 
                  htmlFor="internal" 
                  className="flex items-center cursor-pointer flex-1"
                >
                  <FileText className="w-4 h-4 mr-2 text-orange-600" />
                  <div>
                    <div className="font-medium">Anotação Interna</div>
                    <div className="text-xs text-gray-500">Salvar como nota interna do ticket</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
