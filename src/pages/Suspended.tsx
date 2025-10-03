import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Suspended() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-destructive/5">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-destructive/10 rounded-full">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Conta Suspensa</CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Sua conta foi suspensa. Entre em contato com o administrador para mais informações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Para reativar sua conta, entre em contato através da página de contato ou envie um e-mail para suporte@melodyhub.com
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
