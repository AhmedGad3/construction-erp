export const generateSampleData = () => {
  const suppliers = [
    {
      id: 1,
      name: "Nile Materials Co.",
      nameAr: "شركة النيل للمواد",
      contactPerson: "Ahmed Hassan",
      phone: "+20 100 123 4567",
      address: "Cairo, Egypt",
      paymentTermsDays: 60,
      notes: "Main supplier for construction materials",
      isActive: true,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      name: "Ahram Steel",
      nameAr: "مؤسسة الأهرام للحديد",
      contactPerson: "Mohamed Ali",
      phone: "+20 101 234 5678",
      address: "Alexandria, Egypt",
      paymentTermsDays: 60,
      notes: "Steel and metal supplies",
      isActive: true,
      createdAt: "2024-02-01"
    },
    {
      id: 3,
      name: "Al Shorouk Stores",
      nameAr: "محلات الشروق",
      contactPerson: "Fatima Ibrahim",
      phone: "+20 102 345 6789",
      address: "Giza, Egypt",
      paymentTermsDays: 60,
      notes: "Paint and finishing materials",
      isActive: true,
      createdAt: "2024-02-10"
    },
    {
      id: 4,
      name: "Cairo Construction Supplies",
      nameAr: "مستلزمات البناء القاهرة",
      contactPerson: "Omar Khaled",
      phone: "+20 103 456 7890",
      address: "Cairo, Egypt",
      paymentTermsDays: 60,
      notes: "General construction supplies",
      isActive: true,
      createdAt: "2024-03-01"
    }
  ];

  const invoices = [
    {
      id: 1,
      supplierId: 1,
      invoiceNumber: "INV-2024-001",
      invoiceDate: "2024-10-01",
      paymentType: "credit",
      dueDate: "2024-11-30",
      items: [
        { itemName: "Cement", itemNameAr: "أسمنت", quantity: 100, unitPrice: 850, total: 85000 },
        { itemName: "Sand", itemNameAr: "رمل", quantity: 50, unitPrice: 200, total: 10000 }
      ],
      totalAmount: 95000,
      notes: "Monthly supply",
      status: "pending",
      createdBy: "Admin",
      createdAt: "2024-10-01"
    },
    {
      id: 2,
      supplierId: 2,
      invoiceNumber: "INV-2024-002",
      invoiceDate: "2024-09-15",
      paymentType: "credit",
      dueDate: "2024-11-14",
      items: [
        { itemName: "Steel Bars", itemNameAr: "حديد تسليح", quantity: 20, unitPrice: 5000, total: 100000 }
      ],
      totalAmount: 100000,
      notes: "Steel reinforcement",
      status: "overdue",
      createdBy: "Admin",
      createdAt: "2024-09-15"
    },
    {
      id: 3,
      supplierId: 1,
      invoiceNumber: "INV-2024-003",
      invoiceDate: "2024-11-01",
      paymentType: "cash",
      dueDate: null,
      items: [
        { itemName: "Gravel", itemNameAr: "زلط", quantity: 30, unitPrice: 300, total: 9000 }
      ],
      totalAmount: 9000,
      notes: "Cash purchase",
      status: "paid",
      createdBy: "Admin",
      createdAt: "2024-11-01"
    },
    {
      id: 4,
      supplierId: 3,
      invoiceNumber: "INV-2024-004",
      invoiceDate: "2024-10-20",
      paymentType: "credit",
      dueDate: "2024-12-19",
      items: [
        { itemName: "Paint", itemNameAr: "دهانات", quantity: 50, unitPrice: 150, total: 7500 },
        { itemName: "Brushes", itemNameAr: "فرش", quantity: 20, unitPrice: 50, total: 1000 }
      ],
      totalAmount: 8500,
      notes: "Finishing materials",
      status: "pending",
      createdBy: "Admin",
      createdAt: "2024-10-20"
    },
    {
      id: 5,
      supplierId: 2,
      invoiceNumber: "INV-2024-005",
      invoiceDate: "2024-10-05",
      paymentType: "credit",
      dueDate: "2024-12-04",
      items: [
        { itemName: "Steel Bars", itemNameAr: "حديد تسليح", quantity: 5, unitPrice: 5000, total: 25000 }
      ],
      totalAmount: 25000,
      notes: "Additional steel",
      status: "pending",
      createdBy: "Admin",
      createdAt: "2024-10-05"
    },
    {
      id: 6,
      supplierId: 4,
      invoiceNumber: "INV-2024-006",
      invoiceDate: "2024-11-10",
      paymentType: "credit",
      dueDate: "2025-01-09",
      items: [
        { itemName: "Tiles", itemNameAr: "سيراميك", quantity: 200, unitPrice: 80, total: 16000 },
        { itemName: "Electrical Supplies", itemNameAr: "مستلزمات كهربائية", quantity: 30, unitPrice: 200, total: 6000 }
      ],
      totalAmount: 22000,
      notes: "Construction supplies",
      status: "pending",
      createdBy: "Admin",
      createdAt: "2024-11-10"
    }
  ];

  const payments = [
    {
      id: 1,
      supplierId: 1,
      amount: 45000,
      paymentDate: "2024-10-15",
      paymentMethod: "bank_transfer",
      referenceNumber: "TRF-2024-001",
      notes: "Partial payment",
      createdBy: "Admin",
      createdAt: "2024-10-15"
    },
    {
      id: 2,
      supplierId: 3,
      amount: 8500,
      paymentDate: "2024-10-25",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "Full payment",
      createdBy: "Admin",
      createdAt: "2024-10-25"
    },
    {
      id: 3,
      supplierId: 1,
      amount: 5000,
      paymentDate: "2024-11-05",
      paymentMethod: "check",
      referenceNumber: "CHK-2024-001",
      notes: "Check payment",
      createdBy: "Admin",
      createdAt: "2024-11-05"
    },
    {
      id: 4,
      supplierId: 4,
      amount: 10000,
      paymentDate: "2024-11-12",
      paymentMethod: "bank_transfer",
      referenceNumber: "TRF-2024-002",
      notes: "Partial payment",
      createdBy: "Admin",
      createdAt: "2024-11-12"
    }
  ];

  const users = [
    {
      id: 1,
      name: "Ahmed Mohamed",
      nameAr: "أحمد محمد",
      email: "ahmed@company.com",
      role: "admin",
      roleAr: "مدير",
      phone: "+20 100 000 0001",
      department: "Management",
      departmentAr: "الإدارة",
      avatar: "AM"
    },
    {
      id: 2,
      name: "Sara Ali",
      nameAr: "سارة علي",
      email: "sara@company.com",
      role: "accountant",
      roleAr: "محاسب",
      phone: "+20 100 000 0002",
      department: "Finance",
      departmentAr: "المالية",
      avatar: "SA"
    },
    {
      id: 3,
      name: "Mohamed Hassan",
      nameAr: "محمد حسن",
      email: "mohamed@company.com",
      role: "manager",
      roleAr: "مدير مشروع",
      phone: "+20 100 000 0003",
      department: "Operations",
      departmentAr: "العمليات",
      avatar: "MH"
    }
  ];

  const warehouses = [
    {
      id: 1,
      name: "Main Warehouse",
      nameAr: "المخزن الرئيسي",
      location: "Cairo",
      manager: "Ahmed Mohamed",
      notes: "Main storage facility",
      isActive: true,
      createdAt: "2024-01-01"
    },
    {
      id: 2,
      name: "Site Warehouse A",
      nameAr: "مخزن الموقع أ",
      location: "Giza",
      manager: "Sara Ali",
      notes: "Construction site storage",
      isActive: true,
      createdAt: "2024-02-01"
    }
  ];

  const stockMovements = [
    {
      id: 1,
      warehouseId: 1,
      itemName: "Cement",
      itemNameAr: "أسمنت",
      movementType: "in",
      quantity: 100,
      reference: "INV-2024-001",
      notes: "From purchase invoice",
      createdBy: "Admin",
      createdAt: "2024-10-01"
    },
    {
      id: 2,
      warehouseId: 1,
      itemName: "Steel Bars",
      itemNameAr: "حديد تسليح",
      movementType: "in",
      quantity: 20,
      reference: "INV-2024-002",
      notes: "From purchase invoice",
      createdBy: "Admin",
      createdAt: "2024-09-15"
    },
    {
      id: 3,
      warehouseId: 1,
      itemName: "Cement",
      itemNameAr: "أسمنت",
      movementType: "out",
      quantity: 30,
      reference: "TRF-001",
      notes: "Transferred to site",
      createdBy: "Admin",
      createdAt: "2024-10-10"
    }
  ];

  return { suppliers, invoices, payments, users, warehouses, stockMovements };
};

