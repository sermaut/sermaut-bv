import { ContractorForm } from '@/components/contractors/ContractorForm';
import { ContractorList } from '@/components/contractors/ContractorList';

export default function Contractors() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contratados Parciais</h1>
          <p className="text-muted-foreground">Gerencie seus contratados e suas tarefas</p>
        </div>
        <ContractorForm />
      </div>

      <ContractorList />
    </div>
  );
}
