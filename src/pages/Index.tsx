import { useState, useEffect } from 'react';
import { Header } from '@/components/crm/Header';
import { Sidebar } from '@/components/crm/Sidebar';
import { MainContent } from '@/components/crm/MainContent';
import { ImagePasteModal } from '@/components/crm/ImagePasteModal';
import { AddTicketModal } from '@/components/crm/AddTicketModal';
import { sectors as initialSectors } from '@/data/sectors';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  // Estado para os setores (agora gerenciado localmente)
  const [sectors, setSectors] = useState(initialSectors);
  const [selectedSector, setSelectedSector] = useState(initialSectors[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return sessionStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isFullScreen, setIsFullScreen] = useState(() => {
    return sessionStorage.getItem('fullScreen') === 'true';
  });
  const [currentView, setCurrentView] = useState(() => {
    return sessionStorage.getItem('currentView') || 'conversas';
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return sessionStorage.getItem('soundEnabled') !== 'false';
  });
  const [isLoading, setIsLoading] = useState(false);

  // Função para atualizar os setores
  const handleSectorUpdate = (updatedSectors: typeof sectors) => {
    setSectors(updatedSectors);
    
    // Se o setor selecionado ainda existe, manter; senão, selecionar o primeiro
    const currentSectorExists = updatedSectors.find(s => s.id === selectedSector.id);
    if (!currentSectorExists && updatedSectors.length > 0) {
      setSelectedSector(updatedSectors[0]);
    }
    
    // Salvar no localStorage para persistir entre sessões
    localStorage.setItem('customSectors', JSON.stringify(updatedSectors));
  };

  // Carregar setores personalizados do localStorage na inicialização
  useEffect(() => {
    const savedSectors = localStorage.getItem('customSectors');
    if (savedSectors) {
      try {
        const parsedSectors = JSON.parse(savedSectors);
        setSectors(parsedSectors);
        
        // Verificar se o setor selecionado ainda existe
        const currentSectorExists = parsedSectors.find((s: any) => s.id === selectedSector.id);
        if (!currentSectorExists && parsedSectors.length > 0) {
          setSelectedSector(parsedSectors[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar setores personalizados:', error);
      }
    }
  }, []);

  // Handle image paste globally
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setPastedImage(event.target?.result as string);
                setShowImageModal(true);
              };
              reader.readAsDataURL(blob);
            }
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
        sessionStorage.setItem('fullScreen', 'false');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Save state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  useEffect(() => {
    sessionStorage.setItem('fullScreen', isFullScreen.toString());
  }, [isFullScreen]);

  useEffect(() => {
    sessionStorage.setItem('currentView', currentView);
  }, [currentView]);

  useEffect(() => {
    sessionStorage.setItem('soundEnabled', soundEnabled.toString());
  }, [soundEnabled]);

  const handleSectorChange = (sector: typeof sectors[0]) => {
    setIsLoading(true);
    setSelectedSector(sector);
    setCurrentView('conversas'); // Reset to default view
    
    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 500);

    if (soundEnabled) {
      // Play notification sound for sector change
      console.log('Playing sector change sound');
    }
  };

  const handleViewChange = (view: string) => {
    setIsLoading(true);
    setCurrentView(view);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const toggleSidebar = () => {
    console.log('toggleSidebar called! Current state:', sidebarCollapsed);
    setSidebarCollapsed(prev => {
      const newState = !prev;
      console.log('Setting sidebar to:', newState);
      return newState;
    });
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleNotificationSound = () => {
    if (soundEnabled) {
      // Play notification sound
      console.log('Playing notification sound');
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex h-screen overflow-hidden">
        <Header
          selectedSector={selectedSector}
          currentView={currentView}
          onViewChange={handleViewChange}
          isFullScreen={isFullScreen}
          onToggleFullScreen={toggleFullScreen}
          soundEnabled={soundEnabled}
          onToggleSound={setSoundEnabled}
          onOpenAddTicket={() => setShowAddTicketModal(true)}
        />
        
        <div className="flex flex-1 pt-16">
          <Sidebar
            sectors={sectors}
            selectedSector={selectedSector}
            onSectorChange={handleSectorChange}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            onSectorUpdate={handleSectorUpdate}
          />
          
          <MainContent
            selectedSector={selectedSector}
            currentView={currentView}
            onViewChange={handleViewChange}
            isLoading={isLoading}
            sidebarCollapsed={sidebarCollapsed}
            onOpenAddTicket={() => setShowAddTicketModal(true)}
          />
        </div>

        {showImageModal && (
          <ImagePasteModal
            image={pastedImage}
            onClose={() => {
              setShowImageModal(false);
              setPastedImage(null);
            }}
            onSend={(comment, isInternal) => {
              console.log('Sending image:', { comment, isInternal });
              toast({
                title: "Imagem enviada",
                description: isInternal ? "Anotação interna criada" : "Imagem enviada ao cliente",
              });
              setShowImageModal(false);
              setPastedImage(null);
            }}
          />
        )}

        {showAddTicketModal && (
          <AddTicketModal
            sector={selectedSector}
            onClose={() => setShowAddTicketModal(false)}
            onSave={(ticketData) => {
              console.log('Creating ticket:', ticketData);
              toast({
                title: "Ticket criado",
                description: "Novo ticket foi criado com sucesso",
              });
              setShowAddTicketModal(false);
              handleNotificationSound();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
