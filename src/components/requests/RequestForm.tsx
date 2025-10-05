import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateRequest } from '@/hooks/useRequests';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBalance } from '@/hooks/useUserBalance';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
  service_type: z.enum(['accompaniment', 'arrangement_no_mod', 'arrangement_with_mod', 'review']),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const calculatePrice = (serviceType: string): number => {
  switch (serviceType) {
    case 'accompaniment':
      return 350; // Acompanhamento: 350 Kz
    case 'arrangement_no_mod':
      return 250;
    case 'arrangement_with_mod':
      return 370; // Arranjos com Modificações: 370 Kz
    case 'review':
      return 50; // Análises Musicais: 50 Kz
    default:
      return 0;
  }
};

export function RequestForm() {
  const { user } = useAuth();
  const createRequest = useCreateRequest();
  const { data: balance } = useUserBalance();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: user?.email || '',
      service_type: 'accompaniment',
      description: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    const price = calculatePrice(data.service_type);

    // Verificar saldo antes de criar solicitação
    if (balance !== undefined && balance < price && price > 0) {
      createRequest.reset();
      return;
    }

    await createRequest.mutateAsync({
      name: data.name,
      phone: data.phone,
      email: data.email,
      service_type: data.service_type,
      description: data.description || '',
      user_id: user.id,
      status: 'pending',
      price,
    });

    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="+244 900 000 000" {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Serviço</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="accompaniment">Acompanhamento (350 Kz)</SelectItem>
                  <SelectItem value="arrangement_no_mod">Arranjos sem Modificações (250 Kz)</SelectItem>
                  <SelectItem value="arrangement_with_mod">Arranjos com Modificações (370 Kz)</SelectItem>
                  <SelectItem value="review">Análises Musicais (50 Kz)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva os detalhes da sua solicitação..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={createRequest.isPending}>
          {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar Solicitação
        </Button>
      </form>
    </Form>
  );
}
