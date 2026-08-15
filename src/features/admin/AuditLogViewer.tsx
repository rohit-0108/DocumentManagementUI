import { useQuery } from '@tanstack/react-query';
import {
  Download, FileSpreadsheet, FileText, Filter, Link2, RefreshCw, ScrollText, Search, X,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { auditLogApi, extractErrorMessage } from '@/api';
import { EmptyState, ErrorState, Pagination } from '@/components/common';
import {
  Badge, Button, Card, CardContent, Dialog, Input, Select, Spinner, Table, TableBody,
  TableCell, TableHead, TableHeader, TableRow, TableSkeleton,
} from '@/components/ui';
import { useDebounce, usePagination } from '@/hooks';
import { queryKeys } from '@/lib/queryKeys';
import { downloadBlob, formatDateTime, truncate } from '@/lib/utils';
import { EntityType, type AuditLogFilterParams, type ExportFormat } from '@/types';

const COMMON_ACTIONS = [
  'UserLoggedIn', 'UserLoginFailed', 'UserRegistered', 'UserLoggedOut', 'PasswordChanged',
  'DocumentUploaded', 'DocumentApproved', 'DocumentRejected', 'DocumentDeleted',
  'DocumentDownloaded', 'DocumentUpdated', 'UserUpdated', 'UserRoleChanged',
  'UserDeactivated', 'AuditLogExported',
];

function StatusPill({ code, success }: { code?: number | null; success: boolean }) {
  if (code == null) return <span className="text-xs text-muted-foreground">—</span>;

  const variant =
    code < 300 ? 'success' : code < 400 ? 'default' : code < 500 ? 'warning' : 'destructive';

  return (
    <Badge variant={success ? variant : 'destructive'}>
      {code}
    </Badge>
  );
}

function MethodPill({ method }: { method: string }) {
  const colours: Record<string, string> = {
    GET: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    POST: 'bg-green-500/15 text-green-600 dark:text-green-400',
    PUT: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    PATCH: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    DELETE: 'bg-red-500/15 text-red-600 dark:text-red-400',
  };

  return (
    <span
      className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${
        colours[method] ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {method}
    </span>
  );
}

export default function AuditLogViewer() {
  const pagination = usePagination({ initialPageSize: 20 });

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [httpMethod, setHttpMethod] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const debouncedSearch = useDebounce(search);

  const filter: AuditLogFilterParams = {
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    action: action || undefined,
    entityType: (entityType as EntityType) || undefined,
    httpMethod: httpMethod || undefined,
    isSuccess: successFilter === '' ? undefined : successFilter === 'true',
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.auditLogs.list(filter),
    queryFn: () => auditLogApi.getAll(filter),
    placeholderData: (previous) => previous,
  });

  const { data: trace, isLoading: traceLoading } = useQuery({
    queryKey: queryKeys.auditLogs.trace(traceId ?? ''),
    queryFn: () => auditLogApi.getByCorrelationId(traceId!),
    enabled: Boolean(traceId),
  });

  const activeFilterCount = [action, entityType, httpMethod, successFilter, dateFrom, dateTo]
    .filter(Boolean).length;

  const clearFilters = () => {
    setAction('');
    setEntityType('');
    setHttpMethod('');
    setSuccessFilter('');
    setDateFrom('');
    setDateTo('');
    pagination.setPageNumber(1);
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    const loadingId = toast.loading(`Generating ${format.toUpperCase()} export…`);
    try {
      const { blob, fileName } = await auditLogApi.export(format, filter);
      downloadBlob(blob, fileName);
      toast.success('Export downloaded.', { id: loadingId });
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Export failed.'), { id: loadingId });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ScrollText className="h-6 w-6 text-primary" />
            Audit log
          </h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.totalCount.toLocaleString()} entr(ies)` : 'Loading…'}
            {isFetching && !isLoading && ' • refreshing'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            loading={exporting === 'excel'}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            loading={exporting === 'pdf'}
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search action, endpoint or username…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  pagination.setPageNumber(1);
                }}
                className="pl-9"
              />
            </div>

            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters((p) => !p)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  pagination.setPageNumber(1);
                }}
              >
                <option value="">All actions</option>
                {COMMON_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>

              <Select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  pagination.setPageNumber(1);
                }}
              >
                <option value="">All entity types</option>
                <option value={EntityType.Document}>Document</option>
                <option value={EntityType.User}>User</option>
                <option value={EntityType.AuditLog}>Audit log</option>
                <option value={EntityType.None}>None</option>
              </Select>

              <Select
                value={httpMethod}
                onChange={(e) => {
                  setHttpMethod(e.target.value);
                  pagination.setPageNumber(1);
                }}
              >
                <option value="">All methods</option>
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>

              <Select
                value={successFilter}
                onChange={(e) => {
                  setSuccessFilter(e.target.value);
                  pagination.setPageNumber(1);
                }}
              >
                <option value="">Success and failure</option>
                <option value="true">Successful only</option>
                <option value="false">Failures only</option>
              </Select>

              <Input
                type="datetime-local"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="From"
              />
              <Input
                type="datetime-local"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="To"
              />

              <Button
                variant="ghost"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="lg:col-span-2"
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={10} columns={8} />
          ) : isError ? (
            <ErrorState message={extractErrorMessage(error)} onRetry={() => refetch()} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No audit entries found"
              description="Try widening your filters or date range."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Trace</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.items.map((log) => (
                    <TableRow key={log.logId} className={!log.isSuccess ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.logId}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-medium">{log.action}</span>
                        {log.errorMessage && (
                          <p className="text-xs text-destructive">{truncate(log.errorMessage, 40)}</p>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MethodPill method={log.httpMethod} />
                          <span className="font-mono text-xs text-muted-foreground">
                            {truncate(log.endpoint, 32)}
                          </span>
                        </div>
                        {log.durationMs != null && (
                          <p className="text-xs text-muted-foreground">{log.durationMs} ms</p>
                        )}
                      </TableCell>

                      <TableCell>
                        {log.username ? (
                          <>
                            <p className="text-sm">{log.username}</p>
                            <p className="text-xs text-muted-foreground">#{log.userId}</p>
                          </>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">anonymous</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {log.entityType !== EntityType.None ? (
                          <Badge variant="outline">
                            {log.entityTypeName}
                            {log.entityId ? ` #${log.entityId}` : ''}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <StatusPill code={log.statusCode} success={log.isSuccess} />
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View full request trace"
                          onClick={() => setTraceId(log.correlationId)}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* ---------- Correlation-id drill-down ---------- */}
      <Dialog
        open={traceId !== null}
        onClose={() => setTraceId(null)}
        title="Request trace"
        description={traceId ?? ''}
        size="xl"
        footer={
          <Button variant="outline" onClick={() => setTraceId(null)}>
            Close
          </Button>
        }
      >
        {traceLoading ? (
          <Spinner label="Loading trace…" />
        ) : !trace ? (
          <p className="text-sm text-muted-foreground">No entries found for this correlation id.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Entries</p>
                <p className="text-lg font-semibold">{trace.entryCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="text-sm font-medium">{formatDateTime(trace.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ended</p>
                <p className="text-sm font-medium">{formatDateTime(trace.endedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total duration</p>
                <p className="text-lg font-semibold">
                  {trace.totalDurationMs != null ? `${trace.totalDurationMs} ms` : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {trace.entries.map((entry, index) => (
                <div
                  key={entry.logId}
                  className={`rounded-lg border p-3 ${
                    entry.isSuccess ? '' : 'border-destructive/40 bg-destructive/5'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {index + 1}
                      </span>
                      <span className="font-medium">{entry.action}</span>
                      <MethodPill method={entry.httpMethod} />
                      <StatusPill code={entry.statusCode} success={entry.isSuccess} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                      {entry.durationMs != null && ` • ${entry.durationMs} ms`}
                    </span>
                  </div>

                  <p className="mt-1.5 font-mono text-xs text-muted-foreground">{entry.endpoint}</p>

                  {entry.details && (
                    <p className="mt-1.5 rounded bg-muted/60 p-2 text-xs">{entry.details}</p>
                  )}

                  {entry.errorMessage && (
                    <p className="mt-1.5 text-xs text-destructive">{entry.errorMessage}</p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {entry.username && <span>User: {entry.username}</span>}
                    {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
                    {entry.entityId && (
                      <span>
                        {entry.entityTypeName} #{entry.entityId}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}