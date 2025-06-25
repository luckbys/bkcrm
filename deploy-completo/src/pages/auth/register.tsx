import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/ui/icons';
import { AuthError } from '@supabase/supabase-js';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'Pelo menos 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Pelo menos uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Pelo menos uma letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Pelo menos um número', test: (p) => /\d/.test(p) },
  { label: 'Pelo menos um caractere especial', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Limpa erro quando usuário digita
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Por favor, insira um email válido');
      return false;
    }

    if (!formData.password) {
      setError('Senha é obrigatória');
      return false;
    }

    const failedRequirements = passwordRequirements.filter(req => !req.test(formData.password));
    if (failedRequirements.length > 0) {
      setError(`Senha não atende aos requisitos: ${failedRequirements.map(r => r.label).join(', ')}`);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.name);
      setSuccess('Conta criada com sucesso! Verifique seu email para confirmar a conta.');
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
      
    } catch (err) {
      console.error('Erro ao criar conta:', err);
      if (err instanceof AuthError) {
        switch (err.message) {
          case 'User already registered':
            setError('Este email já está cadastrado. Tente fazer login ou use a opção "Esqueci a senha"');
            break;
          case 'Password should be at least 6 characters':
            setError('A senha deve ter pelo menos 6 caracteres');
            break;
          case 'Signup disabled':
            setError('O cadastro está temporariamente desabilitado. Entre em contato com o suporte.');
            break;
          case 'Invalid email':
            setError('Por favor, insira um email válido');
            break;
          default:
            setError(`Erro ao criar conta: ${err.message}`);
        }
      } else {
        setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const passed = passwordRequirements.filter(req => req.test(formData.password)).length;
    if (passed <= 2) return { strength: 'weak', color: 'bg-red-500', text: 'Fraca' };
    if (passed <= 3) return { strength: 'medium', color: 'bg-yellow-500', text: 'Média' };
    if (passed <= 4) return { strength: 'good', color: 'bg-blue-500', text: 'Boa' };
    return { strength: 'strong', color: 'bg-green-500', text: 'Forte' };
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-[480px] space-y-6">
        {/* Logo e Título */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <Icons.logo className="h-12 w-12" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Criar nova conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados abaixo para criar sua conta no BKCRM
          </p>
        </div>

        {/* Card de Registro */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Registro</CardTitle>
              <CardDescription>
                Crie sua conta para acessar o sistema
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

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                  autoComplete="email"
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    disabled={loading}
                    className="w-full pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>

                {/* Indicador de força da senha */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Força da senha:</span>
                      <span className={cn(
                        "font-medium",
                        getPasswordStrength().strength === 'weak' && "text-red-600",
                        getPasswordStrength().strength === 'medium' && "text-yellow-600",
                        getPasswordStrength().strength === 'good' && "text-blue-600",
                        getPasswordStrength().strength === 'strong' && "text-green-600"
                      )}>
                        {getPasswordStrength().text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn("h-2 rounded-full transition-all", getPasswordStrength().color)}
                        style={{ 
                          width: `${(passwordRequirements.filter(req => req.test(formData.password)).length / passwordRequirements.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Requisitos da senha */}
                {(passwordFocused || formData.password) && (
                  <div className="space-y-1 p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs font-medium text-gray-700 mb-2">Requisitos da senha:</p>
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        {req.test(formData.password) ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={cn(
                          req.test(formData.password) ? "text-green-700" : "text-gray-600"
                        )}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    disabled={loading}
                    className={cn(
                      "w-full pr-10",
                      formData.confirmPassword && formData.password !== formData.confirmPassword && "border-red-300"
                    )}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    As senhas não coincidem
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Senhas coincidem
                  </p>
                )}
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
                    Criando conta...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Conta criada com sucesso!
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
              
              <div className="text-center text-sm">
                Já tem uma conta?{' '}
                <Link 
                  to="/auth/login" 
                  className="font-medium text-primary hover:underline"
                >
                  Faça login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Ao criar uma conta, você concorda com nossos{' '}
          <Button variant="link" className="px-0 h-auto" type="button">
            Termos de Serviço
          </Button>{' '}
          e{' '}
          <Button variant="link" className="px-0 h-auto" type="button">
            Política de Privacidade
          </Button>
        </p>
      </div>
    </div>
  );
}