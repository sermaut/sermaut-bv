import { useSidebar } from '@/contexts/SidebarContext';

export function Overlay() {
  const { isOpen, close } = useSidebar();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
      onClick={close}
      aria-hidden="true"
    />
  );
}
