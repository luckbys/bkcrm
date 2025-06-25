import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmailConfirmation() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resendConfirmation } = useAuth();
  const { toast } = useToast();

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "❌ Campo obrigatório",
        description: "Por favor, digite seu email",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await resendConfirmation(email.trim());
      setEmailSent(true);
      
      toast({
        title: "📧 Email reenviado!",
        description: "Verifique sua caixa de entrada (incluindo spam) para o link de confirmação",
      });
    } catch (error: any) {
      console.error('Erro ao reenviar confirmação:', error);
      toast({
        title: "❌ Erro ao reenviar email",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-amber-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Confirme seu Email
          </CardTitle>
          <CardDescription className="text-gray-600">
            Para acessar o sistema, você precisa confirmar seu endereço de email
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Email enviado!</h3>
                <p className="text-sm text-gray-600">
                  Enviamos um novo link de confirmação para <strong>{email}</strong>
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Próximos passos:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Abra sua caixa de entrada de email</li>
                  <li>Procure por um email do BKCRM (verifique o spam)</li>
                  <li>Clique no link "Confirmar Email"</li>
                  <li>Retorne aqui e faça login</li>
                </ol>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setEmailSent(false)}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reenviar novamente
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResendConfirmation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email para confirmação</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-amber-800 font-medium mb-1">Por que preciso confirmar?</p>
                    <p className="text-amber-700">
                      A confirmação de email garante que você tenha acesso à sua conta e possa recuperar sua senha se necessário.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Reenviar Email de Confirmação
                  </>
                )}
              </Button>
            </form>
          )}
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <Link 
                to="/auth/login" 
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Voltar ao Login
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                to="/auth/register" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 