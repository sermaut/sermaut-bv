import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export async function uploadContractorAvatar(contractorId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `avatars/${contractorId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('contractor-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Retornar o path do arquivo para salvar no banco
  return filePath;
}

export async function getContractorAvatarUrl(filePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('contractor-documents')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

  return data?.signedUrl || '';
}

export async function deleteContractorAvatar(avatarPath: string) {
  if (!avatarPath) return;
  
  const { error } = await supabase.storage
    .from('contractor-documents')
    .remove([avatarPath]);

  if (error) throw error;
}

export function useContractors() {
  return useQuery({
    queryKey: ['contractors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useContractor(id: string) {
  return useQuery({
    queryKey: ['contractors', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractor: TablesInsert<'contractors'>) => {
      const { data, error } = await supabase
        .from('contractors')
        .insert(contractor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      toast({
        title: 'Contratado cadastrado!',
        description: 'O contratado foi adicionado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'contractors'> }) => {
      const { data, error } = await supabase
        .from('contractors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      toast({
        title: 'Contratado atualizado!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
