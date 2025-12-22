import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, Download, FileText, Image, Music } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export function ContractorProofValidation() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: pendingProofs, isLoading } = useQuery({
    queryKey: ['pending-contractor-proofs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('request_attachments')
        .select(`
          *,
          service_requests(id, name, service_type)
        `)
        .eq('approved', false)
        .not('uploaded_by', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ attachmentId, approved }: { attachmentId: string; approved: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      if (approved) {
        const { error } = await supabase
          .from('request_attachments')
          .update({
            approved: true,
            approved_at: new Date().toISOString(),
            approved_by: user.id,
          })
          .eq('id', attachmentId);

        if (error) throw error;
      } else {
        // Delete the attachment if rejected
        const attachment = pendingProofs?.find(p => p.id === attachmentId);
        if (attachment) {
          // Delete file from storage
          await supabase.storage.from('service-attachments').remove([attachment.file_path]);
        }
        
        const { error } = await supabase
          .from('request_attachments')
          .delete()
          .eq('id', attachmentId);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-contractor-proofs'] });
      toast({
        title: variables.approved ? 'Comprovante aprovado!' : 'Comprovante rejeitado',
        description: variables.approved 
          ? 'O arquivo agora está visível para o usuário.'
          : 'O comprovante foi removido.',
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

  const handleViewFile = async (filePath: string, mimeType: string) => {
    const { data } = await supabase.storage.from('service-attachments').createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      setSelectedFile(data.signedUrl);
      setFileType(mimeType);
      setModalOpen(true);
    }
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') return <Image className="h-4 w-4" />;
    if (type === 'audio') return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pendingProofs || pendingProofs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comprovantes de Contratados</CardTitle>
          <CardDescription>Nenhum comprovante pendente de aprovação</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Comprovantes de Contratados</CardTitle>
          <CardDescription>Aprove ou rejeite os comprovantes enviados pelos contratados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Solicitação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Visualizar</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingProofs.map((proof: any) => (
                <TableRow key={proof.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getFileIcon(proof.file_type)}
                      <span className="truncate max-w-[200px]">{proof.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {proof.service_requests?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{proof.file_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(proof.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewFile(proof.file_path, proof.mime_type)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => approveMutation.mutate({ attachmentId: proof.id, approved: true })}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => approveMutation.mutate({ attachmentId: proof.id, approved: false })}
                      disabled={approveMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Visualizar Comprovante</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              {fileType.startsWith('image/') ? (
                <img
                  src={selectedFile}
                  alt="Comprovante"
                  className="w-full h-auto rounded-lg border"
                />
              ) : fileType.startsWith('audio/') ? (
                <audio controls className="w-full">
                  <source src={selectedFile} type={fileType} />
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              ) : (
                <iframe 
                  src={selectedFile} 
                  className="w-full h-[500px] rounded-lg border"
                  title="Documento"
                />
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(selectedFile, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Arquivo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
