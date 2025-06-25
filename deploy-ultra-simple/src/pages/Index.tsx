import { useState, useEffect } from 'react';
import { Header } from '@/components/crm/Header';
import { Sidebar } from '@/components/crm/Sidebar';
import { MainContent } from '@/components/crm/MainContent';
import { ImagePasteModal } from '@/components/crm/ImagePasteModal';
import { AddTicketModal } from '@/components/crm/AddTicketModal';
import { useDepartments, Department } from '@/hooks/useDepartments';
import { useTicketsDB } from '@/hooks/useTicketsDB';
import { toast } from '@/hooks/use-toast';
import '@/utils/consoleDiagnostic';

const Index = () => {
  // Usar hook de departamentos do banco de dados
  const { departments, loading: departmentsLoading, error: departmentsError, refreshDepartments } = useDepartments();
  
  // Hook para gerenciamento de tickets
  const { createTicket } = useTicketsDB();
  
  // Estado local para setor selecionado
  const [selectedSector, setSelectedSector] = useState<Department | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return sessionStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isFullScreen, setIsFullScreen] = useState(() => {
    return sessionStorage.getItem('fullScreen') === 'true';
  });
  const [currentView, setCurrentView] = useState(() => {
    return sessionStorage.getItem('currentView') || 'dashboard';
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return sessionStorage.getItem('soundEnabled') !== 'false';
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar setor selecionado quando os departamentos carregarem
  useEffect(() => {
    if (departments.length > 0 && !selectedSector) {
      // Tentar recuperar o último setor selecionado do sessionStorage
      const savedSectorId = sessionStorage.getItem('selectedSectorId');
      const savedSector = savedSectorId ? departments.find(d => d.id === savedSectorId) : null;
      
      // Se encontrou o setor salvo e está ativo, usar ele; senão, usar o primeiro ativo
      const activeDepartments = departments.filter(d => d.isActive);
      const sectorToSelect = (savedSector && savedSector.isActive) ? savedSector : activeDepartments[0];
      
      if (sectorToSelect) {
        setSelectedSector(sectorToSelect);
        sessionStorage.setItem('selectedSectorId', sectorToSelect.id);
      }
    }
  }, [departments, selectedSector]);

  // Salvar setor selecionado no sessionStorage quando mudar
  useEffect(() => {
    if (selectedSector) {
      sessionStorage.setItem('selectedSectorId', selectedSector.id);
    }
  }, [selectedSector]);

  // Mostrar erro se houver problemas ao carregar departamentos
  useEffect(() => {
    if (departmentsError) {
      toast({
        title: "Erro ao carregar departamentos",
        description: departmentsError.message,
        variant: "destructive",
      });
    }
  }, [departmentsError]);

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

  const handleSectorChange = (sector: Department) => {
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

  // Função para atualizar departamentos após modificações
  const handleDepartmentUpdate = async () => {
    await refreshDepartments();
  };

  // Se não há setor selecionado e não está carregando, mostrar loading
  if (departmentsLoading || (!selectedSector && departments.length > 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando departamentos...</p>
        </div>
      </div>
    );
  }

  // Se não há departamentos ativos, mostrar mensagem
  if (!departmentsLoading && departments.filter(d => d.isActive).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Nenhum departamento ativo encontrado.</p>
          <button 
            onClick={() => refreshDepartments()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

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
        
        <div className="flex flex-1 pt-[76px] md:pt-[76px] lg:pt-[120px]">
          <Sidebar
            sectors={departments.filter(d => d.isActive)}
            selectedSector={selectedSector}
            onSectorChange={handleSectorChange}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            onSectorUpdate={handleDepartmentUpdate}
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
            onClose={() => {
              setShowImageModal(false);
              setPastedImage(null);
            }}
            image={pastedImage}
            onSend={(comment: string, isInternal: boolean) => {
              console.log('Enviando imagem:', { comment, isInternal });
              toast({
                title: "🖼️ Imagem enviada",
                description: isInternal ? "Imagem salva como nota interna" : "Imagem enviada para o cliente",
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
            onSave={async (ticketData) => {
              try {
                const newTicketData = {
                  title: ticketData.subject,
                  description: ticketData.description,
                  subject: ticketData.subject, // Para compatibilidade
                  status: ticketData.status,
                  priority: ticketData.priority,
                  channel: ticketData.channel,
                  department_id: selectedSector?.id,
                  metadata: {
                    client_name: ticketData.client,
                    anonymous_contact: ticketData.email,
                    phone: ticketData.phone,
                    assignee: ticketData.assignee
                  }
                };

                await createTicket(newTicketData);
                
                toast({
                  title: "Ticket criado com sucesso!",
                  description: `Ticket "${ticketData.subject}" foi criado para o cliente ${ticketData.client}`,
                });
                
                setShowAddTicketModal(false);
              } catch (error) {
                console.error('Erro ao criar ticket:', error);
                toast({
                  title: "Erro ao criar ticket",
                  description: "Ocorreu um erro ao criar o ticket. Tente novamente.",
                  variant: "destructive",
                });
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
