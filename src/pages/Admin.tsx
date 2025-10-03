import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PendingApprovals } from '@/components/admin/PendingApprovals';
import { UserManagement } from '@/components/admin/UserManagement';
import { ContractorManagement } from '@/components/admin/ContractorManagement';
import { Users, UserCheck, Briefcase } from 'lucide-react';

export default function Admin() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie usuários, aprovações e contratados</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Cadastros Pendentes
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gerenciar Usuários
          </TabsTrigger>
          <TabsTrigger value="contractors" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Gerenciar Contratados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Cadastros Pendentes</CardTitle>
              <CardDescription>
                Aprove ou rejeite usuários que aguardam confirmação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingApprovals />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Visualize, edite, suspenda ou adicione saldo aos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contractors">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Contratados</CardTitle>
              <CardDescription>
                Adicione e gerencie contratados do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractorManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
