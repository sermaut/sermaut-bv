import { NavLink } from 'react-router-dom';
import { Home, FileText, Users, BarChart3, Mail, Shield, History, ExternalLink } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsContractor } from '@/hooks/useIsContractor';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { isOpen, close } = useSidebar();
  const { isAdmin } = useUserRole();
  const { isContractor } = useIsContractor();

  const menuItems = [
    // SIGEG-BV link first
    { 
      title: 'Ir para SIGEG-BV', 
      url: 'https://sigeg-bv.lovable.app', 
      icon: ExternalLink, 
      external: true 
    },
    { title: 'Página Inicial', url: '/', icon: Home },
    { title: 'Solicitações', url: '/requests', icon: FileText },
    // Hide these from contractors
    ...(!isContractor ? [
      { title: 'Contratados', url: '/contractors', icon: Users },
      { title: 'Relatórios', url: '/reports', icon: BarChart3 },
    ] : []),
    { title: 'Contato', url: '/contact', icon: Mail },
    // Admin only
    ...(isAdmin && !isContractor ? [
      { title: 'Administração', url: '/admin', icon: Shield },
      { title: 'Auditoria', url: '/audit-logs', icon: History },
    ] : []),
  ];

  return (
    <aside
      className={cn(
        'bg-card border-r border-border transition-transform duration-300 flex flex-col z-50',
        // Mobile: fixed, slide from left
        'fixed inset-y-0 left-0 w-64 md:relative md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Melody Hub</h2>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.url}>
              {item.external ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </a>
              ) : (
                <NavLink
                  to={item.url}
                  end={item.url === '/'}
                  onClick={close}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
