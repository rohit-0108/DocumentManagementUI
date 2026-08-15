import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpDown, Download, Eye, FileText, Filter, Search, Upload, X,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { documentApi, extractErrorMessage } from '@/api';
import { EmptyState, ErrorState, Pagination, StatusBadge } from '@/components/common';
import {
  Button, Card, CardContent, Input, Select, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, TableSkeleton,
} from '@/components/ui';
import { useAuth, useDebounce, usePagination } from '@/hooks';
import { queryKeys } from '@/lib/queryKeys';
import { downloadBlob, formatDateTime } from '@/lib/utils';
import { DEPARTMENTS, DocumentStatus, type DocumentFilterParams } from '@/types';

export default function DocumentList() {
  const { isAdmin, canApprove } = useAuth();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search);

  const filter: DocumentFilterParams = {
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: pagination.sortBy,
    sortDesc: pagination.sortDesc,
    search: debouncedSearch || undefined,
    department: department || undefined,
    status: (status as DocumentStatus) || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.documents.list(filter),
    queryFn: () => documentApi.getAll(filter),
    placeholderData: (previous) => previous,
  });

  const activeFilterCount = [department, status, dateFrom, dateTo].filter(Boolean).length;

  const clearFilters = () => {
    setDepartment('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    pagination.setPageNumber(1);
  };

  const handleDownload = async (id: number, title: string) => {
    const loadingId = toast.loading(`Downloading "${title}"…`);
    try {
      const { blob, fileName } = await documentApi.download(id);
      downloadBlob(blob, fileName);
      toast.success('Download started.', { id: loadingId });
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Download failed.'), { id: loadingId });
    }
  };

  const SortableHeader = ({ column, label }: { column: string; label: string }) => (
    <TableHead>
      <button
        onClick={() => pagination.toggleSort(column)}
        className="flex items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        <ArrowUpDown
            className={`h-3 w-3 ${pagination.sortBy === column ? 'text-primary' : 'opacity-40'}`}
            />
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdmin || canApprove ? 'All documents' : 'My documents'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.totalCount} document(s)` : 'Loading…'}
            {isFetching && !isLoading && ' • refreshing'}
          </p>
        </div>

        <Link to="/documents/upload">
          <Button>
            <Upload className="h-4 w-4" />
            Upload document
          </Button>
        </Link>
      </div>

      {/* Search + filters */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, description or filename…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  pagination.setPageNumber(1);
                }}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
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
            <div className="grid gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-5">
              <Select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  pagination.setPageNumber(1);
                }}
              >
                <option value="">All departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>

              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  pagination.setPageNumber(1);
                }}
              >
                <option value="">All statuses</option>
                <option value={DocumentStatus.Pending}>Pending</option>
                <option value={DocumentStatus.Approved}>Approved</option>
                <option value={DocumentStatus.Rejected}>Rejected</option>
              </Select>

              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="From date"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="To date"
              />

              <Button variant="ghost" onClick={clearFilters} disabled={activeFilterCount === 0}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : isError ? (
            <ErrorState message={extractErrorMessage(error)} onRetry={() => refetch()} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents found"
              description={
                search || activeFilterCount > 0
                  ? 'Try adjusting your search or filters.'
                  : 'Upload your first document to get started.'
              }
              action={
                <Link to="/documents/upload">
                  <Button>
                    <Upload className="h-4 w-4" />
                    Upload document
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader column="Title" label="Title" />
                    <SortableHeader column="Department" label="Department" />
                    <TableHead>Uploaded by</TableHead>
                    <SortableHeader column="UploadedAt" label="Uploaded" />
                    <SortableHeader column="FileSize" label="Size" />
                    <SortableHeader column="Status" label="Status" />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.items.map((doc) => (
                    <TableRow key={doc.documentId}>
                      <TableCell>
                        <Link
                            to={`/documents/${doc.documentId}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                          {doc.title}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">{doc.fileName}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{doc.department}</TableCell>
                      <TableCell className="text-muted-foreground">{doc.uploadedByName}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(doc.uploadedAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {doc.fileSizeFormatted}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Link to={`/documents/${doc.documentId}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
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
                        </div>
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
    </div>
  );
}