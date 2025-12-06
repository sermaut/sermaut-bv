import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsContractor() {
  const { user } = useAuth();

  const { data: contractor, isLoading } = useQuery({
    queryKey: ['user_contractor', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return { 
    isContractor: !!contractor, 
    contractor,
    loading: isLoading 
  };
}
