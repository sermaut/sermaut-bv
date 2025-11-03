import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useMarkNotificationAsRead, useUnreadCount } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationCenter() {
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkNotificationAsRead();

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) {
      markAsRead.mutate(id);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs flex items-center justify-center text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notif.read ? 'bg-muted/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif.id, notif.read)}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-medium text-sm">{notif.title}</h4>
                    {!notif.read && (
                      <Badge variant="default" className="h-5 text-xs">Novo</Badge>
                    )}
                  </div>
                  {notif.description && (
                    <p className="text-sm text-muted-foreground mb-2">{notif.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notif.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}