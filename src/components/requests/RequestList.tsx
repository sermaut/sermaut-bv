import { useState } from 'react';
import { useRequests } from '@/hooks/useRequests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const serviceLabels = {
  accompaniment: 'Acompanhamento',
  arrangement_no_mod: 'Arranjos sem Mod.',
  arrangement_with_mod: 'Arranjos com Mod.',
  review: 'Revisão',
};

export function RequestList() {
  const { data: requests, isLoading } = useRequests();
  const [search, setSearch] = useState('');

  const filteredRequests = requests?.filter((req) =>
    req.name.toLowerCase().includes(search.toLowerCase()) ||
    req.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />
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

      {filteredRequests && filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma solicitação encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests?.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.name}</CardTitle>
                  <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                    {statusLabels[request.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <CardDescription>{request.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Serviço:</span> {serviceLabels[request.service_type as keyof typeof serviceLabels]}</p>
                  <p><span className="font-medium">Preço:</span> {request.price} Kz</p>
                  <p><span className="font-medium">Telefone:</span> {request.phone}</p>
                  {request.description && (
                    <p className="text-muted-foreground line-clamp-2">{request.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
