import { useState } from 'react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const actionLabels: Record<string, string> = {
  user_status_changed: 'Mudança de Status de Usuário',
  request_created: 'Solicitação Criada',
  request_status_changed: 'Status de Solicitação Alterado',
  request_deleted: 'Solicitação Eliminada',
};

const entityTypeLabels: Record<string, string> = {
  profile: 'Perfil',
  service_request: 'Solicitação',
  contractor: 'Contratado',
};

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs(page, 20);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Registos de Auditoria</h1>
        <p className="text-muted-foreground">Histórico completo de ações no sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.logs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entityTypeLabels[log.entity_type] || log.entity_type}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {log.details && (
                          <code className="text-xs bg-muted p-1 rounded">
                            {JSON.stringify(log.details, null, 2).slice(0, 100)}...
                          </code>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                        className={page === data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum registo encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}