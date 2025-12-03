import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Package, Search, X } from 'lucide-react';
import { formatCurrency } from '../utils/dateFormat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Supplies({ state, dispatch, t, lang, showToast, currentUser }) {
  const [showModal, setShowModal] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    unit: '',
    unitAr: '',
    category: '',
    categoryAr: '',
    description: '',
    descriptionAr: '',
    isActive: true
  });

  // Extract unique supplies from invoices
  const allSupplies = useMemo(() => {
    const suppliesMap = new Map();
    
    state.invoices.forEach(invoice => {
      if (invoice.items) {
        invoice.items.forEach(item => {
          const key = `${item.itemName}-${item.itemNameAr}`;
          if (!suppliesMap.has(key)) {
            suppliesMap.set(key, {
              id: suppliesMap.size + 1,
              name: item.itemName,
              nameAr: item.itemNameAr,
              unit: 'unit',
              unitAr: 'وحدة',
              category: 'General',
              categoryAr: 'عام',
              description: '',
              descriptionAr: '',
              totalQuantity: 0,
              totalValue: 0,
              isActive: true
            });
          }
          
          const supply = suppliesMap.get(key);
          supply.totalQuantity += item.quantity || 0;
          supply.totalValue += item.total || 0;
        });
      }
    });

    // Add supplies from state if they exist
    if (state.supplies) {
      state.supplies.forEach(supply => {
        const key = `${supply.name}-${supply.nameAr}`;
        if (!suppliesMap.has(key)) {
          suppliesMap.set(key, { ...supply, totalQuantity: 0, totalValue: 0 });
        }
      });
    }

    return Array.from(suppliesMap.values());
  }, [state.invoices, state.supplies]);

  const filteredSupplies = useMemo(() => {
    if (!searchTerm) return allSupplies;
    
    const term = searchTerm.toLowerCase();
    return allSupplies.filter(supply => 
      supply.name.toLowerCase().includes(term) ||
      supply.nameAr.includes(term) ||
      supply.category?.toLowerCase().includes(term) ||
      supply.categoryAr?.includes(term)
    );
  }, [allSupplies, searchTerm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingSupply) {
      dispatch({ 
        type: 'UPDATE_SUPPLY', 
        payload: { ...editingSupply, ...formData } 
      });
      showToast(lang === 'ar' ? 'تم تحديث المادة بنجاح' : 'Supply updated successfully');
    } else {
      const newSupply = {
        ...formData,
        id: Date.now(),
        totalQuantity: 0,
        totalValue: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      dispatch({ type: 'ADD_SUPPLY', payload: newSupply });
      showToast(lang === 'ar' ? 'تم إضافة المادة بنجاح' : 'Supply added successfully');
    }
    
    setShowModal(false);
    setEditingSupply(null);
    resetForm();
  };

  const handleEdit = (supply) => {
    setEditingSupply(supply);
    setFormData({
      name: supply.name,
      nameAr: supply.nameAr,
      unit: supply.unit || '',
      unitAr: supply.unitAr || '',
      category: supply.category || '',
      categoryAr: supply.categoryAr || '',
      description: supply.description || '',
      descriptionAr: supply.descriptionAr || '',
      isActive: supply.isActive !== undefined ? supply.isActive : true
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه المادة؟' : 'Are you sure you want to delete this supply?')) {
      dispatch({ type: 'DELETE_SUPPLY', payload: id });
      showToast(lang === 'ar' ? 'تم حذف المادة' : 'Supply deleted');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      unit: '',
      unitAr: '',
      category: '',
      categoryAr: '',
      description: '',
      descriptionAr: '',
      isActive: true
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package className="text-blue-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">
              {lang === 'ar' ? 'المستلزمات والمواد' : 'Supplies & Materials'}
            </h2>
          </div>
          <Button
            onClick={() => {
              setEditingSupply(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus size={20} className="mr-2" />
            {lang === 'ar' ? 'إضافة مادة جديدة' : 'Add New Supply'}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder={lang === 'ar' ? 'بحث عن مادة...' : 'Search supplies...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-right">{lang === 'ar' ? 'اسم المادة' : 'Supply Name'}</TableHead>
              <TableHead className="text-right">{lang === 'ar' ? 'الفئة' : 'Category'}</TableHead>
              <TableHead className="text-right">{lang === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
              <TableHead className="text-right">{lang === 'ar' ? 'الكمية الإجمالية' : 'Total Quantity'}</TableHead>
              <TableHead className="text-right">{lang === 'ar' ? 'القيمة الإجمالية' : 'Total Value'}</TableHead>
              <TableHead className="text-right">{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="text-right">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSupplies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {lang === 'ar' ? 'لا توجد مواد' : 'No supplies found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSupplies.map((supply) => (
                <TableRow key={supply.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {lang === 'ar' ? supply.nameAr : supply.name}
                  </TableCell>
                  <TableCell>
                    {lang === 'ar' ? supply.categoryAr : supply.category}
                  </TableCell>
                  <TableCell>
                    {lang === 'ar' ? supply.unitAr : supply.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {supply.totalQuantity || 0}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(supply.totalValue || 0, lang)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      supply.isActive !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {supply.isActive !== false 
                        ? (lang === 'ar' ? 'نشط' : 'Active')
                        : (lang === 'ar' ? 'غير نشط' : 'Inactive')
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(supply)}
                      >
                        <Edit size={16} className="mr-1" />
                        {t.edit}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(supply.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} className="mr-1" />
                        {t.delete}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingSupply 
                  ? (lang === 'ar' ? 'تعديل المادة' : 'Edit Supply')
                  : (lang === 'ar' ? 'إضافة مادة جديدة' : 'Add New Supply')
                }
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSupply(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'ar' ? 'اسم المادة (إنجليزي)' : 'Supply Name (English)'}
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'ar' ? 'اسم المادة (عربي)' : 'Supply Name (Arabic)'}
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'ar' ? 'الفئة (إنجليزي)' : 'Category (English)'}
                  </label>
                  <Input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'ar' ? 'الفئة (عربي)' : 'Category (Arabic)'}
                  </label>
                  <Input
                    type="text"
                    value={formData.categoryAr}
                    onChange={(e) => setFormData({ ...formData, categoryAr: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'ar' ? 'الوحدة (إنجليزي)' : 'Unit (English)'}
                  </label>
                  <Input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'ar' ? 'الوحدة (عربي)' : 'Unit (Arabic)'}
                  </label>
                  <Input
                    type="text"
                    value={formData.unitAr}
                    onChange={(e) => setFormData({ ...formData, unitAr: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </label>
                <textarea
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  dir="rtl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  {lang === 'ar' ? 'نشط' : 'Active'}
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupply(null);
                    resetForm();
                  }}
                >
                  {t.cancel}
                </Button>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                  {t.save}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

