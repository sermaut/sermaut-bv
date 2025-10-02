import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export function useTasks(contractorId?: string) {
  return useQuery({
    queryKey: ['contractor_tasks', contractorId],
    queryFn: async () => {
      let query = supabase
        .from('contractor_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (contractorId) {
        query = query.eq('contractor_id', contractorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: TablesInsert<'contractor_tasks'>) => {
      const { data, error } = await supabase
        .from('contractor_tasks')
        .insert(task)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor_tasks'] });
      toast({
        title: 'Tarefa criada!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('contractor_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['contractor_transactions'] });
      toast({
        title: 'Tarefa concluída!',
        description: 'O pagamento foi adicionado ao saldo do contratado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao concluir tarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
