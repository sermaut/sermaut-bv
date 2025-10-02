import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { useRequests } from '@/hooks/useRequests';
import { useContractors } from '@/hooks/useContractors';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: requests, isLoading: loadingRequests } = useRequests();
  const { data: contractors, isLoading: loadingContractors } = useContractors();

  const totalRequests = requests?.length || 0;
  const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
  const activeContractors = contractors?.filter(c => c.status === 'active').length || 0;
  const totalRevenue = requests?.filter(r => r.status === 'completed').reduce((sum, r) => sum + Number(r.price), 0) || 0;
  const completionRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

  const stats = [
    {
      title: 'Total de Solicitações',
      value: totalRequests.toString(),
      icon: FileText,
      badge: `${requests?.filter(r => r.status === 'pending').length || 0} pendentes`,
      color: 'text-primary',
    },
    {
      title: 'Solicitações Concluídas',
      value: completedRequests.toString(),
      icon: CheckCircle,
      badge: `${completionRate}%`,
      color: 'text-green-500',
    },
    {
      title: 'Contratados Ativos',
      value: activeContractors.toString(),
      icon: Users,
      badge: 'Ativos',
      color: 'text-blue-500',
    },
    {
      title: 'Receita Total',
      value: `${totalRevenue.toLocaleString()} Kz`,
      icon: TrendingUp,
      badge: 'Concluídas',
      color: 'text-purple-500',
    },
  ];

  const isLoading = loadingRequests || loadingContractors;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Página Inicial</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.badge}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{request.price} Kz</p>
                    <p className="text-xs text-muted-foreground capitalize">{request.status.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhuma solicitação ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
