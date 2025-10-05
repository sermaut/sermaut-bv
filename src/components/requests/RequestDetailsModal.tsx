import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';

interface RequestDetailsModalProps {
  request: any;
  open: boolean;
  onClose: () => void;
  onEdit?: (request: any) => void;
  onDelete?: (id: string) => void;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const serviceLabels: Record<string, string> = {
  accompaniment: 'Acompanhamento',
  arrangement_no_mod: 'Arranjos sem Modificações',
  arrangement_with_mod: 'Arranjos com Modificações',
  review: 'Análises Musicais',
};

export function RequestDetailsModal({ 
  request, 
  open, 
  onClose,
  onEdit,
  onDelete 
}: RequestDetailsModalProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Solicitação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{request.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline">
                {statusLabels[request.status] || request.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{request.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{request.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Serviço</p>
              <p className="font-medium">
                {serviceLabels[request.service_type] || request.service_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Preço</p>
              <p className="font-medium">{request.price} Kz</p>
            </div>
          </div>

          {request.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Descrição</p>
              <p className="text-sm bg-muted p-3 rounded-md">
                {request.description}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">Data de Criação</p>
            <p className="text-sm">
              {new Date(request.created_at).toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(request)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm('Tem certeza que deseja eliminar esta solicitação?')) {
                    onDelete(request.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
