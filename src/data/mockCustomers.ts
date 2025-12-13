// Mock Data for Customers List Page
// UI Only - No Backend

export type CustomerStatus = 'جديد' | 'متابعة' | 'مهتم' | 'تم البيع' | 'ملغي';
export type CustomerPriority = 'عادي' | 'متوسط' | 'عالي' | 'عاجل';
export type PropertyType = 'شقة' | 'فيلا' | 'أرض' | 'محل' | 'مكتب';
export type CustomerSource = 'موقع' | 'واتساب' | 'مكالمة' | 'إحالة' | 'معرض';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email?: string;
  status: CustomerStatus;
  priority: CustomerPriority;
  propertyType: PropertyType;
  budget: string;
  location: string;
  notes: string;
  source: CustomerSource;
  assignedTo?: string;
  createdAt: string;
  lastContact: string;
  nextFollowUp?: string;
  tags: string[];
}

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'أحمد محمد العلي',
    phone: '0501234567',
    whatsapp: '0501234567',
    email: 'ahmed@example.com',
    status: 'جديد',
    priority: 'عالي',
    propertyType: 'فيلا',
    budget: '2,500,000 ريال',
    location: 'الرياض - حي النرجس',
    notes: 'يبحث عن فيلا مع مسبح',
    source: 'موقع',
    createdAt: '2025-12-10',
    lastContact: '2025-12-12',
    nextFollowUp: '2025-12-15',
    tags: ['VIP', 'نقدي'],
  },
  {
    id: '2',
    name: 'فاطمة عبدالله السعود',
    phone: '0559876543',
    whatsapp: '0559876543',
    email: 'fatima@example.com',
    status: 'متابعة',
    priority: 'متوسط',
    propertyType: 'شقة',
    budget: '800,000 ريال',
    location: 'جدة - حي الحمراء',
    notes: 'تفضل شقة بإطلالة بحرية',
    source: 'واتساب',
    createdAt: '2025-12-08',
    lastContact: '2025-12-11',
    nextFollowUp: '2025-12-14',
    tags: ['تمويل'],
  },
  {
    id: '3',
    name: 'خالد سعد القحطاني',
    phone: '0541112233',
    whatsapp: '0541112233',
    status: 'مهتم',
    priority: 'عاجل',
    propertyType: 'أرض',
    budget: '5,000,000 ريال',
    location: 'الرياض - شمال المدينة',
    notes: 'مستثمر يبحث عن أرض تجارية',
    source: 'إحالة',
    assignedTo: 'محمد',
    createdAt: '2025-12-05',
    lastContact: '2025-12-13',
    tags: ['مستثمر', 'VIP'],
  },
  {
    id: '4',
    name: 'نورة سليمان الشمري',
    phone: '0532221144',
    whatsapp: '0532221144',
    email: 'noura@example.com',
    status: 'تم البيع',
    priority: 'عادي',
    propertyType: 'فيلا',
    budget: '3,200,000 ريال',
    location: 'الدمام - حي الفيصلية',
    notes: 'تم إتمام الصفقة بنجاح',
    source: 'معرض',
    createdAt: '2025-11-20',
    lastContact: '2025-12-01',
    tags: ['مكتمل'],
  },
  {
    id: '5',
    name: 'عبدالرحمن يوسف المالكي',
    phone: '0567778899',
    whatsapp: '0567778899',
    status: 'جديد',
    priority: 'متوسط',
    propertyType: 'محل',
    budget: '1,500,000 ريال',
    location: 'مكة - العزيزية',
    notes: 'يبحث عن محل تجاري',
    source: 'مكالمة',
    createdAt: '2025-12-12',
    lastContact: '2025-12-12',
    tags: ['تجاري'],
  },
  {
    id: '6',
    name: 'سارة خالد العتيبي',
    phone: '0544556677',
    whatsapp: '0544556677',
    email: 'sara@example.com',
    status: 'ملغي',
    priority: 'عادي',
    propertyType: 'شقة',
    budget: '600,000 ريال',
    location: 'الطائف - حي الشهداء',
    notes: 'غيرت رأيها بخصوص الشراء',
    source: 'موقع',
    createdAt: '2025-11-15',
    lastContact: '2025-11-25',
    tags: [],
  },
  {
    id: '7',
    name: 'محمد علي الغامدي',
    phone: '0553334455',
    whatsapp: '0553334455',
    status: 'متابعة',
    priority: 'عالي',
    propertyType: 'مكتب',
    budget: '4,000,000 ريال',
    location: 'الرياض - طريق الملك فهد',
    notes: 'شركة تبحث عن مقر جديد',
    source: 'إحالة',
    assignedTo: 'أحمد',
    createdAt: '2025-12-01',
    lastContact: '2025-12-10',
    nextFollowUp: '2025-12-16',
    tags: ['شركة', 'VIP'],
  },
  {
    id: '8',
    name: 'ريم عبدالعزيز النفيعي',
    phone: '0588889999',
    whatsapp: '0588889999',
    email: 'reem@example.com',
    status: 'مهتم',
    priority: 'متوسط',
    propertyType: 'فيلا',
    budget: '1,800,000 ريال',
    location: 'الخبر - حي العليا',
    notes: 'تبحث عن فيلا للعائلة',
    source: 'واتساب',
    createdAt: '2025-12-07',
    lastContact: '2025-12-11',
    nextFollowUp: '2025-12-17',
    tags: ['عائلي'],
  },
];

// Helper functions for status colors
export const getStatusColor = (status: CustomerStatus): string => {
  const colors: Record<CustomerStatus, string> = {
    'جديد': 'bg-info text-info-foreground',
    'متابعة': 'bg-warning text-warning-foreground',
    'مهتم': 'bg-success text-success-foreground',
    'تم البيع': 'bg-primary text-primary-foreground',
    'ملغي': 'bg-muted text-muted-foreground',
  };
  return colors[status];
};

export const getPriorityColor = (priority: CustomerPriority): string => {
  const colors: Record<CustomerPriority, string> = {
    'عادي': 'border-muted-foreground text-muted-foreground',
    'متوسط': 'border-warning text-warning',
    'عالي': 'border-destructive text-destructive',
    'عاجل': 'border-destructive bg-destructive/10 text-destructive',
  };
  return colors[priority];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};