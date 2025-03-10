import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  getSortedRowModel,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { DataTableToolbar } from './data-table-toolbar';
import { FC, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Todo } from '@todo/shared';
import { emptyTodo} from '../constants';
import { useDeleteTodo } from '../hooks/use-delete-todo';
import { useAddTodo } from '../hooks/use-add-todo';

export interface DataTableMeta {
  updateRow: (rowIndex: number, columnId: string, value: unknown) => void;
  addRow: () => void;
  deleteRow: (id: number) => void;
}

interface DataTableProps {
  columns: ColumnDef<Todo>[];
  data: Todo[];
}

export const DataTable: FC<DataTableProps> = ({
  columns,
  data: defaultData,
}) => {
  const [data, setData] = useState(() => [...defaultData]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const queryClient = useQueryClient();
  const addTodoMutation = useAddTodo(queryClient)
  const deleteTodoMutation = useDeleteTodo(queryClient)

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
    },
    meta: {
      updateRow: (rowIndex, columnId, value) => {
        setData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex],
                [columnId]: value,
              };
            }
            return row;
          }),
        );
      },
      addRow: () => {
        setData((oldTodo) => [...oldTodo, emptyTodo as Todo]);
      },
      deleteRow: (id: number) => {
        setData((oldTodo) => oldTodo.filter((t) => t.id !== id));
        deleteTodoMutation.mutate(id);

      },
    } satisfies DataTableMeta,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onStateChange: () => {
      const [selectedRowIndex] = Object.keys(rowSelection);
      if (selectedRowIndex) {
        const todo = table.getRow(String(selectedRowIndex))?.original;
        addTodoMutation.mutate(todo);
      }
      setRowSelection({});
    },
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
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
                    <TableCell key={cell.id} width={cell.column.getSize()}>
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
    </div>
  );
};
