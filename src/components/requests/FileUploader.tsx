import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Paperclip, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxImages?: number;
  maxAudios?: number;
  maxSizeMB?: number;
}

export function FileUploader({ 
  onFilesChange, 
  maxImages = 6, 
  maxAudios = 5,
  maxSizeMB = 16 
}: FileUploaderProps) {
  const [images, setImages] = useState<File[]>([]);
  const [audios, setAudios] = useState<File[]>([]);

  const getTotalSize = (files: File[]) => {
    return files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024); // MB
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, maxImages);
    
    const totalSize = getTotalSize([...newImages, ...audios]);
    if (totalSize > maxSizeMB) {
      toast({
        title: 'Erro',
        description: `O tamanho total dos arquivos não pode exceder ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    if (newImages.length > maxImages) {
      toast({
        title: 'Limite excedido',
        description: `Você pode adicionar no máximo ${maxImages} imagens`,
        variant: 'destructive',
      });
      return;
    }

    setImages(newImages);
    onFilesChange([...newImages, ...audios]);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAudios = [...audios, ...files].slice(0, maxAudios);
    
    const totalSize = getTotalSize([...images, ...newAudios]);
    if (totalSize > maxSizeMB) {
      toast({
        title: 'Erro',
        description: `O tamanho total dos arquivos não pode exceder ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    if (newAudios.length > maxAudios) {
      toast({
        title: 'Limite excedido',
        description: `Você pode adicionar no máximo ${maxAudios} áudios`,
        variant: 'destructive',
      });
      return;
    }

    setAudios(newAudios);
    onFilesChange([...images, ...newAudios]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onFilesChange([...newImages, ...audios]);
  };

  const removeAudio = (index: number) => {
    const newAudios = audios.filter((_, i) => i !== index);
    setAudios(newAudios);
    onFilesChange([...images, ...newAudios]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button type="button" variant="outline" size="sm" asChild>
            <span className="cursor-pointer">
              <Camera className="h-4 w-4 mr-2" />
              Fotos ({images.length}/{maxImages})
            </span>
          </Button>
        </label>

        <input
          type="file"
          accept="audio/*"
          multiple
          onChange={handleAudioUpload}
          className="hidden"
          id="audio-upload"
        />
        <label htmlFor="audio-upload">
          <Button type="button" variant="outline" size="sm" asChild>
            <span className="cursor-pointer">
              <Paperclip className="h-4 w-4 mr-2" />
              Áudios ({audios.length}/{maxAudios})
            </span>
          </Button>
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {audios.length > 0 && (
        <div className="space-y-2">
          {audios.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeAudio(index)}
                className="text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Total: {getTotalSize([...images, ...audios]).toFixed(2)}MB / {maxSizeMB}MB
      </p>
    </div>
  );
}
