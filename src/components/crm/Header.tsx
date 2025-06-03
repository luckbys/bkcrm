
import { MainMenu } from './header/MainMenu';
import { SectorTitle } from './header/SectorTitle';
import { SectorActions } from './header/SectorActions';
import { ActionButtons } from './header/ActionButtons';
import { NotificationsDropdown } from './header/NotificationsDropdown';
import { UserProfile } from './header/UserProfile';

interface HeaderProps {
  selectedSector: any;
  currentView: string;
  onViewChange: (view: string) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenAddTicket: () => void;
}

export const Header = ({ 
  selectedSector, 
  currentView, 
  onViewChange, 
  isFullScreen, 
  onToggleFullScreen,
  soundEnabled,
  onToggleSound,
  onOpenAddTicket 
}: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Side */}
        <div className="flex items-center space-x-3">
          <MainMenu />
          <SectorTitle selectedSector={selectedSector} />
          <SectorActions currentView={currentView} onViewChange={onViewChange} />
        </div>

        {/* Center - Company Logo */}
        <div className="flex-1 flex justify-center">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CRM Sistema
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2">
          <ActionButtons
            selectedSector={selectedSector}
            isFullScreen={isFullScreen}
            onToggleFullScreen={onToggleFullScreen}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            onOpenAddTicket={onOpenAddTicket}
          />
          <NotificationsDropdown />
          <UserProfile />
        </div>
      </div>
    </header>
  );
};
