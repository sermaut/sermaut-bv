import { useState } from 'react';
import { useUsers, useSuspendUser } from '@/hooks/useUserManagement';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Ban, Plus, Search } from 'lucide-react';
import { AddBalanceDialog } from './AddBalanceDialog';
import { format } from 'date-fns';

export function UserManagement() {
  const { data: users, isLoading } = useUsers();
  const suspendUser = useSuspendUser();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredUsers = users?.filter(u => 
    u.account_status !== 'pending' && 
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
     u.phone?.includes(search))
  ) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className: string }> = {
      approved: { variant: 'default', label: 'Aprovado', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      rejected: { variant: 'destructive', label: 'Rejeitado', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
      suspended: { variant: 'outline', label: 'Suspenso', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
    };
    
    const config = variants[status] || variants.approved;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name || 'Sem nome'}</TableCell>
              <TableCell>{user.phone || 'N/A'}</TableCell>
              <TableCell className="font-semibold">{user.balance?.toLocaleString('pt-AO')} Kz</TableCell>
              <TableCell>{getStatusBadge(user.account_status)}</TableCell>
              <TableCell>{format(new Date(user.created_at), 'dd/MM/yyyy')}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Saldo
                </Button>
                {user.account_status !== 'suspended' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => suspendUser.mutate(user.id)}
                    disabled={suspendUser.isPending}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Suspender
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUserId && (
        <AddBalanceDialog
          userId={selectedUserId}
          open={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
