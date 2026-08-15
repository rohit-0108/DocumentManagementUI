import { AlertTriangle } from 'lucide-react';
import { Button, Dialog } from '@/components/ui';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      size="sm"
      closeOnOverlayClick={!loading}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={
            variant === 'destructive'
              ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15'
              : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15'
          }
        >
          <AlertTriangle
            className={variant === 'destructive' ? 'h-5 w-5 text-destructive' : 'h-5 w-5 text-primary'}
          />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </Dialog>
  );
}