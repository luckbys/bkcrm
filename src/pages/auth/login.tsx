import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/ui/icons';
import { AuthError } from '@supabase/supabase-js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      // O redirecionamento será feito pelo useEffect quando o user for atualizado
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      if (err instanceof AuthError) {
        switch (err.message) {
          case 'Invalid login credentials':
            setError('Email ou senha inválidos');
            break;
          case 'Email not confirmed':
            setError('Por favor, confirme seu email antes de fazer login');
            break;
          case 'Too many requests':
            setError('Muitas tentativas de login. Por favor, aguarde alguns minutos');
            break;
          default:
            setError('Ocorreu um erro ao fazer login. Por favor, tente novamente');
        }
      } else {
        setError('Ocorreu um erro ao fazer login. Por favor, tente novamente');
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
            Bem-vindo ao BKCRM
          </h1>
          <p className="text-sm text-muted-foreground">
            Faça login para acessar sua conta
          </p>
        </div>

        {/* Card de Login */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Button
                    variant="link"
                    className="px-0 font-normal"
                    type="button"
                    onClick={() => navigate('/auth/forgot-password')}
                  >
                    Esqueceu a senha?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
              <div className="text-center text-sm">
                Não tem uma conta?{' '}
                <Button
                  variant="link"
                  className="px-0"
                  type="button"
                  onClick={() => navigate('/auth/register')}
                >
                  Cadastre-se
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Ao fazer login, você concorda com nossos{' '}
          <Button variant="link" className="px-0" type="button">
            Termos de Serviço
          </Button>{' '}
          e{' '}
          <Button variant="link" className="px-0" type="button">
            Política de Privacidade
          </Button>
        </p>
      </div>
    </div>
  );
} 