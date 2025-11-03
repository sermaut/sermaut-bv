import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateTask } from '@/hooks/useTasks';
import { useContractors } from '@/hooks/useContractors';
import { useRequests } from '@/hooks/useRequests';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const taskSchema = z.object({
  contractor_id: z.string().min(1, 'Selecione um contratado'),
  request_id: z.string().optional(),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  payment: z.string().min(1, 'Valor é obrigatório'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSuccess?: () => void;
}

export function TaskForm({ onSuccess }: TaskFormProps) {
  const createTask = useCreateTask();
  const { data: contractors } = useContractors();
  const { data: requests } = useRequests();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      payment: '150',
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    await createTask.mutateAsync({
      contractor_id: data.contractor_id,
      request_id: data.request_id || null,
      title: data.title,
      description: data.description || null,
      payment: Number(data.payment),
      status: 'assigned',
    });

    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contractor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contratado *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o contratado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contractors?.filter(c => c.status === 'active').map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id}>
                      {contractor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="request_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solicitação (opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vincular a uma solicitação" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {requests?.map((request) => (
                    <SelectItem key={request.id} value={request.id}>
                      {request.name} - {request.service_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input placeholder="Nome da tarefa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalhes da tarefa..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pagamento (Kz) *</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="1" placeholder="150" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={createTask.isPending}>
          {createTask.isPending ? 'Criando...' : 'Criar Tarefa'}
        </Button>
      </form>
    </Form>
  );
}