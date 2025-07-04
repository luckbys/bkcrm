import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, RefreshCw, Users, Settings, Wrench, User, Building, AlertCircle } from 'lucide-react';
import { runDepartmentDiagnostic, checkDepartmentIssues } from '@/utils/fixDepartmentIssues';
import { toast } from '@/hooks/use-toast';
export const DepartmentDiagnostic = () => {
    const [loading, setLoading] = useState(false);
    const [issues, setIssues] = useState([]);
    const [lastDiagnostic, setLastDiagnostic] = useState(null);
    const [hasRun, setHasRun] = useState(false);
    const runDiagnostic = async () => {
        try {
            setLoading(true);
            const result = await runDepartmentDiagnostic();
            setIssues(result.issues);
            setLastDiagnostic(new Date());
            setHasRun(true);
            if (result.issues.length === 0) {
                toast({
                    title: "✅ Sistema OK",
                    description: "Nenhum problema de departamento encontrado.",
                });
            }
            else {
                toast({
                    title: "🔧 Problemas corrigidos",
                    description: `${result.issues.length} problemas encontrados e corrigidos automaticamente.`,
                });
            }
        }
        catch (error) {
            console.error('Erro no diagnóstico:', error);
            toast({
                title: "❌ Erro no diagnóstico",
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const checkOnly = async () => {
        try {
            setLoading(true);
            const foundIssues = await checkDepartmentIssues();
            setIssues(foundIssues);
            setLastDiagnostic(new Date());
            setHasRun(true);
            if (foundIssues.length === 0) {
                toast({
                    title: "✅ Sistema OK",
                    description: "Nenhum problema de departamento encontrado.",
                });
            }
            else {
                toast({
                    title: "⚠️ Problemas encontrados",
                    description: `${foundIssues.length} problemas detectados. Use "Executar Correção" para corrigir.`,
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error('Erro na verificação:', error);
            toast({
                title: "❌ Erro na verificação",
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return _jsx(Settings, { className: "w-4 h-4 text-red-600" });
            case 'agent': return _jsx(User, { className: "w-4 h-4 text-blue-600" });
            case 'customer': return _jsx(Users, { className: "w-4 h-4 text-green-600" });
            default: return _jsx(User, { className: "w-4 h-4 text-gray-600" });
        }
    };
    const getRoleBadge = (role) => {
        const variants = {
            admin: 'bg-red-100 text-red-800 border-red-200',
            agent: 'bg-blue-100 text-blue-800 border-blue-200',
            customer: 'bg-green-100 text-green-800 border-green-200'
        };
        return (_jsx(Badge, { className: variants[role] || 'bg-gray-100 text-gray-800 border-gray-200', children: role.charAt(0).toUpperCase() + role.slice(1) }));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Building, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { children: "Diagn\u00F3stico de Departamentos" })] }), _jsx("p", { className: "text-sm text-gray-600", children: "Verifique e corrija problemas relacionados \u00E0 separa\u00E7\u00E3o de tickets por departamento" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs(Button, { onClick: checkOnly, disabled: loading, variant: "outline", className: "flex-1", children: [loading ? (_jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" })) : (_jsx(AlertCircle, { className: "w-4 h-4 mr-2" })), "Verificar Apenas"] }), _jsxs(Button, { onClick: runDiagnostic, disabled: loading, className: "flex-1 bg-blue-600 hover:bg-blue-700", children: [loading ? (_jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" })) : (_jsx(Wrench, { className: "w-4 h-4 mr-2" })), "Executar Corre\u00E7\u00E3o"] })] }), lastDiagnostic && (_jsxs("p", { className: "text-xs text-gray-500 text-center", children: ["\u00DAltima verifica\u00E7\u00E3o: ", lastDiagnostic.toLocaleString('pt-BR')] }))] })] }), hasRun && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [issues.length === 0 ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-600" })) : (_jsx(AlertTriangle, { className: "w-5 h-5 text-amber-600" })), _jsx("span", { children: "Resultado do Diagn\u00F3stico" })] }) }), _jsx(CardContent, { children: issues.length === 0 ? (_jsxs(Alert, { children: [_jsx(CheckCircle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Sistema OK" }), _jsx(AlertDescription, { children: "Todos os usu\u00E1rios est\u00E3o corretamente atribu\u00EDdos aos seus departamentos. O filtro de tickets por setor deve estar funcionando corretamente." })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertTriangle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Problemas Encontrados" }), _jsxs(AlertDescription, { children: [issues.length, " problema(s) detectado(s) que podem estar causando a visibilidade incorreta de tickets entre setores."] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "font-semibold text-gray-900", children: "Detalhes dos Problemas:" }), issues.map((issue, index) => (_jsx(Card, { className: "border-l-4 border-l-amber-500", children: _jsx(CardContent, { className: "pt-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-2 flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [getRoleIcon(issue.userRole), _jsx("span", { className: "font-medium", children: issue.userName }), getRoleBadge(issue.userRole)] }), _jsx("p", { className: "text-sm text-gray-600", children: issue.userEmail }), _jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx("span", { className: "text-red-600 font-medium", children: "Problema:" }), _jsx("span", { children: issue.issue })] }), _jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx("span", { className: "text-blue-600 font-medium", children: "Corre\u00E7\u00E3o:" }), _jsx("span", { children: issue.suggested_fix })] })] }), _jsx("div", { className: "ml-4", children: _jsxs(Badge, { variant: "outline", className: "border-amber-200 text-amber-800", children: ["ID: ", issue.userId.slice(0, 8), "..."] }) })] }) }) }, index)))] })] })) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-medium text-gray-700", children: "Como funciona o filtro por departamento" }) }), _jsxs(CardContent, { className: "text-sm text-gray-600 space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Customers:" }), " Veem apenas seus pr\u00F3prios tickets"] }), _jsxs("p", { children: [_jsx("strong", { children: "Agents:" }), " Veem apenas tickets do seu departamento"] }), _jsxs("p", { children: [_jsx("strong", { children: "Admins com departamento:" }), " Veem apenas tickets do seu departamento"] }), _jsxs("p", { children: [_jsx("strong", { children: "Admins sem departamento:" }), " Veem todos os tickets (super admin)"] }), _jsx(Separator, { className: "my-3" }), _jsx("p", { className: "text-xs text-gray-500", children: "\uD83D\uDCA1 Se os tickets ainda est\u00E3o aparecendo para outros setores, execute o diagn\u00F3stico para identificar e corrigir configura\u00E7\u00F5es incorretas." })] })] })] }));
};
