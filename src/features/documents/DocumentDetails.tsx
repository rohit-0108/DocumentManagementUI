import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, Calendar, CheckCircle2, Download, FileText,
  HardDrive, Pencil, Trash2, User as UserIcon, XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentApi, extractErrorMessage } from '@/api';
import { ConfirmDialog, ErrorState, FormField, StatusBadge } from '@/components/common';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Dialog, Input,
  PageSpinner, Select, Textarea,
} from '@/components/ui';
import { useAuth } from '@/hooks';
import { queryKeys } from '@/lib/queryKeys';
import { downloadBlob, formatDateTime } from '@/lib/utils';
import {
  rejectDocumentSchema, updateDocumentSchema,
  type RejectDocumentFormValues, type UpdateDocumentFormValues,
} from '@/lib/validationSchemas';
import { DEPARTMENTS, DocumentStatus } from '@/types';

export default function DocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const documentId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canApprove } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: doc, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.documents.detail(documentId),
    queryFn: () => documentApi.getById(documentId),
    enabled: Number.isFinite(documentId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  // ---------- mutations ----------
  const updateMutation = useMutation({
    mutationFn: (values: UpdateDocumentFormValues) =>
      documentApi.update(documentId, {
        title: values.title,
        description: values.description || undefined,
        department: values.department,
      }),
    onSuccess: () => {
      invalidate();
      setEditOpen(false);
      toast.success('Document updated.');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentApi.remove(documentId),
    onSuccess: () => {
      invalidate();
      toast.success('Document deleted.');
      navigate('/documents');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const approveMutation = useMutation({
    mutationFn: () => documentApi.approve(documentId, {}),
    onSuccess: () => {
      invalidate();
      toast.success('Document approved.');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: (values: RejectDocumentFormValues) => documentApi.reject(documentId, values),
    onSuccess: () => {
      invalidate();
      setRejectOpen(false);
      toast.success('Document rejected.');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  // ---------- forms ----------
  const editForm = useForm<UpdateDocumentFormValues>({
    resolver: zodResolver(updateDocumentSchema),
    values: {
      title: doc?.title ?? '',
      description: doc?.description ?? '',
      department: doc?.department ?? '',
    },
  });

  const rejectForm = useForm<RejectDocumentFormValues>({
    resolver: zodResolver(rejectDocumentSchema),
    defaultValues: { reason: '' },
  });

  const handleDownload = async () => {
    if (!doc) return;
    const loadingId = toast.loading('Preparing download…');
    try {
      const { blob, fileName } = await documentApi.download(documentId);
      downloadBlob(blob, fileName);
      toast.success('Download started.', { id: loadingId });
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Download failed.'), { id: loadingId });
    }
  };

  if (isLoading) return <PageSpinner label="Loading document…" />;
  if (isError || !doc)
    return <ErrorState message={extractErrorMessage(error, 'Document not found.')} onRetry={refetch} />;

  const meta = [
    { Icon: Building2, label: 'Department', value: doc.department },
    { Icon: UserIcon, label: 'Uploaded by', value: doc.uploadedByName },
    { Icon: Calendar, label: 'Uploaded at', value: formatDateTime(doc.uploadedAt) },
    { Icon: HardDrive, label: 'File size', value: doc.fileSizeFormatted },
    { Icon: FileText, label: 'File name', value: doc.fileName },
    { Icon: FileText, label: 'Content type', value: doc.contentType },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link to="/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
              <StatusBadge status={doc.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Document #{doc.documentId} • version {doc.version}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          {doc.canEdit && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
          {doc.canDelete && (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Approval action bar */}
      {canApprove && doc.status === DocumentStatus.Pending && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">This document is awaiting your review.</p>
              <p className="text-sm text-muted-foreground">
                Approve it or reject it with a reason.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="success"
                onClick={() => approveMutation.mutate()}
                loading={approveMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection notice */}
      {doc.status === DocumentStatus.Rejected && doc.rejectionReason && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4">
            <p className="flex items-center gap-2 font-medium text-destructive">
              <XCircle className="h-4 w-4" />
              Rejected
            </p>
            <p className="mt-1 text-sm">{doc.rejectionReason}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              By {doc.approvedByName} on {formatDateTime(doc.approvedAt)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Approval notice */}
      {doc.status === DocumentStatus.Approved && (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="p-4">
            <p className="flex items-center gap-2 font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />
              Approved
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              By {doc.approvedByName} on {formatDateTime(doc.approvedAt)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {doc.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{doc.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {meta.map(({ Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ---------- Edit dialog ---------- */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit document"
        description="Only metadata can be changed — the stored file stays the same."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={editForm.handleSubmit((v) => updateMutation.mutate(v))}
              loading={updateMutation.isPending}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form className="space-y-4" noValidate>
          <FormField label="Title" required error={editForm.formState.errors.title?.message}>
            <Input {...editForm.register('title')} />
          </FormField>

          <FormField label="Department" required error={editForm.formState.errors.department?.message}>
            <Select {...editForm.register('department')}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Description" error={editForm.formState.errors.description?.message}>
            <Textarea rows={3} {...editForm.register('description')} />
          </FormField>
        </form>
      </Dialog>

      {/* ---------- Reject dialog ---------- */}
      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject document"
        description="The uploader will see this reason."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={rejectForm.handleSubmit((v) => rejectMutation.mutate(v))}
              loading={rejectMutation.isPending}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </>
        }
      >
        <FormField label="Reason" required error={rejectForm.formState.errors.reason?.message}>
          <Textarea
            rows={4}
            placeholder="Explain why this document is being rejected…"
            {...rejectForm.register('reason')}
          />
        </FormField>
      </Dialog>

      {/* ---------- Delete confirm ---------- */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this document?"
        message={`"${doc.title}" will be removed from all listings. This can only be undone by an administrator.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}