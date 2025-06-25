import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/ui/icons';
import { AuthError } from '@supabase/supabase-js';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Por favor, insira seu email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess(
        'Email de recuperação enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'
      );
    } catch (err) {
      console.error('Erro ao enviar email de recuperação:', err);
      if (err instanceof AuthError) {
        switch (err.message) {
          case 'For security purposes, you can only request this once every 60 seconds':
            setError('Por segurança, você só pode solicitar isso uma vez a cada 60 segundos');
            break;
          case 'Invalid email':
            setError('Por favor, insira um email válido');
            break;
          default:
            setError('Ocorreu um erro ao enviar o email de recuperação. Tente novamente.');
        }
      } else {
        setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo e Título */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <Icons.logo className="h-12 w-12" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Esqueci minha senha
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite seu email para receber as instruções de recuperação
          </p>
        </div>

        {/* Card de Recuperação */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Recuperar senha</CardTitle>
              <CardDescription>
                Enviaremos um link de recuperação para seu email
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Mensagens de erro e sucesso */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                  autoComplete="email"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || success !== null}
              >
                {loading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Email enviado!
                  </>
                ) : (
                  'Enviar email de recuperação'
                )}
              </Button>
              
              <div className="text-center text-sm">
                <Link 
                  to="/auth/login" 
                  className="inline-flex items-center font-medium text-primary hover:underline"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Voltar ao login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Instruções adicionais */}
        {success && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Próximos passos:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Verifique sua caixa de entrada (e spam)</li>
                <li>• Clique no link de recuperação</li>
                <li>• Digite sua nova senha</li>
                <li>• Faça login com as novas credenciais</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Não recebeu o email? Verifique a pasta de spam ou{' '}
          <Button 
            variant="link" 
            className="px-0 h-auto" 
            type="button"
            onClick={() => !loading && handleSubmit(new Event('submit') as any)}
            disabled={loading || !email}
          >
            envie novamente
          </Button>
        </p>
      </div>
    </div>
  );
} 