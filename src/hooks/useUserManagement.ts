import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: 'approved' })
        .eq('id', userId);
      
      if (error) throw error;

      // Criar notificação
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Conta Aprovada! 🎉',
        description: 'Sua conta foi aprovada. Agora você pode fazer solicitações de serviços.',
        type: 'account_status'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuário aprovado",
        description: "O usuário foi aprovado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: 'rejected' })
        .eq('id', userId);
      
      if (error) throw error;

      // Criar notificação
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Cadastro Rejeitado',
        description: 'Seu cadastro foi rejeitado. Entre em contato para mais informações.',
        type: 'account_status'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuário rejeitado",
        description: "O usuário foi rejeitado.",
      });
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: 'suspended' })
        .eq('id', userId);
      
      if (error) throw error;

      // Criar notificação
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Conta Suspensa',
        description: 'Sua conta foi suspensa. Entre em contato com o administrador.',
        type: 'account_status'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuário suspenso",
        description: "O usuário foi suspenso.",
      });
    },
  });
}

export function useAddBalance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, amount, description }: { userId: string; amount: number; description: string }) => {
      // Adicionar saldo usando a função do banco
      const { error: balanceError } = await supabase.rpc('add_user_balance', {
        p_user_id: userId,
        p_amount: amount
      });

      if (balanceError) throw balanceError;

      // Criar transação
      const { data: { user } } = await supabase.auth.getUser();
      const { error: transactionError } = await supabase
        .from('user_transactions')
        .insert({
          user_id: userId,
          type: 'admin_add',
          amount,
          description,
          admin_id: user?.id
        });

      if (transactionError) throw transactionError;

      // Criar notificação
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Saldo Adicionado',
        description: `Foram adicionados ${amount} Kz à sua conta.`,
        type: 'balance'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user_balance'] });
      toast({
        title: "Saldo adicionado",
        description: "O saldo foi adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar saldo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUserTransactions(userId?: string) {
  return useQuery({
    queryKey: ['user_transactions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
