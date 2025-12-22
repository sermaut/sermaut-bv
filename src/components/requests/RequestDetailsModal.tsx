import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, FileText, Image, Music, Download, Upload, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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

export function RequestDetailsModal({ request, open, onClose, onEdit, onDelete }: RequestDetailsModalProps) {
  const [status, setStatus] = useState<string>(request?.status || 'pending');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (request) {
      setStatus(request.status);
      loadAttachments();
    }
  }, [request]);

  const loadAttachments = async () => {
    if (!request?.id) return;
    setLoadingAttachments(true);
    try {
      // Only load approved attachments for users (contractors' uploads need approval first)
      const { data, error } = await supabase
        .from('request_attachments')
        .select('*')
        .eq('request_id', request.id)
        .or('approved.eq.true,uploaded_by.is.null') // Show approved OR directly uploaded (no uploaded_by = admin upload)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  if (!request) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'completed' && files.length === 0 && attachments.length === 0) {
      toast({ title: 'Atenção', description: 'Anexe pelo menos um arquivo de resultado para concluir.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('service_requests').update({ status: newStatus as any }).eq('id', request.id);
      if (error) throw error;
      setStatus(newStatus);
      queryClient.invalidateQueries({ queryKey: ['service_requests'] });
      toast({ title: 'Status atualizado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const handleFileUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'document';
        const fileName = `results/${request.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('service-attachments').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { error: insertError } = await supabase.from('request_attachments').insert({ request_id: request.id, file_type: fileType as any, file_path: fileName, file_name: file.name, file_size: file.size, mime_type: file.type });
        if (insertError) throw insertError;
      }
      toast({ title: 'Arquivos enviados' });
      setFiles([]);
      loadAttachments();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao enviar arquivos', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: any) => {
    const { data } = await supabase.storage.from('service-attachments').createSignedUrl(attachment.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') return <Image className="h-4 w-4" />;
    if (type === 'audio') return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Detalhes da Solicitação</DialogTitle></DialogHeader>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="result">Resultado {attachments.length > 0 && <Badge variant="secondary" className="ml-2 h-5 text-xs">{attachments.length}</Badge>}</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Nome</p><p className="font-medium">{request.name}</p></div>
              <div><Label className="text-sm text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={handleStatusChange}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="in_progress">Em Andamento</SelectItem><SelectItem value="completed">Concluído</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{request.email}</p></div>
              <div><p className="text-sm text-muted-foreground">Telefone</p><p className="font-medium">{request.phone}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Tipo de Serviço</p><p className="font-medium">{serviceLabels[request.service_type] || request.service_type}</p></div>
              <div><p className="text-sm text-muted-foreground">Preço</p><p className="font-medium">{request.price} Kz</p></div>
            </div>
            {request.description && <div><p className="text-sm text-muted-foreground mb-2">Descrição</p><p className="text-sm bg-muted p-3 rounded-md">{request.description}</p></div>}
            <div><p className="text-sm text-muted-foreground mb-2">Data de Criação</p><p className="text-sm">{new Date(request.created_at).toLocaleString('pt-AO')}</p></div>
            <Separator />
            <div className="flex gap-2 pt-4 border-t">
              {onEdit && <Button variant="outline" onClick={() => onEdit(request)}><Edit className="h-4 w-4 mr-2" />Editar</Button>}
              {onDelete && <Button variant="destructive" onClick={() => { if (confirm('Tem certeza que deseja eliminar esta solicitação?')) { onDelete(request.id); onClose(); } }}><Trash2 className="h-4 w-4 mr-2" />Eliminar</Button>}
            </div>
          </TabsContent>
          <TabsContent value="result" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 space-y-3">
              <Label>Adicionar Arquivos de Resultado</Label>
              <Input type="file" accept="image/*,audio/*,.pdf" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              {files.length > 0 && <div className="space-y-2">{files.map((f, i) => <div key={i} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">{f.type.startsWith('image/') ? <Image className="h-4 w-4" /> : f.type.startsWith('audio/') ? <Music className="h-4 w-4" /> : <FileText className="h-4 w-4" />}<span className="truncate">{f.name}</span></div>)}<Button onClick={handleFileUpload} disabled={uploading}>{uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Upload className="h-4 w-4 mr-2" />Enviar</Button></div>}
            </div>
            <div><h4 className="font-semibold mb-3">Arquivos Anexados</h4>
              {loadingAttachments ? <p className="text-sm text-muted-foreground">Carregando...</p> : attachments.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum arquivo anexado.</p> : <div className="space-y-2">{attachments.map((att) => <div key={att.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">{getFileIcon(att.file_type)}<div className="flex-1"><p className="text-sm font-medium">{att.file_name}</p><p className="text-xs text-muted-foreground">{(att.file_size / 1024).toFixed(1)} KB</p></div><Button size="sm" variant="ghost" onClick={() => handleDownload(att)}><Download className="h-4 w-4" /></Button></div>)}</div>}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
