import { useState, useMemo } from 'react';
import { Plus, Package, Edit, Trash2, Download, ArrowRightLeft, X, FileText } from 'lucide-react';
import FilterableTable from './FilterableTable';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../utils/dateFormat';
import { exportToExcel } from '../utils/excelExport';
import { exportToPDF } from '../utils/pdfExport';

export default function Warehouses({ state, dispatch, t, lang, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    location: '',
    manager: '',
    notes: '',
    isActive: true
  });
  const [movementData, setMovementData] = useState({
    warehouseId: '',
    itemName: '',
    itemNameAr: '',
    movementType: 'in',
    quantity: '',
    reference: '',
    notes: ''
  });

  const warehousesWithStock = useMemo(() => {
    return state.warehouses.map(warehouse => {
      const movements = state.stockMovements.filter(m => m.warehouseId === warehouse.id);
      const stock = movements.reduce((sum, m) => {
        if (m.movementType === 'in') return sum + m.quantity;
        if (m.movementType === 'out') return sum - m.quantity;
        return sum;
      }, 0);
      return { ...warehouse, currentStock: stock };
    });
  }, [state.warehouses, state.stockMovements]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingWarehouse) {
      dispatch({ type: 'UPDATE_WAREHOUSE', payload: { ...editingWarehouse, ...formData } });
      showToast('Warehouse updated');
    } else {
      const newWarehouse = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0]
      };
      dispatch({ type: 'ADD_WAREHOUSE', payload: newWarehouse });
      showToast('Warehouse added');
    }
    setShowModal(false);
    setEditingWarehouse(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      location: '',
      manager: '',
      notes: '',
      isActive: true
    });
  };

  const handleMovementSubmit = (e) => {
    e.preventDefault();
    const movement = {
      ...movementData,
      id: Date.now(),
      quantity: parseFloat(movementData.quantity),
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Admin'
    };
    dispatch({ type: 'ADD_STOCK_MOVEMENT', payload: movement });
    showToast('Stock movement recorded');
    setShowMovementModal(false);
    setMovementData({
      warehouseId: '',
      itemName: '',
      itemNameAr: '',
      movementType: 'in',
      quantity: '',
      reference: '',
      notes: ''
    });
  };

  const handleDelete = (id) => {
    if (window.confirm(t.confirmDelete)) {
      dispatch({ type: 'DELETE_WAREHOUSE', payload: id });
      showToast('Warehouse deleted');
    }
  };

  const handleExportExcel = () => {
    const headers = [
      { [t.warehouse]: t.warehouse },
      { Location: 'Location' },
      { Manager: 'Manager' },
      { [t.currentStock]: t.currentStock },
      { [t.status]: t.status }
    ];
    
    const data = warehousesWithStock.map(w => ({
      [t.warehouse]: lang === 'ar' ? w.nameAr : w.name,
      Location: w.location,
      Manager: w.manager,
      [t.currentStock]: w.currentStock,
      [t.status]: w.isActive ? t.active : t.inactive
    }));
    
    if (data.length === 0) {
      showToast(lang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', 'error');
      return;
    }
    
    exportToExcel(data, headers, 'Warehouses', lang);
    showToast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully');
  };

  const handleExportPDF = () => {
    const headers = [
      { [t.warehouse]: t.warehouse },
      { Location: 'Location' },
      { Manager: 'Manager' },
      { [t.currentStock]: t.currentStock },
      { [t.status]: t.status }
    ];
    
    const data = warehousesWithStock.map(w => ({
      [t.warehouse]: lang === 'ar' ? w.nameAr : w.name,
      Location: w.location,
      Manager: w.manager,
      [t.currentStock]: w.currentStock,
      [t.status]: w.isActive ? t.active : t.inactive
    }));
    
    if (data.length === 0) {
      showToast(lang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', 'error');
      return;
    }
    
    exportToPDF(data, headers, 'Warehouses', lang, t.warehouses);
    showToast(lang === 'ar' ? 'تم التصدير بنجاح' : 'Export completed successfully');
  };

  const warehouseColumns = [
    {
      key: 'name',
      header: t.warehouse,
      accessor: (row) => lang === 'ar' ? row.nameAr : row.name,
    },
    {
      key: 'location',
      header: 'Location',
    },
    {
      key: 'manager',
      header: 'Manager',
    },
    {
      key: 'currentStock',
      header: t.currentStock,
      render: (value) => (
        <span className="font-semibold">{value}</span>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t.warehouses}</h2>
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
            onClick={() => setShowMovementModal(true)}
            variant="outline"
          >
            <ArrowRightLeft size={20} className="mr-2" />
            {t.stockMovement}
          </Button>
          <Button
            onClick={() => {
              setEditingWarehouse(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            {t.addNew} {t.warehouse}
          </Button>
        </div>
      </div>

      <FilterableTable
        data={warehousesWithStock}
        columns={warehouseColumns}
        lang={lang}
        t={t}
        renderActions={(warehouse) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingWarehouse(warehouse);
                setFormData({
                  name: warehouse.name,
                  nameAr: warehouse.nameAr,
                  location: warehouse.location,
                  manager: warehouse.manager,
                  notes: warehouse.notes || '',
                  isActive: warehouse.isActive
                });
                setShowModal(true);
              }}
              title={t.edit}
              className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(warehouse.id)}
              title={t.delete}
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      />

      {/* Warehouse Modal */}
      {showModal && (
        <WarehouseModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setEditingWarehouse(null);
            resetForm();
          }}
          editingWarehouse={editingWarehouse}
          t={t}
        />
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <MovementModal
          movementData={movementData}
          setMovementData={setMovementData}
          onSubmit={handleMovementSubmit}
          onClose={() => setShowMovementModal(false)}
          warehouses={state.warehouses}
          lang={lang}
          t={t}
        />
      )}
    </div>
  );
}

function WarehouseModal({ formData, setFormData, onSubmit, onClose, editingWarehouse, t }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{editingWarehouse ? t.edit : t.addNew} {t.warehouse}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.warehouse} (EN)</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.warehouse} (AR)</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
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
            <Button type="button" variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit">
              {t.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MovementModal({ movementData, setMovementData, onSubmit, onClose, warehouses, lang, t }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{t.stockMovement}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.warehouse}</label>
            <select
              required
              value={movementData.warehouseId}
              onChange={(e) => setMovementData({ ...movementData, warehouseId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select {t.warehouse}</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{lang === 'ar' ? w.nameAr : w.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.item} (EN)</label>
              <input
                type="text"
                required
                value={movementData.itemName}
                onChange={(e) => setMovementData({ ...movementData, itemName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.item} (AR)</label>
              <input
                type="text"
                required
                value={movementData.itemNameAr}
                onChange={(e) => setMovementData({ ...movementData, itemNameAr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.movementType}</label>
            <select
              value={movementData.movementType}
              onChange={(e) => setMovementData({ ...movementData, movementType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="in">{t.in}</option>
              <option value="out">{t.out}</option>
              <option value="transfer">{t.transfer}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.quantity}</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={movementData.quantity}
              onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              value={movementData.reference}
              onChange={(e) => setMovementData({ ...movementData, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
            <textarea
              value={movementData.notes}
              onChange={(e) => setMovementData({ ...movementData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="3"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit">
              {t.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

