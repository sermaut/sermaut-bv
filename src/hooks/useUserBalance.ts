import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.balance || 0;
    },
    enabled: !!user?.id,
  });
}
