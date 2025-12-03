import { useState, useMemo } from 'react';
import { Edit, Trash2, RotateCcw, Download, Eye, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateShort } from '../utils/dateFormat';

export default function InvoicesTable({ 
  invoices, 
  suppliers, 
  lang, 
  t, 
  onEdit, 
  onDelete, 
  onCreateReturn 
}) {
  const [viewInvoice, setViewInvoice] = useState(null);
  const [filters, setFilters] = useState({
    invoiceNumber: '',
    date: '',
    supplier: '',
    total: '',
    paymentType: '',
    status: ''
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const supplier = suppliers.find(s => s.id === invoice.supplierId);
      const supplierName = lang === 'ar' ? supplier?.nameAr : supplier?.name;
      
      return (
        (!filters.invoiceNumber || invoice.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase())) &&
        (!filters.date || invoice.invoiceDate.includes(filters.date)) &&
        (!filters.supplier || supplierName?.toLowerCase().includes(filters.supplier.toLowerCase())) &&
        (!filters.total || invoice.totalAmount.toString().includes(filters.total)) &&
        (!filters.paymentType || invoice.paymentType === filters.paymentType) &&
        (!filters.status || invoice.status === filters.status)
      );
    });
  }, [invoices, suppliers, filters, lang]);

  const getStatusBadge = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>
        {t[status]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[150px]">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500">{t.invoiceNumber}</div>
                  <Input
                    placeholder={t.search}
                    value={filters.invoiceNumber}
                    onChange={(e) => setFilters({ ...filters, invoiceNumber: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[150px]">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500">{t.date}</div>
                  <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500">{t.supplierName}</div>
                  <Input
                    placeholder={t.search}
                    value={filters.supplier}
                    onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[120px]">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500">{t.total}</div>
                  <Input
                    placeholder={t.search}
                    value={filters.total}
                    onChange={(e) => setFilters({ ...filters, total: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[120px]">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500">{t.paymentType}</div>
                  <select
                    value={filters.paymentType}
                    onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}
                    className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="">{t.all || 'All'}</option>
                    <option value="credit">{t.credit}</option>
                    <option value="cash">{t.cash}</option>
                  </select>
                </div>
              </TableHead>
              <TableHead className="w-[120px]">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500">{t.status}</div>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="">{t.all || 'All'}</option>
                    <option value="paid">{t.paid}</option>
                    <option value="pending">{t.pending}</option>
                    <option value="overdue">{t.overdue}</option>
                  </select>
                </div>
              </TableHead>
              <TableHead className="w-[120px]">
                <div className="text-xs font-medium text-gray-500">{t.actions}</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {t.noData}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map(invoice => {
                const supplier = suppliers.find(s => s.id === invoice.supplierId);
                return (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatDateShort(invoice.invoiceDate, lang)}</TableCell>
                    <TableCell>{lang === 'ar' ? supplier?.nameAr : supplier?.name}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.totalAmount, lang)}</TableCell>
                    <TableCell>{invoice.paymentType === 'credit' ? t.credit : t.cash}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewInvoice(invoice)}
                          title={t.view || 'View'}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700"
                        >
                          <Eye size={16} />
                        </Button>
                        {invoice.paymentType === 'credit' && invoice.status !== 'paid' && !invoice.invoiceNumber.startsWith('RET-') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onCreateReturn(invoice)}
                            title={t.createReturn}
                            className="h-8 w-8 text-purple-600 hover:text-purple-700"
                          >
                            <RotateCcw size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(invoice)}
                          title={t.edit}
                          className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(invoice.id)}
                          title={t.delete}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Details Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{t.invoiceNumber}: {viewInvoice.invoiceNumber}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewInvoice(null)}
                className="h-8 w-8"
              >
                <X size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t.supplierName}</p>
                  <p className="font-semibold">{lang === 'ar' ? suppliers.find(s => s.id === viewInvoice.supplierId)?.nameAr : suppliers.find(s => s.id === viewInvoice.supplierId)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t.date}</p>
                  <p className="font-semibold">{formatDateShort(viewInvoice.invoiceDate, lang)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t.paymentType}</p>
                  <p className="font-semibold">{viewInvoice.paymentType === 'credit' ? t.credit : t.cash}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t.status}</p>
                  <p>{getStatusBadge(viewInvoice.status)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">{t.items}</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-4 py-2 text-right">{t.itemName}</th>
                      <th className="border px-4 py-2 text-right">{t.quantity}</th>
                      <th className="border px-4 py-2 text-right">{t.unitPrice}</th>
                      <th className="border px-4 py-2 text-right">{t.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewInvoice.items && viewInvoice.items.length > 0 ? (
                      viewInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border px-4 py-2">
                            {lang === 'ar' ? item.itemNameAr : item.itemName}
                          </td>
                          <td className="border px-4 py-2 text-center">{item.quantity}</td>
                          <td className="border px-4 py-2 text-right">{formatCurrency(item.unitPrice, lang)}</td>
                          <td className="border px-4 py-2 text-right font-semibold">{formatCurrency(item.total, lang)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="border px-4 py-2 text-center text-gray-500">
                          {t.noData}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={3} className="border px-4 py-2 text-right">{t.grandTotal}</td>
                      <td className="border px-4 py-2 text-right">{formatCurrency(viewInvoice.totalAmount, lang)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {viewInvoice.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.notes}</p>
                  <p className="bg-gray-50 p-3 rounded">{viewInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

