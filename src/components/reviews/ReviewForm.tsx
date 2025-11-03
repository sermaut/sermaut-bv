import { useState } from 'react';
import { useCreateReview } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ReviewFormProps {
  requestId: string;
  contractorId?: string;
  onSuccess?: () => void;
}

export function ReviewForm({ requestId, contractorId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    await createReview.mutateAsync({
      request_id: requestId,
      contractor_id: contractorId,
      rating,
      comment: comment.trim() || undefined,
    });

    setRating(0);
    setComment('');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="mb-2 block">Avaliação *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="comment">Comentário (opcional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Compartilhe sua experiência..."
          rows={4}
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || createReview.isPending}
        className="w-full"
      >
        {createReview.isPending ? 'Enviando...' : 'Enviar Avaliação'}
      </Button>
    </form>
  );
}