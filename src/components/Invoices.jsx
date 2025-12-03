import { useState } from 'react';
import { Plus, Download, X, FileText } from 'lucide-react';
import { formatCurrency, formatDateShort } from '../utils/dateFormat';
import { exportToExcel } from '../utils/excelExport';
import { exportToPDF } from '../utils/pdfExport';
import InvoicesTable from './InvoicesTable';

import { Button } from '@/components/ui/button';

export default function Invoices({ state, dispatch, t, lang, showToast, currentUser }) {
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    supplierId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentType: 'credit',
    items: [{ itemName: '', itemNameAr: '', quantity: '', unitPrice: '', total: 0 }],
    notes: '',
    createdBy: currentUser ? (lang === 'ar' ? currentUser.nameAr : currentUser.name) : 'Admin'
  });


  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].total = qty * price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', itemNameAr: '', quantity: '', unitPrice: '', total: 0 }]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalAmount = calculateTotal(formData.items);
    const dueDate = formData.paymentType === 'credit' 
      ? new Date(new Date(formData.invoiceDate).getTime() + (60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      : null;
    
    const invoice = {
      ...formData,
      id: editingInvoice ? editingInvoice.id : Date.now(),
      totalAmount,
      dueDate,
      status: formData.paymentType === 'cash' ? 'paid' : 'pending',
      items: formData.items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        total: parseFloat(item.quantity) * parseFloat(item.unitPrice)
      })),
      createdAt: editingInvoice ? editingInvoice.createdAt : new Date().toISOString().split('T')[0]
    };

    if (editingInvoice) {
      dispatch({ type: 'UPDATE_INVOICE', payload: invoice });
      showToast(t.invoiceUpdated);
    } else {
      dispatch({ type: 'ADD_INVOICE', payload: invoice });
      showToast(t.invoiceCreated);
    }
    
    setShowModal(false);
    setEditingInvoice(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentType: 'credit',
      items: [{ itemName: '', itemNameAr: '', quantity: '', unitPrice: '', total: 0 }],
      notes: '',
      createdBy: currentUser ? (lang === 'ar' ? currentUser.nameAr : currentUser.name) : 'Admin'
    });
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      supplierId: invoice.supplierId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      paymentType: invoice.paymentType,
      items: invoice.items.length > 0 ? invoice.items : [{ itemName: '', itemNameAr: '', quantity: '', unitPrice: '', total: 0 }],
      notes: invoice.notes || '',
      createdBy: invoice.createdBy
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t.confirmDelete)) {
      dispatch({ type: 'DELETE_INVOICE', payload: id });
      showToast('Invoice deleted');
    }
  };

  const handleCreateReturn = (invoice) => {
    const returnInvoice = {
      ...invoice,
      id: Date.now(),
      invoiceNumber: `RET-${invoice.invoiceNumber}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      items: invoice.items.map(item => ({
        ...item,
        quantity: -Math.abs(item.quantity)
      })),
      totalAmount: -Math.abs(invoice.totalAmount),
      notes: `${t.returnInvoice} - ${invoice.invoiceNumber}`,
      status: 'paid',
      createdAt: new Date().toISOString().split('T')[0]
    };
    dispatch({ type: 'ADD_INVOICE', payload: returnInvoice });
    showToast('Return invoice created');
  };

  const handleExportExcel = () => {
    const headers = [
      { [t.invoiceNumber]: t.invoiceNumber },
      { [t.date]: t.date },
      { [t.supplierName]: t.supplierName },
      { [t.paymentType]: t.paymentType },
      { [t.total]: t.total },
      { [t.status]: t.status }
    ];
    
    const data = state.invoices.map(inv => {
      const supplier = state.suppliers.find(s => s.id === inv.supplierId);
      return {
        [t.invoiceNumber]: inv.invoiceNumber,
        [t.date]: formatDateShort(inv.invoiceDate, lang),
        [t.supplierName]: lang === 'ar' ? supplier?.nameAr : supplier?.name,
        [t.paymentType]: inv.paymentType === 'credit' ? t.credit : t.cash,
        [t.total]: inv.totalAmount,
        [t.status]: t[inv.status]
      };
    });
    
    if (data.length === 0) {
      showToast(lang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', 'error');
      return;
    }
    
    exportToExcel(data, headers, 'Purchase_Invoices', lang);
    showToast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully');
  };

  const handleExportPDF = () => {
    const headers = [
      { [t.invoiceNumber]: t.invoiceNumber },
      { [t.date]: t.date },
      { [t.supplierName]: t.supplierName },
      { [t.paymentType]: t.paymentType },
      { [t.total]: t.total },
      { [t.status]: t.status }
    ];
    
    const data = state.invoices.map(inv => {
      const supplier = state.suppliers.find(s => s.id === inv.supplierId);
      return {
        [t.invoiceNumber]: inv.invoiceNumber,
        [t.date]: formatDateShort(inv.invoiceDate, lang),
        [t.supplierName]: lang === 'ar' ? supplier?.nameAr : supplier?.name,
        [t.paymentType]: inv.paymentType === 'credit' ? t.credit : t.cash,
        [t.total]: inv.totalAmount,
        [t.status]: t[inv.status]
      };
    });
    
    if (data.length === 0) {
      showToast(lang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', 'error');
      return;
    }
    
    exportToPDF(data, headers, 'Purchase_Invoices', lang, t.allInvoices);
    showToast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully');
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t.allInvoices}</h2>
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
              setEditingInvoice(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            {t.createInvoice}
          </Button>
        </div>
      </div>

      <InvoicesTable
        invoices={state.invoices}
        suppliers={state.suppliers}
        lang={lang}
        t={t}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateReturn={handleCreateReturn}
      />

      {/* Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingInvoice ? t.editInvoice : t.createInvoice}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.supplierName}</label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">{t.selectSupplier || 'Select Supplier'}</option>
                    {state.suppliers.map(s => (
                      <option key={s.id} value={s.id}>{lang === 'ar' ? s.nameAr : s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.invoiceNumber}</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.invoiceDate}</label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentType}</label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="credit">{t.credit}</option>
                    <option value="cash">{t.cash}</option>
                  </select>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">{t.items || 'Items'}</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    {t.addNew || 'Add Item'}
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t.itemName} (EN)</label>
                        <input
                          type="text"
                          required
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t.itemName} (AR)</label>
                        <input
                          type="text"
                          required
                          value={item.itemNameAr}
                          onChange={(e) => handleItemChange(index, 'itemNameAr', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t.quantity}</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t.unitPrice}</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex gap-1">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">{t.total}</label>
                          <input
                            type="text"
                            readOnly
                            value={formatCurrency(item.total || 0, lang)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                          />
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <p className="text-lg font-bold">
                    {t.grandTotal}: {formatCurrency(calculateTotal(formData.items), lang)}
                  </p>
                </div>
              </div>
              
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

