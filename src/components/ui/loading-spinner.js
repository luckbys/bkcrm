import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export const LoadingSpinner = ({ size = 'md', variant = 'primary', text = 'Carregando...', className, showProgress = false, progress = 0 }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };
    const variantClasses = {
        default: 'border-gray-300 border-t-gray-600',
        primary: 'border-blue-200 border-t-blue-600',
        secondary: 'border-purple-200 border-t-purple-600',
        success: 'border-green-200 border-t-green-600',
        warning: 'border-yellow-200 border-t-yellow-600',
        error: 'border-red-200 border-t-red-600'
    };
    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg'
    };
    return (_jsxs("div", { className: cn("flex flex-col items-center justify-center space-y-4", className), children: [_jsxs("div", { className: "relative loading-shine", children: [_jsx("div", { className: cn("animate-spin rounded-full border-2 border-transparent", "bg-gradient-to-r from-transparent via-transparent to-transparent", "before:absolute before:inset-0 before:rounded-full before:border-2 before:border-transparent", "before:bg-gradient-to-r before:from-current before:to-transparent", "before:animate-pulse", sizeClasses[size], variantClasses[variant], "animate-pulse-glow") }), _jsx("div", { className: cn("absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-white/5", "backdrop-blur-sm border border-white/10", "animate-pulse") }), _jsx("div", { className: cn("absolute inset-2 rounded-full bg-gradient-to-br from-white to-white/80", "animate-ping") }), _jsx("div", { className: "absolute inset-0 rounded-full animate-shimmer" })] }), text && (_jsxs("div", { className: "text-center space-y-2", children: [_jsx("p", { className: cn("font-medium text-gray-700 dark:text-gray-300", "animate-pulse", textSizeClasses[size]), children: text }), _jsxs("div", { className: "flex justify-center space-x-1", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce-soft", style: { animationDelay: '0ms' } }), _jsx("div", { className: "w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce-soft", style: { animationDelay: '150ms' } }), _jsx("div", { className: "w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce-soft", style: { animationDelay: '300ms' } })] })] })), showProgress && (_jsx("div", { className: "w-32 h-1 bg-gray-200 rounded-full overflow-hidden loading-shine", children: _jsx("div", { className: "h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out animate-gradient-shift", style: { width: `${Math.min(100, Math.max(0, progress))}%` } }) }))] }));
};
// Componente de loading para tela cheia
export const FullScreenLoading = ({ text = 'Carregando departamentos...', variant = 'primary', showProgress = false, progress = 0 }) => {
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center loading-particles", children: _jsxs("div", { className: "relative animate-fade-in-up", children: [_jsx("div", { className: "absolute inset-0 loading-glass rounded-3xl shadow-2xl animate-pulse-glow" }), _jsx("div", { className: "relative p-8 animate-scale-in", children: _jsx(LoadingSpinner, { size: "xl", variant: variant, text: text, showProgress: showProgress, progress: progress }) }), _jsx("div", { className: "absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-ping" }), _jsx("div", { className: "absolute -bottom-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping", style: { animationDelay: '1s' } }), _jsx("div", { className: "absolute inset-0 loading-wave rounded-3xl" })] }) }));
};
// Componente de loading para sidebar
export const SidebarLoading = ({ text = 'Carregando...', variant = 'primary' }) => {
    return (_jsx("div", { className: "flex flex-col items-center justify-center p-6 space-y-4", children: _jsx(LoadingSpinner, { size: "md", variant: variant, text: text }) }));
};
// Componente de loading para conteúdo
export const ContentLoading = ({ text = 'Carregando conteúdo...', variant = 'primary' }) => {
    return (_jsx("div", { className: "flex flex-col items-center justify-center p-12 space-y-6", children: _jsx(LoadingSpinner, { size: "lg", variant: variant, text: text }) }));
};
