import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise e exportação de dados</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>Visão geral das receitas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Gráficos em desenvolvimento...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Estatísticas de performance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Gráficos em desenvolvimento...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
