import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTransactions(contractorId?: string) {
  return useQuery({
    queryKey: ['contractor_transactions', contractorId],
    queryFn: async () => {
      let query = supabase
        .from('contractor_transactions')
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
