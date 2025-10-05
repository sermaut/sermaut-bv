import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCreateContractor, uploadContractorAvatar } from '@/hooks/useContractors';
import { Plus, Loader2, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  address: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ContractorForm() {
  const [open, setOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const createContractor = useCreateContractor();
  const queryClient = useQueryClient();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor selecione uma imagem',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Tamanho máximo: 5MB',
        variant: 'destructive',
      });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setUploading(true);
      
      let avatarUrl = null;

      // Criar o contratado primeiro
      const contractor = await createContractor.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address || '',
      });

      // Fazer upload da foto se houver
      if (avatarFile && contractor) {
        const avatarPath = await uploadContractorAvatar(contractor.id, avatarFile);
        
        // Atualizar com o path da foto
        const { error } = await supabase
          .from('contractors')
          .update({ avatar_url: avatarPath })
          .eq('id', contractor.id);

        if (error) throw error;
        
        // Invalidar queries para atualizar a lista
        queryClient.invalidateQueries({ queryKey: ['contractors'] });
      }

      form.reset();
      clearAvatar();
      setOpen(false);
      
      toast({
        title: 'Contratado cadastrado!',
        description: avatarFile 
          ? 'O contratado foi adicionado com foto de perfil.' 
          : 'O contratado foi adicionado com sucesso.',
      });
    } catch (error) {
      console.error('Error creating contractor:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar o contratado.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Cadastrar Contratado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Contratado</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="text-2xl">
                  <Upload className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex gap-2">
                <label htmlFor="avatar-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {avatarPreview ? 'Alterar Foto' : 'Adicionar Foto'}
                    </span>
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
                
                {avatarPreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearAvatar}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Máximo: 5MB</p>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do contratado" {...field} />
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
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                    <Input placeholder="+244 900 000 000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Morada (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createContractor.isPending || uploading}>
              {(createContractor.isPending || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Contratado
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
