-- Adicionar coluna avatar_url à tabela contractors
ALTER TABLE public.contractors ADD COLUMN avatar_url TEXT;

-- Criar políticas RLS para o bucket contractor-documents
-- Admins podem fazer upload de avatares
CREATE POLICY "Admins can upload contractor avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contractor-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Admins podem visualizar avatares de contratados
CREATE POLICY "Admins can view contractor avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contractor-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins podem deletar avatares de contratados
CREATE POLICY "Admins can delete contractor avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contractor-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] = 'avatars'
);