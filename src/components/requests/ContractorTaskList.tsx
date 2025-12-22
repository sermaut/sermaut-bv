import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, Clock, Upload, AlertTriangle, FileText, Image, Music } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContractorTaskListProps {
  contractorId?: string;
}

const statusColors = {
  assigned: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
};

const statusLabels = {
  assigned: 'Atribuída',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
};

export function ContractorTaskList({ contractorId }: ContractorTaskListProps) {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['contractor_tasks', contractorId],
    queryFn: async () => {
      if (!contractorId) return [];
      
      const { data, error } = await supabase
        .from('contractor_tasks')
        .select('*, service_requests(*)')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!contractorId,
  });

  const acceptTaskMutation = useMutation({
    mutationFn: async ({ taskId, files, requestId }: { taskId: string; files: File[]; requestId: string | null }) => {
      if (files.length === 0) {
        throw new Error('Anexe pelo menos um arquivo de comprovante.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Upload files and register in request_attachments
      for (const file of files) {
        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'document';
        const fileName = `task-proofs/${taskId}/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('service-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Register attachment for approval (only if linked to a request)
        if (requestId) {
          await supabase.from('request_attachments').insert({
            request_id: requestId,
            file_type: fileType as any,
            file_path: fileName,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            approved: false,
            uploaded_by: user.id,
          });
        }
      }

      // Update task status with accepted_at timestamp
      const { error } = await supabase
        .from('contractor_tasks')
        .update({ 
          status: 'in_progress',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor_tasks'] });
      toast({
        title: 'Tarefa aceita!',
        description: 'Os comprovantes foram enviados para aprovação.',
      });
      setAcceptModalOpen(false);
      setFiles([]);
      setSelectedTask(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('contractor_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor_tasks'] });
      toast({
        title: 'Tarefa rejeitada',
        description: 'A tarefa foi removida da sua lista.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAcceptClick = (task: any) => {
    setSelectedTask(task);
    setAcceptModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmitAccept = () => {
    if (selectedTask && files.length > 0) {
      acceptTaskMutation.mutate({ 
        taskId: selectedTask.id, 
        files, 
        requestId: selectedTask.request_id 
      });
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma tarefa atribuída no momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                  {statusLabels[task.status as keyof typeof statusLabels]}
                </Badge>
              </div>
              <CardDescription>
                Pagamento: {task.payment.toLocaleString()} Kz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {task.description && (
                <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Criada em: {format(new Date(task.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
                
                {task.status === 'assigned' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptClick(task)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja rejeitar esta tarefa?')) {
                          rejectTaskMutation.mutate(task.id);
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={acceptModalOpen} onOpenChange={setAcceptModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aceitar Tarefa</DialogTitle>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Depois de aceitar, se quebrar o combinado, será debitado 200 Kz na sua conta.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label>Anexar Comprovantes (PDFs, Imagens, Áudios)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Você tem 2 dias para enviar os comprovantes de execução.
              </p>
              <Input
                type="file"
                accept="image/*,audio/*,.pdf"
                multiple
                onChange={handleFileChange}
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Arquivos selecionados:</Label>
                <div className="space-y-1">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                      {getFileIcon(file)}
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitAccept}
              disabled={files.length === 0 || acceptTaskMutation.isPending}
            >
              {acceptTaskMutation.isPending ? 'Enviando...' : 'Aceitar e Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
