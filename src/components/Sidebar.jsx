import { LayoutDashboard, Users, ShoppingCart, CreditCard, FileText, Package, Box } from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, t, lang }) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'suppliers', icon: Users, label: t.suppliers },
    { id: 'supplies', icon: Box, label: t.supplies || 'Supplies' },
    { id: 'invoices', icon: ShoppingCart, label: t.purchases },
    { id: 'payments', icon: CreditCard, label: t.payments },
    { id: 'warehouses', icon: Package, label: t.warehouses },
    { id: 'reports', icon: FileText, label: t.reports },
  ];

  return (
    <aside className={`fixed w-64 bg-white shadow-lg border-gray-200 overflow-y-auto ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'}`} style={{ top: '4rem', height: 'calc(100vh - 4rem)' }}>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

