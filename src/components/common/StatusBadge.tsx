import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui';
import { DocumentStatus } from '@/types';

const config = {
  [DocumentStatus.Pending]: { variant: 'warning' as const, Icon: Clock, label: 'Pending' },
  [DocumentStatus.Approved]: { variant: 'success' as const, Icon: CheckCircle2, label: 'Approved' },
  [DocumentStatus.Rejected]: { variant: 'destructive' as const, Icon: XCircle, label: 'Rejected' },
};

export function StatusBadge({ status }: { status: DocumentStatus | string }) {
  const entry = config[status as DocumentStatus] ?? config[DocumentStatus.Pending];
  const { variant, Icon, label } = entry;

  return (
    <Badge variant={variant}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const variant =
    role === 'Admin' ? 'destructive' : role === 'Approver' ? 'default' : 'secondary';
  return <Badge variant={variant}>{role}</Badge>;
}

export function BooleanBadge({ value, trueLabel = 'Active', falseLabel = 'Inactive' }: {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return <Badge variant={value ? 'success' : 'secondary'}>{value ? trueLabel : falseLabel}</Badge>;
}