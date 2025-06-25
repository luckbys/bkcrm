import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Settings, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useState } from 'react';

export const UserProfile = () => {
  const { signOut, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Pega as iniciais do usuário para o avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  // Pega o nome do usuário ou email
  const getUserName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuário';
  };

  const getUserEmail = () => {
    return user?.email || '';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="
            h-10 px-2 py-1 rounded-xl
            bg-white/60 hover:bg-white/80
            border border-gray-200/60 hover:border-gray-300/80
            shadow-sm hover:shadow-md
            backdrop-blur-sm
            transition-all duration-200 ease-out
            group
          "
        >
          <div className="flex items-center space-x-2">
            <Avatar className="h-7 w-7 ring-2 ring-white/80 shadow-sm">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="
                bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 
                text-white font-semibold text-xs
              ">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block text-left">
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                {getUserName()}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-all group-hover:rotate-180 duration-200" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="
          w-64 p-3
          bg-white/95 backdrop-blur-xl
          border border-gray-200/50
          shadow-2xl shadow-black/5
          rounded-2xl
          animate-in slide-in-from-top-2 duration-300
        "
      >
        <DropdownMenuLabel className="p-0 mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-blue-100 shadow-sm">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="
                bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 
                text-white font-semibold
              ">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {getUserName()}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getUserEmail()}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                <span className="text-xs text-gray-400 font-medium">Online</span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-gray-200/60 to-transparent h-px border-0" />
        
        <div className="space-y-1">
          <DropdownMenuItem className="
            flex items-center p-3 rounded-xl
            hover:bg-gray-50/80 hover:backdrop-blur-sm
            transition-all duration-200 ease-out
            cursor-pointer group
            focus:bg-gray-50/80
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
            border border-transparent hover:border-gray-200/50
          ">
            <div className="
              mr-3 p-2 rounded-lg
              bg-gray-100/50 group-hover:bg-blue-50/80
              transition-all duration-200
              group-hover:scale-105
            ">
              <User className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Minha Conta
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="
            flex items-center p-3 rounded-xl
            hover:bg-gray-50/80 hover:backdrop-blur-sm
            transition-all duration-200 ease-out
            cursor-pointer group
            focus:bg-gray-50/80
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
            border border-transparent hover:border-gray-200/50
          ">
            <div className="
              mr-3 p-2 rounded-lg
              bg-gray-100/50 group-hover:bg-amber-50/80
              transition-all duration-200
              group-hover:scale-105
            ">
              <Settings className="w-4 h-4 text-gray-500 group-hover:text-amber-600 transition-colors duration-200" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Configurações
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="
            flex items-center p-3 rounded-xl
            hover:bg-gray-50/80 hover:backdrop-blur-sm
            transition-all duration-200 ease-out
            cursor-pointer group
            focus:bg-gray-50/80
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
            border border-transparent hover:border-gray-200/50
          ">
            <div className="
              mr-3 p-2 rounded-lg
              bg-gray-100/50 group-hover:bg-emerald-50/80
              transition-all duration-200
              group-hover:scale-105
            ">
              <Shield className="w-4 h-4 text-gray-500 group-hover:text-emerald-600 transition-colors duration-200" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Privacidade
            </span>
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-gray-200/60 to-transparent h-px border-0" />
        
        <DropdownMenuItem 
          className="
            flex items-center p-3 rounded-xl
            hover:bg-red-50/80 hover:backdrop-blur-sm
            transition-all duration-200 ease-out
            cursor-pointer group
            focus:bg-red-50/80
            focus:outline-none focus:ring-2 focus:ring-red-500/20
            border border-transparent hover:border-red-200/50
          "
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <div className="
            mr-3 p-2 rounded-lg
            bg-gray-100/50 group-hover:bg-red-50/80
            transition-all duration-200
            group-hover:scale-105
          ">
            <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors duration-200" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-red-700 transition-colors">
            {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
