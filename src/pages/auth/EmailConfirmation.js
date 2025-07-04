import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const handleResendConfirmation = async (e) => {
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
        }
        catch (error) {
            console.error('Erro ao reenviar confirmação:', error);
            toast({
                title: "❌ Erro ao reenviar email",
                description: error.message || "Ocorreu um erro. Tente novamente.",
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm", children: [_jsxs(CardHeader, { className: "space-y-2 text-center", children: [_jsx("div", { className: "mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center", children: _jsx(Mail, { className: "w-6 h-6 text-amber-600" }) }), _jsx(CardTitle, { className: "text-xl font-bold text-gray-900", children: "Confirme seu Email" }), _jsx(CardDescription, { className: "text-gray-600", children: "Para acessar o sistema, voc\u00EA precisa confirmar seu endere\u00E7o de email" })] }), _jsxs(CardContent, { className: "space-y-6", children: [emailSent ? (_jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto", children: _jsx(CheckCircle, { className: "w-8 h-8 text-green-600" }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Email enviado!" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Enviamos um novo link de confirma\u00E7\u00E3o para ", _jsx("strong", { children: email })] })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 text-left", children: [_jsxs("h4", { className: "font-medium text-blue-900 mb-2 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-2" }), "Pr\u00F3ximos passos:"] }), _jsxs("ol", { className: "text-sm text-blue-800 space-y-1 list-decimal list-inside", children: [_jsx("li", { children: "Abra sua caixa de entrada de email" }), _jsx("li", { children: "Procure por um email do BKCRM (verifique o spam)" }), _jsx("li", { children: "Clique no link \"Confirmar Email\"" }), _jsx("li", { children: "Retorne aqui e fa\u00E7a login" })] })] }), _jsxs(Button, { variant: "outline", onClick: () => setEmailSent(false), className: "w-full", children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "Reenviar novamente"] })] })) : (_jsxs("form", { onSubmit: handleResendConfirmation, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email para confirma\u00E7\u00E3o" }), _jsx(Input, { id: "email", type: "email", placeholder: "Digite seu email...", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full", required: true })] }), _jsx("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-3", children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" }), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "text-amber-800 font-medium mb-1", children: "Por que preciso confirmar?" }), _jsx("p", { className: "text-amber-700", children: "A confirma\u00E7\u00E3o de email garante que voc\u00EA tenha acesso \u00E0 sua conta e possa recuperar sua senha se necess\u00E1rio." })] })] }) }), _jsx(Button, { type: "submit", className: "w-full bg-blue-600 hover:bg-blue-700", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }), "Enviando..."] })) : (_jsxs(_Fragment, { children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), "Reenviar Email de Confirma\u00E7\u00E3o"] })) })] })), _jsx("div", { className: "border-t pt-4", children: _jsxs("div", { className: "flex items-center justify-center space-x-4 text-sm", children: [_jsxs(Link, { to: "/auth/login", className: "flex items-center text-gray-600 hover:text-blue-600 transition-colors", children: [_jsx(ArrowLeft, { className: "w-3 h-3 mr-1" }), "Voltar ao Login"] }), _jsx("span", { className: "text-gray-300", children: "\u2022" }), _jsx(Link, { to: "/auth/register", className: "text-gray-600 hover:text-blue-600 transition-colors", children: "Criar Conta" })] }) })] })] }) }));
}
