import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Requests() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Solicitações</h1>
        <p className="text-muted-foreground">Gerencie suas solicitações de serviços</p>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="new">Solicitar Serviços</TabsTrigger>
          <TabsTrigger value="list">Solicitações Feitas</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Nova Solicitação</CardTitle>
              <CardDescription>Preencha os dados para solicitar um serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Formulário de solicitação em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Solicitações</CardTitle>
              <CardDescription>Acompanhe o status das suas solicitações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Lista de solicitações em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
