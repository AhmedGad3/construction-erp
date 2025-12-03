import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ReportsTable({ 
  data, 
  columns, 
  lang,
  t,
  renderActions
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                className="border-r last:border-r-0 px-4 py-3 text-xs font-medium text-gray-700 uppercase"
              >
                {column.header}
              </TableHead>
            ))}
            {renderActions && (
              <TableHead className="w-[120px] border-r px-4 py-3 text-xs font-medium text-gray-700 uppercase">
                {t.actions}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data || data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (renderActions ? 1 : 0)} className="text-center py-8 text-gray-500">
                {t.noData}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={row.id || index} className="hover:bg-gray-50 border-b">
                {columns.map((column) => {
                  const cellValue = column.accessor ? column.accessor(row) : row[column.key];
                  const displayValue = column.render ? column.render(cellValue, row) : cellValue;
                  
                  return (
                    <TableCell key={column.key} className={`${column.className || ''} border-r last:border-r-0 px-4 py-3`}>
                      {displayValue}
                    </TableCell>
                  );
                })}
                {renderActions && (
                  <TableCell className="border-r px-4 py-3">
                    {renderActions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}



