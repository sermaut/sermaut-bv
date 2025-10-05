import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, Trash2, Edit, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ContractorDetailsModalProps {
  contractor: any;
  open: boolean;
  onClose: () => void;
}

export function ContractorDetailsModal({ contractor, open, onClose }: ContractorDetailsModalProps) {
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [balanceAction, setBalanceAction] = useState<'add' | 'remove'>('add');
  const queryClient = useQueryClient();

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
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {contractor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-bold">{contractor.name}</h3>
              <Badge variant={contractor.status === 'active' ? 'default' : 'secondary'}>
                {contractor.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
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
