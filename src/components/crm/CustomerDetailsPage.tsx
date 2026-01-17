/**
 * CustomerDetailsPage.tsx
 * صفحة تفاصيل العميل الكاملة - 8 تبويبات
 * Complete Customer Details Page with 8 Tabs
 */

import { useState, useEffect, useRef, useCallback } from "react";
import GeneralInfoTab from "./GeneralInfoTab";
import AddTaskDialog from "./AddTaskDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Building2,
  MapPin,
  DollarSign,
  User,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  FileText,
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Star,
  Share2,
  Send,
  Tag,
  Briefcase,
  Activity,
  History,
  Settings,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import PropertyDetailsDialog from "./PropertyDetailsDialog";
import PDFPreviewDialog from "./PDFPreviewDialog";
import { generatePropertyPDF } from "@/utils/generatePropertyPDF";
import { useCRMTasks } from "@/hooks/useCRMTasks";
import { useDeviceContacts } from "@/hooks/useDeviceContacts";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerTransactions } from "@/hooks/useCustomerTransactions";
import { useCustomerInteractions } from "@/hooks/useCustomerInteractions";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { useEventTracker } from "@/hooks/useEventTracker";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationSounds } from "@/utils/notificationSounds";
import { markAsViewed, isNew } from "@/hooks/usePublishedAdsManager";
import PulsingDot from "@/components/ui/PulsingDot";
import { useBusinessCardData } from "@/hooks/useBusinessCardData";
import { generateRequestPDF } from "@/utils/generateRequestPDF";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  company?: string;
  type?: 'buyer' | 'seller' | 'renter' | 'owner' | 'investor' | 'other';
  interestLevel?: 'hot' | 'warm' | 'cold' | 'moderate';
  propertyType?: string;
  budget?: string;
  location?: string;
  notes?: string;
  source?: string;
  status: string;
  columnId: string;
  tags?: string[];
  image?: string;
  profileImage?: string;
  createdAt: string;
  lastContact?: string;
  nextFollowUp?: string;
}

interface ActivityLog {
  id: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'note' | 'status_change';
  description: string;
  timestamp: string;
  user?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface LinkedProperty {
  id: string;
  title: string;
  type: string;
  price: string;
  location: string;
  status: 'active' | 'sold' | 'rented';
}

interface CustomerDetailsPageProps {
  customer: Customer;
  onBack: () => void;
  onUpdate: (customer: Customer) => void;
}

// Mock activity logs
const mockActivityLogs: ActivityLog[] = [
  { id: '1', type: 'call', description: 'اتصال للاستفسار عن الفلل المتاحة', timestamp: '2024-01-20 10:30', user: 'أحمد' },
  { id: '2', type: 'whatsapp', description: 'إرسال صور لعقار جديد', timestamp: '2024-01-19 14:00', user: 'أحمد' },
  { id: '3', type: 'meeting', description: 'معاينة فيلا في حي النرجس', timestamp: '2024-01-18 09:00', user: 'أحمد' },
  { id: '4', type: 'note', description: 'العميل يفضل الطابق الأرضي', timestamp: '2024-01-17 16:30', user: 'أحمد' },
  { id: '5', type: 'status_change', description: 'تم نقل العميل إلى مرحلة التفاوض', timestamp: '2024-01-16 11:00', user: 'النظام' },
];

// Mock tasks
const mockTasks: Task[] = [
  { id: '1', title: 'متابعة العرض المقدم', description: 'الاتصال للاستفسار عن قرار العميل', dueDate: '2024-01-25', status: 'pending', priority: 'high' },
  { id: '2', title: 'إرسال عقد إيجار', description: 'تجهيز وإرسال العقد للتوقيع', dueDate: '2024-01-22', status: 'completed', priority: 'medium' },
  { id: '3', title: 'تحديث بيانات العميل', dueDate: '2024-01-28', status: 'pending', priority: 'low' },
];

// Mock reminders
const mockReminders: Reminder[] = [
  { id: '1', title: 'اتصال عاجل للتأكيد', description: 'الاتصال بالعميل لتأكيد موعد توقيع العقد غداً', date: '2024-01-19', completed: false, priority: 'high' },
  { id: '2', title: 'إرسال تفاصيل التأمين', description: 'إرسال عروض التأمين من الشركات المختلفة للعقار', date: '2024-01-21', completed: false, priority: 'medium' },
  { id: '3', title: 'تجهيز أوراق البنك', description: 'تجميع وتجهيز جميع الأوراق المطلوبة للتمويل البنكي', date: '2024-01-18', completed: true, priority: 'medium' },
  { id: '4', title: 'جدولة المعاينة النهائية', description: 'ترتيب موعد المعاينة النهائية للعقار مع خبير التقييم', date: '2024-01-25', completed: false, priority: 'low' },
];

// Mock linked properties
const mockLinkedProperties: LinkedProperty[] = [
  { id: '1', title: 'فيلا مودرن في حي النرجس', type: 'فيلا', price: '2,500,000 ريال', location: 'الرياض - النرجس', status: 'active' },
  { id: '2', title: 'شقة 3 غرف في العليا', type: 'شقة', price: '850,000 ريال', location: 'الرياض - العليا', status: 'sold' },
];

// أنواع العملاء الموسعة - Extended Customer Types
const CUSTOMER_TYPES = [
  { id: 'individual', name: 'فردي', name_en: 'Individual', icon: '👤', color: '#3b82f6', bg_color: 'bg-blue-100', text_color: 'text-blue-800' },
  { id: 'corporate', name: 'شركة', name_en: 'Corporate', icon: '🏢', color: '#8b5cf6', bg_color: 'bg-purple-100', text_color: 'text-purple-800' },
  { id: 'vip', name: 'مهم', name_en: 'VIP', icon: '⭐', color: '#f59e0b', bg_color: 'bg-amber-100', text_color: 'text-amber-800' },
  { id: 'government', name: 'حكومي', name_en: 'Government', icon: '🏛️', color: '#10b981', bg_color: 'bg-emerald-100', text_color: 'text-emerald-800' },
  { id: 'international', name: 'دولي', name_en: 'International', icon: '🌍', color: '#ef4444', bg_color: 'bg-red-100', text_color: 'text-red-800' },
  { id: 'partner', name: 'شريك', name_en: 'Partner', icon: '🤝', color: '#6366f1', bg_color: 'bg-indigo-100', text_color: 'text-indigo-800' },
  { id: 'buyer', name: 'مشتري', name_en: 'Buyer', icon: '🛒', color: '#0ea5e9', bg_color: 'bg-sky-100', text_color: 'text-sky-800' },
  { id: 'seller', name: 'بائع', name_en: 'Seller', icon: '💰', color: '#22c55e', bg_color: 'bg-green-100', text_color: 'text-green-800' },
  { id: 'renter', name: 'مستأجر', name_en: 'Renter', icon: '🏠', color: '#a855f7', bg_color: 'bg-violet-100', text_color: 'text-violet-800' },
  { id: 'owner', name: 'مالك', name_en: 'Owner', icon: '🔑', color: '#f97316', bg_color: 'bg-orange-100', text_color: 'text-orange-800' },
  { id: 'investor', name: 'مستثمر', name_en: 'Investor', icon: '📈', color: '#eab308', bg_color: 'bg-yellow-100', text_color: 'text-yellow-800' },
  { id: 'other', name: 'آخر', name_en: 'Other', icon: '📋', color: '#6b7280', bg_color: 'bg-gray-100', text_color: 'text-gray-800' },
] as const;

// درجات الاهتمام الموسعة - Extended Interest Levels  
const INTEREST_LEVELS = [
  { id: 'hot', name: 'ساخن', name_en: 'Hot', icon: '🔥', color: '#dc2626', bg_color: 'bg-red-100', text_color: 'text-red-800' },
  { id: 'warm', name: 'دافئ', name_en: 'Warm', icon: '🌡️', color: '#ea580c', bg_color: 'bg-orange-100', text_color: 'text-orange-800' },
  { id: 'cold', name: 'بارد', name_en: 'Cold', icon: '❄️', color: '#0284c7', bg_color: 'bg-blue-100', text_color: 'text-blue-800' },
  { id: 'lead', name: 'قائد', name_en: 'Lead', icon: '👑', color: '#16a34a', bg_color: 'bg-green-100', text_color: 'text-green-800' },
  { id: 'prospect', name: 'محتمل', name_en: 'Prospect', icon: '🔍', color: '#7c3aed', bg_color: 'bg-violet-100', text_color: 'text-violet-800' },
  { id: 'moderate', name: 'متوسط', name_en: 'Moderate', icon: '🌤️', color: '#f59e0b', bg_color: 'bg-amber-100', text_color: 'text-amber-800' },
] as const;

// حالات العملاء - Customer Statuses
const CUSTOMER_STATUSES = [
  { id: 'active', name: 'نشط', name_en: 'Active', icon: '✅', color: '#10b981', bg_color: 'bg-emerald-100', text_color: 'text-emerald-800' },
  { id: 'inactive', name: 'غير نشط', name_en: 'Inactive', icon: '⏸️', color: '#6b7280', bg_color: 'bg-gray-100', text_color: 'text-gray-800' },
  { id: 'pending', name: 'قيد المراجعة', name_en: 'Pending', icon: '⏳', color: '#f59e0b', bg_color: 'bg-amber-100', text_color: 'text-amber-800' },
  { id: 'suspended', name: 'موقوف', name_en: 'Suspended', icon: '🚫', color: '#ef4444', bg_color: 'bg-red-100', text_color: 'text-red-800' },
  { id: 'archived', name: 'مؤرشف', name_en: 'Archived', icon: '📁', color: '#8b5cf6', bg_color: 'bg-purple-100', text_color: 'text-purple-800' },
] as const;

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  'buyer': 'مشتري',
  'seller': 'بائع',
  'renter': 'مستأجر',
  'owner': 'مالك',
  'investor': 'مستثمر',
  'other': 'آخر',
  'individual': 'فردي',
  'corporate': 'شركة',
  'vip': 'مهم',
  'government': 'حكومي',
  'international': 'دولي',
  'partner': 'شريك',
};

const INTEREST_LEVEL_LABELS: Record<string, { text: string; icon: string; color: string }> = {
  'hot': { text: 'ساخن', icon: '🔥', color: 'bg-red-100 text-red-700' },
  'warm': { text: 'دافئ', icon: '☀️', color: 'bg-orange-100 text-orange-700' },
  'moderate': { text: 'متوسط', icon: '🌤️', color: 'bg-blue-100 text-blue-700' },
  'cold': { text: 'بارد', icon: '❄️', color: 'bg-gray-100 text-gray-700' },
  'lead': { text: 'قائد', icon: '👑', color: 'bg-green-100 text-green-700' },
  'prospect': { text: 'محتمل', icon: '🔍', color: 'bg-violet-100 text-violet-700' },
};

const ACTIVITY_TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  'call': { icon: Phone, color: 'bg-green-100 text-green-600' },
  'whatsapp': { icon: MessageSquare, color: 'bg-green-100 text-green-600' },
  'email': { icon: Mail, color: 'bg-blue-100 text-blue-600' },
  'meeting': { icon: Calendar, color: 'bg-purple-100 text-purple-600' },
  'note': { icon: FileText, color: 'bg-yellow-100 text-yellow-600' },
  'status_change': { icon: Activity, color: 'bg-gray-100 text-gray-600' },
};

// معاملات العميل الوهمية - Mock Transactions
const mockTransactions = [
  { id: '1', date: '2024-12-01', type: 'شراء', amount: 12500, status: 'مكتمل', invoice: 'INV-2024-001' },
  { id: '2', date: '2024-11-28', type: 'دفعة', amount: 5000, status: 'مكتمل', invoice: 'PAY-2024-045' },
  { id: '3', date: '2024-11-25', type: 'استرداد', amount: -2500, status: 'مكتمل', invoice: 'REF-2024-012' },
];

// عروض العميل الوهمية - Mock Customer Offers
const mockCustomerOffers = [
  { id: '1', title: 'عرض فيلا النرجس', price: '2,500,000', status: 'active', date: '2024-12-01' },
  { id: '2', title: 'عرض شقة العليا', price: '850,000', status: 'pending', date: '2024-11-28' },
];

// طلبات العميل الوهمية - Mock Customer Requests
const mockCustomerRequests = [
  { id: '1', title: 'طلب عقار سكني', type: 'فيلا', budget: '3,000,000', status: 'active', date: '2024-12-05' },
  { id: '2', title: 'طلب أرض تجارية', type: 'أرض', budget: '5,000,000', status: 'pending', date: '2024-11-20' },
];

// فواتير العميل الوهمية - Mock Invoices
const mockInvoices = [
  { id: '1', number: 'INV-2024-001', amount: 25000, status: 'مدفوعة', date: '2024-12-01', dueDate: '2024-12-15' },
  { id: '2', number: 'INV-2024-002', amount: 7500, status: 'معلقة', date: '2024-11-28', dueDate: '2024-12-10' },
  { id: '3', number: 'INV-2024-003', amount: 15000, status: 'متأخرة', date: '2024-11-15', dueDate: '2024-11-30' },
];

