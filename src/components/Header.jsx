import { useState } from 'react';
import { Globe, User, ChevronDown, X, LogOut } from 'lucide-react';

export default function Header({ lang, setLang, t, currentUser, setCurrentUser, users, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const handleUserSelect = (user) => {
    setCurrentUser(user);
    setShowUserModal(false);
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40" style={{ height: '4rem' }}>
      <div className="px-6 h-full flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {lang === 'ar' ? 'نظام إدارة الشركات' : 'Construction ERP System'}
        </h1>
        <div className="flex items-center gap-4">
          {/* Current User Display */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                  {currentUser.avatar}
                </div>
                <div className={`text-right ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm font-medium text-gray-800">
                    {lang === 'ar' ? currentUser.nameAr : currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang === 'ar' ? currentUser.roleAr : currentUser.role}
                  </p>
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className={`absolute ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50`}>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
                        {currentUser.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {lang === 'ar' ? currentUser.nameAr : currentUser.name}
                        </p>
                        <p className="text-sm text-gray-500">{currentUser.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {lang === 'ar' ? currentUser.roleAr : currentUser.role} - {lang === 'ar' ? currentUser.departmentAr : currentUser.department}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserModal(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {t.switchUser}
                    </button>
                    {onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Globe size={20} />
            <span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* User Selection Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{t.switchUser}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full p-4 rounded-lg border-2 transition-colors ${
                    currentUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
                      {user.avatar}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-gray-800">
                        {lang === 'ar' ? user.nameAr : user.name}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {lang === 'ar' ? user.roleAr : user.role} - {lang === 'ar' ? user.departmentAr : user.department}
                      </p>
                    </div>
                    {currentUser?.id === user.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}

