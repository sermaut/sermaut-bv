import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function PendingApproval() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Clock className="h-16 w-16 text-primary animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Cadastro em Análise</CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Nossos sistemas estão avaliando seu pedido. Você receberá uma mensagem através de e-mail ou SMS quando for aprovado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Este processo geralmente leva até 24 horas. Obrigado pela paciência!
            </p>
          </div>
          <Button onClick={signOut} variant="outline" className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
