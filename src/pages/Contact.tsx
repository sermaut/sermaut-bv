import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contacte-nos</h1>
        <p className="text-muted-foreground">Entre em contato conosco</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Enviar Mensagem</CardTitle>
            <CardDescription>Preencha o formulário abaixo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea placeholder="Escreva sua mensagem..." rows={5} />
            </div>
            <Button className="w-full">Enviar Mensagem</Button>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Telefone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">+244 XXX XXX XXX</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">contato@melodyhub.ao</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Luanda, Angola</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
