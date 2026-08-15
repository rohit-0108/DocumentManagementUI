import { useCallback, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

/** Local paging/sorting state shared by every grid. */
export function usePagination({
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
}: UsePaginationOptions = {}) {
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortDesc, setSortDesc] = useState(true);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageNumber(1);
  }, []);

  const toggleSort = useCallback(
    (column: string) => {
      if (sortBy === column) {
        setSortDesc((prev) => !prev);
      } else {
        setSortBy(column);
        setSortDesc(true);
      }
      setPageNumber(1);
    },
    [sortBy],
  );

  const reset = useCallback(() => {
    setPageNumber(1);
    setPageSizeState(initialPageSize);
    setSortBy(undefined);
    setSortDesc(true);
  }, [initialPageSize]);

  return {
    pageNumber,
    pageSize,
    sortBy,
    sortDesc,
    setPageNumber,
    setPageSize,
    toggleSort,
    reset,
  };
}