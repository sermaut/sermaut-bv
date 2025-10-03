import { ContractorForm } from '@/components/contractors/ContractorForm';
import { ContractorList } from '@/components/contractors/ContractorList';

export function ContractorManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ContractorForm />
      </div>
      <ContractorList />
    </div>
  );
}
