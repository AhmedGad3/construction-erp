import { useState } from 'react';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login({ users, onLogin, t, lang }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }

    // Find user by email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      setError(lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
      return;
    }

    // Simple password check (in real app, this would be hashed)
    // For demo purposes, we'll accept any password or check against a simple pattern
    if (password.length < 4) {
      setError(lang === 'ar' ? 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' : 'Password must be at least 4 characters');
      return;
    }

    // Login successful
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </h1>
          <p className="text-gray-600">
            {lang === 'ar' ? 'قم بتسجيل الدخول للوصول إلى النظام' : 'Sign in to access the system'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter your email'}
                className="pr-10 h-12"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                className="pr-10 pl-10 h-12"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 h-12 text-lg font-semibold"
          >
            <LogIn className="mr-2" size={20} />
            {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">
            {lang === 'ar' ? 'حسابات تجريبية:' : 'Demo Accounts:'}
          </p>
          <div className="space-y-2">
            {users.slice(0, 3).map(user => (
              <button
                key={user.id}
                onClick={() => {
                  setEmail(user.email);
                  setPassword('demo123');
                }}
                className="w-full text-right px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {lang === 'ar' ? user.nameAr : user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600">
                    {lang === 'ar' ? 'استخدام' : 'Use'}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            {lang === 'ar' ? 'كلمة المرور: demo123' : 'Password: demo123'}
          </p>
        </div>
      </div>
    </div>
  );
}

