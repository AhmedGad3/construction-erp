import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Download, X, FileText } from 'lucide-react';
import { formatCurrency, formatDateShort } from '../utils/dateFormat';
import { exportToExcel } from '../utils/excelExport';
import { exportToPDF } from '../utils/pdfExport';
import FilterableTable from './FilterableTable';
import { Button } from '@/components/ui/button';

export default function Payments({ state, dispatch, t, lang, showToast, currentUser }) {
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    supplierId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
    createdBy: currentUser ? (lang === 'ar' ? currentUser.nameAr : currentUser.name) : 'Admin'
  });

  const paymentsWithSupplier = useMemo(() => {
    return state.payments.map(payment => {
      const supplier = state.suppliers.find(s => s.id === payment.supplierId);
      return {
        ...payment,
        supplierName: lang === 'ar' ? supplier?.nameAr : supplier?.name,
      };
    });
  }, [state.payments, state.suppliers, lang]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payment = {
      ...formData,
      id: editingPayment ? editingPayment.id : Date.now(),
      amount: parseFloat(formData.amount),
      createdAt: editingPayment ? editingPayment.createdAt : new Date().toISOString().split('T')[0]
    };

    if (editingPayment) {
      dispatch({ type: 'UPDATE_PAYMENT', payload: payment });
      showToast('Payment updated');
    } else {
      dispatch({ type: 'ADD_PAYMENT', payload: payment });
      showToast(t.paymentRecorded);
    }
    
    setShowModal(false);
    setEditingPayment(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: '',
      createdBy: currentUser ? (lang === 'ar' ? currentUser.nameAr : currentUser.name) : 'Admin'
    });
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      supplierId: payment.supplierId,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber || '',
      notes: payment.notes || '',
      createdBy: payment.createdBy
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t.confirmDelete)) {
      dispatch({ type: 'DELETE_PAYMENT', payload: id });
      showToast('Payment deleted');
    }
  };

  const handleExportExcel = () => {
    const headers = [
      { [t.date]: t.date },
      { [t.supplierName]: t.supplierName },
      { [t.amount]: t.amount },
      { [t.paymentMethod]: t.paymentMethod },
      { [t.referenceNumber]: t.referenceNumber },
      { [t.createdBy]: t.createdBy }
    ];
    
    const data = paymentsWithSupplier.map(pay => ({
      [t.date]: formatDateShort(pay.paymentDate, lang),
      [t.supplierName]: pay.supplierName,
      [t.amount]: pay.amount,
      [t.paymentMethod]: t[pay.paymentMethod] || pay.paymentMethod,
      [t.referenceNumber]: pay.referenceNumber || '-',
      [t.createdBy]: pay.createdBy
    }));
    
    if (data.length === 0) {
      showToast(lang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', 'error');
      return;
    }
    
    exportToExcel(data, headers, 'Payment_History', lang);
    showToast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully');
  };

  const handleExportPDF = () => {
    const headers = [
      { [t.date]: t.date },
      { [t.supplierName]: t.supplierName },
      { [t.amount]: t.amount },
      { [t.paymentMethod]: t.paymentMethod },
      { [t.referenceNumber]: t.referenceNumber },
      { [t.createdBy]: t.createdBy }
    ];
    
    const data = paymentsWithSupplier.map(pay => ({
      [t.date]: formatDateShort(pay.paymentDate, lang),
      [t.supplierName]: pay.supplierName,
      [t.amount]: pay.amount,
      [t.paymentMethod]: t[pay.paymentMethod] || pay.paymentMethod,
      [t.referenceNumber]: pay.referenceNumber || '-',
      [t.createdBy]: pay.createdBy
    }));
    
    if (data.length === 0) {
      showToast(lang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', 'error');
      return;
    }
    
    exportToPDF(data, headers, 'Payment_History', lang, t.allPayments);
    showToast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully');
  };

  const paymentColumns = [
    {
      key: 'paymentDate',
      header: t.date,
      accessor: (row) => formatDateShort(row.paymentDate, lang),
      filterType: 'date',
    },
    {
      key: 'supplierName',
      header: t.supplierName,
      accessor: (row) => row.supplierName,
    },
    {
      key: 'amount',
      header: t.amount,
      accessor: (row) => row.amount,
      render: (value) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(value, lang)}
        </span>
      ),
      filterType: 'number',
    },
    {
      key: 'paymentMethod',
      header: t.paymentMethod,
      accessor: (row) => getMethodLabel(row.paymentMethod),
      filterType: 'select',
      options: [
        { value: 'cash', label: t.cash, labelAr: t.cash },
        { value: 'check', label: t.check, labelAr: t.check },
        { value: 'bank_transfer', label: t.bankTransfer, labelAr: t.bankTransfer },
      ],
    },
    {
      key: 'referenceNumber',
      header: t.referenceNumber,
      accessor: (row) => row.referenceNumber || '-',
    },
    {
      key: 'createdBy',
      header: t.createdBy,
    },
  ];

  const getMethodLabel = (method) => {
    const labels = {
      cash: t.cash,
      check: t.check,
      bank_transfer: t.bankTransfer
    };
    return labels[method] || method;
  };

  const getSupplierBalance = (supplierId) => {
    const creditInvoices = state.invoices.filter(
      inv => inv.supplierId === supplierId && inv.paymentType === 'credit'
    );
    const totalPurchases = creditInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
    const totalPayments = state.payments
      .filter(p => p.supplierId === supplierId)
      .reduce((s, p) => s + p.amount, 0);
    return totalPurchases - totalPayments;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t.allPayments}</h2>
        <div className="flex gap-3">
          <Button
            onClick={handleExportExcel}
            className="bg-green-500 hover:bg-green-600"
          >
            <Download size={20} className="mr-2" />
            Excel
          </Button>
          <Button
            onClick={handleExportPDF}
            className="bg-red-500 hover:bg-red-600"
          >
            <FileText size={20} className="mr-2" />
            PDF
          </Button>
          <Button
            onClick={() => {
              setEditingPayment(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            {t.recordPayment}
          </Button>
        </div>
      </div>

      <FilterableTable
        data={paymentsWithSupplier}
        columns={paymentColumns}
        lang={lang}
        t={t}
        renderActions={(payment) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(payment)}
              title={t.edit}
              className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(payment.id)}
              title={t.delete}
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      />

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingPayment ? t.edit : t.recordPayment}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.supplierName}</label>
                <select
                  required
                  value={formData.supplierId}
                  onChange={(e) => {
                    setFormData({ ...formData, supplierId: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">{t.selectSupplier || 'Select Supplier'}</option>
                  {state.suppliers.map(s => (
                    <option key={s.id} value={s.id}>{lang === 'ar' ? s.nameAr : s.name}</option>
                  ))}
                </select>
                {formData.supplierId && (
                  <p className="mt-1 text-sm text-gray-600">
                    {t.currentBalance}: <span className="font-bold">{formatCurrency(getSupplierBalance(parseInt(formData.supplierId)), lang)}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentAmount}</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentDate}</label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentMethod}</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="cash">{t.cash}</option>
                  <option value="check">{t.check}</option>
                  <option value="bank_transfer">{t.bankTransfer}</option>
                </select>
              </div>
              {(formData.paymentMethod === 'check' || formData.paymentMethod === 'bank_transfer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.referenceNumber}</label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

