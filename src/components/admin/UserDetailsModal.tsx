import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, Plus, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { AddBalanceDialog } from './AddBalanceDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useSuspendUser } from '@/hooks/useUserManagement';

interface UserDetailsModalProps {
  user: any;
  open: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ user, open, onClose }: UserDetailsModalProps) {
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const queryClient = useQueryClient();
  const suspendUser = useSuspendUser();

  if (!user) return null;

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja eliminar este usuário?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário eliminado com sucesso',
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao eliminar usuário',
        variant: 'destructive',
      });
    }
  };

  const handleSuspend = async () => {
    try {
      await suspendUser.mutateAsync(user.id);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      approved: { label: 'Aprovado', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      rejected: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
      suspended: { label: 'Suspenso', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
    };
    
    const config = variants[status] || variants.approved;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <>
      <Dialog open={open && !showBalanceDialog} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-bold">{user.full_name || 'Sem nome'}</h3>
                {getStatusBadge(user.account_status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{user.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="text-2xl font-bold">{user.balance?.toLocaleString('pt-AO')} Kz</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Data de Cadastro</p>
              <p className="font-medium">{format(new Date(user.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>

            <div className="flex gap-2 flex-wrap pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowBalanceDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Saldo
              </Button>
              
              {user.account_status !== 'suspended' && (
                <Button
                  variant="outline"
                  onClick={handleSuspend}
                  disabled={suspendUser.isPending}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspender
                </Button>
              )}

              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showBalanceDialog && (
        <AddBalanceDialog
          userId={user.id}
          open={showBalanceDialog}
          onClose={() => {
            setShowBalanceDialog(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
