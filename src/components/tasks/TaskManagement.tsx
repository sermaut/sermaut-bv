import { useState } from 'react';
import { useTasks, useCreateTask, useCompleteTask } from '@/hooks/useTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Plus } from 'lucide-react';
import { TaskForm } from './TaskForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors = {
  assigned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
};

const statusLabels = {
  assigned: 'Atribuída',
  in_progress: 'Em Progresso',
  completed: 'Concluída',
};

export function TaskManagement() {
  const { data: tasks, isLoading } = useTasks();
  const completeTask = useCompleteTask();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleComplete = async (taskId: string) => {
    await completeTask.mutateAsync(taskId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Tarefas</h2>
          <p className="text-muted-foreground">Atribua e acompanhe tarefas dos contratados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <TaskForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                    {statusLabels[task.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <CardDescription>
                  {format(new Date(task.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {task.payment} Kz
                  </span>
                  {task.status !== 'completed' && (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(task.id)}
                      disabled={completeTask.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Concluir
                    </Button>
                  )}
                </div>
                {task.completed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Concluída em: {format(new Date(task.completed_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma tarefa criada ainda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}