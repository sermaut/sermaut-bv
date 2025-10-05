import { useState } from 'react';
import { useUsers, useSuspendUser } from '@/hooks/useUserManagement';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { UserDetailsModal } from './UserDetailsModal';

export function UserManagement() {
  const { data: users, isLoading } = useUsers();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredUsers = (users?.filter(u => 
    u.account_status !== 'pending' && 
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
     u.phone?.includes(search))
  ) || []).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

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
            <TableHead className="text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow 
              key={user.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => {
                setSelectedUser(user);
                setModalOpen(true);
              }}
            >
              <TableCell className="font-medium">{user.full_name || 'Sem nome'}</TableCell>
              <TableCell className="text-right font-semibold">{user.balance?.toLocaleString('pt-AO')} Kz</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserDetailsModal
        user={selectedUser}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
