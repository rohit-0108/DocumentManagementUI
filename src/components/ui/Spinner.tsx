import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function Spinner({ className, size = 'md', label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status">
      <Loader2 className={cn('animate-spin text-primary', sizes[size], className)} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function PageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}