import { MainMenu } from './header/MainMenu';
import { SectorTitle } from './header/SectorTitle';
import { SectorActions } from './header/SectorActions';
import { ActionButtons } from './header/ActionButtons';
import { NotificationsDropdown } from './notifications/NotificationsDropdown';
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-100/70">
      {/* Premium gradient background with subtle noise texture */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/30 via-white/50 to-blue-50/20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />
      
      <div className="relative">
        {/* Main header content */}
        <div className="flex items-center justify-between h-[76px] px-4 lg:px-8 xl:px-12">
          
          {/* Left Section - Brand + Navigation */}
          <div className="flex items-center space-x-8 flex-1 min-w-0">
            {/* Brand Logo - Always visible */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center transition-all duration-300 group-hover:shadow-blue-500/40 group-hover:scale-105">
                  <div className="w-5 h-5 bg-white rounded-md opacity-95" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full shadow-sm animate-pulse" />
              </div>
              
              <div className="hidden sm:block">
                <span className="text-2xl font-light tracking-[-0.02em] text-gray-900">
                  CRM
                </span>
                <span className="text-2xl font-normal tracking-[-0.02em] text-gray-600 ml-1">
                  Sistema
                </span>
              </div>
            </div>

            {/* Primary Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-200/60 to-transparent" />
              <SectorActions currentView={currentView} onViewChange={onViewChange} />
            </div>
          </div>

          {/* Right Section - Actions + User */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Quick Actions - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              <ActionButtons
                selectedSector={selectedSector}
                isFullScreen={isFullScreen}
                onToggleFullScreen={onToggleFullScreen}
                soundEnabled={soundEnabled}
                onToggleSound={onToggleSound}
                onOpenAddTicket={onOpenAddTicket}
                variant="compact"
              />
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-gray-200/60 to-transparent" />
              
              <div className="flex items-center space-x-2">
                <NotificationsDropdown />
                <UserProfile />
              </div>
            </div>

            {/* Mobile Menu - Only on small screens */}
            <div className="md:hidden">
              <MainMenu onNavigate={onViewChange} />
            </div>
          </div>
        </div>

        {/* Secondary Navigation Bar - For mobile */}
        <div className="md:hidden border-t border-gray-100/60 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <SectorTitle selectedSector={selectedSector} variant="compact" />
            
            <div className="flex items-center space-x-2">
              <ActionButtons
                selectedSector={selectedSector}
                isFullScreen={isFullScreen}
                onToggleFullScreen={onToggleFullScreen}
                soundEnabled={soundEnabled}
                onToggleSound={onToggleSound}
                onOpenAddTicket={onOpenAddTicket}
                variant="mobile"
              />
            </div>
          </div>
          
          {/* Mobile Navigation Pills */}
          <div className="px-4 pb-3">
            <SectorActions currentView={currentView} onViewChange={onViewChange} />
          </div>
        </div>


      </div>
      
      {/* Enhanced bottom border with gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent" />
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-200/40 to-transparent" />
    </header>
  );
};
