import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="light"
      toastOptions={{
        classNames: {
          toast: '!rounded-xl !border !border-border !bg-white !text-foreground !shadow-lg',
          description: '!text-muted-foreground',
          actionButton: '!bg-primary',
          cancelButton: '!bg-secondary',
        },
      }}
    />
  );
}
