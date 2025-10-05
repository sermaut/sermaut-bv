import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Trash2, Edit, Plus, Minus, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { uploadContractorAvatar, deleteContractorAvatar } from '@/hooks/useContractors';
import { ContractorAvatar } from './ContractorAvatar';

interface ContractorDetailsModalProps {
  contractor: any;
  open: boolean;
  onClose: () => void;
}

export function ContractorDetailsModal({ contractor, open, onClose }: ContractorDetailsModalProps) {
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [balanceAction, setBalanceAction] = useState<'add' | 'remove'>('add');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setUploadingAvatar(true);

      if (contractor.avatar_url) {
        await deleteContractorAvatar(contractor.avatar_url);
      }

      const avatarPath = await uploadContractorAvatar(contractor.id, avatarFile);
      
      const { error } = await supabase
        .from('contractors')
        .update({ avatar_url: avatarPath })
        .eq('id', contractor.id);

      if (error) throw error;

      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }

      queryClient.invalidateQueries({ queryKey: ['contractors'] });

      toast({
        title: 'Foto atualizada!',
        description: 'A foto de perfil foi atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: 'Não foi possível atualizar a foto de perfil.',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!contractor.avatar_url) return;

    try {
      setUploadingAvatar(true);

      await deleteContractorAvatar(contractor.avatar_url);

      const { error } = await supabase
        .from('contractors')
        .update({ avatar_url: null })
        .eq('id', contractor.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['contractors'] });

      toast({
        title: 'Foto removida!',
        description: 'A foto de perfil foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: 'Erro ao remover foto',
        description: 'Não foi possível remover a foto de perfil.',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const cancelAvatarChange = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
  };

  if (!contractor) return null;

  const handleBalanceChange = async () => {
    try {
      const amount = balanceAction === 'add' ? balanceAmount : -balanceAmount;
      
      const { error } = await supabase
        .from('contractors')
        .update({ balance: contractor.balance + amount })
        .eq('id', contractor.id);

      if (error) throw error;

      await supabase.from('contractor_transactions').insert({
        contractor_id: contractor.id,
        type: balanceAction === 'add' ? 'manual_add' : 'manual_subtract',
        amount: Math.abs(amount),
        description: `${balanceAction === 'add' ? 'Adição' : 'Dedução'} manual de saldo`,
      });

      toast({
        title: 'Sucesso',
        description: `Saldo ${balanceAction === 'add' ? 'adicionado' : 'deduzido'} com sucesso`,
      });

      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      setShowBalanceDialog(false);
      setBalanceAmount(0);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar saldo',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja eliminar este contratado?')) return;

    try {
      const { error } = await supabase
        .from('contractors')
        .delete()
        .eq('id', contractor.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Contratado eliminado com sucesso',
      });

      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      onClose();
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao eliminar contratado',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Contratado</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="h-32 w-32 rounded-full object-cover" />
            ) : (
              <ContractorAvatar 
                avatarPath={contractor.avatar_url} 
                name={contractor.name} 
                className="h-32 w-32 text-3xl"
              />
            )}

            <div className="text-center">
              <h3 className="text-2xl font-bold">{contractor.name}</h3>
              <Badge variant={contractor.status === 'active' ? 'default' : 'secondary'}>
                {contractor.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            {avatarPreview ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'Salvando...' : 'Salvar Foto'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelAvatarChange}
                  disabled={uploadingAvatar}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <label htmlFor="avatar-change">
                  <Button size="sm" variant="outline" asChild disabled={uploadingAvatar}>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Alterar Foto
                    </span>
                  </Button>
                  <input
                    id="avatar-change"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>

                {contractor.avatar_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{contractor.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{contractor.phone}</p>
            </div>
          </div>

          {contractor.address && (
            <div>
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p className="font-medium">{contractor.address}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <p className="text-2xl font-bold">{contractor.balance} Kz</p>
          </div>

          {!showBalanceDialog ? (
            <div className="flex gap-2 flex-wrap pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setBalanceAction('add');
                  setShowBalanceDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Saldo
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setBalanceAction('remove');
                  setShowBalanceDialog(true);
                }}
              >
                <Minus className="h-4 w-4 mr-2" />
                Deduzir Saldo
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div>
                <Label>Valor (Kz)</Label>
                <Input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(parseFloat(e.target.value))}
                  placeholder="Digite o valor"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleBalanceChange}>
                  Confirmar {balanceAction === 'add' ? 'Adição' : 'Dedução'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowBalanceDialog(false);
                  setBalanceAmount(0);
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
