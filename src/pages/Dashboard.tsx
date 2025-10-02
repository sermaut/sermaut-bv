import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Users, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total de Solicitações',
      value: '24',
      icon: FileText,
      badge: '+3 novas',
      color: 'text-primary',
    },
    {
      title: 'Solicitações Concluídas',
      value: '18',
      icon: CheckCircle,
      badge: '75%',
      color: 'text-success',
    },
    {
      title: 'Contratados Ativos',
      value: '8',
      icon: Users,
      badge: 'Ativos',
      color: 'text-secondary',
    },
    {
      title: 'Receita Total',
      value: '12.500 Kz',
      icon: TrendingUp,
      badge: '+12%',
      color: 'text-accent',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Página Inicial</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.badge}</p>
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
          <p className="text-muted-foreground">Em breve: lista de solicitações recentes</p>
        </CardContent>
      </Card>
    </div>
  );
}
