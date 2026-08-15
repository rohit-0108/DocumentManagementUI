import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, ClipboardCheck, Clock, Download, Eye, Search, XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { documentApi, extractErrorMessage } from '@/api';
import { EmptyState, ErrorState, FormField, Pagination } from '@/components/common';
import {
  Button, Card, CardContent, Dialog, Input, Select, Table, TableBody,
  TableCell, TableHead, TableHeader, TableRow, TableSkeleton, Textarea,
} from '@/components/ui';
import { useDebounce, usePagination } from '@/hooks';
import { queryKeys } from '@/lib/queryKeys';
import { downloadBlob, formatDateTime, formatRelative } from '@/lib/utils';
import { rejectDocumentSchema, type RejectDocumentFormValues } from '@/lib/validationSchemas';
import { DEPARTMENTS, type DocumentFilterParams } from '@/types';

export default function ApprovalQueue() {
  const queryClient = useQueryClient();
  const pagination = usePagination({ initialPageSize: 20 });

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [rejectTarget, setRejectTarget] = useState<{ id: number; title: string } | null>(null);

  const debouncedSearch = useDebounce(search);

  const filter: DocumentFilterParams = {
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    department: department || undefined,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.documents.pending(filter),
    queryFn: () => documentApi.getPendingApproval(filter),
    placeholderData: (previous) => previous,
    refetchInterval: 30_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => documentApi.approve(id, {}),
    onSuccess: (doc) => {
      invalidate();
      toast.success(`"${doc.title}" approved.`);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      documentApi.reject(id, { reason }),
    onSuccess: (doc) => {
      invalidate();
      setRejectTarget(null);
      rejectForm.reset();
      toast.success(`"${doc.title}" rejected.`);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const rejectForm = useForm<RejectDocumentFormValues>({
    resolver: zodResolver(rejectDocumentSchema),
    defaultValues: { reason: '' },
  });

  const handleDownload = async (id: number, title: string) => {
    const loadingId = toast.loading(`Downloading "${title}"…`);
    try {
      const { blob, fileName } = await documentApi.download(id);
      downloadBlob(blob, fileName);
      toast.success('Download started.', { id: loadingId });
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Download failed.'), { id: loadingId });
    }
  };

  const ageBadge = (uploadedAt: string) => {
    const days = Math.floor((Date.now() - new Date(uploadedAt).getTime()) / 86_400_000);
    const tone =
      days >= 7 ? 'text-destructive' : days >= 3 ? 'text-warning-foreground' : 'text-muted-foreground';
    return <span className={`text-xs font-medium ${tone}`}>{formatRelative(uploadedAt)}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Approval queue
          </h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.totalCount} document(s) awaiting review` : 'Loading…'}
            {isFetching && !isLoading && ' • refreshing'}
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                pagination.setPageNumber(1);
              }}
              className="w-full pl-9 sm:w-56"
            />
          </div>

          <Select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              pagination.setPageNumber(1);
            }}
            className="w-40"
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : isError ? (
            <ErrorState message={extractErrorMessage(error)} onRetry={() => refetch()} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Queue is clear"
              description="There are no documents awaiting approval right now."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Uploaded by</TableHead>
                    <TableHead>Waiting</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.items.map((doc) => {
                    const busy =
                      (approveMutation.isPending && approveMutation.variables === doc.documentId) ||
                      (rejectMutation.isPending && rejectMutation.variables?.id === doc.documentId);

                    return (
                      <TableRow key={doc.documentId}>
                        <TableCell>
                          <Link
                            to={`/documents/${doc.documentId}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {doc.title}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">{doc.fileName}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{doc.department}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.uploadedByName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {ageBadge(doc.uploadedAt)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(doc.uploadedAt)}
                          </p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {doc.fileSizeFormatted}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Link to={`/documents/${doc.documentId}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Review">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Download"
                              onClick={() => handleDownload(doc.documentId, doc.title)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              className="h-8"
                              disabled={busy}
                              onClick={() => approveMutation.mutate(doc.documentId)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8"
                              disabled={busy}
                              onClick={() =>
                                setRejectTarget({ id: doc.documentId, title: doc.title })
                              }
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Pagination
                pageNumber={data.pageNumber}
                pageSize={data.pageSize}
                totalCount={data.totalCount}
                totalPages={data.totalPages}
                hasPreviousPage={data.hasPreviousPage}
                hasNextPage={data.hasNextPage}
                onPageChange={pagination.setPageNumber}
                onPageSizeChange={pagination.setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="Reject document"
        description={rejectTarget ? `"${rejectTarget.title}" will be marked as rejected.` : ''}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={rejectMutation.isPending}
              onClick={rejectForm.handleSubmit((v) =>
                rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason: v.reason }),
              )}
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
    </div>
  );
}