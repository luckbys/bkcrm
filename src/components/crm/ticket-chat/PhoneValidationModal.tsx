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
  Phone,
  Search,
  AlertTriangle,
  CheckCircle,
  Loader2,
  PhoneCall,
  X,
  Info
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { usePhoneValidationAndSearch } from '../../../hooks/usePhoneValidationAndSearch';
import { useToast } from '../../../hooks/use-toast';

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  currentPhone?: string;
  customerName?: string;
  onPhoneValidated: (phone: string, phoneFormatted: string) => void;
}

export const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  currentPhone,
  customerName,
  onPhoneValidated
}) => {
  const { toast } = useToast();
  const {
    validatePhoneFormat,
    searchCustomerPhone,
    updateTicketWithPhone,
    validateAndSearchPhone,
    isSearching
  } = usePhoneValidationAndSearch();

  const [manualPhone, setManualPhone] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-buscar quando modal abrir
  useEffect(() => {
    if (isOpen && ticketId && !hasSearched) {
      handleAutoSearch();
    }
  }, [isOpen, ticketId]);

  // Resetar estado quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setManualPhone('');
      setSearchResult(null);
      setValidationResult(null);
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleAutoSearch = async () => {
    setHasSearched(true);
    
    try {
      console.log('🔍 Realizando busca automática de telefone...');
      
      const result = await validateAndSearchPhone(ticketId, currentPhone, customerName);
      setSearchResult(result);
      
      if (result.canSend) {
        toast({
          title: "📱 Telefone encontrado automaticamente!",
          description: `${result.phoneFormatted} pronto para envio`,
        });
        
        // Fechar modal e continuar com envio
        onPhoneValidated(result.phone!, result.phoneFormatted!);
        onClose();
      } else {
        console.log('❌ Busca automática não encontrou telefone válido');
      }
    } catch (error) {
      console.error('❌ Erro na busca automática:', error);
    }
  };

  const handleManualValidation = async () => {
    if (!manualPhone.trim()) return;

    setIsValidating(true);
    
    try {
      const validation = validatePhoneFormat(manualPhone);
      setValidationResult(validation);
      
      if (validation.isValid) {
        // Atualizar ticket com telefone manual
        const phoneData = {
          found: true,
          phone: validation.phone!,
          phoneFormatted: validation.phoneFormatted!,
          source: 'manual' as const,
          confidence: 'medium' as const
        };
        
        const updated = await updateTicketWithPhone(ticketId, phoneData);
        
        if (updated) {
          toast({
            title: "✅ Telefone validado!",
            description: `${validation.phoneFormatted} salvo no ticket`,
          });
          
          onPhoneValidated(validation.phone!, validation.phoneFormatted!);
          onClose();
        } else {
          toast({
            title: "⚠️ Telefone válido mas não salvo",
            description: "Use o telefone mas não foi possível salvar no banco",
            variant: "default"
          });
          
          // Ainda assim permitir o envio
          onPhoneValidated(validation.phone!, validation.phoneFormatted!);
          onClose();
        }
      }
    } catch (error) {
      console.error('❌ Erro na validação manual:', error);
      toast({
        title: "❌ Erro na validação",
        description: "Não foi possível validar o telefone",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && manualPhone.trim()) {
      handleManualValidation();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-orange-600" />
            Validação de Telefone WhatsApp
          </DialogTitle>
          <DialogDescription>
            Não foi possível enviar a mensagem via WhatsApp. Vamos encontrar um número válido.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status do telefone atual */}
          {currentPhone && currentPhone !== 'Telefone não informado' && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Telefone atual inválido</p>
                  <p className="text-sm text-orange-700 mt-1">
                    <span className="font-mono bg-orange-100 px-2 py-1 rounded">{currentPhone}</span>
                  </p>
                  {validatePhoneFormat(currentPhone).suggestions && (
                    <div className="mt-2">
                      <p className="text-xs text-orange-600 font-medium">Sugestões:</p>
                      <ul className="text-xs text-orange-600 list-disc list-inside mt-1">
                        {validatePhoneFormat(currentPhone).suggestions?.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resultado da busca automática */}
          {isSearching && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="font-medium text-blue-800">Buscando telefone automaticamente...</p>
                  <p className="text-sm text-blue-700">Verificando histórico de mensagens e dados do cliente</p>
                </div>
              </div>
            </div>
          )}

          {searchResult && !searchResult.canSend && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Busca automática sem sucesso</p>
                  <p className="text-sm text-red-700 mt-1">{searchResult.reason}</p>
                  
                  {searchResult.searchResult && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Fonte: {searchResult.searchResult.source} | 
                        Confiança: {searchResult.searchResult.confidence}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Input para telefone manual */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digite o telefone WhatsApp do cliente
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Ex: +55 (11) 99999-9999 ou 5511999999999"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Resultado da validação manual */}
            {validationResult && (
              <div className={cn(
                "p-3 rounded-lg border",
                validationResult.isValid 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-start gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      validationResult.isValid ? "text-green-800" : "text-red-800"
                    )}>
                      {validationResult.isValid ? "Telefone válido!" : "Telefone inválido"}
                    </p>
                    
                    {validationResult.isValid && validationResult.phoneFormatted && (
                      <p className="text-sm text-green-700 mt-1">
                        Formato: <span className="font-mono bg-green-100 px-1 rounded">{validationResult.phoneFormatted}</span>
                      </p>
                    )}
                    
                    {!validationResult.isValid && validationResult.error && (
                      <p className="text-sm text-red-700 mt-1">{validationResult.error}</p>
                    )}
                    
                    {validationResult.suggestions && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 font-medium">Sugestões:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside mt-1">
                          {validationResult.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dicas de formato */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-700">Formatos aceitos:</p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• <span className="font-mono">+55 (11) 99999-9999</span> - Celular brasileiro</li>
                  <li>• <span className="font-mono">5511999999999</span> - Apenas números</li>
                  <li>• <span className="font-mono">+1 (555) 123-4567</span> - Internacional</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancelar Envio
          </Button>
          
          <Button 
            onClick={handleManualValidation}
            disabled={!manualPhone.trim() || isValidating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <PhoneCall className="w-4 h-4 mr-2" />
                Validar e Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