export default function CustomerDetailsPage({ customer, onBack, onUpdate }: CustomerDetailsPageProps) {
  // استخدام التبويب من بيانات العميل إذا تم تحديده (مثلاً من المساعد الذكي)
  const initialTab = (customer as any).activeTab || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer>(customer);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [linkedProperties, setLinkedProperties] = useState<LinkedProperty[]>(mockLinkedProperties);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'medium' });
  const [newReminder, setNewReminder] = useState({ title: '', description: '', date: '', priority: 'medium' });
  const [isSaving, setIsSaving] = useState(false);
  const [showAddCRMTask, setShowAddCRMTask] = useState(false);
  
  // استخدام hook المهام من قاعدة البيانات
  const { tasks: crmTasks, getTasksByCustomer, fetchTasks: refreshTasks } = useCRMTasks();
  const customerTasks = getTasksByCustomer(customer.id);
  
  // استخدام hooks البيانات الحقيقية
  const { 
    transactions, 
    getTransactionsByCustomer, 
    createTransaction,
    loading: transactionsLoading 
  } = useCustomerTransactions();
  const { 
    interactions, 
    getInteractionsByCustomer, 
    createInteraction, 
    getInteractionStats,
    getRecentInteractions,
    loading: interactionsLoading 
  } = useCustomerInteractions();
  const { 
    invoices, 
    getInvoicesByCustomer, 
    createInvoice, 
    markAsPaid,
    getInvoiceStats,
    generateInvoiceNumber,
    loading: invoicesLoading 
  } = useCustomerInvoices();
  
  // استخدام hooks تتبع الأحداث والإشعارات
  const { trackCustomerEvent, track } = useEventTracker();
  const { createNotification } = useNotifications();
  
  // ✅ جلب بيانات البطاقة الرقمية للمستخدم الحالي
  const { data: businessCardData, loading: businessCardLoading } = useBusinessCardData();
  
  // جلب البيانات الخاصة بالعميل الحالي
  const customerTransactions = getTransactionsByCustomer(customer.id, customer.phone);
  const customerInteractions = getInteractionsByCustomer(customer.id, customer.phone);
  const customerInvoices = getInvoicesByCustomer(customer.id, customer.phone);
  const interactionStats = getInteractionStats(customer.id, customer.phone);
  const invoiceStats = getInvoiceStats(customer.id, customer.phone);
  const recentActivities = getRecentInteractions(customer.id, customer.phone, 3);
  
  // حالة نموذج المعاملة الجديدة
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);
  const [newTransactionData, setNewTransactionData] = useState({
    transaction_type: 'دفعة',
    amount: '',
    description: '',
    invoice_number: ''
  });
  
  // حالة نموذج التفاعل الجديد
  const [showNewInteractionForm, setShowNewInteractionForm] = useState(false);
  const [newInteractionData, setNewInteractionData] = useState({
    interaction_type: 'call',
    description: '',
    sentiment: 'محايد',
    outcome: ''
  });
  
  // حالة نموذج الفاتورة الجديدة
  const [showNewInvoiceForm, setShowNewInvoiceForm] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    amount: '',
    description: '',
    due_date: ''
  });
  
  // حالات العقود والتنبيهات
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertType, setAlertType] = useState<'normal' | 'urgent'>('normal');
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [showEvacuationDialog, setShowEvacuationDialog] = useState(false);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [extensionDays, setExtensionDays] = useState('30');
  const [renewalMonths, setRenewalMonths] = useState('12');
  
  // حالة عرض تفاصيل العرض المستلم (معاينة كاملة)
  const [showOfferPreviewDialog, setShowOfferPreviewDialog] = useState(false);
  const [selectedOfferForPreview, setSelectedOfferForPreview] = useState<any>(null);
  
  // حالة عرض تفاصيل الطلب المستلم (معاينة كاملة)
  const [showRequestPreviewDialog, setShowRequestPreviewDialog] = useState(false);
  const [selectedRequestForPreview, setSelectedRequestForPreview] = useState<any>(null);
  
  // ✅ حالة نافذة اختيار محتويات PDF
  const [showPdfOptionsDialog, setShowPdfOptionsDialog] = useState(false);
  const [selectedOfferForPdf, setSelectedOfferForPdf] = useState<any>(null);
  const [pdfOptions, setPdfOptions] = useState({
    includeOwner: true,
    includeDeed: true,
    includeImages: true,
    includeProperty: true,
    includeDescription: true,
  });
  
  // حالات نموذج إضافة عقد إيجار جديد
  const [showNewRentalForm, setShowNewRentalForm] = useState(false);
  const [rentalFilter, setRentalFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [newRentalData, setNewRentalData] = useState({
    title: '',
    location: '',
    tenant: '',
    tenantPhone: '',
    startDate: '',
    duration: '12',
    monthlyRent: '',
    propertyType: 'villa',
    notes: '',
  });
  
  // بيانات العقارات المؤجرة الحقيقية
  const [rentedProperties, setRentedProperties] = useState([
    {
      id: '1',
      title: 'فيلا في حي النرجس',
      location: 'الرياض - حي النرجس',
      tenant: 'خالد سعيد',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      daysRemaining: 32,
      monthlyRent: 8000,
      duration: 12,
    },
    {
      id: '2',
      title: 'شقة في حي العليا',
      location: 'الرياض - حي العليا',
      tenant: 'أحمد فهد',
      status: 'expiring',
      startDate: '2023-12-01',
      endDate: '2024-12-01',
      daysRemaining: 15,
      monthlyRent: 4500,
      duration: 12,
    },
    {
      id: '3',
      title: 'مكتب تجاري في طريق الملك فهد',
      location: 'الرياض - طريق الملك فهد',
      tenant: 'شركة الأمل للتجارة',
      status: 'expired',
      startDate: '2023-12-01',
      endDate: '2024-12-01',
      daysRemaining: 0,
      monthlyRent: 15000,
      duration: 12,
    },
  ]);
  
  // حساب إحصائيات العقارات المؤجرة
  const rentedStats = {
    total: rentedProperties.length,
    active: rentedProperties.filter(p => p.status === 'active').length,
    expiring: rentedProperties.filter(p => p.status === 'expiring').length,
    expired: rentedProperties.filter(p => p.status === 'expired').length,
    totalMonthlyRent: rentedProperties.reduce((sum, p) => sum + p.monthlyRent, 0),
  };
  
  // إرسال تنبيه للمستأجر
  const handleSendAlert = async (property: any, type: 'normal' | 'urgent') => {
    setSelectedContract(property);
    setAlertType(type);
    setAlertMessage(type === 'urgent' 
      ? `⚠️ تنبيه عاجل: عقد إيجار "${property.title}" ينتهي خلال ${property.daysRemaining} يوم فقط!`
      : `📋 تذكير: عقد إيجار "${property.title}" سينتهي بتاريخ ${property.endDate}`
    );
    setShowAlertDialog(true);
  };
  
  // تأكيد إرسال التنبيه
  const confirmSendAlert = async () => {
    try {
      // محاولة إرسال SMS
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: customer.phone,
          message: alertMessage,
        }
      });
      
      if (error) {
        // في حالة فشل SMS، فتح WhatsApp
        const encodedMessage = encodeURIComponent(alertMessage);
        window.open(`https://wa.me/${customer.phone?.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
      }
      
      NotificationSounds.chime();
      toast.success(alertType === 'urgent' ? 'تم إرسال الإشعار العاجل' : 'تم إرسال التنبيه');
      
      // إنشاء تفاعل في قاعدة البيانات
      await createInteraction({
        customer_id: customer.id,
        customer_phone: customer.phone,
        interaction_type: 'whatsapp',
        description: alertMessage,
        sentiment: alertType === 'urgent' ? 'سلبي' : 'محايد',
        outcome: 'تم الإرسال',
      });
      
      setShowAlertDialog(false);
      setAlertMessage('');
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('فشل إرسال التنبيه');
    }
  };
  
  // تجديد العقد
  const handleRenewal = (property: any) => {
    setSelectedContract(property);
    setShowRenewalDialog(true);
  };
  
  // تأكيد تجديد العقد
  const confirmRenewal = () => {
    if (!selectedContract) return;
    
    const newEndDate = new Date(selectedContract.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + parseInt(renewalMonths));
    
    setRentedProperties(prev => prev.map(p => 
      p.id === selectedContract.id 
        ? { 
            ...p, 
            status: 'active', 
            endDate: newEndDate.toISOString().split('T')[0],
            daysRemaining: Math.ceil((newEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          } 
        : p
    ));
    
    NotificationSounds.success();
    toast.success(`تم تجديد العقد لمدة ${renewalMonths} شهر`);
    
    createNotification({
      title: 'تم تجديد العقد',
      message: `تم تجديد عقد "${selectedContract.title}" لمدة ${renewalMonths} شهر`,
      notification_type: 'crm',
      category: 'contract_renewed',
      related_entity_id: selectedContract.id,
      related_entity_type: 'contract',
    });
    
    setShowRenewalDialog(false);
    setSelectedContract(null);
  };
  
  // إخلاء العقار
  const handleEvacuation = (property: any) => {
    setSelectedContract(property);
    setShowEvacuationDialog(true);
  };
  
  // تأكيد إخلاء العقار
  const confirmEvacuation = () => {
    if (!selectedContract) return;
    
    setRentedProperties(prev => prev.filter(p => p.id !== selectedContract.id));
    
    NotificationSounds.alert();
    toast.success('تم تسجيل إخلاء العقار');
    
    createNotification({
      title: 'إخلاء عقار',
      message: `تم إخلاء "${selectedContract.title}" من قبل ${selectedContract.tenant}`,
      notification_type: 'crm',
      category: 'property_evacuated',
      related_entity_id: selectedContract.id,
      related_entity_type: 'contract',
    });
    
    setShowEvacuationDialog(false);
    setSelectedContract(null);
  };
  
  // طلب مهلة
  const handleExtension = (property: any) => {
    setSelectedContract(property);
    setShowExtensionDialog(true);
  };
  
  // تأكيد طلب المهلة
  const confirmExtension = () => {
    if (!selectedContract) return;
    
    const currentEndDate = new Date(selectedContract.endDate);
    currentEndDate.setDate(currentEndDate.getDate() + parseInt(extensionDays));
    
    setRentedProperties(prev => prev.map(p => 
      p.id === selectedContract.id 
        ? { 
            ...p, 
            endDate: currentEndDate.toISOString().split('T')[0],
            daysRemaining: parseInt(extensionDays),
            status: 'expiring',
          } 
        : p
    ));
    
    NotificationSounds.chime();
    toast.success(`تم منح مهلة ${extensionDays} يوم`);
    
    createNotification({
      title: 'طلب مهلة',
      message: `تم منح مهلة ${extensionDays} يوم لـ "${selectedContract.title}"`,
      notification_type: 'crm',
      category: 'extension_granted',
      related_entity_id: selectedContract.id,
      related_entity_type: 'contract',
    });
    
    setShowExtensionDialog(false);
    setSelectedContract(null);
  };
  
  // استخدام hook تصدير جهات الاتصال
  const { saveContactToDevice, isNativePlatform, isSaving: isSavingContact } = useDeviceContacts();
  
  // تصدير جهة اتصال العميل للجهاز
  const handleExportContactToDevice = async () => {
    const success = await saveContactToDevice({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    });
  };
  
  // عروض الأسعار للعميل من صفحة العروض
  const [priceQuotes, setPriceQuotes] = useState<any[]>([]);
  
  // تحميل عروض الأسعار للعميل (من قاعدة البيانات أولاً ثم localStorage كاحتياط)
  useEffect(() => {
    const fromDb = ((customer as any).metadata?.price_quotes as any[]) || [];
    if (fromDb.length > 0) {
      setPriceQuotes(fromDb);
      return;
    }

    const loadFromLocal = () => {
      try {
        const allCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
        const foundCustomer = allCustomers.find((c: any) =>
          c.phone === customer.phone || c.whatsapp === customer.phone || c.id === customer.id
        );
        if (foundCustomer?.priceQuotes) {
          setPriceQuotes(foundCustomer.priceQuotes);
        } else {
          setPriceQuotes([]);
        }
      } catch (e) {
        console.error('Error loading price quotes:', e);
        setPriceQuotes([]);
      }
    };

    loadFromLocal();

    const handleStorageChange = () => loadFromLocal();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [customer.id, customer.phone, (customer as any).metadata]);
  
  // العقارات المنشورة للعميل
  const [publishedAds, setPublishedAds] = useState<any[]>([]);
  
  // تحميل العقارات المنشورة للمالك من قاعدة البيانات و localStorage
  useEffect(() => {
    const loadPublishedAds = async () => {
      try {
        // 1. محاولة التحميل من قاعدة البيانات أولاً (platform_listings)
        const { data: dbListings, error } = await supabase
          .from('platform_listings')
          .select('*')
          .or(`owner_phone.eq.${customer.phone},broker_phone.eq.${customer.phone}`)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && dbListings && dbListings.length > 0) {
          // تحويل البيانات لتتوافق مع الصيغة المتوقعة
          const formattedListings = dbListings.map((listing: any) => ({
            id: listing.id,
            title: listing.title,
            propertyType: listing.property_type,
            purpose: listing.purpose,
            price: listing.price?.toString(),
            area: listing.area,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            city: listing.city,
            district: listing.district,
            locationDetails: {
              city: listing.city,
              district: listing.district,
              street: listing.street,
            },
            images: listing.images || [],
            status: listing.status,
            ad_license: listing.ad_license,
            ad_license_date: listing.ad_license_date,
            ad_license_duration: listing.ad_license_duration,
            ad_license_expires_at: listing.ad_license_expires_at,
            publishedAt: listing.created_at,
            views: listing.views || 0,
            is_hidden: listing.is_hidden,
            is_pinned: listing.is_pinned,
          }));
          setPublishedAds(formattedListings);
          return;
        }

        // 2. كاحتياط، تحميل من localStorage
        const allAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
        const customerAds = allAds.filter((ad: any) => 
          ad.linkedCustomerId === customer.id || 
          ad.ownerPhone === customer.phone ||
          ad.ownerName === customer.name
        );
        setPublishedAds(customerAds);
      } catch (e) {
        console.error('Error loading published ads:', e);
        // كاحتياط نهائي
        try {
          const allAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
          const customerAds = allAds.filter((ad: any) => 
            ad.linkedCustomerId === customer.id || 
            ad.ownerPhone === customer.phone ||
            ad.ownerName === customer.name
          );
          setPublishedAds(customerAds);
        } catch {
          setPublishedAds([]);
        }
      }
    };
    
    loadPublishedAds();
    
    // Listen for new ads being published
    const handleAdPublished = () => loadPublishedAds();
    window.addEventListener('adPublished', handleAdPublished);
    
    return () => {
      window.removeEventListener('adPublished', handleAdPublished);
    };
  }, [customer.id, customer.phone, customer.name]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showAddTabDialog, setShowAddTabDialog] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  
  // حالة عرض تفاصيل العقار
  const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState<any>(null);
  const [showPropertyDetailsDialog, setShowPropertyDetailsDialog] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [selectedPropertyForPDF, setSelectedPropertyForPDF] = useState<any>(null);
  const [showPDFPreviewDialog, setShowPDFPreviewDialog] = useState(false);
  
  // التبويبات القابلة للتخصيص
  const [customTabs, setCustomTabs] = useState(() => {
    const saved = localStorage.getItem(`customer_tabs_${customer.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  
  // الحصول على حالة العروض والطلبات غير المقروءة
  const customerMetadata = (customer as any).metadata || {};
  const hasUnreadOffer = customerMetadata.hasUnreadOffer === true;
  const hasUnreadRequest = customerMetadata.hasUnreadRequest === true;
  const offersCount = (customerMetadata.property_offers as any[] || []).length;
  const requestsCount = (customerMetadata.property_requests as any[] || []).length;
  
  // Default tabs - مرتبة: المعلومات العامة، العروض، عرض منشور، طلب منشور، الطلبات، عروض الأسعار، عقار مؤجر، المهام
  const defaultTabs = [
    { id: 'overview', name: '📊 المعلومات العامة', removable: false },
    { id: 'offers', name: '🎯 العروض', removable: false, hasUnread: hasUnreadOffer, count: offersCount },
    { id: 'published_ads', name: '📢 عقارات منشورة', removable: false },
    { id: 'published_requests', name: '📋 طلب منشور', removable: false },
    { id: 'requests', name: '📝 الطلبات', removable: false, hasUnread: hasUnreadRequest, count: requestsCount },
    { id: 'price_quotes', name: '💵 عروض الأسعار', removable: false },
    { id: 'rented', name: '🏠 عقار مؤجر', removable: false },
    { id: 'tasks', name: '✅ المهام', removable: false },
    { id: 'transactions', name: '💰 المعاملات', removable: true },
    { id: 'activity', name: '💬 التفاعلات', removable: false },
    { id: 'analytics', name: '📈 التحليلات', removable: true },
    { id: 'properties', name: '🏘️ العقارات', removable: true },
    { id: 'invoices', name: '🧾 الفواتير', removable: true },
    { id: 'history', name: '⏳ السجل', removable: true },
    { id: 'settings', name: '⚙️ الإعدادات', removable: false },
  ];
  
  const [visibleTabs, setVisibleTabs] = useState(() => {
    const saved = localStorage.getItem(`visible_tabs_${customer.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultTabs.map(t => t.id);
      }
    }
    return defaultTabs.map(t => t.id);
  });
  
  // حفظ التبويبات المرئية
  useEffect(() => {
    localStorage.setItem(`visible_tabs_${customer.id}`, JSON.stringify(visibleTabs));
  }, [visibleTabs, customer.id]);
  
  // حذف تبويب
  const removeTab = (tabId: string) => {
    const tab = defaultTabs.find(t => t.id === tabId);
    if (tab && !tab.removable) {
      toast.error('لا يمكن حذف هذا التبويب');
      return;
    }
    setVisibleTabs(prev => prev.filter(id => id !== tabId));
    if (activeTab === tabId) {
      setActiveTab('overview');
    }
    toast.success('تم إخفاء التبويب');
  };
  
  // إضافة تبويب مخفي
  const addHiddenTab = (tabId: string) => {
    if (!visibleTabs.includes(tabId)) {
      setVisibleTabs(prev => [...prev, tabId]);
      toast.success('تم إظهار التبويب');
    }
  };
  
  // التمرير بالسحب للتبويبات
  const handleTabsScroll = (e: React.TouchEvent) => {
    // Touch scrolling is handled natively
  };

  // Auto-save functionality - saves after 2 seconds of inactivity
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    setHasUnsavedChanges(true);
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (isEditing) {
        setIsSaving(true);
        onUpdate(editedCustomer);
        
        setTimeout(() => {
          setIsSaving(false);
          setHasUnsavedChanges(false);
          toast.success('تم الحفظ تلقائياً', { duration: 1500 });
        }, 500);
      }
    }, 2000);
  }, [editedCustomer, isEditing, onUpdate]);

  // Trigger auto-save when edited customer changes
  useEffect(() => {
    if (isEditing && editedCustomer !== customer) {
      triggerAutoSave();
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editedCustomer, isEditing, customer, triggerAutoSave]);

  // Handle delete customer
  const handleDeleteCustomer = () => {
    setShowDeleteConfirm(true);
  };

  // Confirm delete customer
  const confirmDeleteCustomer = () => {
    // TODO: Implement actual delete logic with backend
    toast.success('تم حذف العميل بنجاح');
    setShowDeleteConfirm(false);
    onBack();
  };

  // Handle save (manual)
  const handleSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    onUpdate(editedCustomer);
    setIsEditing(false);
    setHasUnsavedChanges(false);
    toast.success('تم حفظ التغييرات بنجاح');
  };

  // Handle add note
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: ActivityLog = {
      id: Date.now().toString(),
      type: 'note',
      description: newNote,
      timestamp: new Date().toLocaleString('ar-SA'),
      user: 'أنت',
    };
    
    setActivityLogs([note, ...activityLogs]);
    setNewNote('');
    setShowAddNote(false);
    toast.success('تم إضافة الملاحظة');
  };

  // Handle add task
  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate,
      status: 'pending',
      priority: newTask.priority as Task['priority'],
    };
    
    setTasks([task, ...tasks]);
    setNewTask({ title: '', description: '', dueDate: '', priority: 'medium' });
    setShowAddTask(false);
    toast.success('تم إضافة المهمة');
  };

  // Toggle task status
  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  // Handle add reminder
  const handleAddReminder = () => {
    if (!newReminder.title.trim()) return;
    
    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      description: newReminder.description,
      date: newReminder.date,
      completed: false,
      priority: newReminder.priority as Reminder['priority'],
    };
    
    setReminders([reminder, ...reminders]);
    setNewReminder({ title: '', description: '', date: '', priority: 'medium' });
    setShowAddReminder(false);
    toast.success('تم إضافة التذكير');
  };

  // Toggle reminder status
  const toggleReminderStatus = (reminderId: string) => {
    setReminders(reminders.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, completed: !reminder.completed }
        : reminder
    ));
  };

  const interestLevel = INTEREST_LEVEL_LABELS[customer.interestLevel || 'moderate'] || INTEREST_LEVEL_LABELS['moderate'];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] border-b-4 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-2 border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة
            </Button>
            
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">تفاصيل العميل</h1>
              
              {/* Auto-save indicator */}
              {isEditing && (
                <div className="flex items-center gap-2">
                  {isSaving ? (
                    <span className="text-xs text-[#D4AF37] flex items-center gap-1 animate-pulse">
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-ping"></div>
                      جاري الحفظ...
                    </span>
                  ) : hasUnsavedChanges ? (
                    <span className="text-xs text-yellow-300 flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                      تغييرات غير محفوظة
                    </span>
                  ) : (
                    <span className="text-xs text-green-300 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      محفوظ
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={() => {
                      if (autoSaveTimeoutRef.current) {
                        clearTimeout(autoSaveTimeoutRef.current);
                      }
                      setEditedCustomer(customer);
                      setIsEditing(false);
                      setHasUnsavedChanges(false);
                    }}
                    variant="outline"
                    className="border-[#D4AF37] text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4 ml-1" />
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-[#D4AF37] text-[#01411C] hover:bg-[#f1c40f]"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 ml-1" />
                    حفظ
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setActiveTab('settings')}
                  className="bg-[#01411C] text-white border-2 border-[#D4AF37] hover:bg-[#026129] shadow-lg"
                >
                  <Settings className="w-4 h-4 ml-1" />
                  إعدادات خاصة
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Customer Profile Card */}
      <div className="container mx-auto px-4 py-6">
        <Card className="border-2 border-[#D4AF37] bg-gradient-to-r from-white to-[#f0fdf4] shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 border-4 border-[#D4AF37] shadow-lg">
                {customer.profileImage && <AvatarImage src={customer.profileImage} />}
                <AvatarFallback className="bg-[#01411C] text-white text-2xl font-bold">
                  {customer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-[#01411C]">{customer.name}</h2>
                  <Badge className={interestLevel.color}>
                    {interestLevel.icon} {interestLevel.text}
                  </Badge>
                  <Badge variant="outline" className="text-[#01411C] border-[#01411C]">
                    {CUSTOMER_TYPE_LABELS[customer.type || 'other']}
                  </Badge>
                </div>

                {customer.company && (
                  <p className="text-gray-600 mb-2 flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {customer.company}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-[#01411C]" />
                    <span dir="ltr">{customer.phone}</span>
                  </span>
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-[#01411C]" />
                      {customer.email}
                    </span>
                  )}
                  {customer.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#01411C]" />
                      {customer.location}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => window.open(`https://wa.me/${customer.phone}`, '_blank')}
                >
                  <MessageSquare className="w-4 h-4 ml-2" />
                  واتساب
                </Button>
                <Button
                  className="bg-[#01411C] hover:bg-[#065f41]"
                  onClick={() => window.location.href = `tel:${customer.phone}`}
                >
                  <Phone className="w-4 h-4 ml-2" />
                  اتصال
                </Button>
                <Button
                  variant="outline"
                  className="border-[#D4AF37]"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('createAppointmentFromCRM', {
                      detail: { customerId: customer.id, customerName: customer.name, customerPhone: customer.phone }
                    }));
                  }}
                >
                  <Calendar className="w-4 h-4 ml-2" />
                  جدولة موعد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs - تبويبات قابلة للسحب والتخصيص */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <div className="flex items-center gap-2 mb-4">
            {/* التبويبات القابلة للسحب */}
            <div 
              ref={tabsContainerRef}
              className="flex-1 overflow-x-auto scrollbar-hide touch-pan-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onTouchStart={handleTabsScroll}
            >
              <TabsList className="flex flex-nowrap gap-1 bg-white border-2 border-[#D4AF37] p-1 min-w-max">
                {defaultTabs.filter(tab => visibleTabs.includes(tab.id)).map((tab) => {
                  // التحقق من وجود عناصر جديدة في كل تبويب
                  const customerMeta = (customer as any).metadata as Record<string, any> | undefined;
                  const hasNewPublishedRequest = customerMeta?.hasNewPublishedRequest && tab.id === 'published_requests';
                  const hasNewPublishedAd = customerMeta?.hasNewPublishedAd && tab.id === 'published_ads';
                  // ✅ الدائرة النابضة لتبويب العروض والطلبات - من metadata العميل
                  const hasNewOffer = customerMeta?.hasUnreadOffer && tab.id === 'offers';
                  const hasNewRequest = customerMeta?.hasUnreadRequest && tab.id === 'requests';
                  return (
                    <div key={tab.id} className="relative group flex items-center">
                      <TabsTrigger 
                        value={tab.id} 
                        className="text-xs whitespace-nowrap pr-6 relative"
                        onClick={() => {
                          // إزالة علامة غير مقروء عند فتح تبويب العروض
                          if (tab.id === 'offers' && customerMeta?.hasUnreadOffer) {
                            supabase
                              .from('crm_customers')
                              .update({
                                metadata: {
                                  ...customerMeta,
                                  hasUnreadOffer: false,
                                }
                              })
                              .eq('id', customer.id)
                              .then(() => {
                                markAsViewed('offer', customer.id);
                                window.dispatchEvent(new CustomEvent('customerUpdated'));
                              });
                          }
                          // إزالة علامة غير مقروء عند فتح تبويب الطلبات
                          if (tab.id === 'requests' && customerMeta?.hasUnreadRequest) {
                            supabase
                              .from('crm_customers')
                              .update({
                                metadata: {
                                  ...customerMeta,
                                  hasUnreadRequest: false,
                                }
                              })
                              .eq('id', customer.id)
                              .then(() => {
                                markAsViewed('request', customer.id);
                                window.dispatchEvent(new CustomEvent('customerUpdated'));
                              });
                          }
                        }}
                      >
                        {tab.name}
                        {(tab as any).count > 0 && (
                          <Badge className="mr-1 bg-[#D4AF37] text-[#01411C] text-[10px] px-1.5">{(tab as any).count}</Badge>
                        )}
                        {/* نقطة نابضة للتبويبات الجديدة */}
                        <PulsingDot 
                          show={hasNewPublishedRequest || hasNewPublishedAd || hasNewOffer || hasNewRequest} 
                          size="sm" 
                          position="top-left" 
                          className="m-0"
                        />
                      </TabsTrigger>
                      {tab.removable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTab(tab.id);
                          }}
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </TabsList>
            </div>
            
            {/* زر إضافة تبويب مخفي */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 border-[#D4AF37] hover:bg-[#D4AF37]/10"
                onClick={() => setShowAddTabDialog(true)}
              >
                <Plus className="w-4 h-4 text-[#01411C]" />
              </Button>
            </div>
          </div>
          
          {/* حوار إضافة تبويب */}
          <Dialog open={showAddTabDialog} onOpenChange={setShowAddTabDialog}>
            <DialogContent dir="rtl" className="max-w-sm">
              <DialogHeader>
                <DialogTitle>إظهار تبويب</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {defaultTabs.filter(tab => !visibleTabs.includes(tab.id)).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      addHiddenTab(tab.id);
                      setShowAddTabDialog(false);
                    }}
                    className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {tab.name}
                  </button>
                ))}
                {defaultTabs.filter(tab => !visibleTabs.includes(tab.id)).length === 0 && (
                  <p className="text-center text-gray-500 py-4">جميع التبويبات ظاهرة</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddTabDialog(false)}>
                  إغلاق
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


          {/* Overview Tab - المعلومات العامة */}
          <TabsContent value="overview">
            <GeneralInfoTab
              customer={customer}
              isEditing={isEditing}
              editedCustomer={editedCustomer}
              setEditedCustomer={setEditedCustomer}
            />
          </TabsContent>

          {/* Activity Tab - تبويب التفاعلات المحسن - مربوط بقاعدة البيانات */}
          <TabsContent value="activity">
            <div className="space-y-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    سجل التفاعلات
                    {customerInteractions.length > 0 && (
                      <Badge className="bg-[#01411C] text-white">{customerInteractions.length}</Badge>
                    )}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    className="bg-[#01411C] hover:bg-[#065f41]"
                    onClick={() => setShowNewInteractionForm(true)}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    تفاعل جديد
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* نموذج إضافة تفاعل جديد */}
                  {showNewInteractionForm && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                      <h4 className="font-bold text-blue-800 mb-4">تسجيل تفاعل جديد</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">نوع التفاعل</Label>
                          <Select
                            value={newInteractionData.interaction_type}
                            onValueChange={(value) => setNewInteractionData(prev => ({ ...prev, interaction_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">📞 مكالمة هاتفية</SelectItem>
                              <SelectItem value="whatsapp">💬 واتساب</SelectItem>
                              <SelectItem value="email">📧 بريد إلكتروني</SelectItem>
                              <SelectItem value="meeting">🤝 اجتماع</SelectItem>
                              <SelectItem value="visit">🏠 زيارة عقار</SelectItem>
                              <SelectItem value="note">📝 ملاحظة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">الانطباع</Label>
                          <Select
                            value={newInteractionData.sentiment}
                            onValueChange={(value) => setNewInteractionData(prev => ({ ...prev, sentiment: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الانطباع" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="إيجابي">😊 إيجابي</SelectItem>
                              <SelectItem value="محايد">😐 محايد</SelectItem>
                              <SelectItem value="سلبي">😟 سلبي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-sm">الوصف</Label>
                          <Textarea
                            placeholder="وصف التفاعل..."
                            value={newInteractionData.description}
                            onChange={(e) => setNewInteractionData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-sm">النتيجة</Label>
                          <Input
                            placeholder="نتيجة التفاعل (اختياري)..."
                            value={newInteractionData.outcome}
                            onChange={(e) => setNewInteractionData(prev => ({ ...prev, outcome: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="bg-[#01411C] hover:bg-[#065f41]"
                          onClick={async () => {
                            if (!newInteractionData.description) {
                              toast.error('يرجى إدخال وصف التفاعل');
                              return;
                            }
                            const result = await createInteraction({
                              customer_id: customer.id,
                              customer_phone: customer.phone,
                              interaction_type: newInteractionData.interaction_type,
                              description: newInteractionData.description,
                              sentiment: newInteractionData.sentiment,
                              outcome: newInteractionData.outcome || undefined
                            });
                            
                            if (result) {
                              // تشغيل صوت النجاح
                              NotificationSounds.chime(0.5);
                              
                              // تسجيل الحدث
                              await trackCustomerEvent(customer.id, newInteractionData.interaction_type === 'call' ? 'call' : 
                                newInteractionData.interaction_type === 'whatsapp' ? 'whatsapp' : 
                                newInteractionData.interaction_type === 'email' ? 'email' : 'note_add', {
                                sentiment: newInteractionData.sentiment,
                                description: newInteractionData.description,
                                customer_name: customer.name,
                              });
                              
                              // إنشاء إشعار
                              await createNotification({
                                title: 'تفاعل جديد',
                                message: `تم تسجيل ${newInteractionData.interaction_type === 'call' ? 'مكالمة' : 
                                  newInteractionData.interaction_type === 'whatsapp' ? 'رسالة واتساب' : 
                                  newInteractionData.interaction_type === 'meeting' ? 'اجتماع' : 'تفاعل'} مع ${customer.name}`,
                                notification_type: 'crm',
                                related_entity_type: 'customer',
                                related_entity_id: customer.id,
                                priority: 'low'
                              });
                            }
                            
                            setNewInteractionData({ interaction_type: 'call', description: '', sentiment: 'محايد', outcome: '' });
                            setShowNewInteractionForm(false);
                          }}
                        >
                          حفظ التفاعل
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowNewInteractionForm(false)}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}

                  {interactionsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#01411C]" />
                      <p className="text-gray-500 mt-2">جاري التحميل...</p>
                    </div>
                  ) : customerInteractions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد تفاعلات مسجلة لهذا العميل</p>
                      <p className="text-sm mt-1">اضغط على "تفاعل جديد" لتسجيل أول تفاعل</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {customerInteractions.map((interaction) => {
                          const interactionIcons: Record<string, { icon: any; color: string }> = {
                            'call': { icon: Phone, color: 'bg-green-100 text-green-600' },
                            'whatsapp': { icon: MessageSquare, color: 'bg-green-100 text-green-600' },
                            'email': { icon: Mail, color: 'bg-blue-100 text-blue-600' },
                            'meeting': { icon: Calendar, color: 'bg-purple-100 text-purple-600' },
                            'visit': { icon: Home, color: 'bg-amber-100 text-amber-600' },
                            'note': { icon: FileText, color: 'bg-yellow-100 text-yellow-600' },
                          };
                          const iconData = interactionIcons[interaction.interaction_type] || interactionIcons['note'];
                          const Icon = iconData.icon;
                          
                          return (
                            <div key={interaction.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconData.color}`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900">
                                      {interaction.interaction_type === 'call' ? 'مكالمة هاتفية' : 
                                       interaction.interaction_type === 'whatsapp' ? 'واتساب' :
                                       interaction.interaction_type === 'email' ? 'بريد إلكتروني' :
                                       interaction.interaction_type === 'meeting' ? 'اجتماع' :
                                       interaction.interaction_type === 'visit' ? 'زيارة عقار' :
                                       'ملاحظة'}
                                    </h4>
                                    <div className="text-sm text-gray-600">
                                      {new Date(interaction.created_at).toLocaleDateString('ar-SA')} - {new Date(interaction.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                                <Badge className={
                                  interaction.sentiment === 'إيجابي' ? 'bg-green-100 text-green-800' :
                                  interaction.sentiment === 'محايد' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {interaction.sentiment || 'محايد'}
                                </Badge>
                              </div>
                              
                              <p className="text-gray-700 mb-3">{interaction.description}</p>
                              
                              {interaction.outcome && (
                                <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                                  <strong>النتيجة:</strong> {interaction.outcome}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                                <div className="flex items-center gap-4">
                                  {interaction.duration_seconds && <span>⏱️ {Math.round(interaction.duration_seconds / 60)} دقيقة</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* إحصائيات الاتصال - حقيقية */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">إجمالي المكالمات</div>
                    <div className="text-2xl font-bold text-blue-600">{interactionStats.callsCount}</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">رسائل واتساب</div>
                    <div className="text-2xl font-bold text-green-600">{interactionStats.whatsappCount}</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">الاجتماعات</div>
                    <div className="text-2xl font-bold text-purple-600">{interactionStats.meetingsCount}</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">إجمالي التفاعلات</div>
                    <div className="text-2xl font-bold text-amber-600">{interactionStats.totalInteractions}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  العقارات المرتبطة
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 ml-1" />
                  ربط عقار
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {linkedProperties.map((property) => (
                    <Card key={property.id} className="border">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-[#01411C]">{property.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span>{property.type}</span>
                            <span>•</span>
                            <span>{property.location}</span>
                            <span>•</span>
                            <span className="font-medium text-[#D4AF37]">{property.price}</span>
                          </div>
                        </div>
                        <Badge className={property.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {property.status === 'active' ? 'نشط' : property.status === 'sold' ? 'مباع' : 'مؤجر'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {linkedProperties.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد عقارات مرتبطة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Published Ads Tab - تبويب العقارات المنشورة */}
          <TabsContent value="published_ads">
            <Card className="border-2 border-[#D4AF37]">
              <CardHeader className="bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  العقارات المنشورة للمالك
                  {publishedAds.length > 0 && (
                    <Badge className="bg-[#D4AF37] text-[#01411C]">{publishedAds.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {publishedAds.length > 0 ? (
                  <div className="space-y-4">
                    {publishedAds.map((ad) => {
                      const isSold = ad.status === 'sold';
                      const isRented = ad.status === 'rented';
                      const isInactive = isSold || isRented;
                      
                      return (
                      <div key={ad.id} className="relative p-4 border-2 border-[#D4AF37]/50 rounded-lg bg-gradient-to-r from-amber-50/50 to-yellow-50/50">
                        {/* شريط أحمر للحالة: تم البيع/التأجير */}
                        {isInactive && (
                          <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 rounded-t-lg font-bold text-sm z-10">
                            {isSold ? '🏷️ تم البيع' : '🔑 تم التأجير'}
                          </div>
                        )}
                        
                        {/* نقطة حمراء نابضة على العرض الجديد */}
                        <PulsingDot show={isNew('published_ad', ad.id)} size="md" position="top-right" />
                        <div className={`flex flex-col lg:flex-row lg:items-start justify-between gap-4 ${isInactive ? 'mt-8' : ''}`}>
                          {/* معلومات العقار */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-lg text-[#01411C]">
                                {ad.purpose} {ad.propertyType}
                              </h4>
                              {/* حالة العرض بناءً على حالة الترخيص */}
                              {(() => {
                                // التحقق من حالة الترخيص
                                const today = new Date();
                                const expiresAt = ad.ad_license_expires_at ? new Date(ad.ad_license_expires_at) : null;
                                const isLicenseExpired = expiresAt && expiresAt < today;
                                const isHidden = ad.is_hidden;
                                
                                if (isSold) {
                                  return (
                                    <Badge className="bg-purple-100 text-purple-700">
                                      🏷️ مباع
                                    </Badge>
                                  );
                                }
                                if (isRented) {
                                  return (
                                    <Badge className="bg-blue-100 text-blue-700">
                                      🔑 مؤجر
                                    </Badge>
                                  );
                                }
                                if (isHidden) {
                                  return (
                                    <Badge className="bg-gray-100 text-gray-700">
                                      👁️‍🗨️ مخفي
                                    </Badge>
                                  );
                                }
                                if (isLicenseExpired) {
                                  return (
                                    <Badge className="bg-red-100 text-red-700">
                                      ⚠️ غير نشط - انتهى الترخيص
                                    </Badge>
                                  );
                                }
                                return (
                                  <Badge className="bg-emerald-100 text-emerald-700">
                                    ✅ نشط
                                  </Badge>
                                );
                              })()}
                              {/* عرض معلومات الترخيص إن وجدت */}
                              {ad.ad_license && (
                                <Badge variant="outline" className="border-amber-400 text-amber-700 text-xs">
                                  📋 {ad.ad_license}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {ad.locationDetails?.city} - {ad.locationDetails?.district}
                              </span>
                              <span className="flex items-center gap-1">
                                <Home className="w-4 h-4" />
                                {ad.area} م²
                              </span>
                              {ad.bedrooms && (
                                <span>🛏️ {ad.bedrooms} غرف</span>
                              )}
                              {ad.bathrooms && (
                                <span>🚿 {ad.bathrooms} حمام</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className="text-[#D4AF37] font-bold text-lg">
                                {ad.price ? `${parseInt(ad.price).toLocaleString()} ريال` : 'السعر غير محدد'}
                              </span>
                              <span className="text-gray-500 text-sm">
                                تاريخ النشر: {new Date(ad.publishedAt).toLocaleDateString('ar-SA')}
                              </span>
                            </div>

                            {/* الصور المصغرة */}
                            {ad.images && ad.images.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {ad.images.slice(0, 4).map((img: string, idx: number) => (
                                  <img 
                                    key={idx}
                                    src={img} 
                                    alt={`صورة ${idx + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg border"
                                  />
                                ))}
                                {ad.images.length > 4 && (
                                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-sm">
                                    +{ad.images.length - 4}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* أزرار الإجراءات */}
                          <div className="flex flex-col gap-2 min-w-[160px]">
                            <Button 
                              size="sm"
                              className="bg-[#01411C] text-white hover:bg-[#01411C]/90"
                              onClick={() => {
                                // تخزين بيانات الإعلان للتعبئة التلقائية
                                const republishData = {
                                  ...ad,
                                  // إعادة تعيين ID لإنشاء إعلان جديد
                                  id: undefined,
                                  publishedAt: undefined,
                                  status: 'draft',
                                };
                                localStorage.setItem('wasata_republish_data', JSON.stringify(republishData));
                                
                                // فتح نموذج النشر
                                window.dispatchEvent(new CustomEvent('openPublishForm', {
                                  detail: { 
                                    adData: republishData,
                                    isRepublish: true 
                                  }
                                }));
                                
                                // الانتقال لتبويب النشر
                                window.dispatchEvent(new CustomEvent('switchToDashboardTab', {
                                  detail: { tabId: 'publish' }
                                }));
                                
                                toast.success('تم تحميل بيانات العقار للنشر مرة أخرى');
                              }}
                            >
                              <Send className="w-4 h-4 ml-1" />
                              نشر مرة أخرى
                            </Button>
                            
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-[#D4AF37] text-[#01411C]"
                              onClick={() => {
                                setSelectedPropertyForPDF(ad);
                                setShowPDFPreviewDialog(true);
                              }}
                            >
                              <Download className="w-4 h-4 ml-1" />
                              تحميل PDF
                            </Button>
                            
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // إزالة النقطة الحمراء عند فتح العرض
                                markAsViewed('published_ad', ad.id);
                                markAsViewed('customer', customer.id);
                                setSelectedPropertyForDetails(ad);
                                setShowPropertyDetailsDialog(true);
                              }}
                              className="relative"
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              عرض التفاصيل
                              <PulsingDot show={isNew('published_ad', ad.id)} size="sm" position="top-right" />
                            </Button>
                            
                            {/* زر تم البيع أو تم التأجير */}
                            {!isSold && !isRented && (
                              <Button 
                                size="sm"
                                variant="outline"
                                className={ad.purpose === 'للإيجار' || ad.purpose === 'rent' 
                                  ? "border-blue-500 text-blue-600 hover:bg-blue-50" 
                                  : "border-purple-500 text-purple-600 hover:bg-purple-50"
                                }
                                onClick={async () => {
                                  const newStatus = (ad.purpose === 'للإيجار' || ad.purpose === 'rent') ? 'rented' : 'sold';
                                  try {
                                    // تحديث في قاعدة البيانات
                                    const { error } = await supabase
                                      .from('platform_listings')
                                      .update({ status: newStatus })
                                      .eq('id', ad.id);
                                    
                                    if (error) throw error;
                                    
                                    // تحديث الحالة محلياً
                                    setPublishedAds(prev => prev.map(a => 
                                      a.id === ad.id ? { ...a, status: newStatus } : a
                                    ));
                                    
                                    // تشغيل صوت النجاح
                                    NotificationSounds.success(0.5);
                                    
                                    toast.success(newStatus === 'sold' ? 'تم تسجيل البيع بنجاح' : 'تم تسجيل التأجير بنجاح');
                                  } catch (e) {
                                    console.error('Error updating status:', e);
                                    toast.error('فشل تحديث الحالة');
                                  }
                                }}
                              >
                                {(ad.purpose === 'للإيجار' || ad.purpose === 'rent') ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 ml-1" />
                                    تم التأجير
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 ml-1" />
                                    تم البيع
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">لا توجد عقارات منشورة</h3>
                    <p className="text-sm mb-4">لم يتم نشر أي عقار مرتبط بهذا المالك بعد</p>
                    <Button
                      onClick={() => {
                        // فتح نموذج النشر مع معلومات المالك مسبقة التعبئة
                        window.dispatchEvent(new CustomEvent('openPublishForm', {
                          detail: { 
                            prefillOwner: {
                              ownerName: customer.name,
                              ownerPhone: customer.phone,
                              ownerEmail: customer.email,
                            }
                          }
                        }));
                      }}
                      className="bg-[#01411C] text-[#D4AF37]"
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      نشر إعلان جديد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Published Requests Tab - تبويب طلب منشور */}
          <TabsContent value="published_requests">
            <Card className="border-2 border-[#D4AF37]">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-[#D4AF37]/10 flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  الطلبات المنشورة للعميل
                  {(() => {
                    const customerMeta = (customer as any).metadata as Record<string, any> | undefined;
                    const publishedReqs = customerMeta?.published_requests || [];
                    return publishedReqs.length > 0 ? (
                      <Badge className="bg-blue-500 text-white text-xs">{publishedReqs.length}</Badge>
                    ) : null;
                  })()}
                  {(() => {
                    const customerMeta = (customer as any).metadata as Record<string, any> | undefined;
                    return customerMeta?.hasNewPublishedRequest ? (
                      <PulsingDot show={true} size="sm" position="top-right" />
                    ) : null;
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {(() => {
                  const customerMeta = (customer as any).metadata as Record<string, any> | undefined;
                  const publishedReqs = customerMeta?.published_requests || [];
                  
                  // إزالة علامة الجديد عند عرض التبويب
                  if (customerMeta?.hasNewPublishedRequest && activeTab === 'published_requests') {
                    // تحديث الـ metadata لإزالة hasNewPublishedRequest
                    setTimeout(async () => {
                      try {
                        await supabase
                          .from('crm_customers')
                          .update({
                            metadata: {
                              ...customerMeta,
                              hasNewPublishedRequest: false,
                            }
                          })
                          .eq('id', customer.id);
                      } catch (e) {
                        console.log('Error updating customer metadata:', e);
                      }
                    }, 500);
                  }
                  
                  if (publishedReqs.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-2">لا توجد طلبات منشورة</h3>
                        <p className="text-sm mb-4">لم يتم نشر أي طلب عقاري لهذا العميل بعد</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-4">
                      {publishedReqs.map((req: any, index: number) => {
                        const isFulfilled = req.status === 'fulfilled';
                        
                        return (
                        <div 
                          key={req.id || index}
                          className="relative p-4 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50/50 to-white hover:shadow-md transition-all"
                        >
                          {/* شريط أحمر للحالة: تم التوفير */}
                          {isFulfilled && (
                            <div className="absolute top-0 left-0 right-0 bg-green-600 text-white text-center py-2 rounded-t-lg font-bold text-sm z-10">
                              ✓ تم توفير الطلب
                            </div>
                          )}
                          
                          <div className={`flex items-start justify-between ${isFulfilled ? 'mt-8' : ''}`}>
                            <div className="flex-1">
                              {/* العنوان والحالة */}
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-[#01411C]">
                                  طلب {req.purpose} - {req.propertyType}
                                </h4>
                                <Badge className={req.status === 'fulfilled' ? 'bg-green-500' : 'bg-blue-500'}>
                                  {req.status === 'fulfilled' ? '✓ تم التوفير' : '📢 منشور'}
                                </Badge>
                                {req.isNew && (
                                  <Badge className="bg-red-500 text-white animate-pulse">جديد</Badge>
                                )}
                              </div>
                              
                              {/* تفاصيل الطلب */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                <div className="p-2 bg-white border rounded-lg">
                                  <p className="text-xs text-gray-500">نوع العقار</p>
                                  <p className="font-medium text-sm">{req.propertyType || '-'}</p>
                                </div>
                                <div className="p-2 bg-white border rounded-lg">
                                  <p className="text-xs text-gray-500">المدينة</p>
                                  <p className="font-medium text-sm flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-[#01411C]" />
                                    {req.preferredCity || req.ownerCity || '-'}
                                  </p>
                                </div>
                                <div className="p-2 bg-white border rounded-lg">
                                  <p className="text-xs text-gray-500">الميزانية</p>
                                  <p className="font-medium text-sm">
                                    {req.minBudget ? `${parseInt(req.minBudget).toLocaleString()}` : '-'} - {req.maxBudget ? `${parseInt(req.maxBudget).toLocaleString()}` : '-'} ريال
                                  </p>
                                </div>
                                <div className="p-2 bg-white border rounded-lg">
                                  <p className="text-xs text-gray-500">تاريخ النشر</p>
                                  <p className="font-medium text-sm">
                                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-SA') : '-'}
                                  </p>
                                </div>
                              </div>
                              
                              {/* مواصفات إضافية */}
                              {(req.bedrooms || req.bathrooms || req.minArea || req.maxArea) && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {req.bedrooms && (
                                    <Badge variant="outline" className="text-xs">
                                      🛏️ {req.bedrooms} غرف
                                    </Badge>
                                  )}
                                  {req.bathrooms && (
                                    <Badge variant="outline" className="text-xs">
                                      🚿 {req.bathrooms} حمام
                                    </Badge>
                                  )}
                                  {(req.minArea || req.maxArea) && (
                                    <Badge variant="outline" className="text-xs">
                                      📐 {req.minArea || '-'} - {req.maxArea || '-'} م²
                                    </Badge>
                                  )}
                                  {req.furnishing && (
                                    <Badge variant="outline" className="text-xs">
                                      🪑 {req.furnishing}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              {/* متطلبات إضافية */}
                              {req.additionalRequirements && (
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-xs text-yellow-700 font-medium mb-1">متطلبات إضافية:</p>
                                  <p className="text-sm text-gray-700">{req.additionalRequirements}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* أزرار الإجراءات */}
                          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => window.open(`https://wa.me/${customer.phone}`, '_blank')}
                            >
                              <MessageSquare className="w-4 h-4 ml-1" />
                              واتساب
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => window.location.href = `tel:${customer.phone}`}
                            >
                              <Phone className="w-4 h-4 ml-1" />
                              اتصال
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-500 text-amber-600 hover:bg-amber-50"
                              onClick={async () => {
                                // تحديث حالة الطلب لـ "تم التوفير"
                                const updatedReqs = publishedReqs.map((r: any) => 
                                  r.id === req.id ? { ...r, status: 'fulfilled' } : r
                                );
                                try {
                                  await supabase
                                    .from('crm_customers')
                                    .update({
                                      metadata: {
                                        ...customerMeta,
                                        published_requests: updatedReqs,
                                      }
                                    })
                                    .eq('id', customer.id);
                                  toast.success('تم تحديث حالة الطلب');
                                  // تحديث البيانات محلياً
                                  window.dispatchEvent(new CustomEvent('customerUpdated'));
                                } catch (e) {
                                  toast.error('فشل تحديث الحالة');
                                }
                              }}
                              disabled={req.status === 'fulfilled'}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              {req.status === 'fulfilled' ? 'تم التوفير' : 'تم توفير الطلب'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#01411C] text-[#01411C] hover:bg-[#01411C]/10"
                              onClick={async () => {
                                // ✅ تحميل PDF للطلب باستخدام بيانات البطاقة الرقمية
                                try {
                                  const brokerData = {
                                    name: businessCardData.name,
                                    company: businessCardData.companyName,
                                    phone: businessCardData.phone,
                                    location: req.preferredCity || businessCardData.city,
                                    licenseNumber: businessCardData.falLicense,
                                    profileImage: businessCardData.profileImageUrl,
                                    coverImage: businessCardData.coverImageUrl,
                                    logoImage: businessCardData.logoUrl,
                                  };
                                  
                                  const requestData = {
                                    id: req.id,
                                    ownerName: req.ownerName || customer.name,
                                    ownerPhone: req.ownerPhone || customer.phone,
                                    ownerIdNumber: req.ownerIdNumber,
                                    ownerBirthDate: req.ownerBirthDate,
                                    ownerCity: req.ownerCity,
                                    ownerDistrict: req.ownerDistrict,
                                    propertyType: req.propertyType,
                                    purpose: req.purpose,
                                    preferredCity: req.preferredCity,
                                    preferredDistricts: req.preferredDistricts,
                                    minArea: req.minArea,
                                    maxArea: req.maxArea,
                                    bedrooms: req.bedrooms,
                                    bathrooms: req.bathrooms,
                                    livingRooms: req.livingRooms,
                                    floors: req.floors,
                                    furnishing: req.furnishing,
                                    minBudget: req.minBudget,
                                    maxBudget: req.maxBudget,
                                    paymentPrices: req.paymentPrices,
                                    hasPool: req.hasPool,
                                    hasGarden: req.hasGarden,
                                    hasElevator: req.hasElevator,
                                    hasParking: req.hasParking,
                                    hasMaidRoom: req.hasMaidRoom,
                                    hasDriverRoom: req.hasDriverRoom,
                                    additionalRequirements: req.additionalRequirements,
                                    urgency: req.urgency,
                                    createdAt: req.createdAt,
                                  };
                                  
                                  await generateRequestPDF(requestData, true, brokerData);
                                  toast.success('تم تحميل ملف PDF');
                                } catch (e) {
                                  console.error('PDF error', e);
                                  toast.error('تعذر إنشاء PDF');
                                }
                              }}
                            >
                              <Download className="w-4 h-4 ml-1" />
                              PDF
                            </Button>
                            
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rented Properties Tab - تبويب عقار مؤجر */}
          <TabsContent value="rented">
            <div className="space-y-6">
              {/* نموذج إضافة عقد إيجار جديد */}
              {showNewRentalForm && (
                <Card className="border-2 border-[#D4AF37] bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      إضافة عقد إيجار جديد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">اسم العقار *</Label>
                        <Input
                          placeholder="مثال: فيلا في حي النرجس"
                          value={newRentalData.title}
                          onChange={(e) => setNewRentalData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">الموقع *</Label>
                        <Input
                          placeholder="مثال: الرياض - حي النرجس"
                          value={newRentalData.location}
                          onChange={(e) => setNewRentalData(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">اسم المستأجر *</Label>
                        <Input
                          placeholder="اسم المستأجر"
                          value={newRentalData.tenant}
                          onChange={(e) => setNewRentalData(prev => ({ ...prev, tenant: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">هاتف المستأجر</Label>
                        <Input
                          placeholder="05XXXXXXXX"
                          value={newRentalData.tenantPhone}
                          onChange={(e) => setNewRentalData(prev => ({ ...prev, tenantPhone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">تاريخ بداية العقد *</Label>
                        <Input
                          type="date"
                          value={newRentalData.startDate}
                          onChange={(e) => setNewRentalData(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">مدة العقد (بالأشهر) *</Label>
                        <Select 
                          value={newRentalData.duration} 
                          onValueChange={(v) => setNewRentalData(prev => ({ ...prev, duration: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المدة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 أشهر</SelectItem>
                            <SelectItem value="6">6 أشهر</SelectItem>
                            <SelectItem value="12">12 شهر (سنة)</SelectItem>
                            <SelectItem value="24">24 شهر (سنتين)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">الإيجار الشهري (ريال) *</Label>
                        <Input
                          type="number"
                          placeholder="مثال: 5000"
                          value={newRentalData.monthlyRent}
                          onChange={(e) => setNewRentalData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">نوع العقار</Label>
                        <Select 
                          value={newRentalData.propertyType} 
                          onValueChange={(v) => setNewRentalData(prev => ({ ...prev, propertyType: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="villa">فيلا</SelectItem>
                            <SelectItem value="apartment">شقة</SelectItem>
                            <SelectItem value="office">مكتب</SelectItem>
                            <SelectItem value="shop">محل تجاري</SelectItem>
                            <SelectItem value="warehouse">مستودع</SelectItem>
                            <SelectItem value="land">أرض</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">ملاحظات إضافية</Label>
                      <Textarea
                        placeholder="أي ملاحظات خاصة بالعقد..."
                        value={newRentalData.notes}
                        onChange={(e) => setNewRentalData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="bg-[#01411C] hover:bg-[#065f41]"
                        onClick={() => {
                          if (!newRentalData.title || !newRentalData.location || !newRentalData.tenant || !newRentalData.startDate || !newRentalData.monthlyRent) {
                            toast.error('يرجى ملء جميع الحقول المطلوبة');
                            return;
                          }
                          
                          const startDate = new Date(newRentalData.startDate);
                          const endDate = new Date(startDate);
                          endDate.setMonth(endDate.getMonth() + parseInt(newRentalData.duration || '12'));
                          const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          
                          const newProperty = {
                            id: `rental-${Date.now()}`,
                            title: newRentalData.title,
                            location: newRentalData.location,
                            tenant: newRentalData.tenant,
                            tenantPhone: newRentalData.tenantPhone,
                            status: daysRemaining <= 0 ? 'expired' : daysRemaining <= 30 ? 'expiring' : 'active',
                            startDate: newRentalData.startDate,
                            endDate: endDate.toISOString().split('T')[0],
                            daysRemaining: Math.max(0, daysRemaining),
                            monthlyRent: parseInt(newRentalData.monthlyRent),
                            duration: parseInt(newRentalData.duration || '12'),
                            propertyType: newRentalData.propertyType,
                            notes: newRentalData.notes,
                          };
                          
                          setRentedProperties(prev => [...prev, newProperty]);
                          NotificationSounds.success();
                          toast.success('تم إضافة عقد الإيجار بنجاح');
                          
                          // إنشاء إشعار
                          createNotification({
                            title: 'عقد إيجار جديد',
                            message: `تم إضافة عقد إيجار "${newRentalData.title}" للمستأجر ${newRentalData.tenant}`,
                            notification_type: 'crm',
                            category: 'contract_created',
                            related_entity_id: customer.id,
                            related_entity_type: 'customer',
                          });
                          
                          setNewRentalData({
                            title: '',
                            location: '',
                            tenant: '',
                            tenantPhone: '',
                            startDate: '',
                            duration: '12',
                            monthlyRent: '',
                            propertyType: 'villa',
                            notes: '',
                          });
                          setShowNewRentalForm(false);
                        }}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة العقد
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewRentalForm(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* البطاقة الرئيسية للعقارات المؤجرة */}
              <Card className="border-2 border-[#D4AF37]">
                <CardHeader className="bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    العقارات المؤجرة للمالك
                    {rentedProperties.length > 0 && (
                      <Badge className="bg-[#01411C] text-white text-xs">{rentedProperties.length}</Badge>
                    )}
                  </CardTitle>
                  <Button
                    size="sm"
                    className="bg-[#01411C] hover:bg-[#065f41]"
                    onClick={() => setShowNewRentalForm(true)}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة عقد جديد
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  {/* فلاتر سريعة */}
                  {rentedProperties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      <Button
                        size="sm"
                        variant={rentalFilter === 'all' ? 'default' : 'outline'}
                        className={rentalFilter === 'all' ? 'bg-[#01411C]' : ''}
                        onClick={() => setRentalFilter('all')}
                      >
                        الكل ({rentedStats.total})
                      </Button>
                      <Button
                        size="sm"
                        variant={rentalFilter === 'active' ? 'default' : 'outline'}
                        className={rentalFilter === 'active' ? 'bg-emerald-600' : 'border-emerald-500 text-emerald-600'}
                        onClick={() => setRentalFilter('active')}
                      >
                        نشط ({rentedStats.active})
                      </Button>
                      <Button
                        size="sm"
                        variant={rentalFilter === 'expiring' ? 'default' : 'outline'}
                        className={rentalFilter === 'expiring' ? 'bg-amber-600' : 'border-amber-500 text-amber-600'}
                        onClick={() => setRentalFilter('expiring')}
                      >
                        ينتهي قريباً ({rentedStats.expiring})
                      </Button>
                      <Button
                        size="sm"
                        variant={rentalFilter === 'expired' ? 'default' : 'outline'}
                        className={rentalFilter === 'expired' ? 'bg-red-600' : 'border-red-500 text-red-600'}
                        onClick={() => setRentalFilter('expired')}
                      >
                        منتهي ({rentedStats.expired})
                      </Button>
                    </div>
                  )}
                  
                  {rentedProperties.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Home className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium mb-2">لا توجد عقارات مؤجرة لهذا العميل</p>
                      <p className="text-sm mb-4">اضغط على "إضافة عقد جديد" لإضافة أول عقد إيجار</p>
                      <Button 
                        className="bg-[#01411C] hover:bg-[#065f41]"
                        onClick={() => setShowNewRentalForm(true)}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة عقد إيجار
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rentedProperties
                        .filter(p => rentalFilter === 'all' || p.status === rentalFilter)
                        .map((property) => (
                        <div 
                          key={property.id}
                          className={`p-4 border-2 rounded-xl transition-all hover:shadow-md ${
                            property.status === 'active' 
                              ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white' 
                              : property.status === 'expiring'
                              ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-white'
                              : 'border-red-200 bg-gradient-to-r from-red-50/50 to-white'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {/* العنوان والحالة */}
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                  property.status === 'active' ? 'bg-emerald-100' :
                                  property.status === 'expiring' ? 'bg-amber-100' : 'bg-red-100'
                                }`}>
                                  <Home className={`w-6 h-6 ${
                                    property.status === 'active' ? 'text-emerald-600' :
                                    property.status === 'expiring' ? 'text-amber-600' : 'text-red-600'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-lg text-gray-900">{property.title}</h4>
                                    <Badge className={`text-white ${
                                      property.status === 'active' 
                                        ? 'bg-emerald-500' 
                                        : property.status === 'expiring'
                                        ? 'bg-amber-500 animate-pulse'
                                        : 'bg-red-500'
                                    }`}>
                                      {property.status === 'active' ? '✓ نشط' : property.status === 'expiring' ? '⚠ ينتهي قريباً' : '✗ منتهي'}
                                    </Badge>
                                    {property.status === 'expiring' && property.daysRemaining <= 7 && (
                                      <Badge className="bg-red-100 text-red-700 animate-pulse">
                                        ⏰ تبقى {property.daysRemaining} يوم فقط!
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <MapPin className="w-4 h-4" />
                                    {property.location}
                                  </p>
                                </div>
                              </div>
                              
                              {/* معلومات المستأجر */}
                              <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-[#01411C]" />
                                  <span className="text-sm"><strong>المستأجر:</strong> {property.tenant}</span>
                                </div>
                                {(property as any).tenantPhone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#01411C]" />
                                    <a 
                                      href={`tel:${(property as any).tenantPhone}`}
                                      className="text-sm text-[#01411C] hover:underline"
                                    >
                                      {(property as any).tenantPhone}
                                    </a>
                                  </div>
                                )}
                              </div>
                              
                              {/* تفاصيل العقد */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-2 bg-white border rounded-lg">
                                  <p className="text-xs text-gray-500">بداية العقد</p>
                                  <p className="font-medium text-sm flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-emerald-600" />
                                    {property.startDate}
                                  </p>
                                </div>
                                <div className="p-2 bg-white border rounded-lg">
                                  <p className="text-xs text-gray-500">نهاية العقد</p>
                                  <p className={`font-medium text-sm flex items-center gap-1 ${
                                    property.status === 'expired' ? 'text-red-600' : ''
                                  }`}>
                                    <Calendar className={`w-3 h-3 ${property.status === 'expired' ? 'text-red-600' : 'text-gray-500'}`} />
                                    {property.endDate}
                                  </p>
                                </div>
                                <div className="p-2 bg-white border rounded-lg">
                                  <p className="text-xs text-gray-500">مدة العقد</p>
                                  <p className="font-medium text-sm">{property.duration} شهر</p>
                                </div>
                                <div className="p-2 bg-white border rounded-lg">
                                  <p className="text-xs text-gray-500">المتبقي</p>
                                  <p className={`font-bold text-sm ${
                                    property.status === 'active' ? 'text-emerald-600' : 
                                    property.status === 'expiring' ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {property.daysRemaining > 0 ? `${property.daysRemaining} يوم` : 'منتهي'}
                                  </p>
                                </div>
                              </div>
                              
                              {/* الإيجار */}
                              <div className="flex items-center justify-between p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30">
                                <div>
                                  <p className="text-xs text-gray-600">الإيجار الشهري</p>
                                  <p className="text-xl font-bold text-[#D4AF37]">{property.monthlyRent.toLocaleString()} ريال</p>
                                </div>
                                <div className="text-left">
                                  <p className="text-xs text-gray-600">الإيجار السنوي</p>
                                  <p className="text-lg font-bold text-[#01411C]">{(property.monthlyRent * 12).toLocaleString()} ريال</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* أزرار الإجراءات */}
                            <div className="flex flex-col gap-2 min-w-[140px]">
                              {/* زر عرض العقد - دائماً ظاهر */}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-[#01411C] text-[#01411C] w-full"
                                onClick={() => {
                                  setSelectedContract(property);
                                  setShowContractDialog(true);
                                }}
                              >
                                <FileText className="w-4 h-4 ml-1" />
                                عرض العقد
                              </Button>
                              
                              {/* أزرار للعقود النشطة */}
                              {property.status === 'active' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-[#01411C] w-full"
                                    onClick={() => handleSendAlert(property, 'normal')}
                                  >
                                    <Send className="w-4 h-4 ml-1" />
                                    إرسال تنبيه
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                      window.dispatchEvent(new CustomEvent('createAppointmentFromCRM', {
                                        detail: {
                                          customerId: customer.id,
                                          customerName: property.tenant,
                                          customerPhone: (property as any).tenantPhone || customer.phone,
                                          propertyTitle: property.title,
                                        }
                                      }));
                                      toast.success('جاري فتح نموذج جدولة الموعد');
                                    }}
                                  >
                                    <Calendar className="w-4 h-4 ml-1" />
                                    جدولة موعد
                                  </Button>
                                </>
                              )}
                              
                              {/* أزرار للعقود التي تنتهي قريباً */}
                              {property.status === 'expiring' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="w-full animate-pulse"
                                    onClick={() => handleSendAlert(property, 'urgent')}
                                  >
                                    <AlertTriangle className="w-4 h-4 ml-1" />
                                    إشعار عاجل
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                                    onClick={() => handleRenewal(property)}
                                  >
                                    تجديد العقد
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleExtension(property)}
                                  >
                                    <Clock className="w-4 h-4 ml-1" />
                                    طلب مهلة
                                  </Button>
                                </>
                              )}
                              
                              {/* أزرار للعقود المنتهية */}
                              {property.status === 'expired' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                                    onClick={() => handleRenewal(property)}
                                  >
                                    <CheckCircle className="w-4 h-4 ml-1" />
                                    تجديد العقد
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-red-500 text-red-500 hover:bg-red-50 w-full"
                                    onClick={() => handleEvacuation(property)}
                                  >
                                    <AlertTriangle className="w-4 h-4 ml-1" />
                                    إخلاء العقار
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleExtension(property)}
                                  >
                                    <Clock className="w-4 h-4 ml-1" />
                                    طلب مهلة
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => handleSendAlert(property, 'urgent')}
                                  >
                                    <Send className="w-4 h-4 ml-1" />
                                    إشعار إخلاء
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* إحصائيات العقارات المؤجرة */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold">{rentedStats.total}</div>
                    <div className="text-sm opacity-90">إجمالي العقارات</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold">{rentedStats.active}</div>
                    <div className="text-sm opacity-90">عقود نشطة</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold">{rentedStats.expiring}</div>
                    <div className="text-sm opacity-90">تنتهي قريباً</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold">{rentedStats.expired}</div>
                    <div className="text-sm opacity-90">منتهية</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white border-0">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{rentedStats.totalMonthlyRent.toLocaleString()}</div>
                    <div className="text-sm opacity-90">الإيجار الشهري</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* ملخص سنوي */}
              {rentedProperties.length > 0 && (
                <Card className="border-2 border-[#01411C]/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                      📊 الملخص المالي السنوي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-[#01411C]/5 rounded-xl text-center">
                        <p className="text-sm text-gray-600 mb-1">الدخل السنوي المتوقع</p>
                        <p className="text-2xl font-bold text-[#01411C]">
                          {(rentedStats.totalMonthlyRent * 12).toLocaleString()} ريال
                        </p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl text-center">
                        <p className="text-sm text-gray-600 mb-1">عقود تحتاج تجديد</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {rentedStats.expiring + rentedStats.expired} عقد
                        </p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-xl text-center">
                        <p className="text-sm text-gray-600 mb-1">نسبة الإشغال</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {rentedStats.total > 0 ? Math.round((rentedStats.active / rentedStats.total) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tasks Tab - تبويب المهام المحسن */}
          <TabsContent value="tasks">
            <div className="space-y-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    مهام العميل
                    {customerTasks.length > 0 && (
                      <Badge className="bg-[#01411C] text-white text-xs">{customerTasks.length}</Badge>
                    )}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-[#01411C] to-[#065f41] text-white hover:from-[#065f41] hover:to-[#01411C]" 
                    onClick={() => setShowAddCRMTask(true)}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    مهمة جديدة
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">المهمة</th>
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">تاريخ الاستحقاق</th>
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الأولوية</th>
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الحالة</th>
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => (
                          <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="text-right">
                                <div className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</div>
                                {task.description && <div className="text-sm text-gray-500">{task.description}</div>}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-right">
                                <div className="font-medium text-gray-900">{task.dueDate}</div>
                                <div className="text-sm text-gray-500">موعد نهائي</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={
                                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                              }>
                                {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={
                                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                task.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                              }>
                                {task.status === 'completed' ? 'مكتمل' : task.status === 'pending' ? 'قيد الانتظار' : 'قيد التنفيذ'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 justify-end">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggleTaskStatus(task.id)}>
                                  ✅
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  ✏️
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* المهام من قاعدة البيانات */}
                  {customerTasks.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#01411C] rounded-full"></span>
                        مهام من قاعدة البيانات ({customerTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {customerTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className={`p-3 rounded-lg border ${
                              task.status === 'completed' 
                                ? 'bg-gray-50 border-gray-200 opacity-60' 
                                : task.priority === 'urgent_important'
                                  ? 'bg-red-50 border-red-200'
                                  : task.priority === 'important_not_urgent'
                                    ? 'bg-orange-50 border-orange-200'
                                    : task.priority === 'urgent_not_important'
                                      ? 'bg-yellow-50 border-yellow-200'
                                      : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {task.title}
                                </h5>
                                {task.description && (
                                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={
                                    task.priority === 'urgent_important' ? 'bg-red-100 text-red-700' :
                                    task.priority === 'important_not_urgent' ? 'bg-orange-100 text-orange-700' :
                                    task.priority === 'urgent_not_important' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                  }>
                                    {task.priority === 'urgent_important' ? 'مهم وعاجل' :
                                     task.priority === 'important_not_urgent' ? 'مهم وغير عاجل' :
                                     task.priority === 'urgent_not_important' ? 'عاجل وغير مهم' :
                                     'غير مهم وغير عاجل'}
                                  </Badge>
                                  {task.due_date && (
                                    <span className="text-xs text-gray-500">
                                      📅 {new Date(task.due_date).toLocaleDateString('ar-SA')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge className={task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                                {task.status === 'completed' ? '✅ مكتمل' : '⏳ قيد الانتظار'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tasks.length === 0 && customerTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد مهام</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-3"
                        onClick={() => setShowAddCRMTask(true)}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة مهمة
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* إحصائيات المهام */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>توزيع المهام</span>
                      <span className="text-lg">📊</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">مكتمل</span>
                        <span className="font-bold">{tasks.filter(t => t.status === 'completed').length}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${(tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1)) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">قيد الانتظار</span>
                        <span className="font-bold">{tasks.filter(t => t.status === 'pending').length}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${(tasks.filter(t => t.status === 'pending').length / Math.max(tasks.length, 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>الأولوية</span>
                      <span className="text-lg">🎯</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">عالي</span>
                      </div>
                      <span className="font-bold">{tasks.filter(t => t.priority === 'high').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <span className="text-sm">متوسط</span>
                      </div>
                      <span className="font-bold">{tasks.filter(t => t.priority === 'medium').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">منخفض</span>
                      </div>
                      <span className="font-bold">{tasks.filter(t => t.priority === 'low').length}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>مهام متأخرة</span>
                      <span className="text-lg">⏰</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-4xl font-bold text-red-600 mb-2">{tasks.filter(t => t.status === 'overdue').length}</div>
                      <div className="text-gray-600">مهام تجاوزت موعدها</div>
                      <Button size="sm" className="mt-4 bg-red-100 text-red-700 hover:bg-red-200">
                        عرض التفاصيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Reminders Tab - تبويب التذكيرات */}
          <TabsContent value="reminders">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  إدارة التذكيرات والمهام
                </CardTitle>
                <Button size="sm" className="bg-[#01411C] hover:bg-[#065f41]" onClick={() => setShowAddReminder(true)}>
                  <Plus className="w-4 h-4 ml-1" />
                  تذكير جديد
                </Button>
              </CardHeader>
              <CardContent>
                {reminders.length > 0 ? (
                  <div className="space-y-3">
                    {reminders.map((reminder) => (
                      <Card
                        key={reminder.id}
                        className={`${
                          reminder.completed
                            ? 'border-green-300 bg-green-50/50'
                            : reminder.priority === 'high'
                            ? 'border-red-300 bg-red-50/50'
                            : reminder.priority === 'medium'
                            ? 'border-orange-300 bg-orange-50/50'
                            : 'border-blue-300 bg-blue-50/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className={`font-medium ${
                                reminder.completed ? 'line-through text-gray-500' : 'text-[#01411C]'
                              }`}>
                                {reminder.title}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {reminder.date}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    reminder.completed
                                      ? 'bg-green-100 text-green-700'
                                      : reminder.priority === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : reminder.priority === 'medium'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {reminder.completed ? 'مكتمل' : reminder.priority === 'high' ? 'عاجل' : reminder.priority === 'medium' ? 'متوسط' : 'منخفض'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 w-8 p-0 ${
                                  reminder.completed
                                    ? 'text-green-600 hover:bg-green-50'
                                    : reminder.priority === 'high'
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-orange-600 hover:bg-orange-50'
                                }`}
                                onClick={() => toggleReminderStatus(reminder.id)}
                              >
                                {reminder.completed ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">لا توجد تذكيرات حالياً</p>
                    <Button variant="outline" className="border-[#D4AF37] text-[#01411C]" onClick={() => setShowAddReminder(true)}>
                      إضافة أول تذكير
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab - تبويب التحليلات - مربوط بالبيانات الحقيقية */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#01411C]">تحليلات العميل</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm">نشاط العميل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{interactionStats.activityRate}%</div>
                      <div className="text-xs text-gray-600">معدل التفاعل</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm">احتمالية الإغلاق</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">{interactionStats.closingProbability}%</div>
                      <div className="text-xs text-gray-600">بناءً على النشاط</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm">قيمة المعاملات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {customerTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">ريال سعودي</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm">مدة المتابعة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {Math.floor((new Date().getTime() - new Date(customer.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-xs text-gray-600">يوم</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* تحليل سلوك العميل - حقيقي */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#01411C]" />
                    تحليل سلوك العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{interactionStats.callsCount}</div>
                      <div className="text-sm text-gray-600">مكالمات هاتفية</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{interactionStats.whatsappCount}</div>
                      <div className="text-sm text-gray-600">رسائل واتساب</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{interactionStats.meetingsCount}</div>
                      <div className="text-sm text-gray-600">اجتماعات</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">{interactionStats.emailsCount}</div>
                      <div className="text-sm text-gray-600">إيميلات</div>
                    </div>
                  </div>
                  
                  {/* تحليل الانطباعات */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-4 bg-green-100 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{interactionStats.positiveCount}</div>
                      <div className="text-sm text-gray-600">😊 إيجابي</div>
                    </div>
                    <div className="text-center p-4 bg-gray-100 rounded-lg">
                      <div className="text-2xl font-bold text-gray-700">
                        {interactionStats.totalInteractions - interactionStats.positiveCount - interactionStats.negativeCount}
                      </div>
                      <div className="text-sm text-gray-600">😐 محايد</div>
                    </div>
                    <div className="text-center p-4 bg-red-100 rounded-lg">
                      <div className="text-2xl font-bold text-red-700">{interactionStats.negativeCount}</div>
                      <div className="text-sm text-gray-600">😟 سلبي</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* إحصائيات المالية */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#01411C]" />
                    ملخص مالي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white">
                      <div className="text-sm mb-1">إجمالي المدفوعات</div>
                      <div className="text-2xl font-bold">{invoiceStats.paidAmount.toLocaleString()} ريال</div>
                      <div className="text-sm opacity-80">{invoiceStats.paidCount} فاتورة مدفوعة</div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white">
                      <div className="text-sm mb-1">المستحقات</div>
                      <div className="text-2xl font-bold">{invoiceStats.pendingAmount.toLocaleString()} ريال</div>
                      <div className="text-sm opacity-80">{invoiceStats.pendingCount} فاتورة معلقة</div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl text-white">
                      <div className="text-sm mb-1">إجمالي المعاملات</div>
                      <div className="text-2xl font-bold">{customerTransactions.length}</div>
                      <div className="text-sm opacity-80">معاملة</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* التوقعات المستقبلية - حقيقية */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[#01411C]" />
                    التوقعات المستقبلية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-lg font-bold text-yellow-700 mb-2">
                        احتمالية الإغلاق خلال 30 يوم
                      </div>
                      <div className="text-3xl font-bold text-yellow-600">{interactionStats.closingProbability}%</div>
                      <p className="text-sm text-gray-600 mt-2">
                        بناءً على {interactionStats.recentInteractions} تفاعل في الأسبوع الأخير
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-lg font-bold text-red-700 mb-2">
                        مخاطر فقدان العميل
                      </div>
                      <div className="text-3xl font-bold text-red-600">
                        {interactionStats.recentInteractions > 3 ? '15%' : interactionStats.recentInteractions > 0 ? '35%' : '60%'}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {interactionStats.recentInteractions > 3 ? 'منخفض - تفاعل نشط' : interactionStats.recentInteractions > 0 ? 'متوسط' : 'مرتفع - يحتاج متابعة'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  الملاحظات
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddNote(true)}>
                  <Plus className="w-4 h-4 ml-1" />
                  ملاحظة جديدة
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityLogs.filter(l => l.type === 'note').map((note) => (
                    <div key={note.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-gray-800">{note.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{note.timestamp}</span>
                        {note.user && <span>- {note.user}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab - تبويب الملفات المحسن */}
          <TabsContent value="documents">
            <div className="space-y-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    ملفات العميل
                  </CardTitle>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                    <Plus className="w-4 h-4 ml-1" />
                    رفع ملف
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* ✅ تم إزالة الملفات الوهمية - يتم عرض الملفات الحقيقية من قاعدة البيانات */}
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        📁
                      </div>
                      <p className="text-lg font-medium">لا توجد ملفات مرفقة</p>
                      <p className="text-sm">اضغط على "رفع ملف" لإضافة مستندات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* إحصائيات الملفات */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">إجمالي الملفات</div>
                    <div className="text-2xl font-bold text-blue-600">45</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">حجم التخزين</div>
                    <div className="text-2xl font-bold text-green-600">156 MB</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">ملفات PDF</div>
                    <div className="text-2xl font-bold text-red-600">12</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">ملفات صور</div>
                    <div className="text-2xl font-bold text-purple-600">24</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* History Tab - تبويب التاريخ المحسن - مربوط بآخر 3 أنشطة حقيقية */}
          <TabsContent value="history">
            <div className="space-y-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <History className="w-5 h-5" />
                    سجل الأحداث
                    {(recentActivities.length + customerTransactions.length + customerInvoices.length) > 0 && (
                      <Badge className="bg-blue-100 text-blue-800">
                        {recentActivities.length + customerTransactions.length + customerInvoices.length} نشاط
                      </Badge>
                    )}
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    📤 تصدير السجل
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* آخر 3 تفاعلات حقيقية */}
                    {recentActivities.length > 0 && (
                      <>
                        <h4 className="font-bold text-gray-700 text-sm">📞 آخر التفاعلات</h4>
                        {recentActivities.map((activity) => (
                          <div key={activity.id} className="border-r-4 border-green-500 pr-4 py-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {activity.interaction_type === 'call' ? '📞 مكالمة' :
                                   activity.interaction_type === 'whatsapp' ? '💬 واتساب' :
                                   activity.interaction_type === 'meeting' ? '🤝 اجتماع' :
                                   activity.interaction_type === 'email' ? '📧 بريد' :
                                   '📝 ملاحظة'}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                              </div>
                              <div className="text-left">
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(activity.created_at).toLocaleDateString('ar-SA')}
                                </div>
                                <Badge className={
                                  activity.sentiment === 'إيجابي' ? 'bg-green-100 text-green-700' :
                                  activity.sentiment === 'سلبي' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }>
                                  {activity.sentiment || 'محايد'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* آخر 3 معاملات حقيقية */}
                    {customerTransactions.slice(0, 3).length > 0 && (
                      <>
                        <h4 className="font-bold text-gray-700 text-sm mt-6">💰 آخر المعاملات</h4>
                        {customerTransactions.slice(0, 3).map((tx) => (
                          <div key={tx.id} className="border-r-4 border-blue-500 pr-4 py-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-gray-900">{tx.transaction_type}</h4>
                                <p className="text-sm text-gray-600 mt-1">{tx.description || 'معاملة مالية'}</p>
                              </div>
                              <div className="text-left">
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(tx.created_at).toLocaleDateString('ar-SA')}
                                </div>
                                <div className={`font-bold ${Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {Number(tx.amount).toLocaleString()} ريال
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* آخر 3 فواتير حقيقية */}
                    {customerInvoices.slice(0, 3).length > 0 && (
                      <>
                        <h4 className="font-bold text-gray-700 text-sm mt-6">🧾 آخر الفواتير</h4>
                        {customerInvoices.slice(0, 3).map((inv) => (
                          <div key={inv.id} className="border-r-4 border-amber-500 pr-4 py-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-gray-900">فاتورة {inv.invoice_number}</h4>
                                <p className="text-sm text-gray-600 mt-1">{inv.description || 'فاتورة'}</p>
                              </div>
                              <div className="text-left">
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(inv.created_at).toLocaleDateString('ar-SA')}
                                </div>
                                <Badge className={
                                  inv.status === 'مدفوعة' ? 'bg-green-100 text-green-700' :
                                  inv.status === 'معلقة' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }>
                                  {inv.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* رسالة فارغة إذا لم توجد أنشطة */}
                    {recentActivities.length === 0 && customerTransactions.length === 0 && customerInvoices.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لا توجد أنشطة مسجلة لهذا العميل</p>
                        <p className="text-sm mt-1">ستظهر هنا آخر التفاعلات والمعاملات والفواتير</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* إحصائيات التاريخ - حقيقية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>إجمالي الأنشطة</span>
                      <span className="text-lg">📅</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {customerInteractions.length + customerTransactions.length + customerInvoices.length}
                      </div>
                      <div className="text-gray-600">نشاط مسجل</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>مدة العلاقة</span>
                      <span className="text-lg">⏱️</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {Math.floor((new Date().getTime() - new Date(customer.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-gray-600">يوم</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>آخر تفاعل</span>
                      <span className="text-lg">🔄</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-purple-600 mb-2">
                        {recentActivities.length > 0 
                          ? `منذ ${Math.floor((new Date().getTime() - new Date(recentActivities[0].created_at).getTime()) / (1000 * 60 * 60 * 24))} يوم`
                          : 'لا يوجد'
                        }
                      </div>
                      <div className="text-gray-600">
                        {recentActivities.length > 0 ? recentActivities[0].interaction_type : 'لا توجد تفاعلات'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab - تبويب الإعدادات المحسن */}
          <TabsContent value="settings">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  إعدادات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* إعدادات الاتصال */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">إعدادات الاتصال</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">الطريقة المفضلة للاتصال</Label>
                      <Select defaultValue="phone">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الطريقة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">الهاتف</SelectItem>
                          <SelectItem value="email">البريد الإلكتروني</SelectItem>
                          <SelectItem value="whatsapp">الواتساب</SelectItem>
                          <SelectItem value="sms">الرسائل النصية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">توقيت الاتصال المفضل</Label>
                      <Select defaultValue="morning">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التوقيت" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">9:00 ص - 12:00 م</SelectItem>
                          <SelectItem value="afternoon">12:00 م - 3:00 م</SelectItem>
                          <SelectItem value="evening">3:00 م - 6:00 م</SelectItem>
                          <SelectItem value="night">6:00 م - 9:00 م</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* إعدادات الإشعارات */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">إعدادات الإشعارات</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">إشعارات العروض</div>
                        <div className="text-sm text-gray-600">إرسال عروض جديدة</div>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">إشعارات الدفع</div>
                        <div className="text-sm text-gray-600">تذكير بمواعيد الدفع</div>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">إشعارات المهام</div>
                        <div className="text-sm text-gray-600">تحديثات حالة المهام</div>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                  </div>
                </div>

                {/* إعدادات الخصوصية والإجراءات - مربوط بالرايت سلايدر */}
                <div className="pt-6 border-t border-gray-200 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">أرشفة العميل</p>
                      <p className="text-sm text-gray-500">نقل العميل للأرشيف (مرتبط بالأرشيف في القائمة الجانبية)</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // تحديث حالة العميل إلى مؤرشف
                        const updatedCustomer = {
                          ...customer,
                          status: 'archived',
                          columnId: 'archived'
                        };
                        onUpdate(updatedCustomer);
                        
                        // إرسال حدث للرايت سلايدر لفتح الأرشيف
                        window.dispatchEvent(new CustomEvent('openRightSlider', {
                          detail: { section: 'archive' }
                        }));
                        
                        toast.success('تم نقل العميل للأرشيف');
                        onBack();
                      }}
                    >
                      📁 أرشفة
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">مشاركة بطاقة العميل</p>
                      <p className="text-sm text-gray-500">إنشاء رابط لمشاركة بيانات العميل</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 ml-1" />
                      مشاركة
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium text-red-700">حذف العميل</p>
                      <p className="text-sm text-red-500">حذف العميل وجميع بياناته نهائياً</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDeleteCustomer}
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal Info Tab - تبويب المعلومات الشخصية */}
          <TabsContent value="personal_info">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* المعلومات الأساسية */}
                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                      <User className="w-5 h-5" />
                      المعلومات الأساسية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">الاسم الكامل (عربي)</Label>
                        <div className="p-3 bg-gray-50 rounded-lg mt-1">{customer.name}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">الاسم الكامل (إنجليزي)</Label>
                        <div className="p-3 bg-gray-50 rounded-lg mt-1">غير محدد</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">نوع العميل</Label>
                        <div className={`p-3 rounded-lg mt-1 ${CUSTOMER_TYPES.find(t => t.id === customer.type)?.bg_color || 'bg-gray-50'} ${CUSTOMER_TYPES.find(t => t.id === customer.type)?.text_color || 'text-gray-800'}`}>
                          {CUSTOMER_TYPES.find(t => t.id === customer.type)?.icon} {CUSTOMER_TYPES.find(t => t.id === customer.type)?.name || CUSTOMER_TYPE_LABELS[customer.type || 'other']}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">درجة الاهتمام</Label>
                        <div className={`p-3 rounded-lg mt-1 ${INTEREST_LEVELS.find(l => l.id === customer.interestLevel)?.bg_color || 'bg-gray-50'} ${INTEREST_LEVELS.find(l => l.id === customer.interestLevel)?.text_color || 'text-gray-800'}`}>
                          {INTEREST_LEVELS.find(l => l.id === customer.interestLevel)?.icon} {INTEREST_LEVELS.find(l => l.id === customer.interestLevel)?.name || 'غير محدد'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* معلومات الاتصال */}
                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      معلومات الاتصال
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">الهاتف المحمول</Label>
                      <div className="p-3 bg-gray-50 rounded-lg mt-1 flex items-center gap-2">
                        <span className="text-blue-600">📱</span>
                        <span dir="ltr">{customer.phone}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">البريد الإلكتروني</Label>
                      <div className="p-3 bg-gray-50 rounded-lg mt-1 flex items-center gap-2">
                        <span className="text-green-600">📧</span>
                        <span>{customer.email || 'غير محدد'}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">واتساب</Label>
                      <div className="p-3 bg-gray-50 rounded-lg mt-1 flex items-center gap-2">
                        <span className="text-green-600">💬</span>
                        <span dir="ltr">{customer.whatsapp || customer.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* العنوان */}
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    العنوان
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">الموقع</Label>
                      <div className="p-3 bg-gray-50 rounded-lg mt-1">{customer.location || 'غير محدد'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">الشركة</Label>
                      <div className="p-3 bg-gray-50 rounded-lg mt-1">{customer.company || 'غير محدد'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">المصدر</Label>
                      <div className="p-3 bg-gray-50 rounded-lg mt-1">{customer.source || 'غير محدد'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab - تبويب المعاملات */}
          <TabsContent value="transactions">
            <div className="space-y-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    سجل المعاملات
                    {customerTransactions.length > 0 && (
                      <Badge className="bg-[#D4AF37] text-[#01411C]">{customerTransactions.length}</Badge>
                    )}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-green-600 to-emerald-500 text-white"
                    onClick={() => setShowNewTransactionForm(true)}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    معاملة جديدة
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* نموذج إضافة معاملة جديدة */}
                  {showNewTransactionForm && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <h4 className="font-bold text-gray-800 mb-4">إضافة معاملة جديدة</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">نوع المعاملة</Label>
                          <Select
                            value={newTransactionData.transaction_type}
                            onValueChange={(val) => setNewTransactionData(prev => ({ ...prev, transaction_type: val }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="شراء">شراء</SelectItem>
                              <SelectItem value="دفعة">دفعة</SelectItem>
                              <SelectItem value="استرداد">استرداد</SelectItem>
                              <SelectItem value="عمولة">عمولة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">المبلغ (ريال)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newTransactionData.amount}
                            onChange={(e) => setNewTransactionData(prev => ({ ...prev, amount: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">رقم الفاتورة (اختياري)</Label>
                          <Input
                            placeholder="INV-2024-XXX"
                            value={newTransactionData.invoice_number}
                            onChange={(e) => setNewTransactionData(prev => ({ ...prev, invoice_number: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">الوصف</Label>
                          <Input
                            placeholder="وصف المعاملة..."
                            value={newTransactionData.description}
                            onChange={(e) => setNewTransactionData(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="bg-[#01411C] hover:bg-[#065f41]"
                          onClick={async () => {
                            if (!newTransactionData.amount) {
                              toast.error('يرجى إدخال المبلغ');
                              return;
                            }
                            const result = await createTransaction({
                              customer_id: customer.id,
                              customer_phone: customer.phone,
                              transaction_type: newTransactionData.transaction_type,
                              amount: parseFloat(newTransactionData.amount) * (newTransactionData.transaction_type === 'استرداد' ? -1 : 1),
                              invoice_number: newTransactionData.invoice_number || undefined,
                              description: newTransactionData.description || undefined
                            });
                            
                            if (result) {
                              // تشغيل صوت النجاح
                              NotificationSounds.success(0.5);
                              
                              // تسجيل الحدث
                              await track({
                                eventName: 'interaction',
                                entityType: 'customer',
                                entityId: customer.id,
                                metadata: {
                                  type: 'transaction',
                                  transaction_type: newTransactionData.transaction_type,
                                  amount: newTransactionData.amount,
                                  customer_name: customer.name,
                                }
                              });
                              
                              // إنشاء إشعار
                              await createNotification({
                                title: 'معاملة جديدة',
                                message: `تم إضافة ${newTransactionData.transaction_type} بقيمة ${newTransactionData.amount} ريال للعميل ${customer.name}`,
                                notification_type: 'crm',
                                related_entity_type: 'customer',
                                related_entity_id: customer.id,
                                priority: 'normal'
                              });
                            }
                            
                            setNewTransactionData({ transaction_type: 'دفعة', amount: '', description: '', invoice_number: '' });
                            setShowNewTransactionForm(false);
                          }}
                        >
                          حفظ المعاملة
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowNewTransactionForm(false)}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}

                  {transactionsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#01411C]" />
                      <p className="text-gray-500 mt-2">جاري التحميل...</p>
                    </div>
                  ) : customerTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد معاملات مسجلة لهذا العميل</p>
                      <p className="text-sm mt-1">اضغط على "معاملة جديدة" لإضافة أول معاملة</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">التاريخ</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">نوع المعاملة</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">المبلغ</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الحالة</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">رقم الفاتورة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerTransactions.map((tx) => (
                            <tr key={tx.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm">{new Date(tx.created_at).toLocaleDateString('ar-SA')}</td>
                              <td className="py-3 px-4">
                                <Badge className={
                                  tx.transaction_type === 'شراء' ? 'bg-blue-100 text-blue-800' :
                                  tx.transaction_type === 'دفعة' ? 'bg-green-100 text-green-800' :
                                  tx.transaction_type === 'عمولة' ? 'bg-purple-100 text-purple-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {tx.transaction_type}
                                </Badge>
                              </td>
                              <td className={`py-3 px-4 font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount >= 0 ? '+' : ''}{Number(tx.amount).toLocaleString()} ريال
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={
                                  tx.status === 'مكتمل' ? 'bg-green-100 text-green-800' :
                                  tx.status === 'معلق' ? 'bg-amber-100 text-amber-800' :
                                  'bg-red-100 text-red-800'
                                }>{tx.status}</Badge>
                              </td>
                              <td className="py-3 px-4 text-sm font-medium">{tx.invoice_number || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* إحصائيات المدفوعات - حقيقية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
                  <div className="text-sm mb-2">إجمالي المعاملات</div>
                  <div className="text-3xl font-bold">
                    {customerTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-sm opacity-90">{customerTransactions.length} معاملة</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
                  <div className="text-sm mb-2">المدفوعات المستلمة</div>
                  <div className="text-3xl font-bold">
                    {customerTransactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + Number(tx.amount), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-sm opacity-90">{customerTransactions.filter(tx => tx.amount > 0).length} دفعة</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                  <div className="text-sm mb-2">المستحقات</div>
                  <div className="text-3xl font-bold">
                    {invoiceStats.pendingAmount.toLocaleString()} ريال
                  </div>
                  <div className="text-sm opacity-90">{invoiceStats.pendingCount} فاتورة معلقة</div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Price Quotes Tab - تبويب عروض الأسعار */}
          <TabsContent value="price_quotes">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  💵 عروض الأسعار المقدمة
                  {priceQuotes.length > 0 && (
                    <Badge className="bg-[#D4AF37] text-[#01411C]">{priceQuotes.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {priceQuotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد عروض أسعار مقدمة من هذا العميل</p>
                    <p className="text-sm mt-1">ستظهر هنا عروض الأسعار التي يقدمها العميل على العقارات</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {priceQuotes.map((quote: any) => (
                      <div key={quote.id} className="p-4 border-2 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-[#01411C]">{quote.propertyTitle}</h4>
                          <Badge className={
                            quote.status === 'مقبول' ? 'bg-green-100 text-green-800' : 
                            quote.status === 'مرفوض' ? 'bg-red-100 text-red-800' : 
                            'bg-amber-100 text-amber-800'
                          }>
                            {quote.status || 'معلق'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{quote.propertyLocation}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">السعر الأصلي:</span>
                              <span className="font-bold">{quote.originalPrice?.toLocaleString()} ريال</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">العرض:</span>
                              <span className="font-bold text-[#D4AF37]">{quote.offeredPrice?.toLocaleString()} ريال</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span>طريقة الدفع: {quote.paymentMethod === 'cash' ? 'نقداً' : quote.paymentMethod === 'finance' ? 'تمويل' : 'تقسيط'}</span>
                            <span>| {new Date(quote.createdAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                          {quote.message && (
                            <div className="mt-2 p-2 bg-gray-100 rounded-lg text-xs">
                              <strong>رسالة العميل:</strong> {quote.message}
                            </div>
                          )}
                        </div>
                        
                        {/* أزرار قبول/رفض عرض السعر */}
                        {(!quote.status || quote.status === 'معلق') && (
                          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={async () => {
                                // تحديث حالة العرض
                                const allCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
                                const custIdx = allCustomers.findIndex((c: any) => c.phone === customer.phone || c.id === customer.id);
                                if (custIdx !== -1 && allCustomers[custIdx].priceQuotes) {
                                  const quoteIdx = allCustomers[custIdx].priceQuotes.findIndex((q: any) => q.id === quote.id);
                                  if (quoteIdx !== -1) {
                                    allCustomers[custIdx].priceQuotes[quoteIdx].status = 'مقبول';
                                    localStorage.setItem('crm_customers', JSON.stringify(allCustomers));
                                    setPriceQuotes([...allCustomers[custIdx].priceQuotes]);
                                  }
                                }
                                
                                // إرسال SMS للعميل
                                const smsMessage = `مرحباً ${customer.name}، تم قبول عرضك على العقار "${quote.propertyTitle}" بسعر ${quote.offeredPrice?.toLocaleString()} ريال. سيتم التواصل معك قريباً لإتمام الإجراءات. - وساطة`;
                                
                                try {
                                  // استخدام توكن الجلسة بدلاً من publishable key للأمان
                                  const { data: { session } } = await supabase.auth.getSession();
                                  if (!session?.access_token) {
                                    toast.error('يرجى تسجيل الدخول أولاً');
                                    return;
                                  }
                                  
                                  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${session.access_token}`,
                                    },
                                    body: JSON.stringify({
                                      to: customer.phone,
                                      message: smsMessage,
                                      messageType: 'price_quote_accepted',
                                    }),
                                  });
                                  
                                  if (response.ok) {
                                    toast.success('تم قبول العرض وإرسال SMS للعميل');
                                  } else {
                                    toast.success('تم قبول العرض');
                                    // فتح واتساب كخيار بديل
                                    const whatsappUrl = `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(smsMessage)}`;
                                    window.open(whatsappUrl, '_blank');
                                  }
                                } catch (e) {
                                  toast.success('تم قبول العرض');
                                  const whatsappUrl = `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(smsMessage)}`;
                                  window.open(whatsappUrl, '_blank');
                                }
                              }}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              قبول العرض
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                // تحديث حالة العرض
                                const allCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
                                const custIdx = allCustomers.findIndex((c: any) => c.phone === customer.phone || c.id === customer.id);
                                if (custIdx !== -1 && allCustomers[custIdx].priceQuotes) {
                                  const quoteIdx = allCustomers[custIdx].priceQuotes.findIndex((q: any) => q.id === quote.id);
                                  if (quoteIdx !== -1) {
                                    allCustomers[custIdx].priceQuotes[quoteIdx].status = 'مرفوض';
                                    localStorage.setItem('crm_customers', JSON.stringify(allCustomers));
                                    setPriceQuotes([...allCustomers[custIdx].priceQuotes]);
                                  }
                                }
                                
                                // رسالة الرفض مع السعر المقبول
                                const acceptablePrice = quote.originalPrice || quote.offeredPrice * 1.1;
                                const smsMessage = `مرحباً ${customer.name}، نأسف لإبلاغك أن عرضك على العقار "${quote.propertyTitle}" بسعر ${quote.offeredPrice?.toLocaleString()} ريال لم يُقبل. السعر المقبول يبدأ من ${acceptablePrice?.toLocaleString()} ريال. للمزيد من المعلومات تواصل معنا. - وساطة`;
                                
                                try {
                                  // استخدام توكن الجلسة بدلاً من publishable key للأمان
                                  const { data: { session } } = await supabase.auth.getSession();
                                  if (!session?.access_token) {
                                    toast.error('يرجى تسجيل الدخول أولاً');
                                    return;
                                  }
                                  
                                  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${session.access_token}`,
                                    },
                                    body: JSON.stringify({
                                      to: customer.phone,
                                      message: smsMessage,
                                      messageType: 'price_quote_rejected',
                                    }),
                                  });
                                  
                                  if (response.ok) {
                                    toast.error('تم رفض العرض وإرسال SMS للعميل');
                                  } else {
                                    toast.error('تم رفض العرض');
                                    const whatsappUrl = `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(smsMessage)}`;
                                    window.open(whatsappUrl, '_blank');
                                  }
                                } catch (e) {
                                  toast.error('تم رفض العرض');
                                  const whatsappUrl = `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(smsMessage)}`;
                                  window.open(whatsappUrl, '_blank');
                                }
                              }}
                            >
                              <X className="w-4 h-4 ml-1" />
                              رفض العرض
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-600 hover:bg-green-50"
                              onClick={() => {
                                const message = `مرحباً ${customer.name}، بخصوص عرضك على العقار "${quote.propertyTitle}" بسعر ${quote.offeredPrice?.toLocaleString()} ريال، نود مناقشة التفاصيل معك.`;
                                const whatsappUrl = `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                            >
                              <MessageSquare className="w-4 h-4 ml-1" />
                              واتساب
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.location.href = `tel:${customer.phone}`;
                              }}
                            >
                              <Phone className="w-4 h-4 ml-1" />
                              اتصال
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab - تبويب العروض */}
          <TabsContent value="offers">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  🎯 عروض العميل
                  {(((customer as any).metadata?.property_offers as any[]) || []).length > 0 && (
                    <Badge className="bg-[#D4AF37] text-[#01411C]">{(((customer as any).metadata?.property_offers as any[]) || []).length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(((customer as any).metadata?.property_offers as any[]) || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد عروض مستلمة من هذا العميل</p>
                    <p className="text-sm mt-1">ستظهر هنا العروض المرسلة من صفحة (إرسال عرض) في بطاقة أعمالك الرقمية</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(((customer as any).metadata?.property_offers as any[]) || []).slice().reverse().map((offer: any) => {
                      const title = `${offer.propertyType || 'عقار'} ${offer.purpose || ''}`.trim();
                      const price = offer.price ? `${offer.price} ريال` : '';
                      const date = offer.submittedAt ? new Date(offer.submittedAt).toLocaleDateString('ar-SA') : '';
                      const isSoldOrRented = offer.status === 'sold' || offer.status === 'rented';

                      return (
                        <div 
                          key={offer.id} 
                          className={`p-4 border-2 rounded-xl hover:bg-gray-50 transition-colors relative ${
                            isSoldOrRented 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-blue-200'
                          }`}
                        >
                          {/* شريط تم البيع/التأجير */}
                          {isSoldOrRented && (
                            <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center text-xs py-1 rounded-t-lg font-bold">
                              {offer.status === 'sold' ? '✓ تم البيع' : '✓ تم التأجير'}
                            </div>
                          )}
                          
                          <div className={`flex items-start justify-between gap-3 ${isSoldOrRented ? 'mt-4' : ''}`}>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-[#01411C] truncate">{title}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                                {price && <span className="font-bold text-[#D4AF37]">{price}</span>}
                                {offer.city && <Badge variant="outline">{offer.city}</Badge>}
                                {offer.district && <Badge variant="outline" className="text-xs">{offer.district}</Badge>}
                                {date && <span>• {date}</span>}
                              </div>
                              
                              {/* معلومات المالك */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                                {offer.ownerName && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">الاسم:</span> <strong>{offer.ownerName}</strong></div>
                                )}
                                {offer.ownerPhone && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">الجوال:</span> <strong dir="ltr">{offer.ownerPhone}</strong></div>
                                )}
                                {offer.ownerBirthDate && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">تاريخ الميلاد:</span> <strong>{offer.ownerBirthDate}</strong></div>
                                )}
                                {offer.ownerIdNumber && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">رقم الهوية:</span> <strong>{offer.ownerIdNumber}</strong></div>
                                )}
                                {offer.ownerCity && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">المدينة:</span> <strong>{offer.ownerCity}</strong></div>
                                )}
                                {offer.ownerDistrict && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">الحي:</span> <strong>{offer.ownerDistrict}</strong></div>
                                )}
                              </div>
                              
                              {/* مواصفات */}
                              {(offer.bedrooms || offer.bathrooms || offer.area) && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {offer.bedrooms && <Badge variant="outline" className="text-xs">🛏️ {offer.bedrooms} غرف</Badge>}
                                  {offer.bathrooms && <Badge variant="outline" className="text-xs">🚿 {offer.bathrooms} حمام</Badge>}
                                  {offer.area && <Badge variant="outline" className="text-xs">📐 {offer.area} م²</Badge>}
                                  {offer.furnishing && <Badge variant="outline" className="text-xs">🪑 {offer.furnishing}</Badge>}
                                </div>
                              )}
                            </div>
                            <Badge className={
                              isSoldOrRented ? 'bg-red-500 text-white' :
                              offer.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                              'bg-green-100 text-green-800'
                            }>
                              {offer.status === 'sold' ? 'مباع' :
                               offer.status === 'rented' ? 'مؤجر' :
                               offer.status === 'pending' ? 'جديد' : (offer.status || 'معلق')}
                            </Badge>
                          </div>

                          {/* أزرار الإجراءات */}
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                            {/* زر المعاينة */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedOfferForPreview(offer);
                                setShowOfferPreviewDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              معاينة
                            </Button>
                            
                            {/* زر نشر إعلان */}
                            <Button
                              size="sm"
                              className="bg-[#01411C] hover:bg-[#065f41]"
                              onClick={() => {
                                const republishData = {
                                  ownerName: offer.ownerName || customer.name,
                                  ownerPhone: offer.ownerPhone || customer.phone,
                                  ownerIdNumber: offer.ownerIdNumber || '',
                                  ownerNationalAddress: offer.ownerNationalAddress || '',
                                  ownerCity: offer.ownerCity || '',
                                  ownerDistrict: offer.ownerDistrict || '',
                                  ownerBirthDate: offer.ownerBirthDate || '',
                                  deedNumber: offer.deedNumber || '',
                                  deedDate: offer.deedDate || '',
                                  deedCity: offer.deedCity || '',
                                  propertyType: offer.propertyType || '',
                                  purpose: offer.purpose || '',
                                  area: offer.area || '',
                                  price: offer.price || '',
                                  paymentPrices: offer.paymentPrices || { onePayment: '', twoPayments: '', fourPayments: '', monthly: '' },
                                  locationDetails: {
                                    city: offer.city || '',
                                    district: offer.district || '',
                                    street: offer.street || '',
                                    buildingNumber: '',
                                    postalCode: '',
                                    additionalNumber: '',
                                    latitude: 24.7136,
                                    longitude: 46.6753,
                                  },
                                  floors: offer.floors || '',
                                  floorNumber: offer.floorNumber || '',
                                  bedrooms: offer.bedrooms || '',
                                  bathrooms: offer.bathrooms || '',
                                  livingRooms: offer.livingRooms || '',
                                  councils: offer.councils || '',
                                  streetWidth: offer.streetWidth || '',
                                  facade: offer.facade || '',
                                  furnishing: offer.furnishing || '',
                                  propertyAge: offer.propertyAge || '',
                                  entrances: offer.entrances || '',
                                  warehouses: offer.warehouses || '',
                                  hasLaundryRoom: offer.hasLaundryRoom || false,
                                  balconies: offer.balconies || '',
                                  acUnits: offer.acUnits || '',
                                  hasExtraKitchen: offer.hasExtraKitchen || false,
                                  warranties: offer.warranties || [],
                                  media: offer.media || [],
                                  tour3DUrl: offer.tour3dUrl || offer.tour3DUrl || '',
                                  aiDescription: offer.description || '',
                                  source: 'customer_metadata',
                                  originalOfferId: offer.id,
                                };

                                localStorage.setItem('wasata_republish_data', JSON.stringify(republishData));
                                window.location.href = '/app/platform?action=publish';
                              }}
                            >
                              <Share2 className="w-4 h-4 ml-1" />
                              نشر إعلان
                            </Button>
                            
                            {/* زر تم البيع/التأجير */}
                            <Button
                              size="sm"
                              variant={isSoldOrRented ? "outline" : "destructive"}
                              className={isSoldOrRented ? "border-green-500 text-green-600 hover:bg-green-50" : ""}
                              onClick={async () => {
                                try {
                                  const newStatus = isSoldOrRented ? 'pending' : (offer.purpose === 'بيع' ? 'sold' : 'rented');
                                  const customerMeta = (customer as any).metadata as Record<string, any> | undefined;
                                  const offers = customerMeta?.property_offers || [];
                                  const updatedOffers = offers.map((o: any) =>
                                    o.id === offer.id ? { ...o, status: newStatus } : o
                                  );

                                  await supabase
                                    .from('crm_customers')
                                    .update({
                                      metadata: {
                                        ...customerMeta,
                                        property_offers: updatedOffers,
                                      }
                                    })
                                    .eq('id', customer.id);

                                  toast.success(isSoldOrRented ? 'تم إلغاء الحالة' : (offer.purpose === 'بيع' ? 'تم تحديد العرض كمباع' : 'تم تحديد العرض كمؤجر'));
                                  window.dispatchEvent(new CustomEvent('customerUpdated'));
                                } catch (e) {
                                  toast.error('حدث خطأ في تحديث الحالة');
                                }
                              }}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              {isSoldOrRented ? 'إلغاء الحالة' : (offer.purpose === 'بيع' ? 'تم البيع' : 'تم التأجير')}
                            </Button>
                            
                            {/* زر واتساب */}
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => window.open(`https://wa.me/${offer.ownerPhone || customer.phone}`, '_blank')}
                            >
                              <MessageSquare className="w-4 h-4 ml-1" />
                              واتساب
                            </Button>
                            
                            {/* زر PDF - يفتح نافذة اختيار المحتويات */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#01411C] text-[#01411C] hover:bg-[#01411C]/10"
                              onClick={() => {
                                setSelectedOfferForPdf(offer);
                                setPdfOptions({
                                  includeOwner: true,
                                  includeDeed: true,
                                  includeImages: true,
                                  includeProperty: true,
                                  includeDescription: true,
                                });
                                setShowPdfOptionsDialog(true);
                              }}
                            >
                              <Download className="w-4 h-4 ml-1" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab - تبويب الطلبات */}
          <TabsContent value="requests">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  📋 طلبات العميل
                  {(((customer as any).metadata?.property_requests as any[]) || []).length > 0 && (
                    <Badge className="bg-[#D4AF37] text-[#01411C]">{(((customer as any).metadata?.property_requests as any[]) || []).length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(((customer as any).metadata?.property_requests as any[]) || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد طلبات مستلمة من هذا العميل</p>
                    <p className="text-sm mt-1">ستظهر هنا الطلبات المرسلة من صفحة (إرسال طلب) في بطاقة أعمالك الرقمية</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(((customer as any).metadata?.property_requests as any[]) || []).slice().reverse().map((request: any) => {
                      const title = `${request.propertyType || 'عقار'} ${request.purpose || ''}`.trim();
                      const city = request.preferredCity || request.city;
                      const budget = request.maxBudget || request.budget;
                      const date = request.submittedAt ? new Date(request.submittedAt).toLocaleDateString('ar-SA') : '';
                      const isFulfilled = request.status === 'fulfilled';

                      return (
                        <div 
                          key={request.id} 
                          className={`p-4 border-2 rounded-xl hover:bg-gray-50 transition-colors relative ${
                            isFulfilled 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-blue-200'
                          }`}
                        >
                          {/* شريط تم توفير الطلب */}
                          {isFulfilled && (
                            <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center text-xs py-1 rounded-t-lg font-bold">
                              ✓ تم توفير الطلب
                            </div>
                          )}
                          
                          <div className={`flex items-start justify-between gap-3 ${isFulfilled ? 'mt-4' : ''}`}>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-[#01411C] truncate">{title}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                                {city && <Badge variant="outline">{city}</Badge>}
                                {request.preferredDistricts && <Badge variant="outline" className="text-xs">{request.preferredDistricts}</Badge>}
                                {budget && <span className="font-bold text-[#D4AF37]">الميزانية: {budget} ريال</span>}
                                {date && <span>• {date}</span>}
                              </div>
                              
                              {/* معلومات العميل */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                                {request.ownerName && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">الاسم:</span> <strong>{request.ownerName}</strong></div>
                                )}
                                {request.ownerPhone && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">الجوال:</span> <strong dir="ltr">{request.ownerPhone}</strong></div>
                                )}
                                {request.ownerBirthDate && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">تاريخ الميلاد:</span> <strong>{request.ownerBirthDate}</strong></div>
                                )}
                                {request.ownerIdNumber && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">رقم الهوية:</span> <strong>{request.ownerIdNumber}</strong></div>
                                )}
                                {request.ownerCity && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">المدينة:</span> <strong>{request.ownerCity}</strong></div>
                                )}
                                {request.ownerDistrict && (
                                  <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">الحي:</span> <strong>{request.ownerDistrict}</strong></div>
                                )}
                              </div>
                              
                              {/* مواصفات */}
                              {(request.bedrooms || request.bathrooms || request.minArea || request.maxArea) && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {request.bedrooms && <Badge variant="outline" className="text-xs">🛏️ {request.bedrooms} غرف</Badge>}
                                  {request.bathrooms && <Badge variant="outline" className="text-xs">🚿 {request.bathrooms} حمام</Badge>}
                                  {(request.minArea || request.maxArea) && <Badge variant="outline" className="text-xs">📐 {request.minArea || '-'} - {request.maxArea || '-'} م²</Badge>}
                                  {request.furnishing && <Badge variant="outline" className="text-xs">🪑 {request.furnishing}</Badge>}
                                </div>
                              )}
                            </div>
                            <Badge className={
                              isFulfilled ? 'bg-red-500 text-white' :
                              request.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                              'bg-green-100 text-green-800'
                            }>
                              {isFulfilled ? 'تم التوفير' :
                               request.status === 'pending' ? 'جديد' : (request.status || 'معلق')}
                            </Badge>
                          </div>
                          
                          {/* أزرار الإجراءات */}
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                            {/* زر المعاينة */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedRequestForPreview(request);
                                setShowRequestPreviewDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              معاينة
                            </Button>
                            
                            {/* زر نشر إعلان */}
                            <Button
                              size="sm"
                              className="bg-[#01411C] hover:bg-[#065f41]"
                              onClick={() => {
                                // تجهيز بيانات نشر الطلب كإعلان
                                const publishData = {
                                  ownerName: request.ownerName || customer.name,
                                  ownerPhone: request.ownerPhone || customer.phone,
                                  ownerIdNumber: request.ownerIdNumber || '',
                                  ownerBirthDate: request.ownerBirthDate || '',
                                  ownerCity: request.ownerCity || '',
                                  ownerDistrict: request.ownerDistrict || '',
                                  propertyType: request.propertyType || '',
                                  purpose: request.purpose || 'شراء',
                                  city: request.preferredCity || '',
                                  district: request.preferredDistricts || '',
                                  bedrooms: request.bedrooms || '',
                                  bathrooms: request.bathrooms || '',
                                  livingRooms: request.livingRooms || '',
                                  floors: request.floors || '',
                                  minArea: request.minArea || '',
                                  maxArea: request.maxArea || '',
                                  furnishing: request.furnishing || '',
                                  minBudget: request.minBudget || '',
                                  maxBudget: request.maxBudget || '',
                                  additionalRequirements: request.additionalRequirements || '',
                                };
                                localStorage.setItem('republish_request_data', JSON.stringify(publishData));
                                // TODO: التوجيه لصفحة النشر
                                toast.success('تم تجهيز البيانات للنشر');
                              }}
                            >
                              <Share2 className="w-4 h-4 ml-1" />
                              نشر إعلان
                            </Button>
                            
                            {/* زر تم توفير الطلب */}
                            <Button
                              size="sm"
                              variant={isFulfilled ? "outline" : "destructive"}
                              className={isFulfilled ? "border-green-500 text-green-600 hover:bg-green-50" : ""}
                              onClick={async () => {
                                try {
                                  const newStatus = isFulfilled ? 'pending' : 'fulfilled';
                                  const customerMeta = (customer as any).metadata as Record<string, any> | undefined;
                                  const requests = customerMeta?.property_requests || [];
                                  const updatedRequests = requests.map((r: any) =>
                                    r.id === request.id ? { ...r, status: newStatus } : r
                                  );

                                  await supabase
                                    .from('crm_customers')
                                    .update({
                                      metadata: {
                                        ...customerMeta,
                                        property_requests: updatedRequests,
                                      }
                                    })
                                    .eq('id', customer.id);

                                  toast.success(isFulfilled ? 'تم إلغاء حالة التوفير' : 'تم تحديد الطلب كموفّر');
                                  window.dispatchEvent(new CustomEvent('customerUpdated'));
                                } catch (e) {
                                  toast.error('حدث خطأ في تحديث الحالة');
                                }
                              }}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              {isFulfilled ? 'إلغاء التوفير' : 'تم توفير الطلب'}
                            </Button>
                            
                            {/* زر واتساب */}
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => window.open(`https://wa.me/${request.ownerPhone || customer.phone}`, '_blank')}
                            >
                              <MessageSquare className="w-4 h-4 ml-1" />
                              واتساب
                            </Button>
                            
                            {/* زر PDF مع قائمة منبثقة */}
                            <div className="relative group">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#01411C] text-[#01411C] hover:bg-[#01411C]/10"
                              >
                                <Download className="w-4 h-4 ml-1" />
                                PDF
                              </Button>
                              <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 hidden group-hover:block min-w-[180px]">
                                <button
                                  className="w-full text-right px-4 py-2 hover:bg-green-50 text-sm text-[#01411C] border-b"
                                  onClick={async () => {
                                    try {
                                      const brokerData = {
                                        name: businessCardData.name,
                                        company: businessCardData.companyName,
                                        phone: businessCardData.phone,
                                        location: request.preferredCity || businessCardData.city,
                                        licenseNumber: businessCardData.falLicense,
                                        profileImage: businessCardData.profileImageUrl,
                                        coverImage: businessCardData.coverImageUrl,
                                        logoImage: businessCardData.logoUrl,
                                      };
                                      
                                      const requestData = {
                                        id: request.id,
                                        ownerName: request.ownerName || customer.name,
                                        ownerPhone: request.ownerPhone || customer.phone,
                                        ownerIdNumber: request.ownerIdNumber,
                                        ownerBirthDate: request.ownerBirthDate,
                                        ownerCity: request.ownerCity,
                                        ownerDistrict: request.ownerDistrict,
                                        propertyType: request.propertyType,
                                        purpose: request.purpose,
                                        preferredCity: request.preferredCity,
                                        preferredDistricts: request.preferredDistricts,
                                        minArea: request.minArea,
                                        maxArea: request.maxArea,
                                        bedrooms: request.bedrooms,
                                        bathrooms: request.bathrooms,
                                        livingRooms: request.livingRooms,
                                        floors: request.floors,
                                        furnishing: request.furnishing,
                                        minBudget: request.minBudget,
                                        maxBudget: request.maxBudget,
                                        paymentPrices: request.paymentPrices,
                                        hasPool: request.hasPool,
                                        hasGarden: request.hasGarden,
                                        hasElevator: request.hasElevator,
                                        hasParking: request.hasParking,
                                        hasMaidRoom: request.hasMaidRoom,
                                        hasDriverRoom: request.hasDriverRoom,
                                        additionalRequirements: request.additionalRequirements,
                                        urgency: request.urgency,
                                        createdAt: request.submittedAt,
                                      };
                                      
                                      await generateRequestPDF(requestData, true, brokerData);
                                      toast.success('تم تحميل ملف PDF مع معلومات المالك');
                                    } catch (e) {
                                      console.error('PDF error', e);
                                      toast.error('تعذر إنشاء PDF');
                                    }
                                  }}
                                >
                                  ✅ مع معلومات المالك
                                </button>
                                <button
                                  className="w-full text-right px-4 py-2 hover:bg-red-50 text-sm text-gray-700"
                                  onClick={async () => {
                                    try {
                                      const brokerData = {
                                        name: businessCardData.name,
                                        company: businessCardData.companyName,
                                        phone: businessCardData.phone,
                                        location: request.preferredCity || businessCardData.city,
                                        licenseNumber: businessCardData.falLicense,
                                        profileImage: businessCardData.profileImageUrl,
                                        coverImage: businessCardData.coverImageUrl,
                                        logoImage: businessCardData.logoUrl,
                                      };
                                      
                                      const requestData = {
                                        id: request.id,
                                        ownerName: request.ownerName || customer.name,
                                        ownerPhone: request.ownerPhone || customer.phone,
                                        ownerIdNumber: request.ownerIdNumber,
                                        ownerBirthDate: request.ownerBirthDate,
                                        ownerCity: request.ownerCity,
                                        ownerDistrict: request.ownerDistrict,
                                        propertyType: request.propertyType,
                                        purpose: request.purpose,
                                        preferredCity: request.preferredCity,
                                        preferredDistricts: request.preferredDistricts,
                                        minArea: request.minArea,
                                        maxArea: request.maxArea,
                                        bedrooms: request.bedrooms,
                                        bathrooms: request.bathrooms,
                                        livingRooms: request.livingRooms,
                                        floors: request.floors,
                                        furnishing: request.furnishing,
                                        minBudget: request.minBudget,
                                        maxBudget: request.maxBudget,
                                        paymentPrices: request.paymentPrices,
                                        hasPool: request.hasPool,
                                        hasGarden: request.hasGarden,
                                        hasElevator: request.hasElevator,
                                        hasParking: request.hasParking,
                                        hasMaidRoom: request.hasMaidRoom,
                                        hasDriverRoom: request.hasDriverRoom,
                                        additionalRequirements: request.additionalRequirements,
                                        urgency: request.urgency,
                                        createdAt: request.submittedAt,
                                      };
                                      
                                      await generateRequestPDF(requestData, false, brokerData);
                                      toast.success('تم تحميل ملف PDF بدون معلومات المالك');
                                    } catch (e) {
                                      console.error('PDF error', e);
                                      toast.error('تعذر إنشاء PDF');
                                    }
                                  }}
                                >
                                  ❌ بدون معلومات المالك
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab - تبويب الفواتير - مربوط بقاعدة البيانات */}
          <TabsContent value="invoices">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  🧾 فواتير العميل
                  {customerInvoices.length > 0 && (
                    <Badge className="bg-[#D4AF37] text-[#01411C]">{customerInvoices.length}</Badge>
                  )}
                </CardTitle>
                <Button 
                  size="sm" 
                  className="bg-[#01411C] hover:bg-[#065f41]"
                  onClick={() => setShowNewInvoiceForm(true)}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  فاتورة جديدة
                </Button>
              </CardHeader>
              <CardContent>
                {/* نموذج إضافة فاتورة جديدة */}
                {showNewInvoiceForm && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
                    <h4 className="font-bold text-amber-800 mb-4">إنشاء فاتورة جديدة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">المبلغ (ريال)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newInvoiceData.amount}
                          onChange={(e) => setNewInvoiceData(prev => ({ ...prev, amount: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">تاريخ الاستحقاق</Label>
                        <Input
                          type="date"
                          value={newInvoiceData.due_date}
                          onChange={(e) => setNewInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">الوصف</Label>
                        <Input
                          placeholder="وصف الفاتورة..."
                          value={newInvoiceData.description}
                          onChange={(e) => setNewInvoiceData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        className="bg-[#01411C] hover:bg-[#065f41]"
                        onClick={async () => {
                          if (!newInvoiceData.amount) {
                            toast.error('يرجى إدخال المبلغ');
                            return;
                          }
                          const invoiceNumber = generateInvoiceNumber();
                          const result = await createInvoice({
                            customer_id: customer.id,
                            customer_phone: customer.phone,
                            amount: parseFloat(newInvoiceData.amount),
                            invoice_number: invoiceNumber,
                            due_date: newInvoiceData.due_date || undefined,
                            description: newInvoiceData.description || undefined
                          });
                          
                          if (result) {
                            // تشغيل صوت النجاح
                            NotificationSounds.success(0.5);
                            
                            // تسجيل الحدث
                            await track({
                              eventName: 'interaction',
                              entityType: 'customer',
                              entityId: customer.id,
                              metadata: {
                                type: 'invoice',
                                invoice_number: invoiceNumber,
                                amount: newInvoiceData.amount,
                                customer_name: customer.name,
                              }
                            });
                            
                            // إنشاء إشعار
                            await createNotification({
                              title: 'فاتورة جديدة',
                              message: `تم إنشاء فاتورة ${invoiceNumber} بقيمة ${newInvoiceData.amount} ريال للعميل ${customer.name}`,
                              notification_type: 'crm',
                              related_entity_type: 'customer',
                              related_entity_id: customer.id,
                              priority: 'normal'
                            });
                          }
                          
                          setNewInvoiceData({ amount: '', description: '', due_date: '' });
                          setShowNewInvoiceForm(false);
                        }}
                      >
                        إنشاء الفاتورة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowNewInvoiceForm(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}

                {invoicesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#01411C]" />
                    <p className="text-gray-500 mt-2">جاري التحميل...</p>
                  </div>
                ) : customerInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد فواتير لهذا العميل</p>
                    <p className="text-sm mt-1">اضغط على "فاتورة جديدة" لإنشاء أول فاتورة</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">رقم الفاتورة</th>
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">المبلغ</th>
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">تاريخ الإصدار</th>
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">تاريخ الاستحقاق</th>
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الحالة</th>
                          <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                            <td className="py-3 px-4 font-bold text-[#D4AF37]">{Number(invoice.amount).toLocaleString()} ريال</td>
                            <td className="py-3 px-4 text-sm">{new Date(invoice.created_at).toLocaleDateString('ar-SA')}</td>
                            <td className="py-3 px-4 text-sm">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-SA') : '-'}</td>
                            <td className="py-3 px-4">
                              <Badge className={
                                invoice.status === 'مدفوعة' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'معلقة' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {invoice.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {invoice.status !== 'مدفوعة' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs border-green-500 text-green-600"
                                    onClick={() => markAsPaid(invoice.id)}
                                  >
                                    ✅ تحديد كمدفوعة
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  📥
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* إحصائيات الفواتير */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                    <div className="text-sm mb-1">المدفوعات المستلمة</div>
                    <div className="text-2xl font-bold">{invoiceStats.paidAmount.toLocaleString()} ريال</div>
                    <div className="text-sm opacity-90">{invoiceStats.paidCount} فاتورة</div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white">
                    <div className="text-sm mb-1">المستحقات المعلقة</div>
                    <div className="text-2xl font-bold">{invoiceStats.pendingAmount.toLocaleString()} ريال</div>
                    <div className="text-sm opacity-90">{invoiceStats.pendingCount} فاتورة</div>
                  </div>
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-white">
                    <div className="text-sm mb-1">المتأخرات</div>
                    <div className="text-2xl font-bold">{invoiceStats.overdueAmount.toLocaleString()} ريال</div>
                    <div className="text-sm opacity-90">{invoiceStats.overdueCount} فاتورة</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* أزرار الإجراءات - مثبتة في الأسفل */}
      <div className="sticky bottom-0 border-t-2 border-[#D4AF37] bg-gradient-to-r from-gray-50 to-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
              className="border-[#D4AF37]"
            >
              <Edit className="w-4 h-4 ml-1" />
              تعديل
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(customer, null, 2));
                toast.success('تم نسخ بيانات العميل');
              }}
            >
              <FileText className="w-4 h-4 ml-1" />
              نسخ
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast.info('سيتم فتح نموذج المشاركة')}
            >
              <Share2 className="w-4 h-4 ml-1" />
              مشاركة
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              إغلاق
            </Button>
            <Button 
              className="bg-[#01411C] hover:bg-[#065f41]"
              onClick={() => window.location.href = `tel:${customer.phone}`}
            >
              <Phone className="w-4 h-4 ml-1" />
              اتصال فوري
            </Button>
          </div>
        </div>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة ملاحظة</DialogTitle>
          </DialogHeader>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="اكتب ملاحظتك هنا..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNote(false)}>إلغاء</Button>
            <Button onClick={handleAddNote} className="bg-[#01411C]">إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مهمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان المهمة *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div>
              <Label>تاريخ الاستحقاق</Label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>إلغاء</Button>
            <Button onClick={handleAddTask} className="bg-[#01411C]">إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddReminder} onOpenChange={setShowAddReminder}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة تذكير</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان التذكير *</Label>
              <Input
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                placeholder="مثال: متابعة العميل"
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={newReminder.description}
                onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                placeholder="تفاصيل التذكير..."
              />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={newReminder.date}
                onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
              />
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select value={newReminder.priority} onValueChange={(v) => setNewReminder({ ...newReminder, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عاجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddReminder(false)}>إلغاء</Button>
            <Button onClick={handleAddReminder} className="bg-[#01411C]">إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              تأكيد حذف العميل
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف العميل "{customer.name}"؟
              <br />
              <span className="text-red-500 font-medium">
                هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بيانات العميل نهائياً.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCustomer}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* مكون عرض تفاصيل العقار */}
      <PropertyDetailsDialog
        isOpen={showPropertyDetailsDialog}
        onClose={() => {
          setShowPropertyDetailsDialog(false);
          setSelectedPropertyForDetails(null);
        }}
        property={selectedPropertyForDetails}
      />

      {/* مكون معاينة وتصدير PDF */}
      <PDFPreviewDialog
        isOpen={showPDFPreviewDialog}
        onClose={() => {
          setShowPDFPreviewDialog(false);
          setSelectedPropertyForPDF(null);
        }}
        property={selectedPropertyForPDF}
      />

      {/* Dialog عرض العقد */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01411C]">
              <FileText className="w-5 h-5" />
              تفاصيل عقد الإيجار
            </DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/10 rounded-lg">
                <h3 className="font-bold text-lg mb-2">{selectedContract.title}</h3>
                <Badge className={`text-white ${
                  selectedContract.status === 'active' ? 'bg-emerald-500' : 
                  selectedContract.status === 'expiring' ? 'bg-amber-500' : 'bg-red-500'
                }`}>
                  {selectedContract.status === 'active' ? 'نشط' : 
                   selectedContract.status === 'expiring' ? 'ينتهي قريباً' : 'منتهي'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-gray-500">الموقع</Label>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#01411C]" />
                    {selectedContract.location}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-gray-500">المستأجر</Label>
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-4 h-4 text-[#01411C]" />
                    {selectedContract.tenant}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-gray-500">بداية العقد</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    {selectedContract.startDate}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-gray-500">نهاية العقد</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-red-500" />
                    {selectedContract.endDate}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-gray-500">الإيجار الشهري</Label>
                  <p className="font-bold text-[#D4AF37] text-lg">
                    {selectedContract.monthlyRent?.toLocaleString()} ريال
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-gray-500">مدة العقد</Label>
                  <p className="font-medium">{selectedContract.duration} شهر</p>
                </div>
              </div>
              
              {selectedContract.daysRemaining > 0 && (
                <div className={`p-4 rounded-lg text-center ${
                  selectedContract.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  <Clock className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold">المتبقي: {selectedContract.daysRemaining} يوم</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowContractDialog(false)}>إغلاق</Button>
            <Button 
              className="bg-[#01411C]"
              onClick={() => {
                toast.success('جاري تحميل العقد...');
                // هنا يمكن إضافة منطق تحميل PDF للعقد
              }}
            >
              <Download className="w-4 h-4 ml-1" />
              تحميل PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog إرسال تنبيه */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${alertType === 'urgent' ? 'text-red-600' : 'text-[#01411C]'}`}>
              {alertType === 'urgent' ? <AlertTriangle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              {alertType === 'urgent' ? 'إشعار عاجل' : 'إرسال تنبيه'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>نص الرسالة</Label>
              <Textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">سيتم إرسال الرسالة إلى:</p>
              <p className="font-medium">{customer.name} - {customer.phone}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAlertDialog(false)}>إلغاء</Button>
            <Button 
              className={alertType === 'urgent' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#01411C]'}
              onClick={confirmSendAlert}
            >
              <Send className="w-4 h-4 ml-1" />
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog تجديد العقد */}
      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              تجديد العقد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContract && (
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="font-medium">{selectedContract.title}</p>
                <p className="text-sm text-gray-600">المستأجر: {selectedContract.tenant}</p>
              </div>
            )}
            <div>
              <Label>مدة التجديد (بالأشهر)</Label>
              <Select value={renewalMonths} onValueChange={setRenewalMonths}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 أشهر</SelectItem>
                  <SelectItem value="12">12 شهر (سنة)</SelectItem>
                  <SelectItem value="24">24 شهر (سنتين)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRenewalDialog(false)}>إلغاء</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={confirmRenewal}>
              <CheckCircle className="w-4 h-4 ml-1" />
              تأكيد التجديد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog إخلاء العقار */}
      <AlertDialog open={showEvacuationDialog} onOpenChange={setShowEvacuationDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              تأكيد إخلاء العقار
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedContract && (
                <>
                  هل أنت متأكد من تسجيل إخلاء العقار "{selectedContract.title}"؟
                  <br />
                  <span className="text-red-500">سيتم إزالة العقار من قائمة العقارات المؤجرة.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmEvacuation}>
              تأكيد الإخلاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog طلب مهلة */}
      <Dialog open={showExtensionDialog} onOpenChange={setShowExtensionDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="w-5 h-5" />
              طلب مهلة إضافية
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContract && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="font-medium">{selectedContract.title}</p>
                <p className="text-sm text-gray-600">المستأجر: {selectedContract.tenant}</p>
              </div>
            )}
            <div>
              <Label>عدد أيام المهلة</Label>
              <Select value={extensionDays} onValueChange={setExtensionDays}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 أيام</SelectItem>
                  <SelectItem value="14">14 يوم</SelectItem>
                  <SelectItem value="30">30 يوم</SelectItem>
                  <SelectItem value="60">60 يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExtensionDialog(false)}>إلغاء</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={confirmExtension}>
              <Clock className="w-4 h-4 ml-1" />
              منح المهلة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog معاينة العرض المستلم - كامل التفاصيل كما أرسله العميل */}
      <Dialog open={showOfferPreviewDialog} onOpenChange={setShowOfferPreviewDialog}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01411C]">
              <Eye className="w-5 h-5" />
              معاينة العرض المستلم
            </DialogTitle>
          </DialogHeader>
          {selectedOfferForPreview && (
            <div className="space-y-4">
              {/* معلومات المالك */}
              <div className="p-4 bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5 rounded-xl border border-[#D4AF37]">
                <h3 className="font-bold text-[#01411C] mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  معلومات المالك
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">الاسم:</span> <strong>{selectedOfferForPreview.ownerName || customer.name}</strong></div>
                  <div><span className="text-gray-500">الجوال:</span> <strong dir="ltr">{selectedOfferForPreview.ownerPhone || customer.phone}</strong></div>
                  {selectedOfferForPreview.ownerIdNumber && (
                    <div><span className="text-gray-500">رقم الهوية:</span> <strong>{selectedOfferForPreview.ownerIdNumber}</strong></div>
                  )}
                  {selectedOfferForPreview.ownerBirthDate && (
                    <div><span className="text-gray-500">تاريخ الميلاد:</span> <strong>{selectedOfferForPreview.ownerBirthDate}</strong></div>
                  )}
                  {selectedOfferForPreview.ownerCity && (
                    <div><span className="text-gray-500">المدينة:</span> <strong>{selectedOfferForPreview.ownerCity}</strong></div>
                  )}
                  {selectedOfferForPreview.ownerDistrict && (
                    <div><span className="text-gray-500">الحي:</span> <strong>{selectedOfferForPreview.ownerDistrict}</strong></div>
                  )}
                </div>
              </div>

              {/* معلومات العقار */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  معلومات العقار
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">نوع العقار:</span> <strong>{selectedOfferForPreview.propertyType}</strong></div>
                  <div><span className="text-gray-500">الغرض:</span> <strong>{selectedOfferForPreview.purpose}</strong></div>
                  {selectedOfferForPreview.price && (
                    <div><span className="text-gray-500">السعر:</span> <strong className="text-[#D4AF37]">{selectedOfferForPreview.price} ريال</strong></div>
                  )}
                  {selectedOfferForPreview.area && (
                    <div><span className="text-gray-500">المساحة:</span> <strong>{selectedOfferForPreview.area} م²</strong></div>
                  )}
                  {selectedOfferForPreview.city && (
                    <div><span className="text-gray-500">المدينة:</span> <strong>{selectedOfferForPreview.city}</strong></div>
                  )}
                  {selectedOfferForPreview.district && (
                    <div><span className="text-gray-500">الحي:</span> <strong>{selectedOfferForPreview.district}</strong></div>
                  )}
                  {selectedOfferForPreview.street && (
                    <div><span className="text-gray-500">الشارع:</span> <strong>{selectedOfferForPreview.street}</strong></div>
                  )}
                </div>
              </div>

              {/* المواصفات */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  المواصفات
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {selectedOfferForPreview.bedrooms && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedOfferForPreview.bedrooms}</div><div className="text-xs text-gray-500">غرف نوم</div></div>
                  )}
                  {selectedOfferForPreview.bathrooms && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedOfferForPreview.bathrooms}</div><div className="text-xs text-gray-500">دورات مياه</div></div>
                  )}
                  {selectedOfferForPreview.livingRooms && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedOfferForPreview.livingRooms}</div><div className="text-xs text-gray-500">صالات</div></div>
                  )}
                  {selectedOfferForPreview.floors && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedOfferForPreview.floors}</div><div className="text-xs text-gray-500">طوابق</div></div>
                  )}
                  {selectedOfferForPreview.propertyAge && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedOfferForPreview.propertyAge}</div><div className="text-xs text-gray-500">عمر العقار</div></div>
                  )}
                  {selectedOfferForPreview.streetWidth && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedOfferForPreview.streetWidth}م</div><div className="text-xs text-gray-500">عرض الشارع</div></div>
                  )}
                </div>
                {(selectedOfferForPreview.facade || selectedOfferForPreview.furnishing) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedOfferForPreview.facade && (
                      <Badge variant="outline" className="bg-white">{selectedOfferForPreview.facade}</Badge>
                    )}
                    {selectedOfferForPreview.furnishing && (
                      <Badge variant="outline" className="bg-white">{selectedOfferForPreview.furnishing}</Badge>
                    )}
                  </div>
                )}
              </div>

              {/* معلومات الصك */}
              {(selectedOfferForPreview.deedNumber || selectedOfferForPreview.deedDate) && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    معلومات الصك
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedOfferForPreview.deedNumber && (
                      <div><span className="text-gray-500">رقم الصك:</span> <strong>{selectedOfferForPreview.deedNumber}</strong></div>
                    )}
                    {selectedOfferForPreview.deedDate && (
                      <div><span className="text-gray-500">تاريخ الصك:</span> <strong>{selectedOfferForPreview.deedDate}</strong></div>
                    )}
                    {selectedOfferForPreview.deedCity && (
                      <div><span className="text-gray-500">مدينة الصك:</span> <strong>{selectedOfferForPreview.deedCity}</strong></div>
                    )}
                  </div>
                </div>
              )}

              {/* الوصف */}
              {selectedOfferForPreview.description && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-2">الوصف</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{selectedOfferForPreview.description}</p>
                </div>
              )}

              {/* الضمانات */}
              {selectedOfferForPreview.warranties && selectedOfferForPreview.warranties.length > 0 && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    الضمانات
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOfferForPreview.warranties.map((warranty: any, idx: number) => (
                      <Badge key={idx} className="bg-green-100 text-green-800 border-green-300">
                        {warranty.type} - {warranty.duration}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* الوسائط - الصور والفيديو */}
              {selectedOfferForPreview.media && selectedOfferForPreview.media.length > 0 && (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <h3 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    الوسائط ({selectedOfferForPreview.media.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedOfferForPreview.media.map((mediaItem: any, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                        {mediaItem.type === 'video' ? (
                          <video src={mediaItem.url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img 
                            src={mediaItem.url} 
                            alt={`صورة ${idx + 1}`} 
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(mediaItem.url, '_blank')}
                          />
                        )}
                        {mediaItem.isMain && (
                          <Badge className="absolute top-1 right-1 bg-[#D4AF37] text-white text-[10px]">رئيسية</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* تاريخ الإرسال */}
              <div className="text-center text-sm text-gray-500 pt-2 border-t">
                تم الإرسال في: {selectedOfferForPreview.submittedAt ? new Date(selectedOfferForPreview.submittedAt).toLocaleDateString('ar-SA', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'غير محدد'}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            {/* زر تم البيع/التأجير */}
            {selectedOfferForPreview?.status !== 'sold' && selectedOfferForPreview?.status !== 'rented' && (
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    const newStatus = selectedOfferForPreview?.purpose === 'بيع' ? 'sold' : 'rented';
                    const customerMeta = (customer as any).metadata as Record<string, any> | undefined;
                    const offers = customerMeta?.property_offers || [];
                    const updatedOffers = offers.map((o: any) =>
                      o.id === selectedOfferForPreview?.id ? { ...o, status: newStatus } : o
                    );

                    await supabase
                      .from('crm_customers')
                      .update({
                        metadata: {
                          ...customerMeta,
                          property_offers: updatedOffers,
                        }
                      })
                      .eq('id', customer.id);

                    setSelectedOfferForPreview({ ...selectedOfferForPreview, status: newStatus });
                    toast.success(newStatus === 'sold' ? 'تم تحديد العرض كمباع' : 'تم تحديد العرض كمؤجر');
                    window.dispatchEvent(new CustomEvent('customerUpdated'));
                  } catch (e) {
                    toast.error('حدث خطأ في تحديث الحالة');
                  }
                }}
              >
                <CheckCircle className="w-4 h-4 ml-1" />
                {selectedOfferForPreview?.purpose === 'بيع' ? 'تم البيع' : 'تم التأجير'}
              </Button>
            )}
            {(selectedOfferForPreview?.status === 'sold' || selectedOfferForPreview?.status === 'rented') && (
              <Badge className="bg-red-500 text-white px-4 py-2">
                {selectedOfferForPreview?.status === 'sold' ? '✓ تم البيع' : '✓ تم التأجير'}
              </Badge>
            )}
            <Button variant="outline" onClick={() => setShowOfferPreviewDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog معاينة الطلب المستلم - كامل التفاصيل كما أرسله العميل */}
      <Dialog open={showRequestPreviewDialog} onOpenChange={setShowRequestPreviewDialog}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            {/* شريط تم توفير الطلب في المعاينة */}
            {selectedRequestForPreview?.status === 'fulfilled' && (
              <div className="bg-red-500 text-white text-center py-2 rounded-lg font-bold text-sm mb-3">
                ✓ تم توفير الطلب
              </div>
            )}
            <DialogTitle className="flex items-center gap-2 text-[#01411C]">
              <Eye className="w-5 h-5" />
              معاينة الطلب المستلم
            </DialogTitle>
          </DialogHeader>
          {selectedRequestForPreview && (
            <div className="space-y-4">
              {/* معلومات العميل */}
              <div className="p-4 bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5 rounded-xl border border-[#D4AF37]">
                <h3 className="font-bold text-[#01411C] mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  معلومات العميل
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">الاسم:</span> <strong>{selectedRequestForPreview.ownerName || customer.name}</strong></div>
                  <div><span className="text-gray-500">الجوال:</span> <strong dir="ltr">{selectedRequestForPreview.ownerPhone || customer.phone}</strong></div>
                  {selectedRequestForPreview.ownerIdNumber && (
                    <div><span className="text-gray-500">رقم الهوية:</span> <strong>{selectedRequestForPreview.ownerIdNumber}</strong></div>
                  )}
                  {selectedRequestForPreview.ownerBirthDate && (
                    <div><span className="text-gray-500">تاريخ الميلاد:</span> <strong>{selectedRequestForPreview.ownerBirthDate}</strong></div>
                  )}
                  {selectedRequestForPreview.ownerCity && (
                    <div><span className="text-gray-500">المدينة:</span> <strong>{selectedRequestForPreview.ownerCity}</strong></div>
                  )}
                  {selectedRequestForPreview.ownerDistrict && (
                    <div><span className="text-gray-500">الحي:</span> <strong>{selectedRequestForPreview.ownerDistrict}</strong></div>
                  )}
                </div>
              </div>

              {/* معلومات الطلب */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  معلومات الطلب
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">نوع العقار:</span> <strong>{selectedRequestForPreview.propertyType}</strong></div>
                  <div><span className="text-gray-500">الغرض:</span> <strong>{selectedRequestForPreview.purpose}</strong></div>
                  {selectedRequestForPreview.preferredCity && (
                    <div><span className="text-gray-500">المدينة المفضلة:</span> <strong>{selectedRequestForPreview.preferredCity}</strong></div>
                  )}
                  {selectedRequestForPreview.preferredDistricts && (
                    <div><span className="text-gray-500">الأحياء المفضلة:</span> <strong>{selectedRequestForPreview.preferredDistricts}</strong></div>
                  )}
                  {(selectedRequestForPreview.minBudget || selectedRequestForPreview.maxBudget) && (
                    <div className="col-span-2">
                      <span className="text-gray-500">الميزانية:</span> 
                      <strong className="text-[#D4AF37] mr-1">
                        {selectedRequestForPreview.minBudget && `من ${selectedRequestForPreview.minBudget}`}
                        {selectedRequestForPreview.minBudget && selectedRequestForPreview.maxBudget && ' - '}
                        {selectedRequestForPreview.maxBudget && `إلى ${selectedRequestForPreview.maxBudget}`} ريال
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* المواصفات المطلوبة */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  المواصفات المطلوبة
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {selectedRequestForPreview.bedrooms && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedRequestForPreview.bedrooms}</div><div className="text-xs text-gray-500">غرف نوم</div></div>
                  )}
                  {selectedRequestForPreview.bathrooms && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedRequestForPreview.bathrooms}</div><div className="text-xs text-gray-500">دورات مياه</div></div>
                  )}
                  {selectedRequestForPreview.livingRooms && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedRequestForPreview.livingRooms}</div><div className="text-xs text-gray-500">صالات</div></div>
                  )}
                  {selectedRequestForPreview.floors && (
                    <div className="text-center p-2 bg-white rounded-lg"><div className="text-lg font-bold">{selectedRequestForPreview.floors}</div><div className="text-xs text-gray-500">طوابق</div></div>
                  )}
                  {(selectedRequestForPreview.minArea || selectedRequestForPreview.maxArea) && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <div className="text-lg font-bold">{selectedRequestForPreview.minArea || '-'} - {selectedRequestForPreview.maxArea || '-'}</div>
                      <div className="text-xs text-gray-500">المساحة (م²)</div>
                    </div>
                  )}
                </div>
                {selectedRequestForPreview.furnishing && (
                  <div className="mt-3">
                    <Badge variant="outline" className="bg-white">{selectedRequestForPreview.furnishing}</Badge>
                  </div>
                )}
              </div>

              {/* المميزات المطلوبة */}
              {(selectedRequestForPreview.hasPool || selectedRequestForPreview.hasGarden || selectedRequestForPreview.hasElevator || 
                selectedRequestForPreview.hasParking || selectedRequestForPreview.hasMaidRoom || selectedRequestForPreview.hasDriverRoom) && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    المميزات المطلوبة
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequestForPreview.hasPool && <Badge className="bg-green-100 text-green-800">🏊 مسبح</Badge>}
                    {selectedRequestForPreview.hasGarden && <Badge className="bg-green-100 text-green-800">🌳 حديقة</Badge>}
                    {selectedRequestForPreview.hasElevator && <Badge className="bg-green-100 text-green-800">🛗 مصعد</Badge>}
                    {selectedRequestForPreview.hasParking && <Badge className="bg-green-100 text-green-800">🚗 موقف</Badge>}
                    {selectedRequestForPreview.hasMaidRoom && <Badge className="bg-green-100 text-green-800">🧹 غرفة خادمة</Badge>}
                    {selectedRequestForPreview.hasDriverRoom && <Badge className="bg-green-100 text-green-800">🚘 غرفة سائق</Badge>}
                  </div>
                </div>
              )}

              {/* متطلبات إضافية */}
              {selectedRequestForPreview.additionalRequirements && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-2">متطلبات إضافية</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{selectedRequestForPreview.additionalRequirements}</p>
                </div>
              )}

              {/* درجة الاستعجال */}
              {selectedRequestForPreview.urgency && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    درجة الاستعجال
                  </h3>
                  <Badge className={
                    selectedRequestForPreview.urgency === 'urgent' ? 'bg-red-500 text-white' :
                    selectedRequestForPreview.urgency === 'soon' ? 'bg-amber-500 text-white' :
                    'bg-green-500 text-white'
                  }>
                    {selectedRequestForPreview.urgency === 'urgent' ? 'عاجل جداً' :
                     selectedRequestForPreview.urgency === 'soon' ? 'قريباً' : 'غير مستعجل'}
                  </Badge>
                </div>
              )}

              {/* تاريخ الإرسال */}
              <div className="text-center text-sm text-gray-500 pt-2 border-t">
                تم الإرسال في: {selectedRequestForPreview.submittedAt ? new Date(selectedRequestForPreview.submittedAt).toLocaleDateString('ar-SA', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'غير محدد'}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            {/* زر تم توفير الطلب */}
            <Button
              variant={selectedRequestForPreview?.status === 'fulfilled' ? "outline" : "destructive"}
              className={selectedRequestForPreview?.status === 'fulfilled' ? "border-green-500 text-green-600 hover:bg-green-50" : ""}
              onClick={async () => {
                try {
                  const isFulfilled = selectedRequestForPreview?.status === 'fulfilled';
                  const newStatus = isFulfilled ? 'pending' : 'fulfilled';
                  const customerMeta = (customer as any).metadata as Record<string, any> | undefined;
                  const requests = customerMeta?.property_requests || [];
                  const updatedRequests = requests.map((r: any) =>
                    r.id === selectedRequestForPreview?.id ? { ...r, status: newStatus } : r
                  );

                  await supabase
                    .from('crm_customers')
                    .update({
                      metadata: {
                        ...customerMeta,
                        property_requests: updatedRequests,
                      }
                    })
                    .eq('id', customer.id);

                  setSelectedRequestForPreview({ ...selectedRequestForPreview, status: newStatus });
                  toast.success(isFulfilled ? 'تم إلغاء حالة التوفير' : 'تم تحديد الطلب كموفّر');
                  window.dispatchEvent(new CustomEvent('customerUpdated'));
                } catch (e) {
                  toast.error('حدث خطأ في تحديث الحالة');
                }
              }}
            >
              <CheckCircle className="w-4 h-4 ml-1" />
              {selectedRequestForPreview?.status === 'fulfilled' ? 'إلغاء التوفير' : 'تم توفير الطلب'}
            </Button>
            {selectedRequestForPreview?.status === 'fulfilled' && (
              <Badge className="bg-red-500 text-white px-4 py-2">
                ✓ تم توفير الطلب
              </Badge>
            )}
            <Button variant="outline" onClick={() => setShowRequestPreviewDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Dialog اختيار محتويات PDF */}
      <Dialog open={showPdfOptionsDialog} onOpenChange={setShowPdfOptionsDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01411C]">
              <Download className="w-5 h-5" />
              اختر محتويات ملف PDF
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* معلومات المالك */}
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={pdfOptions.includeOwner}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, includeOwner: e.target.checked }))}
                className="w-5 h-5 accent-[#01411C]"
              />
              <div>
                <div className="font-medium">معلومات المالك</div>
                <div className="text-sm text-gray-500">الاسم، الجوال، الهوية، العنوان، تاريخ الميلاد</div>
              </div>
            </label>
            
            {/* معلومات الصك */}
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={pdfOptions.includeDeed}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, includeDeed: e.target.checked }))}
                className="w-5 h-5 accent-[#01411C]"
              />
              <div>
                <div className="font-medium">معلومات الصك</div>
                <div className="text-sm text-gray-500">رقم الصك، التاريخ، المدينة</div>
              </div>
            </label>
            
            {/* الصور */}
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={pdfOptions.includeImages}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                className="w-5 h-5 accent-[#01411C]"
              />
              <div>
                <div className="font-medium">الصور</div>
                <div className="text-sm text-gray-500">صور العقار المرفقة، رابط الجولة الافتراضية</div>
              </div>
            </label>
            
            {/* معلومات العقار الكاملة */}
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={pdfOptions.includeProperty}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, includeProperty: e.target.checked }))}
                className="w-5 h-5 accent-[#01411C]"
              />
              <div>
                <div className="font-medium">معلومات العقار الكاملة</div>
                <div className="text-sm text-gray-500">المواصفات التفصيلية، المميزات الإضافية، الضمانات والكفالات</div>
              </div>
            </label>
            
            {/* وصف العقار */}
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={pdfOptions.includeDescription}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, includeDescription: e.target.checked }))}
                className="w-5 h-5 accent-[#01411C]"
              />
              <div>
                <div className="font-medium">وصف العقار</div>
                <div className="text-sm text-gray-500">وصف إضافي</div>
              </div>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPdfOptionsDialog(false)}>إلغاء</Button>
            <Button
              className="bg-[#01411C] hover:bg-[#065f41]"
              onClick={async () => {
                try {
                  const offer = selectedOfferForPdf;
                  if (!offer) return;
                  
                  // جلب بيانات الوسيط من البطاقة الرقمية
                  const brokerData = {
                    name: businessCardData.name,
                    company: businessCardData.companyName,
                    phone: businessCardData.phone,
                    location: offer.city || offer.locationCity || businessCardData.city,
                    licenseNumber: businessCardData.falLicense,
                    profileImage: businessCardData.profileImageUrl,
                    coverImage: businessCardData.coverImageUrl,
                    logoImage: businessCardData.logoUrl,
                  };
                  
                  const slug = localStorage.getItem('public_platform_slug') || '';
                  const publishedDomain = import.meta.env.VITE_PUBLIC_BASE_DOMAIN || 'strict-page-playbook.lovable.app';
                  const offerUrl = slug && (offer.city || offer.locationCity) && (offer.district || offer.locationDistrict)
                    ? `https://${publishedDomain}/${slug}/${offer.city || offer.locationCity}/${offer.district || offer.locationDistrict}/${offer.id}`
                    : '';
                  
                  const title = `${offer.propertyType || 'عقار'} ${offer.purpose || ''}`.trim();
                  
                  // بناء قائمة المميزات
                  const features: string[] = [];
                  if (pdfOptions.includeProperty) {
                    if (offer.hasPool) features.push('مسبح');
                    if (offer.hasGarden) features.push('حديقة');
                    if (offer.hasElevator) features.push('مصعد');
                    if (offer.hasParking) features.push('موقف سيارات');
                    if (offer.hasLaundryRoom) features.push('غرفة غسيل');
                    if (offer.hasExtraKitchen) features.push('مطبخ إضافي');
                    if (offer.customFeatures) features.push(offer.customFeatures);
                  }
                  
                  const pdfData = {
                    id: offer.id,
                    title: title,
                    // معلومات المالك (حسب الاختيار)
                    ownerName: pdfOptions.includeOwner ? (offer.ownerName || customer.name) : undefined,
                    ownerPhone: pdfOptions.includeOwner ? (offer.ownerPhone || customer.phone) : undefined,
                    ownerIdNumber: pdfOptions.includeOwner ? offer.ownerIdNumber : undefined,
                    ownerBirthDate: pdfOptions.includeOwner ? offer.ownerBirthDate : undefined,
                    ownerCity: pdfOptions.includeOwner ? offer.ownerCity : undefined,
                    ownerDistrict: pdfOptions.includeOwner ? offer.ownerDistrict : undefined,
                    // الموقع
                    locationDetails: {
                      city: offer.city || offer.locationCity,
                      district: offer.district || offer.locationDistrict,
                      street: offer.street || offer.locationStreet,
                    },
                    // معلومات الصك (حسب الاختيار)
                    deedNumber: pdfOptions.includeDeed ? offer.deedNumber : undefined,
                    deedDate: pdfOptions.includeDeed ? offer.deedDate : undefined,
                    deedCity: pdfOptions.includeDeed ? offer.deedCity : undefined,
                    // معلومات العقار (حسب الاختيار)
                    propertyType: pdfOptions.includeProperty ? offer.propertyType : undefined,
                    purpose: pdfOptions.includeProperty ? offer.purpose : undefined,
                    price: pdfOptions.includeProperty ? offer.price : undefined,
                    area: pdfOptions.includeProperty ? offer.area : undefined,
                    bedrooms: pdfOptions.includeProperty ? offer.bedrooms : undefined,
                    bathrooms: pdfOptions.includeProperty ? offer.bathrooms : undefined,
                    livingRooms: pdfOptions.includeProperty ? offer.livingRooms : undefined,
                    councils: pdfOptions.includeProperty ? offer.councils : undefined,
                    floors: pdfOptions.includeProperty ? offer.floors : undefined,
                    floorNumber: pdfOptions.includeProperty ? offer.floorNumber : undefined,
                    streetWidth: pdfOptions.includeProperty ? offer.streetWidth : undefined,
                    facade: pdfOptions.includeProperty ? offer.facade : undefined,
                    furnishing: pdfOptions.includeProperty ? offer.furnishing : undefined,
                    propertyAge: pdfOptions.includeProperty ? offer.propertyAge : undefined,
                    entrances: pdfOptions.includeProperty ? offer.entrances : undefined,
                    warehouses: pdfOptions.includeProperty ? offer.warehouses : undefined,
                    balconies: pdfOptions.includeProperty ? offer.balconies : undefined,
                    acUnits: pdfOptions.includeProperty ? offer.acUnits : undefined,
                    // المميزات
                    features: features.length > 0 ? features : undefined,
                    // الضمانات
                    warranties: pdfOptions.includeProperty ? offer.warranties : undefined,
                    // الوصف (حسب الاختيار)
                    aiDescription: pdfOptions.includeDescription ? offer.description : undefined,
                    // الصور ورابط الجولة (حسب الاختيار)
                    images: pdfOptions.includeImages 
                      ? (offer.media || []).filter((m: any) => m.type === 'image').map((m: any) => m.url)
                      : [],
                    image: pdfOptions.includeImages 
                      ? (offer.media || []).find((m: any) => m.type === 'image')?.url || offer.mainImage
                      : undefined,
                    tour3dUrl: pdfOptions.includeImages ? (offer.tour3dUrl || offer.tour3DUrl) : undefined,
                    offerUrl,
                  };
                  
                  await generatePropertyPDF(pdfData as any, pdfOptions.includeOwner, brokerData);
                  toast.success('تم تحميل ملف PDF');
                  setShowPdfOptionsDialog(false);
                } catch (e) {
                  console.error('PDF error', e);
                  toast.error('تعذر إنشاء PDF');
                }
              }}
            >
              <Download className="w-4 h-4 ml-1" />
              تحميل PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
