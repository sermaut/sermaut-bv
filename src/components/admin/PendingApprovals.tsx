import { useUsers, useApproveUser, useRejectUser } from '@/hooks/useUserManagement';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function PendingApprovals() {
  const { data: users, isLoading } = useUsers();
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();

  const pendingUsers = users?.filter(u => u.account_status === 'pending') || [];

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Nenhum cadastro pendente no momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Data de Cadastro</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name || 'Sem nome'}</TableCell>
              <TableCell>{user.phone || 'N/A'}</TableCell>
              <TableCell>{format(new Date(user.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                  Pendente
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => approveUser.mutate(user.id)}
                  disabled={approveUser.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => rejectUser.mutate(user.id)}
                  disabled={rejectUser.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
