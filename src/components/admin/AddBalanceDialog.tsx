import { useState } from 'react';
import { useAddBalance } from '@/hooks/useUserManagement';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AddBalanceDialogProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export function AddBalanceDialog({ userId, open, onClose }: AddBalanceDialogProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const addBalance = useAddBalance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    await addBalance.mutateAsync({
      userId,
      amount: numAmount,
      description: description || 'Adição manual de saldo',
    });

    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Saldo</DialogTitle>
          <DialogDescription>
            Adicione saldo à carteira do usuário
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (Kz)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Motivo da adição de saldo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addBalance.isPending}>
              {addBalance.isPending ? 'Adicionando...' : 'Adicionar Saldo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
