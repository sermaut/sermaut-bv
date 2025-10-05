import { useState } from 'react';
import { useContractors } from '@/hooks/useContractors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContractorDetailsModal } from './ContractorDetailsModal';

export function ContractorList() {
  const { data: contractors, isLoading } = useContractors();
  const [search, setSearch] = useState('');
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredContractors = contractors?.filter((contractor) =>
    contractor.name.toLowerCase().includes(search.toLowerCase()) ||
    contractor.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredContractors && filteredContractors.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhum contratado encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContractors?.map((contractor) => {
            const initials = contractor.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card 
                key={contractor.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedContractor(contractor);
                  setModalOpen(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{contractor.name}</CardTitle>
                      <CardDescription className="truncate">{contractor.email}</CardDescription>
                    </div>
                    <Badge variant={contractor.status === 'active' ? 'default' : 'secondary'}>
                      {contractor.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Telefone:</span> {contractor.phone}</p>
                    <p><span className="font-medium">Saldo:</span> <span className="text-lg font-bold text-primary">{contractor.balance} Kz</span></p>
                    {contractor.address && (
                      <p className="text-muted-foreground line-clamp-2">{contractor.address}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ContractorDetailsModal
        contractor={selectedContractor}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
