import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

const depositSchema = z.object({
  amount: z.number().min(1, 'O valor deve ser maior que 0'),
  payment_method: z.enum(['multicaixa', 'bank_transfer', 'p2p']),
  receipt: z.any(),
});

type DepositData = z.infer<typeof depositSchema>;

const paymentMethods = {
  multicaixa: { name: 'MultiCaixa Express', info: 'Pagamento via MultiCaixa Express' },
  bank_transfer: { 
    name: 'Transferência Bancária', 
    info: 'IBAN: 0040 0000 63929866101 68' 
  },
  p2p: { name: 'P2P', info: 'Pagamento via P2P' },
};

export function DepositTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const form = useForm<DepositData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
      payment_method: 'multicaixa',
    },
  });

  const selectedMethod = form.watch('payment_method');

  const onSubmit = async (data: DepositData) => {
    if (!user || !receiptFile) {
      toast({
        title: 'Erro',
        description: 'Por favor, anexe o comprovante de pagamento',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Upload do comprovante
      const fileName = `${user.id}/${Date.now()}_${receiptFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('service-attachments')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      // Criar registro de depósito pendente
      const { error: insertError } = await supabase
        .from('user_transactions')
        .insert({
          user_id: user.id,
          type: 'deposit_pending',
          amount: data.amount,
          description: `Depósito via ${paymentMethods[data.payment_method].name} - Aguardando aprovação`,
        });

      if (insertError) throw insertError;

      // Criar notificação para o admin
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Depósito em Análise',
        description: `Seu depósito de ${data.amount} Kz está sendo analisado.`,
        type: 'deposit',
      });

      toast({
        title: 'Sucesso',
        description: 'Comprovante enviado! Seu depósito será aprovado em breve.',
      });

      form.reset();
      setReceiptFile(null);
    } catch (error) {
      console.error('Erro ao processar depósito:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar depósito',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fazer Depósito</CardTitle>
        <CardDescription>
          Escolha o método de pagamento e envie o comprovante
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (Kz)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      {Object.entries(paymentMethods).map(([key, { name, info }]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <RadioGroupItem value={key} id={key} />
                          <Label htmlFor={key} className="flex-1 cursor-pointer">
                            <div className="font-medium">{name}</div>
                            <div className="text-sm text-muted-foreground">{info}</div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Comprovante de Pagamento</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {receiptFile && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReceiptFile(null)}
                  >
                    Remover
                  </Button>
                )}
              </div>
              {receiptFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo: {receiptFile.name}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !receiptFile}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />
              Enviar Comprovante
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
