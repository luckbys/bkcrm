import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
const passwordRequirements = [
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
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    // Redireciona se já estiver logado
    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);
    const handleInputChange = (field, value) => {
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
    const handleSubmit = async (e) => {
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
        }
        catch (err) {
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
            }
            else {
                setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const getPasswordStrength = () => {
        const passed = passwordRequirements.filter(req => req.test(formData.password)).length;
        if (passed <= 2)
            return { strength: 'weak', color: 'bg-red-500', text: 'Fraca' };
        if (passed <= 3)
            return { strength: 'medium', color: 'bg-yellow-500', text: 'Média' };
        if (passed <= 4)
            return { strength: 'good', color: 'bg-blue-500', text: 'Boa' };
        return { strength: 'strong', color: 'bg-green-500', text: 'Forte' };
    };
    return (_jsx("div", { className: "min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4", children: _jsxs("div", { className: "w-full max-w-[480px] space-y-6", children: [_jsxs("div", { className: "flex flex-col items-center space-y-2 text-center", children: [_jsx(Icons.logo, { className: "h-12 w-12" }), _jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Criar nova conta" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Preencha os dados abaixo para criar sua conta no BKCRM" })] }), _jsx(Card, { children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Registro" }), _jsx(CardDescription, { children: "Crie sua conta para acessar o sistema" })] }), _jsxs(CardContent, { className: "space-y-4", children: [error && (_jsxs(Alert, { variant: "destructive", children: [_jsx(XCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: error })] })), success && (_jsxs(Alert, { className: "border-green-200 bg-green-50", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-600" }), _jsx(AlertDescription, { className: "text-green-800", children: success })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "Nome completo" }), _jsx(Input, { id: "name", type: "text", placeholder: "Seu nome completo", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), required: true, disabled: loading, className: "w-full", autoComplete: "name" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", placeholder: "seu@email.com", value: formData.email, onChange: (e) => handleInputChange('email', e.target.value), required: true, disabled: loading, className: "w-full", autoComplete: "email" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "Senha" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "password", type: showPassword ? 'text' : 'password', placeholder: "Sua senha", value: formData.password, onChange: (e) => handleInputChange('password', e.target.value), onFocus: () => setPasswordFocused(true), onBlur: () => setPasswordFocused(false), required: true, disabled: loading, className: "w-full pr-10", autoComplete: "new-password" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-0 top-0 h-full px-3 hover:bg-transparent", onClick: () => setShowPassword(!showPassword), disabled: loading, children: showPassword ? (_jsx(EyeOff, { className: "h-4 w-4 text-gray-400" })) : (_jsx(Eye, { className: "h-4 w-4 text-gray-400" })) })] }), formData.password && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-muted-foreground", children: "For\u00E7a da senha:" }), _jsx("span", { className: cn("font-medium", getPasswordStrength().strength === 'weak' && "text-red-600", getPasswordStrength().strength === 'medium' && "text-yellow-600", getPasswordStrength().strength === 'good' && "text-blue-600", getPasswordStrength().strength === 'strong' && "text-green-600"), children: getPasswordStrength().text })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: cn("h-2 rounded-full transition-all", getPasswordStrength().color), style: {
                                                                width: `${(passwordRequirements.filter(req => req.test(formData.password)).length / passwordRequirements.length) * 100}%`
                                                            } }) })] })), (passwordFocused || formData.password) && (_jsxs("div", { className: "space-y-1 p-3 bg-gray-50 rounded-lg border", children: [_jsx("p", { className: "text-xs font-medium text-gray-700 mb-2", children: "Requisitos da senha:" }), passwordRequirements.map((req, index) => (_jsxs("div", { className: "flex items-center space-x-2 text-xs", children: [req.test(formData.password) ? (_jsx(CheckCircle, { className: "h-3 w-3 text-green-600" })) : (_jsx(XCircle, { className: "h-3 w-3 text-gray-400" })), _jsx("span", { className: cn(req.test(formData.password) ? "text-green-700" : "text-gray-600"), children: req.label })] }, index)))] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: "Confirmar senha" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "confirmPassword", type: showConfirmPassword ? 'text' : 'password', placeholder: "Confirme sua senha", value: formData.confirmPassword, onChange: (e) => handleInputChange('confirmPassword', e.target.value), required: true, disabled: loading, className: cn("w-full pr-10", formData.confirmPassword && formData.password !== formData.confirmPassword && "border-red-300"), autoComplete: "new-password" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-0 top-0 h-full px-3 hover:bg-transparent", onClick: () => setShowConfirmPassword(!showConfirmPassword), disabled: loading, children: showConfirmPassword ? (_jsx(EyeOff, { className: "h-4 w-4 text-gray-400" })) : (_jsx(Eye, { className: "h-4 w-4 text-gray-400" })) })] }), formData.confirmPassword && formData.password !== formData.confirmPassword && (_jsxs("p", { className: "text-xs text-red-600 flex items-center gap-1", children: [_jsx(XCircle, { className: "h-3 w-3" }), "As senhas n\u00E3o coincidem"] })), formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (_jsxs("p", { className: "text-xs text-green-600 flex items-center gap-1", children: [_jsx(CheckCircle, { className: "h-3 w-3" }), "Senhas coincidem"] }))] })] }), _jsxs(CardFooter, { className: "flex flex-col space-y-4", children: [_jsx(Button, { type: "submit", className: "w-full", disabled: loading || success !== null, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Icons.spinner, { className: "mr-2 h-4 w-4 animate-spin" }), "Criando conta..."] })) : success ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "mr-2 h-4 w-4" }), "Conta criada com sucesso!"] })) : ('Criar conta') }), _jsxs("div", { className: "text-center text-sm", children: ["J\u00E1 tem uma conta?", ' ', _jsx(Link, { to: "/auth/login", className: "font-medium text-primary hover:underline", children: "Fa\u00E7a login" })] })] })] }) }), _jsxs("p", { className: "text-center text-sm text-muted-foreground", children: ["Ao criar uma conta, voc\u00EA concorda com nossos", ' ', _jsx(Button, { variant: "link", className: "px-0 h-auto", type: "button", children: "Termos de Servi\u00E7o" }), ' ', "e", ' ', _jsx(Button, { variant: "link", className: "px-0 h-auto", type: "button", children: "Pol\u00EDtica de Privacidade" })] })] }) }));
}
