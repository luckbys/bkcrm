import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  QrCode,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Wifi,
  WifiOff,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  User,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionConnection } from '@/hooks/useEvolutionConnection';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
  instanceId: string;
  onConnectionSuccess: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  instanceName,
  instanceId,
  onConnectionSuccess
}) => {
  const { toast } = useToast();
  const [showQR, setShowQR] = useState(true);
  
  // Usar o hook real de conexão
  const {
    status,
    qrCode,
    error,
    timeLeft,
    profileInfo,
    connectInstance,
    disconnect,
    refreshQRCode,
    isConnecting,
    isConnected,
    hasQRCode,
    hasError
  } = useEvolutionConnection(instanceName);

  // Iniciar conexão quando o modal abrir
  useEffect(() => {
    if (isOpen && status === 'disconnected') {
      connectInstance();
    }
  }, [isOpen, status, connectInstance]);

  // Chamar callback quando conectar com sucesso
  useEffect(() => {
    if (status === 'connected') {
      onConnectionSuccess();
      // Fechar modal após 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [status, onConnectionSuccess, onClose]);

  const handleRefresh = () => {
    refreshQRCode();
  };

  const handleCopyQR = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      toast({
        title: "QR Code copiado",
        description: "O código foi copiado para a área de transferência",
      });
    }
  };

  const handleDownloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `whatsapp-qr-${instanceName}.png`;
      link.click();
      toast({
        title: "QR Code baixado",
        description: "O arquivo foi salvo em seus downloads",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'disconnected':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: <WifiOff className="w-5 h-5" />,
          label: 'Desconectado'
        };
      case 'creating':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: <Settings className="w-5 h-5 animate-pulse" />,
          label: 'Criando instância'
        };
      case 'connecting':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          label: 'Conectando'
        };
      case 'qr-ready':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          icon: <QrCode className="w-5 h-5" />,
          label: 'Aguardando escaneamento'
        };
      case 'connected':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Conectado'
        };
      case 'error':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'Erro na conexão'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            Conectar WhatsApp - {instanceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status da Conexão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Status da Conexão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", statusConfig.bgColor)}>
                    {statusConfig.icon}
                  </div>
                  <div>
                    <p className="font-medium">{statusConfig.label}</p>
                    <p className="text-sm text-gray-600">
                      Instância: {instanceName}
                    </p>
                  </div>
                </div>
                <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
                  {status === 'connected' ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Estado de Criação */}
          {status === 'creating' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-blue-100">
                  <Settings className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Criando instância WhatsApp
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Configurando a instância {instanceName}...
                  </p>
                </div>
                <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Estado de Conexão */}
          {status === 'connecting' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-blue-100">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Conectando ao WhatsApp
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Preparando QR Code para escaneamento...
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* QR Code */}
          <AnimatePresence>
            {hasQRCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        QR Code
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowQR(!showQR)}
                        >
                          {showQR ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyQR}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadQR}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      {showQR && qrCode && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200"
                        >
                          <img
                            src={qrCode}
                            alt="QR Code WhatsApp"
                            className="w-64 h-64 mx-auto"
                          />
                        </motion.div>
                      )}
                      
                      {/* Timer */}
                      {timeLeft > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-amber-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-mono text-lg">
                              {formatTime(timeLeft)}
                            </span>
                          </div>
                          <Progress 
                            value={(timeLeft / 120) * 100} 
                            className="w-full max-w-xs mx-auto"
                          />
                          <p className="text-sm text-gray-600">
                            Tempo restante para escaneamento
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instruções */}
          {hasQRCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Como conectar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                      1
                    </span>
                    <span>Abra o WhatsApp no seu celular</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                      2
                    </span>
                    <span>Toque em Menu (⋮) ou Configurações</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                      3
                    </span>
                    <span>Toque em "Aparelhos conectados" ou "WhatsApp Web"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                      4
                    </span>
                    <span>Toque em "Conectar um aparelho" e escaneie o código acima</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Estado Conectado */}
          {isConnected && profileInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    Conectado com sucesso!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Telefone</p>
                        <p className="font-medium">{profileInfo.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nome</p>
                        <p className="font-medium">{profileInfo.name}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-4">
                    Este modal será fechado automaticamente em alguns segundos.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Estado de Erro */}
          {hasError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Erro na conexão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button 
                    onClick={handleRefresh} 
                    className="w-full"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {!isConnected && !isConnecting && (
              <Button onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 