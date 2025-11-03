import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PendingApprovals } from '@/components/admin/PendingApprovals';
import { ContractorManagement } from '@/components/admin/ContractorManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { DepositValidation } from '@/components/admin/DepositValidation';
import { TaskManagement } from '@/components/tasks/TaskManagement';

export default function Admin() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Administração</h1>
        <p className="text-muted-foreground">Gerencie usuários, contratados e sistema</p>
      </div>

      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-4xl">
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="contractors">Contratados</TabsTrigger>
          <TabsTrigger value="deposits">Depósitos</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <PendingApprovals />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="contractors">
          <ContractorManagement />
        </TabsContent>

        <TabsContent value="deposits">
          <DepositValidation />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}