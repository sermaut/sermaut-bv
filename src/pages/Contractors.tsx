import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Contractors() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contratados Parciais</h1>
          <p className="text-muted-foreground">Gerencie seus contratados e suas tarefas</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Cadastrar Contratado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratados</CardTitle>
          <CardDescription>Todos os contratados cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Lista de contratados em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
}
