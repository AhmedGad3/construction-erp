import { useState, useMemo } from 'react';
import { Plus, DollarSign, FileText, Edit, Trash2, Download, X } from 'lucide-react';
import { formatCurrency, formatDateShort } from '../utils/dateFormat';
import { exportToExcel, exportSupplierStatement } from '../utils/excelExport';
import { exportToPDF, exportSupplierStatementToPDF } from '../utils/pdfExport';
import FilterableTable from './FilterableTable';
import { Button } from '@/components/ui/button';


export default function Suppliers({ state, dispatch, t, lang, showToast, currentUser }) {
  const [showModal, setShowModal] = useState(false);
  const [showStatement, setShowStatement] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    contactPerson: '',
    phone: '',
    address: '',
    paymentTermsDays: 60,
    notes: '',
    isActive: true
  });

  const calculateBalance = (supplierId) => {
    const creditInvoices = state.invoices.filter(
      inv => inv.supplierId === supplierId && inv.paymentType === 'credit'
    );
    const totalPurchases = creditInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
    const totalPayments = state.payments
      .filter(p => p.supplierId === supplierId)
      .reduce((s, p) => s + p.amount, 0);
    return totalPurchases - totalPayments;
  };

  const suppliersWithBalance = useMemo(() => {
    return state.suppliers.map(supplier => ({
      ...supplier,
      balance: calculateBalance(supplier.id)
    }));
  }, [state.suppliers, state.invoices, state.payments]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSupplier) {
      dispatch({ type: 'UPDATE_SUPPLIER', payload: { ...editingSupplier, ...formData } });
      showToast(t.supplierUpdated);
    } else {
      const newSupplier = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0]
      };
      dispatch({ type: 'ADD_SUPPLIER', payload: newSupplier });
      showToast(t.supplierAdded);
    }
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      nameAr: '',
      contactPerson: '',
      phone: '',
      address: '',
      paymentTermsDays: 60,
      notes: '',
      isActive: true
    });
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      nameAr: supplier.nameAr,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      address: supplier.address,
      paymentTermsDays: supplier.paymentTermsDays,
      notes: supplier.notes || '',
      isActive: supplier.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t.confirmDelete)) {
      dispatch({ type: 'DELETE_SUPPLIER', payload: id });
      showToast(t.supplierDeleted);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      { [t.supplierName]: t.supplierName },
      { [t.contactPerson]: t.contactPerson },
      { [t.phone]: t.phone },
      { [t.address]: t.address },
      { [t.currentBalance]: t.currentBalance },
      { [t.status]: t.status }
    ];
    
    const data = suppliersWithBalance.map(s => ({
      [t.supplierName]: lang === 'ar' ? s.nameAr : s.name,
      [t.contactPerson]: s.contactPerson,
      [t.phone]: s.phone,
      [t.address]: s.address,
      [t.currentBalance]: s.balance,
      [t.status]: s.isActive ? t.active : t.inactive
    }));
    
    exportToExcel(data, headers, 'Suppliers_List', lang);
    showToast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully');
  };

  const handleExportPDF = () => {
    const headers = [
      { [t.supplierName]: t.supplierName },
      { [t.contactPerson]: t.contactPerson },
      { [t.phone]: t.phone },
      { [t.address]: t.address },
      { [t.currentBalance]: t.currentBalance },
      { [t.status]: t.status }
    ];
    
    const data = suppliersWithBalance.map(s => ({
      [t.supplierName]: lang === 'ar' ? s.nameAr : s.name,
      [t.contactPerson]: s.contactPerson,
      [t.phone]: s.phone,
      [t.address]: s.address,
      [t.currentBalance]: s.balance,
      [t.status]: s.isActive ? t.active : t.inactive
    }));
    
    exportToPDF(data, headers, 'Suppliers_List', lang, t.allSuppliers);
    showToast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully');
  };

  const supplierColumns = [
    {
      key: 'name',
      header: t.supplierName,
      accessor: (row) => lang === 'ar' ? row.nameAr : row.name,
    },
    {
      key: 'contactPerson',
      header: t.contactPerson,
    },
    {
      key: 'phone',
      header: t.phone,
    },
    {
      key: 'balance',
      header: t.currentBalance,
      accessor: (row) => row.balance,
      render: (value) => (
        <span className={`font-semibold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(value, lang)}
        </span>
      ),
      filterType: 'number',
    },
    {
      key: 'isActive',
      header: t.status,
      accessor: (row) => row.isActive ? t.active : t.inactive,
      render: (value, row) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {value}
        </span>
      ),
      filterType: 'select',
      options: [
        { value: 'true', label: t.active, labelAr: t.active },
        { value: 'false', label: t.inactive, labelAr: t.inactive },
      ],
    },
  ];

  const handleExportStatement = (supplier, format = 'excel') => {
    const invoices = state.invoices.filter(inv => inv.supplierId === supplier.id);
    const payments = state.payments.filter(p => p.supplierId === supplier.id);
    if (format === 'pdf') {
      exportSupplierStatementToPDF(supplier, invoices, payments, lang);
    } else {
      exportSupplierStatement(supplier, invoices, payments, lang);
    }
    showToast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t.allSuppliers}</h2>
        <div className="flex gap-3">
        <div className="flex gap-2">
  {/* زر Excel */}
  <Button
    onClick={handleExportExcel}
    className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
  >
    <Download size={18} />
    Excel
  </Button>

  {/* زر PDF */}
  <Button
    onClick={handleExportPDF}
    className="bg-red-500 hover:bg-red-600 flex items-center gap-2"
  >
    <Download size={18} />
    PDF
  </Button>
</div>

          <Button
            onClick={() => {
              setEditingSupplier(null);
              setFormData({
                name: '',
                nameAr: '',
                contactPerson: '',
                phone: '',
                address: '',
                paymentTermsDays: 60,
                notes: '',
                isActive: true
              });
              setShowModal(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            {t.addSupplier}
          </Button>
        </div>
      </div>

      <FilterableTable
        data={suppliersWithBalance}
        columns={supplierColumns}
        lang={lang}
        t={t}
        renderActions={(supplier) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStatement(supplier)}
              title={t.viewStatement}
              className="h-8 w-8 text-blue-600 hover:text-blue-700"
            >
              <FileText size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPaymentModal(supplier)}
              title={t.addPayment}
              className="h-8 w-8 text-green-600 hover:text-green-700"
            >
              <DollarSign size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(supplier)}
              title={t.edit}
              className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(supplier.id)}
              title={t.delete}
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingSupplier ? t.editSupplier : t.addSupplier}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.supplierName} (EN)</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.supplierName} (AR)</label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.contactPerson}</label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentTerms}</label>
                <input
                  type="number"
                  required
                  value={formData.paymentTermsDays}
                  onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">{t.active}</label>
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

      {/* Statement Modal */}
      {showStatement && (
        <StatementModal
          supplier={showStatement}
          state={state}
          t={t}
          lang={lang}
          onClose={() => setShowStatement(null)}
          onExport={(format) => handleExportStatement(showStatement, format)}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          supplier={showPaymentModal}
          state={state}
          dispatch={dispatch}
          t={t}
          lang={lang}
          showToast={showToast}
          onClose={() => setShowPaymentModal(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

function StatementModal({ supplier, state, t, lang, onClose, onExport }) {
  const invoices = state.invoices.filter(inv => inv.supplierId === supplier.id);
  const payments = state.payments.filter(p => p.supplierId === supplier.id);
  
  const transactions = [];
  let runningBalance = 0;
  
  invoices.forEach(inv => {
    runningBalance += inv.totalAmount;
    transactions.push({
      date: inv.invoiceDate,
      type: 'invoice',
      reference: inv.invoiceNumber,
      amount: inv.totalAmount,
      balance: runningBalance
    });
  });
  
  payments.forEach(pay => {
    runningBalance -= pay.amount;
    transactions.push({
      date: pay.paymentDate,
      type: 'payment',
      reference: pay.referenceNumber || '-',
      amount: -pay.amount,
      balance: runningBalance
    });
  });
  
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{t.supplierStatement}: {lang === 'ar' ? supplier.nameAr : supplier.name}</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => onExport('excel')}
              className="bg-green-500 hover:bg-green-600"
            >
              <Download size={16} className="mr-2" />
              Excel
            </Button>
            <Button
              onClick={() => onExport('pdf')}
              className="bg-red-500 hover:bg-red-600"
            >
              <FileText size={16} className="mr-2" />
              PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-right">{t.date}</th>
              <th className="px-4 py-2 text-right">{t.invoiceNumber}</th>
              <th className="px-4 py-2 text-right">{t.amount}</th>
              <th className="px-4 py-2 text-right">{t.currentBalance}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((trans, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-2">{formatDateShort(trans.date, lang)}</td>
                <td className="px-4 py-2">{trans.reference}</td>
                <td className={`px-4 py-2 font-semibold ${trans.amount > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(trans.amount), lang)}
                </td>
                <td className="px-4 py-2 font-semibold">{formatCurrency(trans.balance, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentModal({ supplier, state, dispatch, t, lang, showToast, onClose, currentUser }) {
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
    createdBy: currentUser ? (lang === 'ar' ? currentUser.nameAr : currentUser.name) : 'Admin'
  });

  const balance = state.invoices
    .filter(inv => inv.supplierId === supplier.id && inv.paymentType === 'credit')
    .reduce((s, inv) => s + inv.totalAmount, 0) -
    state.payments
      .filter(p => p.supplierId === supplier.id)
      .reduce((s, p) => s + p.amount, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payment = {
      ...formData,
      id: Date.now(),
      supplierId: supplier.id,
      amount: parseFloat(formData.amount),
      createdAt: new Date().toISOString().split('T')[0]
    };
    dispatch({ type: 'ADD_PAYMENT', payload: payment });
    showToast(t.paymentRecorded);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{t.addPayment}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <p className="mb-4 text-gray-600">
          {t.currentBalance}: <span className="font-bold">{formatCurrency(balance, lang)}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={onClose}
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
  );
}

