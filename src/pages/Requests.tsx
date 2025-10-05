import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RequestForm } from '@/components/requests/RequestForm';
import { RequestList } from '@/components/requests/RequestList';
import { DepositTab } from '@/components/requests/DepositTab';

export default function Requests() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Solicitações</h1>
        <p className="text-muted-foreground">Gerencie suas solicitações de serviços</p>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="new">Solicitar Serviços</TabsTrigger>
          <TabsTrigger value="list">Solicitações Feitas</TabsTrigger>
          <TabsTrigger value="deposit">Fazer Depósito</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Nova Solicitação</CardTitle>
              <CardDescription>Preencha os dados para solicitar um serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <RequestForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <RequestList />
        </TabsContent>

        <TabsContent value="deposit">
          <DepositTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
