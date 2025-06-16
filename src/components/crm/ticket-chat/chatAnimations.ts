// Configurações de animações minimalistas e fluidas para o chat
export const ChatAnimations = {
  // Durações em millisegundos (reduzidas para fluidez)
  duration: {
    instant: 150,     // Para mudanças instantâneas
    fast: 200,        // Para micro-interações
    normal: 300,      // Para transições normais
    slow: 500,        // Para animações maiores
  },

  // Easing functions para movimento natural
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',      // Para saídas suaves
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',          // Para entradas
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',     // Para transições
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Para efeitos lúdicos
  },

  // Classes de transição consistentes
  transition: {
    // Transições básicas
    base: 'transition-all duration-200 ease-out',
    fast: 'transition-all duration-150 ease-out',
    smooth: 'transition-all duration-300 ease-in-out',
    
    // Transformações específicas
    scale: 'transition-transform duration-200 ease-out',
    opacity: 'transition-opacity duration-150 ease-out',
    colors: 'transition-colors duration-200 ease-out',
    
    // Estados hover minimalistas
    hover: 'transition-all duration-200 ease-out hover:scale-[1.02]',
    hoverSubtle: 'transition-all duration-150 ease-out hover:opacity-80',
    hoverGlow: 'transition-all duration-200 ease-out hover:shadow-md',
  },

  // Animações de entrada/saída
  enter: {
    fade: 'animate-in fade-in duration-200',
    slide: 'animate-in slide-in-from-bottom-2 fade-in duration-300',
    scale: 'animate-in zoom-in-95 fade-in duration-200',
    slideRight: 'animate-in slide-in-from-right-4 fade-in duration-300',
  },

  exit: {
    fade: 'animate-out fade-out duration-150',
    slide: 'animate-out slide-out-to-bottom-2 fade-out duration-200',
    scale: 'animate-out zoom-out-95 fade-out duration-150',
    slideLeft: 'animate-out slide-out-to-left-4 fade-out duration-200',
  },

  // Estados de loading minimalistas
  loading: {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
    ping: 'animate-ping opacity-75',
    breathe: 'animate-pulse duration-2000', // Respiração lenta
  },

  // Indicadores visuais sutis
  indicators: {
    typing: 'animate-pulse duration-1000',
    online: 'animate-pulse duration-2000 text-green-500',
    offline: 'opacity-50',
    newMessage: 'animate-bounce duration-1000',
  },

  // Hover states minimalistas
  interactive: {
    button: 'transition-all duration-200 ease-out hover:scale-105 active:scale-95',
    card: 'transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.01]',
    icon: 'transition-all duration-150 ease-out hover:opacity-70',
    badge: 'transition-all duration-200 ease-out hover:scale-110',
  },

  // Animações específicas do chat
  chat: {
    messageEnter: 'animate-in slide-in-from-bottom-1 fade-in duration-200',
    messageHover: 'transition-all duration-150 ease-out hover:bg-gray-50',
    sidebarToggle: 'transition-all duration-300 ease-in-out',
    inputFocus: 'transition-all duration-200 ease-out focus:scale-[1.01]',
    headerScroll: 'transition-all duration-300 ease-out',
  },

  // Estados especiais
  states: {
    error: 'animate-pulse text-red-500',
    success: 'animate-in zoom-in-95 fade-in text-green-500 duration-200',
    warning: 'animate-pulse text-amber-500',
    info: 'animate-in slide-in-from-top-1 fade-in text-blue-500 duration-200',
  },
};

// Funções utilitárias para animações
export const createAnimationClass = (
  base: string,
  hover?: string,
  active?: string
): string => {
  const classes = [base];
  if (hover) classes.push(hover);
  if (active) classes.push(active);
  return classes.join(' ');
};

export const getTransition = (type: keyof typeof ChatAnimations.transition): string => {
  return ChatAnimations.transition[type];
};

export const getChatAnimation = (type: keyof typeof ChatAnimations.chat): string => {
  return ChatAnimations.chat[type];
};

// Configurações responsivas
export const ResponsiveAnimations = {
  mobile: {
    reducedMotion: 'duration-150', // Animações mais rápidas no mobile
    simplifiedTransitions: 'transition-opacity duration-200',
  },
  
  desktop: {
    fullAnimations: true,
    smoothScrolling: 'scroll-smooth',
  },

  // Para usuários que preferem movimento reduzido
  prefersReducedMotion: {
    disable: 'motion-reduce:transition-none motion-reduce:animate-none',
    minimal: 'motion-reduce:duration-150',
  },
}; 