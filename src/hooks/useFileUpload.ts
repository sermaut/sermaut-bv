import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, bucket: string, path: string) => {
    setUploading(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      setProgress(100);
      return data.path;
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (files: File[], bucket: string, pathPrefix: string) => {
    const uploadPromises = files.map((file, index) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${index}_${file.name}`;
      return uploadFile(file, bucket, `${pathPrefix}/${fileName}`);
    });

    return Promise.all(uploadPromises);
  };

  return { uploadFile, uploadMultiple, uploading, progress };
}
