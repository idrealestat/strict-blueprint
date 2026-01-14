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

// ✅ تم إزالة البيانات الوهمية - يتم جلب العملاء من قاعدة البيانات الحقيقية
export const mockCustomers: Customer[] = [];

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