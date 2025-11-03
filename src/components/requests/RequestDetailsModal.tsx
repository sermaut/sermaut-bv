import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Star, Wand2 } from 'lucide-react';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  const [analyzing, setAnalyzing] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<string | null>(null);

  if (!request) return null;

  const canReview = request.status === 'completed';

  const handleAnalyzeAudio = async () => {
    // Buscar anexos de áudio da solicitação
    const { data: attachments, error } = await supabase
      .from('request_attachments')
      .select('*')
      .eq('request_id', request.id)
      .eq('file_type', 'audio');

    if (error || !attachments || attachments.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum arquivo de áudio encontrado para análise.',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-audio', {
        body: {
          audioUrl: attachments[0].file_path,
          requestId: request.id,
        },
      });

      if (fnError) throw fnError;

      setAudioAnalysis(data.analysis);
      toast({
        title: 'Análise Concluída',
        description: 'A IA analisou o áudio com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro na Análise',
        description: error.message || 'Erro ao analisar o áudio.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Solicitação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="reviews">
                Avaliações
                {canReview && <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
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

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Análise de Áudio com IA</h4>
                  <Button
                    size="sm"
                    onClick={handleAnalyzeAudio}
                    disabled={analyzing}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {analyzing ? 'Analisando...' : 'Analisar com IA'}
                  </Button>
                </div>
                {audioAnalysis && (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{audioAnalysis}</p>
                  </div>
                )}
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
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 mt-4">
              {canReview && (
                <>
                  <div>
                    <h4 className="font-semibold mb-3">Deixe sua Avaliação</h4>
                    <ReviewForm
                      requestId={request.id}
                      onSuccess={() => {
                        toast({
                          title: 'Avaliação enviada!',
                        });
                      }}
                    />
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <h4 className="font-semibold mb-3">Avaliações Anteriores</h4>
                <ReviewList requestId={request.id} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
