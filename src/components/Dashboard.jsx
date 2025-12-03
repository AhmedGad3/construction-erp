import { useMemo } from 'react';
import { DollarSign, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDateShort } from '../utils/dateFormat';

export default function Dashboard({ state, t, lang }) {
  // Calculate stats
  const stats = useMemo(() => {
    const totalOutstanding = state.suppliers.reduce((sum, supplier) => {
      const creditInvoices = state.invoices.filter(
        inv => inv.supplierId === supplier.id && inv.paymentType === 'credit'
      );
      const totalPurchases = creditInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
      const totalPayments = state.payments
        .filter(p => p.supplierId === supplier.id)
        .reduce((s, p) => s + p.amount, 0);
      return sum + (totalPurchases - totalPayments);
    }, 0);

    const overdueCount = state.invoices.filter(inv => inv.status === 'overdue').length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const paymentsThisMonth = state.payments
      .filter(p => {
        const payDate = new Date(p.paymentDate);
        return payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const activeSuppliers = state.suppliers.filter(s => s.isActive).length;

    return {
      totalOutstanding,
      overdueCount,
      paymentsThisMonth,
      activeSuppliers
    };
  }, [state]);

  // Generate monthly data for last 6 months
  const monthlyData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = lang === 'ar' 
        ? date.toLocaleDateString('ar-EG', { month: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const purchases = state.invoices
        .filter(inv => {
          const invDate = new Date(inv.invoiceDate);
          return invDate >= monthStart && invDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
      
      const payments = state.payments
        .filter(p => {
          const payDate = new Date(p.paymentDate);
          return payDate >= monthStart && payDate <= monthEnd;
        })
        .reduce((sum, p) => sum + p.amount, 0);
      
      months.push({
        month: monthName,
        purchases: Math.round(purchases),
        payments: Math.round(payments)
      });
    }
    
    return months;
  }, [state, lang]);

  // Top 5 suppliers by balance
  const topSuppliers = useMemo(() => {
    return state.suppliers
      .map(supplier => {
        const creditInvoices = state.invoices.filter(
          inv => inv.supplierId === supplier.id && inv.paymentType === 'credit'
        );
        const totalPurchases = creditInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
        const totalPayments = state.payments
          .filter(p => p.supplierId === supplier.id)
          .reduce((s, p) => s + p.amount, 0);
        const balance = totalPurchases - totalPayments;
        
        return {
          name: lang === 'ar' ? supplier.nameAr : supplier.name,
          balance: Math.round(balance)
        };
      })
      .filter(s => s.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [state, lang]);

  // Payment methods distribution
  const paymentMethodsData = useMemo(() => {
    const methods = {
      cash: 0,
      check: 0,
      bank_transfer: 0
    };
    
    state.payments.forEach(p => {
      methods[p.paymentMethod] += p.amount;
    });
    
    const total = Object.values(methods).reduce((s, v) => s + v, 0);
    
    return [
      { name: t.cash, value: Math.round(methods.cash), percentage: total > 0 ? Math.round((methods.cash / total) * 100) : 0 },
      { name: t.check, value: Math.round(methods.check), percentage: total > 0 ? Math.round((methods.check / total) * 100) : 0 },
      { name: t.bankTransfer, value: Math.round(methods.bank_transfer), percentage: total > 0 ? Math.round((methods.bank_transfer / total) * 100) : 0 },
    ].filter(item => item.value > 0);
  }, [state, t]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities = [];
    
    state.invoices.forEach(inv => {
      const supplier = state.suppliers.find(s => s.id === inv.supplierId);
      activities.push({
        type: 'invoice',
        date: inv.invoiceDate,
        description: `${t.invoiceNumber}: ${inv.invoiceNumber}`,
        supplier: lang === 'ar' ? supplier?.nameAr : supplier?.name,
        amount: inv.totalAmount
      });
    });
    
    state.payments.forEach(pay => {
      const supplier = state.suppliers.find(s => s.id === pay.supplierId);
      activities.push({
        type: 'payment',
        date: pay.paymentDate,
        description: `${t.payment}: ${pay.referenceNumber || '-'}`,
        supplier: lang === 'ar' ? supplier?.nameAr : supplier?.name,
        amount: pay.amount
      });
    });
    
    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [state, t, lang]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t.totalOutstanding}</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {formatCurrency(stats.totalOutstanding, lang)}
              </p>
            </div>
            <DollarSign className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t.overdueInvoices}</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {stats.overdueCount}
              </p>
            </div>
            <AlertCircle className="text-red-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t.paymentsThisMonth}</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {formatCurrency(stats.paymentsThisMonth, lang)}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t.activeSuppliers}</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {stats.activeSuppliers}
              </p>
            </div>
            <Users className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.financialTrend}</h3>
          {monthlyData && monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  angle={lang === 'ar' ? -45 : 0}
                  textAnchor={lang === 'ar' ? 'end' : 'middle'}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value, lang)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="purchases" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name={t.purchases}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="payments" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name={t.payments}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              {t.noData}
            </div>
          )}
        </div>

        {/* Top Suppliers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.topSuppliers}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSuppliers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="balance" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Methods */}
      {paymentMethodsData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.paymentMethods}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.recentActivity}</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm text-gray-600">{formatDateShort(activity.date, lang)}</p>
                <p className="font-medium text-gray-800">{activity.description}</p>
                <p className="text-sm text-gray-500">{activity.supplier}</p>
              </div>
              <div className={`font-semibold ${activity.type === 'payment' ? 'text-green-600' : 'text-blue-600'}`}>
                {formatCurrency(activity.amount, lang)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

