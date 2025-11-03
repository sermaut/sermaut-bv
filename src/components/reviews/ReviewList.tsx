import { useReviews } from '@/hooks/useReviews';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewListProps {
  requestId?: string;
  contractorId?: string;
}

export function ReviewList({ requestId, contractorId }: ReviewListProps) {
  const { data: reviews, isLoading } = useReviews(requestId, contractorId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Nenhuma avaliação ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
            )}
            {review.contractors && (
              <p className="text-xs text-muted-foreground mt-2">
                Contratado: {review.contractors.name}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}