import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const handleSubmit = async (e) => {
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
            if (error)
                throw error;
            setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.');
        }
        catch (err) {
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
            }
            else {
                setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4", children: _jsxs("div", { className: "w-full max-w-[400px] space-y-6", children: [_jsxs("div", { className: "flex flex-col items-center space-y-2 text-center", children: [_jsx(Icons.logo, { className: "h-12 w-12" }), _jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Esqueci minha senha" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Digite seu email para receber as instru\u00E7\u00F5es de recupera\u00E7\u00E3o" })] }), _jsx(Card, { children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Recuperar senha" }), _jsx(CardDescription, { children: "Enviaremos um link de recupera\u00E7\u00E3o para seu email" })] }), _jsxs(CardContent, { className: "space-y-4", children: [error && (_jsxs(Alert, { variant: "destructive", children: [_jsx(XCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: error })] })), success && (_jsxs(Alert, { className: "border-green-200 bg-green-50", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-600" }), _jsx(AlertDescription, { className: "text-green-800", children: success })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", placeholder: "seu@email.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, disabled: loading, className: "w-full", autoComplete: "email" })] })] }), _jsxs(CardFooter, { className: "flex flex-col space-y-4", children: [_jsx(Button, { type: "submit", className: "w-full", disabled: loading || success !== null, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Icons.spinner, { className: "mr-2 h-4 w-4 animate-spin" }), "Enviando..."] })) : success ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "mr-2 h-4 w-4" }), "Email enviado!"] })) : ('Enviar email de recuperação') }), _jsx("div", { className: "text-center text-sm", children: _jsxs(Link, { to: "/auth/login", className: "inline-flex items-center font-medium text-primary hover:underline", children: [_jsx(ArrowLeft, { className: "mr-1 h-3 w-3" }), "Voltar ao login"] }) })] })] }) }), success && (_jsx(Card, { className: "border-blue-200 bg-blue-50", children: _jsxs(CardContent, { className: "p-4", children: [_jsx("h3", { className: "font-semibold text-blue-900 mb-2", children: "Pr\u00F3ximos passos:" }), _jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsx("li", { children: "\u2022 Verifique sua caixa de entrada (e spam)" }), _jsx("li", { children: "\u2022 Clique no link de recupera\u00E7\u00E3o" }), _jsx("li", { children: "\u2022 Digite sua nova senha" }), _jsx("li", { children: "\u2022 Fa\u00E7a login com as novas credenciais" })] })] }) })), _jsxs("p", { className: "text-center text-sm text-muted-foreground", children: ["N\u00E3o recebeu o email? Verifique a pasta de spam ou", ' ', _jsx(Button, { variant: "link", className: "px-0 h-auto", type: "button", onClick: () => !loading && handleSubmit(new Event('submit')), disabled: loading || !email, children: "envie novamente" })] })] }) }));
}
