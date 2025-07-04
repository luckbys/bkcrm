import { cva } from 'class-variance-authority';
// Container principal do sidebar - design minimalista e moderno
const container = cva([
    'fixed left-6',
    'top-[calc(50vh+38px)] -translate-y-1/2',
    'flex flex-col',
    'bg-white/90 dark:bg-gray-900/90',
    'border border-gray-200/50 dark:border-gray-700/50',
    'transition-all duration-300 ease-out',
    'backdrop-blur-xl backdrop-saturate-150',
    'shadow-xl shadow-black/5 dark:shadow-black/20',
    'rounded-2xl',
    'z-40',
    'max-h-[calc(100vh-100px)]',
    'overflow-hidden',
    'hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30'
], {
    variants: {
        collapsed: {
            true: 'w-14',
            false: 'w-64'
        },
        active: {
            true: 'border-blue-400/60 dark:border-blue-500/60',
            false: ''
        }
    },
    defaultVariants: {
        collapsed: false,
        active: false
    }
});
// Header do sidebar com informações principais
const header = cva([
    'flex items-center gap-2 p-3',
    'border-b border-gray-200/30 dark:border-gray-700/30',
    'bg-gradient-to-r from-gray-50/30 to-white/30 dark:bg-gradient-to-r dark:from-gray-800/30 dark:to-gray-900/30',
    'rounded-t-2xl'
], {
    variants: {
        collapsed: {
            true: 'justify-center flex-col gap-2',
            false: 'justify-between'
        }
    }
});
// Área de busca e filtros
const searchArea = cva([
    'p-3 space-y-2',
    'border-b border-gray-200/30 dark:border-gray-700/30',
    'bg-gray-50/20 dark:bg-gray-800/20'
], {
    variants: {
        collapsed: {
            true: 'hidden',
            false: 'block'
        }
    }
});
// Card do departamento
const departmentCard = cva([
    'group relative flex items-center p-3 rounded-xl',
    'transition-all duration-200 ease-out',
    'cursor-pointer',
    'hover:bg-gray-50 dark:hover:bg-gray-800/50',
    'hover:shadow-md hover:scale-[1.02]',
    'active:scale-[0.98]'
], {
    variants: {
        collapsed: {
            true: 'justify-center p-2 w-10 h-10 mx-auto mb-2',
            false: 'gap-3 mx-1 mb-1'
        },
        active: {
            true: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-md',
            false: ''
        }
    }
});
// Ícone do departamento com cores contextuais
const departmentIcon = cva([
    'w-8 h-8 rounded-lg flex items-center justify-center',
    'transition-all duration-200',
    'group-hover:scale-110'
], {
    variants: {
        type: {
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
            gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
        }
    },
    defaultVariants: {
        type: 'blue'
    }
});
// Badge de contagem com variantes
const countBadge = cva([
    'absolute -top-1 -right-1',
    'min-w-[18px] h-[18px] px-1',
    'rounded-full border-2 border-white dark:border-gray-900',
    'text-[10px] font-bold text-white',
    'flex items-center justify-center',
    'transition-all duration-200',
    'animate-pulse'
], {
    variants: {
        variant: {
            primary: 'bg-blue-500',
            danger: 'bg-red-500',
            warning: 'bg-yellow-500',
            success: 'bg-green-500'
        }
    },
    defaultVariants: {
        variant: 'primary'
    }
});
// Estados de loading
const loadingState = cva([
    'flex flex-col items-center justify-center p-6 text-gray-500 dark:text-gray-400'
]);
// Estados de erro
const errorState = cva([
    'flex flex-col items-center justify-center p-6 text-red-500 dark:text-red-400 text-center'
]);
export const styles = {
    container,
    header,
    searchArea,
    departmentCard,
    departmentIcon,
    countBadge,
    loadingState,
    errorState
};
