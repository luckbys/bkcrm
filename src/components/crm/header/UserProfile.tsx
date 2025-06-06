import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut } from 'lucide-react';
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 transition-colors">
          <Avatar className="h-8 w-8 ring-2 ring-gray-200">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden lg:inline">{getUserName()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
        <DropdownMenuItem className="hover:bg-gray-100 transition-colors cursor-pointer">
          <User className="w-4 h-4 mr-2" />
          Conta
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="hover:bg-gray-100 transition-colors cursor-pointer text-red-600"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggingOut ? 'Saindo...' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
