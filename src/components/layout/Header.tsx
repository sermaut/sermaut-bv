import { LogOut, Moon, Sun, User, Menu, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/contexts/SidebarContext';
import { useUserBalance } from '@/hooks/useUserBalance';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export function Header() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toggle } = useSidebar();
  const { data: balance, isLoading: balanceLoading } = useUserBalance();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold hidden sm:block">Melody Hub</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* User Balance */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
            <Wallet className="h-4 w-4 text-primary" />
            {balanceLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <span className="font-semibold text-primary">{balance?.toLocaleString('pt-AO')} Kz</span>
            )}
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled className="text-muted-foreground">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
