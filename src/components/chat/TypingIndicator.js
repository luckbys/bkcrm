import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Indicador de Digitacao em Tempo Real
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { MessageCircle, User, Users } from 'lucide-react';
export const TypingIndicator = ({ typingUsers, className, showAvatars = true, maxUsersShown = 3, animationType = 'dots' }) => {
    const [dotCount, setDotCount] = useState(1);
    useEffect(() => {
        if (typingUsers.length === 0)
            return;
        const interval = setInterval(() => {
            setDotCount(prev => (prev % 3) + 1);
        }, 500);
        return () => clearInterval(interval);
    }, [typingUsers.length]);
    if (typingUsers.length === 0)
        return null;
    const visibleUsers = typingUsers.slice(0, maxUsersShown);
    const hiddenCount = Math.max(0, typingUsers.length - maxUsersShown);
    const getUserInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };
    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${visibleUsers[0].name} está digitando`;
        }
        else if (typingUsers.length === 2) {
            return `${visibleUsers[0].name} e ${visibleUsers[1].name} estão digitando`;
        }
        else {
            const names = visibleUsers.map(u => u.name).join(', ');
            return hiddenCount > 0
                ? `${names} e mais ${hiddenCount} estão digitando`
                : `${names} estão digitando`;
        }
    };
    const AnimatedDots = () => (_jsx("div", { className: "flex gap-1 ml-2", children: [1, 2, 3].map(i => (_jsx("div", { className: cn('w-2 h-2 rounded-full transition-all duration-300', i <= dotCount ? 'bg-blue-500 scale-100' : 'bg-gray-300 scale-75') }, i))) }));
    const PulseAnimation = () => (_jsx("div", { className: "flex items-center ml-2", children: _jsxs("div", { className: "relative", children: [_jsx(MessageCircle, { className: "w-4 h-4 text-blue-500" }), _jsx("div", { className: "absolute inset-0 w-4 h-4 rounded-full bg-blue-500 opacity-20 animate-ping" })] }) }));
    const WaveAnimation = () => (_jsx("div", { className: "flex gap-1 ml-2", children: [0, 1, 2].map(i => (_jsx("div", { className: "w-1 h-4 bg-blue-500 rounded-full animate-pulse", style: {
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
            } }, i))) }));
    const getAnimation = () => {
        switch (animationType) {
            case 'pulse': return _jsx(PulseAnimation, {});
            case 'wave': return _jsx(WaveAnimation, {});
            default: return _jsx(AnimatedDots, {});
        }
    };
    return (_jsxs("div", { className: cn('flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg', 'transition-all duration-300 ease-in-out animate-slide-up', className), children: [showAvatars && (_jsxs("div", { className: "flex -space-x-2", children: [visibleUsers.map((user, index) => (_jsxs("div", { className: cn('relative w-6 h-6 rounded-full border-2 border-white shadow-sm', 'flex items-center justify-center text-xs font-medium', user.role === 'client'
                            ? 'bg-gradient-to-br from-green-400 to-green-500 text-white'
                            : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white'), style: { zIndex: maxUsersShown - index }, children: [user.avatar ? (_jsx("img", { src: user.avatar, alt: user.name, className: "w-full h-full rounded-full object-cover" })) : (getUserInitials(user.name)), _jsx("div", { className: "absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white animate-pulse" })] }, user.id))), hiddenCount > 0 && (_jsxs("div", { className: "relative w-6 h-6 rounded-full border-2 border-white shadow-sm bg-gray-400 flex items-center justify-center text-xs font-medium text-white", children: ["+", hiddenCount] }))] })), !showAvatars && (_jsx("div", { className: "flex items-center", children: typingUsers.length === 1 ? (_jsx(User, { className: "w-4 h-4 text-blue-500" })) : (_jsx(Users, { className: "w-4 h-4 text-blue-500" })) })), _jsx("span", { className: "text-sm text-blue-700 font-medium flex-1", children: getTypingText() }), getAnimation()] }));
};
// Hook para gerenciar estado de digitação
export const useTypingIndicator = () => {
    const [typingUsers, setTypingUsers] = useState([]);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const addTypingUser = (user) => {
        setTypingUsers(prev => {
            const exists = prev.some(u => u.id === user.id);
            if (exists)
                return prev;
            return [...prev, user];
        });
    };
    const removeTypingUser = (userId) => {
        setTypingUsers(prev => prev.filter(u => u.id !== userId));
    };
    const startTyping = (user, timeout = 3000) => {
        addTypingUser(user);
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        const newTimeout = setTimeout(() => {
            removeTypingUser(user.id);
        }, timeout);
        setTypingTimeout(newTimeout);
    };
    const stopTyping = (userId) => {
        removeTypingUser(userId);
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            setTypingTimeout(null);
        }
    };
    const clearAllTyping = () => {
        setTypingUsers([]);
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            setTypingTimeout(null);
        }
    };
    return {
        typingUsers,
        addTypingUser,
        removeTypingUser,
        startTyping,
        stopTyping,
        clearAllTyping,
        isTyping: typingUsers.length > 0
    };
};
