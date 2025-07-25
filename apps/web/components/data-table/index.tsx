'use client';

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
  PaginationState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DataTablePagination } from './pagination';

interface DataTableProps<TData, TValue> {
  fetchData: (
    pageIndex: number,
    pageSize: number,
    sorting: SortingState,
    filters: ColumnFiltersState,
  ) => Promise<{
    data: TData[];
    pageCount: number;
    totalRowCount: number;
  } | null>;
  columns: (
    setData: React.Dispatch<React.SetStateAction<TData[]>>,
    config: Record<string, any>,
  ) => ColumnDef<TData, TValue>[];
  config: Record<string, any>;
  defaultColumnFilters?: ColumnFiltersState;
  defaultSelectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function DataTable<TData, TValue>({
  fetchData,
  columns,
  config,
  defaultColumnFilters = [],
  defaultSelectedRowIds = [],
  onSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(defaultColumnFilters);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [data, setData] = useState<TData[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const _columns = useMemo(() => {
    return columns(setData, config);
  }, [setData, config]);

  const table = useReactTable({
    data: data,
    columns: _columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pageCount,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  const getSelectedRowIds = () => {
    return table.getSelectedRowModel().rows.map((row) => row.id);
  };

  useEffect(() => {
    if (!onSelectionChange) return;
    const selectedRowIds = Object.keys(table.getState().rowSelection);
    const selectedIds = table
      .getRowModel()
      .rows.filter((row) => selectedRowIds.includes(row.id))
      .map((row: any) => row.original.id);
    onSelectionChange(selectedIds);
  }, [table.getState().rowSelection]);

  useEffect(() => {
    const fetchDataFromServer = async () => {
      setIsLoading(true);
      try {
        const response = await fetchData(
          pagination.pageIndex,
          pagination.pageSize,
          sorting,
          columnFilters,
        );
        if (!response) {
          return;
        }
        setData(response.data);
        setPageCount(response.pageCount);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Handle error appropriately (e.g., show error message)
      } finally {
        setIsLoading(false);
      }
    };
    fetchDataFromServer();
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    fetchData,
  ]);

  return (
    <>
      <DataTablePagination table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </>
  );
}
