import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// =============================
// GENERIC EXPORT FUNCTION
// =============================
export const exportToPDF = (data, headers, fileName, lang = 'en', title = '') => {
  const doc = new jsPDF();

  if (lang === 'ar') {
    doc.setLanguage('ar');
  }

  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 15);
  }

  const headerLabels = headers.map(header => {
    const key = Object.keys(header)[0];
    return header[key];
  });

  const headerKeys = headers.map(header => Object.keys(header)[0]);

  const tableData = data.map(row =>
    headerKeys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return value;
      return String(value);
    })
  );

  // الطريقة الصحيحة لاستخدام autoTable
  autoTable(doc, {
    head: [headerLabels],
    body: tableData,
    startY: title ? 25 : 15,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { top: 15, right: 14, bottom: 15, left: 14 },
  });

  const date = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileName}_${date}.pdf`;

  doc.save(fullFileName);
};


// =============================
// SUPPLIER STATEMENT EXPORT
// =============================
export const exportSupplierStatementToPDF = (supplier, invoices, payments, lang = 'en') => {
  const t = {
    en: {
      statement: 'Supplier Statement',
      supplier: 'Supplier',
      date: 'Date',
      type: 'Type',
      reference: 'Reference',
      debit: 'Debit',
      credit: 'Credit',
      balance: 'Balance',
      invoice: 'Invoice',
      payment: 'Payment',
    },
    ar: {
      statement: 'كشف حساب المورد',
      supplier: 'المورد',
      date: 'التاريخ',
      type: 'النوع',
      reference: 'المرجع',
      debit: 'مدين',
      credit: 'دائن',
      balance: 'الرصيد',
      invoice: 'فاتورة',
      payment: 'دفعة',
    }
  }[lang];

  const doc = new jsPDF();

  if (lang === 'ar') {
    doc.setLanguage('ar');
  }

  const title = `${t.statement}: ${lang === 'ar' ? supplier.nameAr : supplier.name}`;
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  const transactions = [];
  let runningBalance = 0;

  invoices.forEach(inv => {
    runningBalance += inv.totalAmount;
    transactions.push({
      date: inv.invoiceDate,
      type: t.invoice,
      reference: inv.invoiceNumber,
      debit: inv.totalAmount,
      credit: 0,
      balance: runningBalance,
    });
  });

  payments.forEach(pay => {
    runningBalance -= pay.amount;
    transactions.push({
      date: pay.paymentDate,
      type: t.payment,
      reference: pay.referenceNumber || '-',
      debit: 0,
      credit: pay.amount,
      balance: runningBalance,
    });
  });

  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  const headers = [t.date, t.type, t.reference, t.debit, t.credit, t.balance];
  const tableData = transactions.map(trans => [
    trans.date,
    trans.type,
    trans.reference,
    trans.debit,
    trans.credit,
    trans.balance,
  ]);

  // ← ← ← هنا التعديل المهم
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 25,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { top: 25, right: 14, bottom: 15, left: 14 },
  });

  const date = new Date().toISOString().split('T')[0];
  const fullFileName = `Supplier_Statement_${supplier.name.replace(/\s+/g, '_')}_${date}.pdf`;

  doc.save(fullFileName);
};
