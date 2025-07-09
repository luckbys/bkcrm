import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/ui/icons';
import { Ripple } from '@/components/magicui/ripple';
import { ButtonLoadingSpinner } from '@/components/ui/loading';
import { AuthError } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // or loading spinner
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Background Ripple Effect */}
      <Ripple 
        variant="elegant"
        mainCircleSize={200}
        mainCircleOpacity={0.06}
        numCircles={8}
        className="absolute inset-0 z-0"
      />
      
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/40 via-transparent to-white/20" />
      
      {/* Content Container */}
      <div className="relative z-20 w-full max-w-md mx-auto px-4">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4 shadow-lg shadow-blue-500/20">
            <span className="text-2xl font-bold text-white">BK</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BKCRM</h1>
          <p className="text-gray-600">Sistema de Gestão Omnichannel</p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-sm bg-white/80 border-gray-200/50 shadow-xl shadow-gray-900/5">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gray-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all duration-200"
                disabled={loading}
              >
                {loading ? <ButtonLoadingSpinner /> : 'Entrar'}
              </Button>

              <div className="text-center text-sm text-gray-500">
                <p>Esqueceu sua senha? Entre em contato com o administrador</p>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2024 BKCRM. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
} 