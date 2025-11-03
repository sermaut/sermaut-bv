import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export function DepositValidation() {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: deposits, isLoading } = useQuery({
    queryKey: ['unverified-deposits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_transactions')
        .select('*, profiles(full_name)')
        .eq('type', 'deposit')
        .is('verified_at', null)
        .not('deposit_receipt_path', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ transactionId, approved }: { transactionId: string; approved: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      if (approved) {
        const { error } = await supabase
          .from('user_transactions')
          .update({
            verified_at: new Date().toISOString(),
            verified_by: user.id,
          })
          .eq('id', transactionId);

        if (error) throw error;
      } else {
        // Se rejeitado, remove o comprovante
        const { error } = await supabase
          .from('user_transactions')
          .update({
            deposit_receipt_path: null,
            verified_at: new Date().toISOString(),
            verified_by: user.id,
          })
          .eq('id', transactionId);

        if (error) throw error;

        // Remove o valor que foi adicionado
        const transaction = deposits?.find(d => d.id === transactionId);
        if (transaction) {
          await supabase.rpc('add_user_balance', {
            p_user_id: transaction.user_id,
            p_amount: -transaction.amount,
          });
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['unverified-deposits'] });
      toast({
        title: variables.approved ? 'Depósito aprovado!' : 'Depósito rejeitado',
        description: variables.approved 
          ? 'O saldo do usuário foi confirmado.'
          : 'O depósito foi rejeitado e o saldo revertido.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleViewReceipt = (receiptPath: string) => {
    setSelectedReceipt(receiptPath);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!deposits || deposits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validação de Depósitos</CardTitle>
          <CardDescription>Nenhum depósito pendente de validação</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Validação de Depósitos</CardTitle>
          <CardDescription>Valide os comprovantes de depósito dos usuários</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((deposit: any) => (
                <TableRow key={deposit.id}>
                  <TableCell className="font-medium">
                    {deposit.profiles?.full_name || 'Sem nome'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {deposit.amount.toLocaleString()} Kz
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(deposit.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewReceipt(deposit.deposit_receipt_path)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => verifyMutation.mutate({ transactionId: deposit.id, approved: true })}
                      disabled={verifyMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => verifyMutation.mutate({ transactionId: deposit.id, approved: false })}
                      disabled={verifyMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprovante de Depósito</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <img
                src={selectedReceipt}
                alt="Comprovante"
                className="w-full h-auto rounded-lg border"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(selectedReceipt, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Comprovante
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}