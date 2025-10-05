import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContractorAvatarProps {
  avatarPath: string | null;
  name: string;
  className?: string;
}

export function ContractorAvatar({ avatarPath, name, className }: ContractorAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarPath) {
      setAvatarUrl(null);
      return;
    }

    const fetchSignedUrl = async () => {
      try {
        const { data } = await supabase.storage
          .from('contractor-documents')
          .createSignedUrl(avatarPath, 60 * 60 * 24); // 24 hours

        if (data?.signedUrl) {
          setAvatarUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error fetching signed URL:', error);
      }
    };

    fetchSignedUrl();
  }, [avatarPath]);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl || undefined} />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
