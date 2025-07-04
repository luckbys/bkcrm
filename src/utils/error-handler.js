// Sistema Global de Tratamento de Erros
// Este arquivo trata erros comuns e oferece fallbacks
export class GlobalErrorHandler {
    // Registrar erro
    static logError(error) {
        this.errors.unshift({
            ...error,
            timestamp: new Date()
        });
        // Manter apenas os últimos 100 erros
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }
        // Log no console para desenvolvimento
        console.group(`🚨 [${error.type.toUpperCase()}] ${error.component || 'Global'}`);
        console.error(error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        console.groupEnd();
        // Enviar para serviço de monitoramento se necessário
        this.sendToMonitoring(error);
    }
    // Tratar erros da Evolution API
    static handleEvolutionApiError(error, instanceName) {
        const errorInfo = {
            type: 'api',
            component: 'EvolutionAPI',
            message: error.message || 'Erro desconhecido',
            stack: error.stack,
            url: error.config?.url
        };
        if (error.response?.status === 404) {
            errorInfo.message = `Instância '${instanceName}' não encontrada na Evolution API`;
            this.logError(errorInfo);
            return 'Instância não encontrada. Verifique se foi criada corretamente.';
        }
        if (error.response?.status === 401) {
            errorInfo.message = 'API Key inválida para Evolution API';
            this.logError(errorInfo);
            return 'Credenciais inválidas. Verifique a configuração da API.';
        }
        if (error.response?.status >= 500) {
            errorInfo.message = 'Erro interno da Evolution API';
            this.logError(errorInfo);
            return 'Erro no servidor. Tente novamente em alguns minutos.';
        }
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
            errorInfo.message = 'Evolution API offline ou inacessível';
            this.logError(errorInfo);
            return 'API offline. Verifique a conectividade.';
        }
        this.logError(errorInfo);
        return 'Erro inesperado. Verifique o console para mais detalhes.';
    }
    // Tratar erros de importação
    static handleImportError(moduleName, fallback) {
        const errorInfo = {
            type: 'import',
            component: 'ModuleLoader',
            message: `Falha ao importar módulo: ${moduleName}`
        };
        this.logError(errorInfo);
        // Retornar fallback se disponível
        if (fallback) {
            console.warn(`⚠️ Usando fallback para ${moduleName}`);
            return fallback;
        }
        // Fallbacks padrão para componentes UI comuns
        if (moduleName.includes('button') || moduleName.includes('Button')) {
            return function ButtonFallback({ children, onClick, disabled, className, ...props }) {
                return React.createElement('button', {
                    onClick,
                    disabled,
                    className: `btn-fallback ${className || ''}`,
                    ...props
                }, children);
            };
        }
        if (moduleName.includes('input') || moduleName.includes('Input')) {
            return function InputFallback({ className, ...props }) {
                return React.createElement('input', {
                    className: `input-fallback ${className || ''}`,
                    ...props
                });
            };
        }
        if (moduleName.includes('card') || moduleName.includes('Card')) {
            return function CardFallback({ children, className, ...props }) {
                return React.createElement('div', {
                    className: `card-fallback ${className || ''}`,
                    ...props
                }, children);
            };
        }
        if (moduleName.includes('badge') || moduleName.includes('Badge')) {
            return function BadgeFallback({ children, variant, className, ...props }) {
                const variantClass = variant ? `badge-${variant}` : 'badge-info';
                return React.createElement('span', {
                    className: `badge-fallback ${variantClass} ${className || ''}`,
                    ...props
                }, children);
            };
        }
        // Fallback genérico
        return function GenericFallback({ children, ...props }) {
            return React.createElement('div', {
                ...props,
                style: { border: '1px dashed #f59e0b', padding: '8px', borderRadius: '4px' }
            }, [
                React.createElement('small', {
                    key: 'warning',
                    style: { color: '#f59e0b' }
                }, 'Componente não disponível'),
                children
            ]);
        };
    }
    // Tratar erros de CSS
    static handleCssError(selector, fallback) {
        const errorInfo = {
            type: 'css',
            component: 'StyleLoader',
            message: `Erro de CSS no seletor: ${selector}`
        };
        this.logError(errorInfo);
        if (fallback) {
            // Aplicar CSS de fallback
            const style = document.createElement('style');
            style.textContent = fallback;
            document.head.appendChild(style);
        }
    }
    // Tratar erros de rede
    static handleNetworkError(url, error) {
        const errorInfo = {
            type: 'network',
            component: 'NetworkRequest',
            message: `Erro de rede: ${url}`,
            url: url
        };
        this.logError(errorInfo);
        if (error.code === 'ECONNREFUSED') {
            return 'Serviço indisponível. Verifique sua conexão.';
        }
        if (error.code === 'ETIMEDOUT') {
            return 'Timeout na requisição. Tente novamente.';
        }
        return 'Erro de rede. Verifique sua conectividade.';
    }
    // Obter relatório de erros
    static getErrorReport() {
        const byType = this.errors.reduce((acc, error) => {
            acc[error.type] = (acc[error.type] || 0) + 1;
            return acc;
        }, {});
        return {
            total: this.errors.length,
            byType,
            recent: this.errors.slice(0, 10)
        };
    }
    // Limpar erros
    static clearErrors() {
        this.errors = [];
        console.log('🧹 Log de erros limpo');
    }
    // Enviar para serviço de monitoramento (placeholder)
    static sendToMonitoring(error) {
        // Em produção, aqui você enviaria para Sentry, LogRocket, etc.
        if (import.meta.env.PROD) {
            // Implementar envio para serviço de monitoramento
        }
    }
    // Verificar saúde do sistema
    static getSystemHealth() {
        const recentErrors = this.errors.filter(error => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000 // últimos 5 minutos
        );
        const issues = [];
        const suggestions = [];
        if (recentErrors.length > 10) {
            issues.push('Muitos erros recentes');
            suggestions.push('Verifique conectividade e configurações');
        }
        const apiErrors = recentErrors.filter(e => e.type === 'api').length;
        if (apiErrors > 5) {
            issues.push('Problemas com APIs externas');
            suggestions.push('Verifique status da Evolution API');
        }
        const importErrors = recentErrors.filter(e => e.type === 'import').length;
        if (importErrors > 3) {
            issues.push('Problemas de importação de módulos');
            suggestions.push('Verifique dependências e build');
        }
        let status = 'healthy';
        if (issues.length > 0) {
            status = issues.length > 2 ? 'unhealthy' : 'degraded';
        }
        return { status, issues, suggestions };
    }
}
Object.defineProperty(GlobalErrorHandler, "errors", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: []
});
Object.defineProperty(GlobalErrorHandler, "maxErrors", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 100
});
// Configurar handler global para erros não capturados
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        GlobalErrorHandler.logError({
            type: 'runtime',
            message: event.message,
            stack: event.error?.stack,
            url: event.filename
        });
    });
    window.addEventListener('unhandledrejection', (event) => {
        GlobalErrorHandler.logError({
            type: 'runtime',
            message: `Promise rejeitada: ${event.reason}`,
            stack: event.reason?.stack
        });
    });
}
// Funções globais para debug
globalThis.getErrorReport = () => GlobalErrorHandler.getErrorReport();
globalThis.clearErrors = () => GlobalErrorHandler.clearErrors();
globalThis.getSystemHealth = () => GlobalErrorHandler.getSystemHealth();
export default GlobalErrorHandler;
