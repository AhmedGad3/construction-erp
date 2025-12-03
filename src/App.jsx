import { useState, useReducer, useEffect } from 'react';
import { translations } from './utils/translations';
import { generateSampleData } from './data/sampleData';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Suppliers from './components/Suppliers';
import Supplies from './components/Supplies';
import Invoices from './components/Invoices';
import Payments from './components/Payments';
import Reports from './components/Reports';
import Warehouses from './components/Warehouses';
import Login from './components/Login';

function App() {
  const [lang, setLang] = useState('en');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize with sample data
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'INIT_DATA':
        return { ...state, ...action.payload };
      case 'ADD_SUPPLIER':
        return { ...state, suppliers: [...state.suppliers, action.payload] };
      case 'UPDATE_SUPPLIER':
        return {
          ...state,
          suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s)
        };
      case 'DELETE_SUPPLIER':
        return {
          ...state,
          suppliers: state.suppliers.filter(s => s.id !== action.payload)
        };
      case 'ADD_INVOICE':
        return { ...state, invoices: [...state.invoices, action.payload] };
      case 'UPDATE_INVOICE':
        return {
          ...state,
          invoices: state.invoices.map(i => i.id === action.payload.id ? action.payload : i)
        };
      case 'DELETE_INVOICE':
        return {
          ...state,
          invoices: state.invoices.filter(i => i.id !== action.payload)
        };
      case 'ADD_PAYMENT':
        return { ...state, payments: [...state.payments, action.payload] };
      case 'UPDATE_PAYMENT':
        return {
          ...state,
          payments: state.payments.map(p => p.id === action.payload.id ? action.payload : p)
        };
      case 'DELETE_PAYMENT':
        return {
          ...state,
          payments: state.payments.filter(p => p.id !== action.payload)
        };
      case 'ADD_WAREHOUSE':
        return { ...state, warehouses: [...state.warehouses, action.payload] };
      case 'UPDATE_WAREHOUSE':
        return {
          ...state,
          warehouses: state.warehouses.map(w => w.id === action.payload.id ? action.payload : w)
        };
      case 'DELETE_WAREHOUSE':
        return {
          ...state,
          warehouses: state.warehouses.filter(w => w.id !== action.payload)
        };
      case 'ADD_STOCK_MOVEMENT':
        return { ...state, stockMovements: [...state.stockMovements, action.payload] };
      case 'UPDATE_STOCK_MOVEMENT':
        return {
          ...state,
          stockMovements: state.stockMovements.map(m => m.id === action.payload.id ? action.payload : m)
        };
      case 'DELETE_STOCK_MOVEMENT':
        return {
          ...state,
          stockMovements: state.stockMovements.filter(m => m.id !== action.payload)
        };
      case 'ADD_SUPPLY':
        return { ...state, supplies: [...state.supplies, action.payload] };
      case 'UPDATE_SUPPLY':
        return {
          ...state,
          supplies: state.supplies.map(s => s.id === action.payload.id ? action.payload : s)
        };
      case 'DELETE_SUPPLY':
        return {
          ...state,
          supplies: state.supplies.filter(s => s.id !== action.payload)
        };
      default:
        return state;
    }
  }, {
    suppliers: [],
    supplies: [],
    invoices: [],
    payments: [],
    users: [],
    warehouses: [],
    stockMovements: []
  });

  useEffect(() => {
    const sampleData = generateSampleData();
    dispatch({ type: 'INIT_DATA', payload: sampleData });
    
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const foundUser = sampleData.users.find(u => u.id === user.id);
        if (foundUser) {
          setCurrentUser(foundUser);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Error parsing saved user:', e);
      }
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setToast({ message: lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful', type: 'success' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    setToast({ message: lang === 'ar' ? 'تم تسجيل الخروج' : 'Logged out successfully', type: 'success' });
  };

  // Update invoice statuses based on due dates
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    state.invoices.forEach(invoice => {
      if (invoice.paymentType === 'credit' && invoice.status !== 'paid') {
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today && invoice.status !== 'overdue') {
          dispatch({
            type: 'UPDATE_INVOICE',
            payload: { ...invoice, status: 'overdue' }
          });
        }
      }
    });
  }, [state.invoices]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const t = translations[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div dir={dir} className="min-h-screen">
        <Login 
          users={state.users || []} 
          onLogin={handleLogin}
          t={t}
          lang={lang}
        />
        {toast && (
          <div className={`fixed bottom-4 ${lang === 'ar' ? 'left-4' : 'right-4'} z-50`}>
            <div className={`px-6 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}>
              {toast.message}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-gray-50">
      <Header 
        lang={lang} 
        setLang={setLang} 
        t={t} 
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={state.users || []}
        onLogout={handleLogout}
      />
      <div className="flex" style={{ paddingTop: '4rem' }}>
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} t={t} lang={lang} />
        <main className={`flex-1 p-6 ${lang === 'ar' ? 'mr-64' : 'ml-64'}`}>
          {currentPage === 'dashboard' && (
            <Dashboard state={state} t={t} lang={lang} />
          )}
          {currentPage === 'suppliers' && (
            <Suppliers
              state={state}
              dispatch={dispatch}
              t={t}
              lang={lang}
              showToast={showToast}
              currentUser={currentUser}
            />
          )}
          {currentPage === 'supplies' && (
            <Supplies
              state={state}
              dispatch={dispatch}
              t={t}
              lang={lang}
              showToast={showToast}
              currentUser={currentUser}
            />
          )}
          {currentPage === 'invoices' && (
            <Invoices
              state={state}
              dispatch={dispatch}
              t={t}
              lang={lang}
              showToast={showToast}
              currentUser={currentUser}
            />
          )}
          {currentPage === 'payments' && (
            <Payments
              state={state}
              dispatch={dispatch}
              t={t}
              lang={lang}
              showToast={showToast}
              currentUser={currentUser}
            />
          )}
          {currentPage === 'reports' && (
            <Reports
              state={state}
              t={t}
              lang={lang}
              showToast={showToast}
            />
          )}
          {currentPage === 'warehouses' && (
            <Warehouses
              state={state}
              dispatch={dispatch}
              t={t}
              lang={lang}
              showToast={showToast}
            />
          )}
        </main>
      </div>
      
      {toast && (
        <div className={`fixed bottom-4 ${lang === 'ar' ? 'left-4' : 'right-4'} z-50`}>
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

