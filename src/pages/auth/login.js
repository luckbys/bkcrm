import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const [error, setError] = useState(null);
    // Redireciona se já estiver logado
    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await signIn(email, password);
            // O redirecionamento será feito pelo useEffect quando o user for atualizado
        }
        catch (err) {
            console.error('Erro ao fazer login:', err);
            // Usar a mensagem de erro personalizada do hook useAuth
            if (err.message) {
                setError(err.message);
            }
            else if (err instanceof AuthError) {
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
            }
            else {
                setError('Ocorreu um erro ao fazer login. Por favor, tente novamente');
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4", children: _jsxs("div", { className: "w-full max-w-[400px] space-y-6", children: [_jsxs("div", { className: "flex flex-col items-center space-y-2 text-center", children: [_jsx(Icons.logo, { className: "h-12 w-12" }), _jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Bem-vindo ao BKCRM" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Fa\u00E7a login para acessar sua conta" })] }), _jsx(Card, { children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Login" }), _jsx(CardDescription, { children: "Entre com suas credenciais para acessar o sistema" })] }), _jsxs(CardContent, { className: "space-y-4", children: [error && (_jsx(Alert, { variant: "destructive", className: "mb-4", children: _jsxs(AlertDescription, { children: [error, error.includes('Email ainda não foi confirmado') && (_jsx("div", { className: "mt-3", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => navigate('/auth/email-confirmation'), className: "w-full", children: "\uD83D\uDCE7 Reenviar Email de Confirma\u00E7\u00E3o" }) }))] }) })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", placeholder: "seu@email.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, disabled: loading, className: "w-full", autoComplete: "email" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "password", children: "Senha" }), _jsx(Button, { variant: "link", className: "px-0 font-normal", type: "button", onClick: () => navigate('/auth/forgot-password'), children: "Esqueceu a senha?" })] }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, disabled: loading, className: "w-full", autoComplete: "current-password" })] })] }), _jsxs(CardFooter, { className: "flex flex-col space-y-4", children: [_jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Icons.spinner, { className: "mr-2 h-4 w-4 animate-spin" }), "Entrando..."] })) : ('Entrar') }), _jsxs("div", { className: "text-center text-sm", children: ["N\u00E3o tem uma conta?", ' ', _jsx(Button, { variant: "link", className: "px-0", type: "button", onClick: () => navigate('/auth/register'), children: "Cadastre-se" })] })] })] }) }), _jsxs("p", { className: "text-center text-sm text-muted-foreground", children: ["Ao fazer login, voc\u00EA concorda com nossos", ' ', _jsx(Button, { variant: "link", className: "px-0", type: "button", children: "Termos de Servi\u00E7o" }), ' ', "e", ' ', _jsx(Button, { variant: "link", className: "px-0", type: "button", children: "Pol\u00EDtica de Privacidade" })] })] }) }));
}
