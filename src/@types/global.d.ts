declare global {
  interface Window {
    // Funções de debug Evolution API
    debugEvolutionAPI: () => Promise<void>;
    quickTestEvolution: () => Promise<boolean>;
    
    // Funções de teste de criação de instância
    testInstanceCreation: (departmentId?: string) => Promise<any>;
    testEvolutionApiConnectivity: () => Promise<any>;
    cleanupTestInstances: () => Promise<any>;
    
    // Outras funções existentes
    testSimpleChatWithTicket?: (ticketId: string) => Promise<void>;
    debugSimpleChat?: () => void;
    getAvailableTickets?: () => void;
    quickTestSimpleChat?: () => Promise<void>;
    testSocketConnection?: () => void;
    testWebSocketDirect?: () => void;
    debugSupabaseKeys?: () => void;
  }
}

export {}; 