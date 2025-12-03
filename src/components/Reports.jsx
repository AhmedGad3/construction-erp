import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, FileText, AlertCircle, CreditCard, Calendar, X, Search, Settings, FileSpreadsheet, File } from 'lucide-react';
import { formatCurrency, formatDateShort } from '../utils/dateFormat';
import { exportToExcel, exportSupplierStatement } from '../utils/excelExport';
import { exportToPDF, exportSupplierStatementToPDF } from '../utils/pdfExport';
import ReportsTable from './ReportsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export default function Reports({ state, t, lang, showToast }) {
  const [selectedReport, setSelectedReport] = useState('statement');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Default showToast if not provided
  const toast = showToast || ((msg, type) => console.log(`${type}: ${msg}`));

  const reportData = useMemo(() => {
    switch (selectedReport) {
      case 'statement':
        if (!selectedSupplier) return null;
        const supplier = state.suppliers.find(s => s.id === parseInt(selectedSupplier));
        if (!supplier) return null;
        const invoices = state.invoices.filter(inv => {
          if (inv.supplierId !== supplier.id) return false;
          if (dateFrom && new Date(inv.invoiceDate) < new Date(dateFrom)) return false;
          if (dateTo && new Date(inv.invoiceDate) > new Date(dateTo)) return false;
          return true;
        });
        const payments = state.payments.filter(p => {
          if (p.supplierId !== supplier.id) return false;
          if (dateFrom && new Date(p.paymentDate) < new Date(dateFrom)) return false;
          if (dateTo && new Date(p.paymentDate) > new Date(dateTo)) return false;
          return true;
        });
        return { supplier, invoices, payments };
      
      case 'purchaseHistory':
        return state.invoices.filter(inv => {
          if (dateFrom && new Date(inv.invoiceDate) < new Date(dateFrom)) return false;
          if (dateTo && new Date(inv.invoiceDate) > new Date(dateTo)) return false;
          return true;
        }).map(inv => {
          const supplier = state.suppliers.find(s => s.id === inv.supplierId);
          return {
            ...inv,
            supplierName: lang === 'ar' ? supplier?.nameAr : supplier?.name,
          };
        });
      
      case 'overdue':
        return state.invoices.filter(inv => {
          if (inv.status !== 'overdue') return false;
          if (dateFrom && inv.dueDate && new Date(inv.dueDate) < new Date(dateFrom)) return false;
          if (dateTo && inv.dueDate && new Date(inv.dueDate) > new Date(dateTo)) return false;
          return true;
        }).map(inv => {
          const supplier = state.suppliers.find(s => s.id === inv.supplierId);
          return {
            ...inv,
            supplierName: lang === 'ar' ? supplier?.nameAr : supplier?.name,
          };
        });
      
      case 'paymentHistory':
        return state.payments.filter(p => {
          if (dateFrom && new Date(p.paymentDate) < new Date(dateFrom)) return false;
          if (dateTo && new Date(p.paymentDate) > new Date(dateTo)) return false;
          return true;
        }).map(p => {
          const supplier = state.suppliers.find(s => s.id === p.supplierId);
          return {
            ...p,
            supplierName: lang === 'ar' ? supplier?.nameAr : supplier?.name,
            paymentMethodLabel: t[p.paymentMethod] || p.paymentMethod,
          };
        });
      
      case 'financialMovements':
        const movements = [];
        let openingBalance = 0;
        
        // Add all invoices as debit
        state.invoices.forEach(inv => {
          if (dateFrom && new Date(inv.invoiceDate) < new Date(dateFrom)) {
            openingBalance += inv.totalAmount;
            return;
          }
          if (dateTo && new Date(inv.invoiceDate) > new Date(dateTo)) return;
          
          const supplier = state.suppliers.find(s => s.id === inv.supplierId);
          movements.push({
            id: `inv-${inv.id}`,
            date: inv.invoiceDate,
            type: 'debit',
            description: `${t.invoiceNumber}: ${inv.invoiceNumber}`,
            supplier: lang === 'ar' ? supplier?.nameAr : supplier?.name,
            amount: inv.totalAmount,
            balance: 0
          });
        });
        
        // Add all payments as credit
        state.payments.forEach(p => {
          if (dateFrom && new Date(p.paymentDate) < new Date(dateFrom)) {
            openingBalance -= p.amount;
            return;
          }
          if (dateTo && new Date(p.paymentDate) > new Date(dateTo)) return;
          
          const supplier = state.suppliers.find(s => s.id === p.supplierId);
          movements.push({
            id: `pay-${p.id}`,
            date: p.paymentDate,
            type: 'credit',
            description: `${t.payment}: ${p.referenceNumber || '-'}`,
            supplier: lang === 'ar' ? supplier?.nameAr : supplier?.name,
            amount: p.amount,
            balance: 0
          });
        });
        
        // Sort by date and calculate running balance
        movements.sort((a, b) => new Date(a.date) - new Date(b.date));
        let runningBalance = openingBalance;
        movements.forEach(m => {
          if (m.type === 'debit') {
            runningBalance += m.amount;
          } else {
            runningBalance -= m.amount;
          }
          m.balance = runningBalance;
        });
        
        return { movements, openingBalance, closingBalance: runningBalance };
      
      case 'monthlySummary':
        const months = {};
        state.invoices.forEach(inv => {
          const month = inv.invoiceDate.substring(0, 7);
          if (!months[month]) {
            months[month] = { month, purchases: 0, payments: 0, id: month };
          }
          months[month].purchases += inv.totalAmount;
        });
        state.payments.forEach(p => {
          const month = p.paymentDate.substring(0, 7);
          if (!months[month]) {
            months[month] = { month, purchases: 0, payments: 0, id: month };
          }
          months[month].payments += p.amount;
        });
        return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
      
      default:
        return null;
    }
  }, [selectedReport, selectedSupplier, dateFrom, dateTo, state, lang, t]);

  const getExportData = () => {
    switch (selectedReport) {
      case 'statement':
        if (!reportData) return null;
        const { supplier, invoices, payments } = reportData;
        const transactions = [];
        let runningBalance = 0;
        
        invoices.forEach(inv => {
          runningBalance += inv.totalAmount;
          transactions.push({
            [t.date]: formatDateShort(inv.invoiceDate, lang),
            [t.invoiceNumber]: inv.invoiceNumber,
            Type: t.invoice,
            [t.amount]: inv.totalAmount,
            [t.currentBalance]: runningBalance,
            _sortDate: inv.invoiceDate
          });
        });
        
        payments.forEach(pay => {
          runningBalance -= pay.amount;
          transactions.push({
            [t.date]: formatDateShort(pay.paymentDate, lang),
            [t.invoiceNumber]: pay.referenceNumber || '-',
            Type: t.payment,
            [t.amount]: -pay.amount,
            [t.currentBalance]: runningBalance,
            _sortDate: pay.paymentDate
          });
        });
        
        transactions.sort((a, b) => new Date(a._sortDate) - new Date(b._sortDate));
        
        return {
          headers: [
            { [t.date]: t.date },
            { [t.invoiceNumber]: t.invoiceNumber },
            { Type: 'Type' },
            { [t.amount]: t.amount },
            { [t.currentBalance]: t.currentBalance }
          ],
          data: transactions,
          title: `${t.supplierStatement}: ${lang === 'ar' ? supplier.nameAr : supplier.name}`,
          fileName: `Supplier_Statement_${supplier.name.replace(/\s+/g, '_')}`
        };
      
      case 'purchaseHistory':
        const purchaseHeaders = [
          { [t.invoiceNumber]: t.invoiceNumber },
          { [t.date]: t.date },
          { [t.supplierName]: t.supplierName },
          { [t.paymentType]: t.paymentType },
          { [t.total]: t.total },
          { [t.status]: t.status }
        ];
        const purchaseData = reportData.map(inv => ({
          [t.invoiceNumber]: inv.invoiceNumber,
          [t.date]: formatDateShort(inv.invoiceDate, lang),
          [t.supplierName]: inv.supplierName,
          [t.paymentType]: inv.paymentType === 'credit' ? t.credit : t.cash,
          [t.total]: inv.totalAmount,
          [t.status]: t[inv.status]
        }));
        return {
          headers: purchaseHeaders,
          data: purchaseData,
          title: t.purchaseHistory,
          fileName: 'Purchase_History'
        };
      
      case 'overdue':
        const overdueHeaders = [
          { [t.invoiceNumber]: t.invoiceNumber },
          { [t.date]: t.date },
          { [t.dueDate]: t.dueDate },
          { [t.supplierName]: t.supplierName },
          { [t.total]: t.total }
        ];
        const overdueData = reportData.map(inv => ({
          [t.invoiceNumber]: inv.invoiceNumber,
          [t.date]: formatDateShort(inv.invoiceDate, lang),
          [t.dueDate]: formatDateShort(inv.dueDate, lang),
          [t.supplierName]: inv.supplierName,
          [t.total]: inv.totalAmount
        }));
        return {
          headers: overdueHeaders,
          data: overdueData,
          title: t.overdueInvoicesReport,
          fileName: 'Overdue_Invoices'
        };
      
      case 'paymentHistory':
        const paymentHeaders = [
          { [t.date]: t.date },
          { [t.supplierName]: t.supplierName },
          { [t.amount]: t.amount },
          { [t.paymentMethod]: t.paymentMethod },
          { [t.referenceNumber]: t.referenceNumber },
          { [t.createdBy]: t.createdBy }
        ];
        const paymentData = reportData.map(p => ({
          [t.date]: formatDateShort(p.paymentDate, lang),
          [t.supplierName]: p.supplierName,
          [t.amount]: p.amount,
          [t.paymentMethod]: p.paymentMethodLabel,
          [t.referenceNumber]: p.referenceNumber || '-',
          [t.createdBy]: p.createdBy
        }));
        return {
          headers: paymentHeaders,
          data: paymentData,
          title: t.paymentHistory,
          fileName: 'Payment_History'
        };
      
      case 'financialMovements':
        const { movements: fmMovements } = reportData;
        const financialHeaders = [
          { [t.date]: t.date },
          { [t.transactionType]: t.transactionType },
          { Description: 'Description' },
          { [t.supplierName]: t.supplierName },
          { [t.amount]: t.amount },
          { [t.currentBalance]: t.currentBalance }
        ];
        const financialData = fmMovements.map(m => ({
          [t.date]: formatDateShort(m.date, lang),
          [t.transactionType]: m.type === 'debit' ? t.debit : t.credit,
          Description: m.description,
          [t.supplierName]: m.supplier,
          [t.amount]: m.amount,
          [t.currentBalance]: m.balance
        }));
        return {
          headers: financialHeaders,
          data: financialData,
          title: t.financialMovements,
          fileName: 'Financial_Movements'
        };
      
      case 'monthlySummary':
        const summaryHeaders = [
          { Month: 'Month' },
          { [t.purchases]: t.purchases },
          { [t.payments]: t.payments },
          { Net: 'Net' }
        ];
        const summaryData = reportData.map(m => ({
          Month: m.month,
          [t.purchases]: m.purchases,
          [t.payments]: m.payments,
          Net: m.purchases - m.payments
        }));
        return {
          headers: summaryHeaders,
          data: summaryData,
          title: t.monthlySummary,
          fileName: 'Monthly_Summary'
        };
      
      default:
        return null;
    }
  };

  const handleExportExcel = () => {
    const exportData = getExportData();
    if (!exportData || !exportData.data || exportData.data.length === 0) {
      toast(lang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', 'error');
      return;
    }
    
    if (selectedReport === 'statement' && reportData) {
      exportSupplierStatement(reportData.supplier, reportData.invoices, reportData.payments, lang);
    } else {
      exportToExcel(exportData.data, exportData.headers, exportData.fileName, lang);
    }
    toast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully', 'success');
  };

  const handleExportPDF = () => {
    const exportData = getExportData();
    if (!exportData || !exportData.data || exportData.data.length === 0) {
      toast(lang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', 'error');
      return;
    }
    
    if (selectedReport === 'statement' && reportData) {
      exportSupplierStatementToPDF(reportData.supplier, reportData.invoices, reportData.payments, lang);
    } else {
      exportToPDF(exportData.data, exportData.headers, exportData.fileName, lang, exportData.title);
    }
    toast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully', 'success');
  };

  const purchaseHistoryColumns = [
    {
      key: 'invoiceNumber',
      header: t.invoiceNumber,
    },
    {
      key: 'invoiceDate',
      header: t.date,
      accessor: (row) => formatDateShort(row.invoiceDate, lang),
      filterType: 'date',
    },
    {
      key: 'supplierName',
      header: t.supplierName,
    },
    {
      key: 'totalAmount',
      header: t.total,
      accessor: (row) => row.totalAmount,
      render: (value) => (
        <span className="font-semibold">{formatCurrency(value, lang)}</span>
      ),
      filterType: 'number',
    },
    {
      key: 'paymentType',
      header: t.paymentType,
      accessor: (row) => row.paymentType === 'credit' ? t.credit : t.cash,
      filterType: 'select',
      options: [
        { value: 'credit', label: t.credit, labelAr: t.credit },
        { value: 'cash', label: t.cash, labelAr: t.cash },
      ],
    },
    {
      key: 'status',
      header: t.status,
      render: (value, row) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.status === 'paid' ? 'bg-green-100 text-green-800' :
          row.status === 'overdue' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {t[row.status]}
        </span>
      ),
      filterType: 'select',
      options: [
        { value: 'paid', label: t.paid, labelAr: t.paid },
        { value: 'pending', label: t.pending, labelAr: t.pending },
        { value: 'overdue', label: t.overdue, labelAr: t.overdue },
      ],
    },
  ];

  const overdueColumns = [
    {
      key: 'invoiceNumber',
      header: t.invoiceNumber,
    },
    {
      key: 'invoiceDate',
      header: t.date,
      accessor: (row) => formatDateShort(row.invoiceDate, lang),
      filterType: 'date',
    },
    {
      key: 'dueDate',
      header: t.dueDate,
      accessor: (row) => formatDateShort(row.dueDate, lang),
      render: (value) => <span className="text-red-600">{value}</span>,
      filterType: 'date',
    },
    {
      key: 'supplierName',
      header: t.supplierName,
    },
    {
      key: 'totalAmount',
      header: t.total,
      accessor: (row) => row.totalAmount,
      render: (value) => (
        <span className="font-semibold text-red-600">{formatCurrency(value, lang)}</span>
      ),
      filterType: 'number',
    },
  ];

  const paymentHistoryColumns = [
    {
      key: 'paymentDate',
      header: t.date,
      accessor: (row) => formatDateShort(row.paymentDate, lang),
      filterType: 'date',
    },
    {
      key: 'supplierName',
      header: t.supplierName,
    },
    {
      key: 'amount',
      header: t.amount,
      render: (value) => (
        <span className="font-semibold text-green-600">{formatCurrency(value, lang)}</span>
      ),
      filterType: 'number',
    },
    {
      key: 'paymentMethod',
      header: t.paymentMethod,
      accessor: (row) => row.paymentMethodLabel,
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

  const renderReport = () => {
    if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
      return (
        <div className="text-center py-12 text-gray-500">
          {t.noData || 'No data available'}
        </div>
      );
    }

    switch (selectedReport) {
      case 'statement':
        const { supplier, invoices, payments } = reportData;
        const transactions = [];
        let runningBalance = 0;
        
        invoices.forEach(inv => {
          runningBalance += inv.totalAmount;
          transactions.push({
            id: `inv-${inv.id}`,
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
            id: `pay-${pay.id}`,
            date: pay.paymentDate,
            type: 'payment',
            reference: pay.referenceNumber || '-',
            amount: -pay.amount,
            balance: runningBalance
          });
        });
        
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const statementColumns = [
          {
            key: 'date',
            header: t.date,
            accessor: (row) => formatDateShort(row.date, lang),
            filterType: 'date',
          },
          {
            key: 'reference',
            header: t.invoiceNumber,
          },
          {
            key: 'amount',
            header: t.amount,
            render: (value) => (
              <span className={`font-semibold ${value > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(value), lang)}
              </span>
            ),
            filterType: 'number',
          },
          {
            key: 'balance',
            header: t.currentBalance,
            render: (value) => (
              <span className="font-semibold">{formatCurrency(value, lang)}</span>
            ),
            filterType: 'number',
          },
        ];
        
        return (
          <ReportsTable
            data={transactions}
            columns={statementColumns}
            lang={lang}
            t={t}
          />
        );
      
      case 'purchaseHistory':
        return (
          <ReportsTable
            data={reportData}
            columns={purchaseHistoryColumns}
            lang={lang}
            t={t}
          />
        );
      
      case 'overdue':
        return (
          <ReportsTable
            data={reportData}
            columns={overdueColumns}
            lang={lang}
            t={t}
          />
        );
      
      case 'paymentHistory':
        return (
          <ReportsTable
            data={reportData}
            columns={paymentHistoryColumns}
            lang={lang}
            t={t}
          />
        );
      
      case 'financialMovements':
        const { movements, openingBalance, closingBalance } = reportData;
        const financialColumns = [
          {
            key: 'date',
            header: t.date,
            accessor: (row) => formatDateShort(row.date, lang),
          },
          {
            key: 'type',
            header: t.transactionType,
            accessor: (row) => row.type === 'debit' ? t.debit : t.credit,
            render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs ${
                value === t.debit ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {value}
              </span>
            ),
          },
          {
            key: 'description',
            header: 'Description',
          },
          {
            key: 'supplier',
            header: t.supplierName,
          },
          {
            key: 'amount',
            header: t.amount,
            render: (value, row) => (
              <span className={`font-semibold ${row.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(value, lang)}
              </span>
            ),
          },
          {
            key: 'balance',
            header: t.currentBalance,
            render: (value) => (
              <span className="font-semibold">{formatCurrency(value, lang)}</span>
            ),
          },
        ];
        
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">{t.openingBalance}</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(openingBalance, lang)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Total {t.credit}</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(movements.filter(m => m.type === 'credit').reduce((s, m) => s + m.amount, 0), lang)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-xs text-gray-600 mb-1">Total {t.debit}</p>
                <p className="text-xl font-bold text-red-700">
                  {formatCurrency(movements.filter(m => m.type === 'debit').reduce((s, m) => s + m.amount, 0), lang)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">{t.closingBalance}</p>
                <p className="text-xl font-bold text-gray-700">{formatCurrency(closingBalance, lang)}</p>
              </div>
            </div>
            <ReportsTable
              data={movements}
              columns={financialColumns}
              lang={lang}
              t={t}
            />
          </div>
        );
      
      case 'monthlySummary':
        const summaryColumns = [
          {
            key: 'month',
            header: 'Month',
          },
          {
            key: 'purchases',
            header: t.purchases,
            render: (value) => (
              <span className="font-semibold">{formatCurrency(value, lang)}</span>
            ),
          },
          {
            key: 'payments',
            header: t.payments,
            render: (value) => (
              <span className="font-semibold">{formatCurrency(value, lang)}</span>
            ),
          },
          {
            key: 'net',
            header: 'Net',
            accessor: (row) => row.purchases - row.payments,
            render: (value, row) => (
              <span className={`font-semibold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(value, lang)}
              </span>
            ),
          },
        ];
        return (
          <ReportsTable
            data={reportData}
            columns={summaryColumns}
            lang={lang}
            t={t}
          />
        );
      
      default:
        return null;
    }
  };

  const reports = [
    { id: 'statement', label: t.supplierStatement, icon: FileText },
    { id: 'purchaseHistory', label: t.purchaseHistory, icon: FileText },
    { id: 'overdue', label: t.overdueInvoicesReport, icon: AlertCircle },
    { id: 'paymentHistory', label: t.paymentHistory, icon: CreditCard },
    { id: 'financialMovements', label: t.financialMovements, icon: CreditCard },
    { id: 'monthlySummary', label: t.monthlySummary, icon: Calendar }
  ];

  const [showFilters, setShowFilters] = useState(true);
  const [reportTitle, setReportTitle] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const currentReport = reports.find(r => r.id === selectedReport);

  return (
    <div className="space-y-4">
      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">{t.reports}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Settings size={16} className="mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <div className="relative" ref={exportMenuRef}>
              <Button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Download size={20} className="mr-2" />
                {t.export}
              </Button>
              {showExportMenu && (
                <div className={`absolute ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50`}>
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-right px-4 py-3 hover:bg-gray-50 rounded-t-lg transition-colors flex items-center gap-2"
                  >
                    <FileSpreadsheet size={18} className="text-green-600" />
                    <span>{lang === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportPDF();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-right px-4 py-3 hover:bg-gray-50 rounded-b-lg transition-colors flex items-center gap-2 border-t border-gray-200"
                  >
                    <File size={18} className="text-red-600" />
                    <span>{lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {reports.map(report => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => {
                  setSelectedReport(report.id);
                  setReportTitle(report.label);
                }}
                className={`p-3 rounded-lg border-2 transition-colors text-sm ${
                  selectedReport === report.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="mx-auto mb-1" size={20} />
                <p className="font-medium">{report.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Main Content */}
        <div className={`flex-1 bg-white rounded-lg shadow ${showFilters ? 'mr-80' : ''} transition-all`}>
          {/* Report Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {currentReport?.label || t.reports}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Search size={16} className="mr-1" />
                  {t.search}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings size={16} />
                </Button>
              </div>
            </div>
            
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.from}</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.to}</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-4 overflow-x-auto">
            {renderReport()}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="w-80 bg-white rounded-lg shadow p-4 h-fit sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">Filters</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(false)}
                className="h-6 w-6"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-3">
              {selectedReport === 'statement' && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">{t.supplierName}</label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => setSelectedSupplier('')}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                  <Select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="h-8 text-sm"
                  >
                    <option value="">{t.selectSupplier || 'Select Supplier'}</option>
                    {state.suppliers.map(s => (
                      <option key={s.id} value={s.id}>{lang === 'ar' ? s.nameAr : s.name}</option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">{t.date}</label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                  >
                    <X size={12} />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">{t.from}</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">{t.to}</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setSelectedSupplier('');
                  }}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

