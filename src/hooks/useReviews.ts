import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useReviews(requestId?: string, contractorId?: string) {
  return useQuery({
    queryKey: ['reviews', requestId, contractorId],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*, service_requests(name, service_type), contractors(name)')
        .order('created_at', { ascending: false });

      if (requestId) {
        query = query.eq('request_id', requestId);
      }
      if (contractorId) {
        query = query.eq('contractor_id', contractorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      request_id: string;
      contractor_id?: string;
      rating: number;
      comment?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          ...review,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado pelo seu feedback.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar avaliação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}