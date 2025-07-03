import { useState, useEffect } from 'react';
import { Header } from '@/components/crm/Header';
import { Sidebar } from '@/components/crm/Sidebar';
import { MainContent } from '@/components/crm/MainContent';
import { ImagePasteModal } from '@/components/crm/ImagePasteModal';
import { AddTicketModal } from '@/components/crm/AddTicketModal';
import { useDepartments, Department } from '@/hooks/useDepartments';
import { useTicketsDB } from '@/hooks/useTicketsDB';
import { toast } from '@/hooks/use-toast';
import { FullScreenLoading } from '@/components/ui/loading-spinner';
import { useDepartmentsLoading } from '@/hooks/useLoadingProgress';
import '@/utils/consoleDiagnostic';
import { cn } from '@/lib/utils';

const Index = () => {
  // Usar hook de departamentos do banco de dados
  const { 
    departments, 
    loading: departmentsLoading, 
    error: departmentsError, 
    refresh: refreshDepartments 
  } = useDepartments();
  
  // Hook para gerenciamento de tickets
  const { createTicket } = useTicketsDB();
  
  // Hook para loading progressivo de departamentos
  const { progress, isLoading: departmentsProgressLoading, startLoading: startDepartmentsLoading } = useDepartmentsLoading();
  
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
      
      // Se encontrou o setor salvo, usar ele; senão, usar o primeiro
      const sectorToSelect = savedSector || departments[0];
      
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
        description: departmentsError,
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

  // Iniciar loading progressivo quando departamentos estão carregando
  useEffect(() => {
    if (departmentsLoading && !departmentsProgressLoading) {
      startDepartmentsLoading();
    }
  }, [departmentsLoading, departmentsProgressLoading, startDepartmentsLoading]);

  const handleSectorChange = (sector: Department) => {
    console.log('🏢 [Index] handleSectorChange chamado com:', sector)
    
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
  const handleSectorReorder = async (reorderedSectors: Department[]) => {
    // Atualiza o estado local imediatamente para uma UX responsiva
    try {
      // Como não temos reorderDepartments, vamos apenas refreshar
      await refreshDepartments();
      toast({
        title: "Departamentos atualizados",
        description: "Os departamentos foram atualizados com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar departamentos:", error);
      toast({
        title: "Erro ao atualizar departamentos",
        description: error instanceof Error ? error.message : "Erro desconhecido ao atualizar.",
        variant: "destructive",
      });
    }
  };

  // Se não há setor selecionado e não está carregando, mostrar loading
  if (departmentsLoading || (!selectedSector && departments.length > 0)) {
    return (
      <FullScreenLoading 
        text="Carregando departamentos..."
        variant="primary"
        showProgress={true}
        progress={departmentsProgressLoading ? progress : (departmentsLoading ? 75 : 90)}
      />
    );
  }

  // Se não há departamentos, mostrar mensagem
  if (!departmentsLoading && departments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Nenhum departamento encontrado.</p>
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
    <div className={cn(
      "min-h-screen bg-gray-50 flex flex-col",
      isFullScreen && "fixed inset-0 z-50"
    )}>
        <Header
          selectedSector={selectedSector}
          currentView={currentView}
          onViewChange={handleViewChange}
          isFullScreen={isFullScreen}
          onToggleFullScreen={toggleFullScreen}
          soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenAddTicket={() => setShowAddTicketModal(true)}
        />
        
      <div className="flex-1 flex pt-36 md:pt-20">
          <Sidebar
            onDepartmentSelect={handleSectorChange}
            selectedDepartmentId={selectedSector?.id}
            className=""
            onCollapsedChange={setSidebarCollapsed}
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
  );
};

export default Index;
