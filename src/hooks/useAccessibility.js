import { useEffect, useRef, useCallback, useState } from 'react';
export const useAccessibility = ({ isOpen, onClose, announceChanges = true, enableFocusTrap = true, enableReducedMotion = true, }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [reducedMotion, setReducedMotion] = useState(false);
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);
    const focusableElementsRef = useRef([]);
    // Detectar preferência de movimento reduzido
    useEffect(() => {
        if (!enableReducedMotion)
            return;
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mediaQuery.matches);
        const handleChange = (e) => {
            setReducedMotion(e.matches);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [enableReducedMotion]);
    // Gerenciar elementos focáveis
    const updateFocusableElements = useCallback(() => {
        if (!modalRef.current)
            return;
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="link"]',
        ].join(', ');
        const elements = Array.from(modalRef.current.querySelectorAll(focusableSelectors));
        focusableElementsRef.current = elements.filter((element) => element.offsetParent !== null && // Visible
            !element.hasAttribute('aria-hidden') &&
            element.tabIndex !== -1);
    }, []);
    // Focus trap
    const handleKeyDown = useCallback((e) => {
        if (!enableFocusTrap || !isOpen)
            return;
        const focusableElements = focusableElementsRef.current;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                announceToScreenReader('Modal fechado');
                onClose();
                break;
            case 'Tab':
                if (focusableElements.length === 0) {
                    e.preventDefault();
                    return;
                }
                if (e.shiftKey) {
                    // Shift + Tab (backward)
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                }
                else {
                    // Tab (forward)
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
                break;
            case 'Home':
                if (e.ctrlKey) {
                    e.preventDefault();
                    firstElement?.focus();
                }
                break;
            case 'End':
                if (e.ctrlKey) {
                    e.preventDefault();
                    lastElement?.focus();
                }
                break;
        }
    }, [enableFocusTrap, isOpen, onClose]);
    // Gerenciar foco quando modal abre/fecha
    useEffect(() => {
        if (isOpen) {
            // Salvar elemento ativo atual
            previousActiveElement.current = document.activeElement;
            // Atualizar elementos focáveis
            setTimeout(() => {
                updateFocusableElements();
                // Focar no primeiro elemento ou no modal
                const firstFocusable = focusableElementsRef.current[0];
                if (firstFocusable) {
                    firstFocusable.focus();
                }
                else if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 100);
            // Adicionar listener de teclado
            document.addEventListener('keydown', handleKeyDown);
        }
        else {
            // Restaurar foco anterior
            if (previousActiveElement.current && 'focus' in previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
            // Remover listener
            document.removeEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown, updateFocusableElements]);
    // Função para anunciar para screen readers
    const announceToScreenReader = useCallback((message) => {
        if (!announceChanges)
            return;
        setAnnouncements(prev => [...prev, message]);
        // Remove announcement after it's been read
        setTimeout(() => {
            setAnnouncements(prev => prev.filter(msg => msg !== message));
        }, 1000);
    }, [announceChanges]);
    // Funções de utilidade para ARIA
    const getAriaProps = useCallback((type, props = {}) => {
        const baseProps = {
            modal: {
                role: 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': props.labelledBy,
                'aria-describedby': props.describedBy,
                tabIndex: -1,
            },
            button: {
                role: 'button',
                'aria-pressed': props.pressed,
                'aria-expanded': props.expanded,
                'aria-label': props.label,
                'aria-describedby': props.describedBy,
                tabIndex: props.disabled ? -1 : 0,
            },
            region: {
                role: 'region',
                'aria-labelledby': props.labelledBy,
                'aria-live': props.live || 'polite',
                'aria-atomic': props.atomic || 'true',
            },
            alert: {
                role: 'alert',
                'aria-live': 'assertive',
                'aria-atomic': 'true',
            },
        };
        return baseProps[type] || {};
    }, []);
    // Verificar se animações devem ser reduzidas
    const shouldReduceMotion = useCallback(() => {
        return reducedMotion;
    }, [reducedMotion]);
    // Criar ID único para elementos ARIA
    const createId = useCallback((prefix) => {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);
    return {
        // Refs
        modalRef,
        // Estado
        announcements,
        reducedMotion,
        // Funções
        announceToScreenReader,
        getAriaProps,
        shouldReduceMotion,
        createId,
        updateFocusableElements,
        // Dados dos elementos focáveis
        focusableElements: focusableElementsRef.current,
    };
};
