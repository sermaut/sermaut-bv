import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Wallet, ArrowDownCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ContractorWithdrawalTabProps {
  contractorId?: string;
  balance: number;
}

const withdrawalSchema = z.object({
  amount: z.number().min(1, 'O valor deve ser maior que 0'),
  account_info: z.string().min(5, 'Informe os dados da conta bancária'),
});

type WithdrawalData = z.infer<typeof withdrawalSchema>;

export function ContractorWithdrawalTab({ contractorId, balance }: ContractorWithdrawalTabProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<WithdrawalData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      account_info: '',
    },
  });

  const watchAmount = form.watch('amount');

  const onSubmit = async (data: WithdrawalData) => {
    if (!contractorId) return;

    if (data.amount > balance) {
      toast({
        title: 'Erro',
        description: 'Saldo insuficiente para este levantamento.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create withdrawal request as transaction
      const { error: insertError } = await supabase
        .from('contractor_transactions')
        .insert({
          contractor_id: contractorId,
          type: 'manual_subtract',
          amount: -data.amount,
          description: `Levantamento solicitado - ${data.account_info}`,
        });

      if (insertError) throw insertError;

      // Update contractor balance
      const { error: updateError } = await supabase
        .from('contractors')
        .update({ balance: balance - data.amount })
        .eq('id', contractorId);

      if (updateError) throw updateError;

      toast({
        title: 'Sucesso',
        description: 'Pedido de levantamento enviado! Aguarde o processamento.',
      });

      queryClient.invalidateQueries({ queryKey: ['user_contractor'] });
      form.reset();
    } catch (error) {
      console.error('Erro ao processar levantamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar levantamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fazer Levantamento</CardTitle>
        <CardDescription>
          Solicite o levantamento do seu saldo disponível
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Saldo Disponível</p>
              <p className="text-2xl font-bold text-primary">{balance.toLocaleString('pt-AO')} Kz</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor a Levantar (Kz)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      max={balance}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  {watchAmount > balance && (
                    <p className="text-sm text-destructive">
                      Valor excede o saldo disponível
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dados da Conta Bancária</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="IBAN ou número da conta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || watchAmount > balance || watchAmount <= 0}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Solicitar Levantamento
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
