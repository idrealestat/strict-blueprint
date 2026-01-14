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
  const initialTab = (customer as any).activeTab || 'published_ads';
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
  
  // Default tabs - مرتبة حسب الطلب: عقار منشور، الطلبات، العروض، عرض سعر، المهام
  const defaultTabs = [
    { id: 'published_ads', name: '📢 عقارات منشورة', removable: false },
    { id: 'requests', name: '📋 الطلبات', removable: false },
    { id: 'offers', name: '🎯 العروض', removable: false },
    { id: 'price_quotes', name: '💵 عرض سعر', removable: false },
    { id: 'tasks', name: '✅ المهام', removable: false },
    { id: 'overview', name: '📊 المعلومات العامة', removable: false },
    { id: 'transactions', name: '💰 المعاملات', removable: true },
    { id: 'activity', name: '💬 التفاعلات', removable: false },
    { id: 'analytics', name: '📈 التحليلات', removable: true },
    { id: 'properties', name: '🏘️ العقارات', removable: true },
    { id: 'rented', name: '🏠 عقار مؤجر', removable: true },
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
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-[#D4AF37] text-white hover:bg-white/20"
                >
                  <Edit className="w-4 h-4 ml-1" />
                  تعديل
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
                  onClick={() => toast.info('سيتم فتح نموذج جدولة موعد')}
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
                {defaultTabs.filter(tab => visibleTabs.includes(tab.id)).map((tab) => (
                  <div key={tab.id} className="relative group flex items-center">
                    <TabsTrigger 
                      value={tab.id} 
                      className="text-xs whitespace-nowrap pr-6"
                    >
                      {tab.name}
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
                ))}
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

          {/* Activity Tab - تبويب التفاعلات المحسن */}
          <TabsContent value="activity">
            <div className="space-y-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    سجل التفاعلات
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Button size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                      📞 تسجيل مكالمة
                    </Button>
                    <Button size="sm" className="bg-green-100 text-green-700 hover:bg-green-200">
                      ✉️ إرسال إيميل
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {activityLogs.map((log) => {
                        const activityType = ACTIVITY_TYPE_ICONS[log.type];
                        const Icon = activityType.icon;
                        const sentiment: 'إيجابي' | 'سلبي' | 'محايد' = log.type === 'meeting' ? 'إيجابي' : log.type === 'call' ? 'إيجابي' : 'محايد';
                        return (
                          <div key={log.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activityType.color}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">
                                    {log.type === 'call' ? 'مكالمة' : 
                                     log.type === 'whatsapp' ? 'واتساب' :
                                     log.type === 'email' ? 'إيميل' :
                                     log.type === 'meeting' ? 'اجتماع' :
                                     log.type === 'note' ? 'ملاحظة' : 'تغيير حالة'}
                                  </h4>
                                  <div className="text-sm text-gray-600">{log.timestamp}</div>
                                </div>
                              </div>
                              <Badge className={
                                sentiment === 'إيجابي' ? 'bg-green-100 text-green-800' :
                                sentiment === 'محايد' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {sentiment}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 mb-3">{log.description}</p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-4">
                                {log.type === 'call' && <span>⏱️ 15 دقيقة</span>}
                                <span>👤 {log.user || 'أنت'}</span>
                              </div>
                              <button className="text-blue-600 hover:text-blue-800">
                                عرض التفاصيل →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* إحصائيات الاتصال */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">إجمالي المكالمات</div>
                    <div className="text-2xl font-bold text-blue-600">24</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">إجمالي الإيميلات</div>
                    <div className="text-2xl font-bold text-green-600">156</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">متوسط وقت المكالمة</div>
                    <div className="text-2xl font-bold text-purple-600">12 دقيقة</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">معدل الرد</div>
                    <div className="text-2xl font-bold text-amber-600">94%</div>
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
                    {publishedAds.map((ad) => (
                      <div key={ad.id} className="p-4 border-2 border-[#D4AF37]/50 rounded-lg bg-gradient-to-r from-amber-50/50 to-yellow-50/50">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          {/* معلومات العقار */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-lg text-[#01411C]">
                                {ad.purpose} {ad.propertyType}
                              </h4>
                              <Badge className="bg-emerald-100 text-emerald-700">
                                {ad.status === 'published' ? 'منشور' : 'مسودة'}
                              </Badge>
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
                                setSelectedPropertyForDetails(ad);
                                setShowPropertyDetailsDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              عرض التفاصيل
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
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

          {/* Rented Properties Tab - تبويب عقار مؤجر */}
          <TabsContent value="rented">
            <Card className="border-2 border-[#D4AF37]">
              <CardHeader className="bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  العقارات المؤجرة للمالك
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {/* Mock rented properties for this owner */}
                <div className="space-y-4">
                  {/* Rented Property 1 */}
                  <div className="p-4 border-2 border-emerald-200 rounded-lg bg-emerald-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">فيلا في حي النرجس</h4>
                          <Badge className="bg-emerald-500 text-white">نشط</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            الرياض - حي النرجس
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            المستأجر: خالد سعيد
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            بداية العقد: 2024-01-15
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-red-500" />
                            نهاية العقد: 2025-01-15
                          </span>
                          <span className="text-emerald-600 font-bold">
                            المتبقي: 32 يوم
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D4AF37] font-bold text-lg">8,000 ريال/شهر</span>
                          <span className="text-gray-500">| مدة العقد: 12 شهر</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="border-[#01411C] text-[#01411C]">
                          <FileText className="w-4 h-4 ml-1" />
                          عرض العقد
                        </Button>
                        <Button size="sm" className="bg-[#01411C]">
                          <Send className="w-4 h-4 ml-1" />
                          إرسال تنبيه
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Rented Property 2 */}
                  <div className="p-4 border-2 border-amber-200 rounded-lg bg-amber-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">شقة في حي العليا</h4>
                          <Badge className="bg-amber-500 text-white animate-pulse">ينتهي قريباً</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            الرياض - حي العليا
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            المستأجر: أحمد فهد
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            بداية العقد: 2023-12-01
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-red-500" />
                            نهاية العقد: 2024-12-01
                          </span>
                          <span className="text-amber-600 font-bold">
                            المتبقي: 15 يوم
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D4AF37] font-bold text-lg">4,500 ريال/شهر</span>
                          <span className="text-gray-500">| مدة العقد: 12 شهر</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="border-[#01411C] text-[#01411C]">
                          <FileText className="w-4 h-4 ml-1" />
                          عرض العقد
                        </Button>
                        <Button size="sm" variant="destructive">
                          <AlertTriangle className="w-4 h-4 ml-1" />
                          إشعار عاجل
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Rented Property 3 - Expired */}
                  <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">مكتب تجاري في طريق الملك فهد</h4>
                          <Badge className="bg-red-500 text-white">منتهي</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            الرياض - طريق الملك فهد
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            المستأجر: شركة الأمل للتجارة
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            بداية العقد: 2023-12-01
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <Calendar className="w-4 h-4" />
                            انتهى في: 2024-12-01
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D4AF37] font-bold text-lg">15,000 ريال/شهر</span>
                          <span className="text-gray-500">| مدة العقد: 12 شهر</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          تجديد العقد
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500 text-red-500">
                          إخلاء العقار
                        </Button>
                        <Button size="sm" variant="outline">
                          طلب مهلة
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-600">3</div>
                      <div className="text-sm text-gray-600">إجمالي العقارات</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">1</div>
                      <div className="text-sm text-gray-600">عقود نشطة</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">1</div>
                      <div className="text-sm text-gray-600">تنتهي قريباً</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#D4AF37]/10 border-[#D4AF37]">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">27,500</div>
                      <div className="text-sm text-gray-600">إجمالي الإيجار الشهري</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
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

          {/* Analytics Tab - تبويب التحليلات */}
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
                      <div className="text-3xl font-bold text-blue-600 mb-1">85%</div>
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
                      <div className="text-3xl font-bold text-green-600 mb-1">72%</div>
                      <div className="text-xs text-gray-600">بناءً على النشاط</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm">قيمة العميل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-1">2.4M</div>
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
                      <div className="text-3xl font-bold text-orange-600 mb-1">45</div>
                      <div className="text-xs text-gray-600">يوم</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* تحليل سلوك العميل */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#01411C]" />
                    تحليل سلوك العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-sm text-gray-600">مكالمات هاتفية</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">8</div>
                      <div className="text-sm text-gray-600">رسائل واتساب</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">5</div>
                      <div className="text-sm text-gray-600">زيارات ميدانية</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* الأهداف والإنجازات */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#01411C]" />
                    الأهداف والإنجازات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>هدف الإغلاق الشهري</span>
                      <span className="text-green-600 font-bold">75%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>التفاعل مع العميل</span>
                      <span className="text-blue-600 font-bold">90%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>جودة المتابعة</span>
                      <span className="text-purple-600 font-bold">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* التوقعات المستقبلية */}
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
                        احتمالية الشراء خلال 30 يوم
                      </div>
                      <div className="text-3xl font-bold text-yellow-600">68%</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-lg font-bold text-red-700 mb-2">
                        مخاطر فقدان العميل
                      </div>
                      <div className="text-3xl font-bold text-red-600">15%</div>
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
                    {/* Sample files */}
                    {[
                      { id: 1, name: 'عقد الخدمة.pdf', size: '2.4 MB', type: 'pdf', uploaded: 'منذ 3 أيام', uploaded_by: 'أحمد' },
                      { id: 2, name: 'الهوية الوطنية.jpg', size: '1.2 MB', type: 'image', uploaded: 'منذ أسبوع', uploaded_by: 'العميل' },
                      { id: 3, name: 'عرض السعر.docx', size: '3.8 MB', type: 'document', uploaded: 'منذ شهر', uploaded_by: 'سارة' },
                    ].map((file) => (
                      <div key={file.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            file.type === 'pdf' ? 'bg-red-100 text-red-600' :
                            file.type === 'image' ? 'bg-green-100 text-green-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <span className="text-xl">
                              {file.type === 'pdf' ? '📄' : file.type === 'image' ? '🖼️' : '📝'}
                            </span>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">⋮</Button>
                        </div>
                        
                        <h4 className="font-bold text-gray-900 mb-1 truncate">{file.name}</h4>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span>📏</span>
                            <span>{file.size}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>⏰</span>
                            <span>{file.uploaded}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>👤</span>
                            <span>{file.uploaded_by}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            👁️ معاينة
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            📥 تحميل
                          </Button>
                        </div>
                      </div>
                    ))}
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

          {/* History Tab - تبويب التاريخ المحسن */}
          <TabsContent value="history">
            <div className="space-y-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <History className="w-5 h-5" />
                    سجل الأحداث
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    📤 تصدير السجل
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { id: 1, event: 'تم إنشاء العميل', date: '2024-01-15', user: 'أحمد محمد', details: 'تم إضافة العميل إلى النظام' },
                      { id: 2, event: 'تم تحديث معلومات الاتصال', date: '2024-03-22', user: 'سارة عبدالله', details: 'تحديث رقم الهاتف والبريد الإلكتروني' },
                      { id: 3, event: 'تمت أول عملية شراء', date: '2024-05-10', user: 'النظام', details: 'شراء خدمة الاستضافة بقيمة 5,000 ريال' },
                    ].map((item) => (
                      <div key={item.id} className="border-r-4 border-blue-500 pr-4 py-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900">{item.event}</h4>
                            <p className="text-sm text-gray-600 mt-1">{item.details}</p>
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">{item.date}</div>
                            <div className="text-xs text-gray-500">{item.user}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {activityLogs.filter(l => l.type === 'status_change').map((log) => (
                      <div key={log.id} className="border-r-4 border-gray-300 pr-4 py-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900">تغيير حالة</h4>
                            <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">{log.timestamp}</div>
                            <div className="text-xs text-gray-500">{log.user || 'النظام'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* إحصائيات التاريخ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>الأحداث</span>
                      <span className="text-lg">📅</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-4xl font-bold text-blue-600 mb-2">245</div>
                      <div className="text-gray-600">حدث مسجل</div>
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
                      <div className="text-4xl font-bold text-green-600 mb-2">324</div>
                      <div className="text-gray-600">يوم</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>آخر تحديث</span>
                      <span className="text-lg">🔄</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-purple-600 mb-2">منذ 2 يوم</div>
                      <div className="text-gray-600">تحديث معلومات</div>
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

                {/* إعدادات الخصوصية والإجراءات */}
                <div className="pt-6 border-t border-gray-200 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">أرشفة العميل</p>
                      <p className="text-sm text-gray-500">نقل العميل للأرشيف</p>
                    </div>
                    <Button variant="outline" size="sm">
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
                  </CardTitle>
                  <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-500 text-white">
                    <Plus className="w-4 h-4 ml-1" />
                    معاملة جديدة
                  </Button>
                </CardHeader>
                <CardContent>
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
                        {mockTransactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">{tx.date}</td>
                            <td className="py-3 px-4">
                              <Badge className={
                                tx.type === 'شراء' ? 'bg-blue-100 text-blue-800' :
                                tx.type === 'دفعة' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {tx.type}
                              </Badge>
                            </td>
                            <td className={`py-3 px-4 font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()} ريال
                            </td>
                            <td className="py-3 px-4">
                              <Badge className="bg-green-100 text-green-800">{tx.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">{tx.invoice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* إحصائيات المدفوعات */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
                  <div className="text-sm mb-2">إجمالي المشتريات</div>
                  <div className="text-3xl font-bold">45,800 ريال</div>
                  <div className="text-sm opacity-90">12 معاملة</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
                  <div className="text-sm mb-2">المدفوعات المستلمة</div>
                  <div className="text-3xl font-bold">38,500 ريال</div>
                  <div className="text-sm opacity-90">8 مدفوعات</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                  <div className="text-sm mb-2">المستحقات</div>
                  <div className="text-3xl font-bold">7,300 ريال</div>
                  <div className="text-sm opacity-90">4 فواتير</div>
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

                      return (
                        <div key={offer.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-bold text-[#01411C] truncate">{title}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                                {price && <span className="font-bold text-[#D4AF37]">{price}</span>}
                                {offer.city && <span>• {offer.city}</span>}
                                {offer.district && <span>• {offer.district}</span>}
                                {date && <span>• {date}</span>}
                              </div>
                            </div>

                            <Badge className={offer.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                              {offer.status === 'pending' ? 'جديد' : (offer.status || 'معلق')}
                            </Badge>
                          </div>

                          {/* أزرار (نشر إعلان) و (PDF) مثل النظام القديم */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="bg-[#01411C] hover:bg-[#065f41]"
                              onClick={() => {
                                // تجهيز بيانات إعادة النشر لنموذج النشر (نفس فكرة TabActionsPanel)
                                const republishData = {
                                  ownerName: offer.ownerName || customer.name,
                                  ownerPhone: offer.ownerPhone || customer.phone,
                                  ownerIdNumber: offer.ownerIdNumber || '',
                                  ownerNationalAddress: offer.ownerNationalAddress || '',
                                  ownerCity: offer.ownerCity || '',
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
                              <Send className="w-4 h-4 ml-1" />
                              نشر إعلان
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#D4AF37] text-[#01411C]"
                              onClick={async () => {
                                try {
                                  const pdfData = {
                                    title: title,
                                    ownerName: offer.ownerName || customer.name,
                                    ownerPhone: offer.ownerPhone || customer.phone,
                                    city: offer.city,
                                    district: offer.district,
                                    propertyType: offer.propertyType,
                                    purpose: offer.purpose,
                                    price: offer.price,
                                    area: offer.area,
                                    description: offer.description,
                                    images: (offer.media || []).filter((m: any) => m.type === 'image').map((m: any) => m.url),
                                  };
                                  await generatePropertyPDF(pdfData as any);
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

                      return (
                        <div key={request.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-bold text-[#01411C] truncate">{title}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                                {city && <Badge variant="outline">{city}</Badge>}
                                {budget && <span className="font-bold text-[#D4AF37]">الميزانية: {budget}</span>}
                                {date && <span>• {date}</span>}
                              </div>
                            </div>
                            <Badge className={request.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                              {request.status === 'pending' ? 'جديد' : (request.status || 'معلق')}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab - تبويب الفواتير */}
          <TabsContent value="invoices">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  🧾 فواتير العميل
                </CardTitle>
                <Button size="sm" className="bg-[#01411C] hover:bg-[#065f41]">
                  <Plus className="w-4 h-4 ml-1" />
                  فاتورة جديدة
                </Button>
              </CardHeader>
              <CardContent>
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
                      {mockInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{invoice.number}</td>
                          <td className="py-3 px-4 font-bold text-[#D4AF37]">{invoice.amount.toLocaleString()} ريال</td>
                          <td className="py-3 px-4 text-sm">{invoice.date}</td>
                          <td className="py-3 px-4 text-sm">{invoice.dueDate}</td>
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
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                👁️
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                📄
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

      {/* مكون إضافة مهمة جديدة */}
      <AddTaskDialog
        isOpen={showAddCRMTask}
        onClose={() => setShowAddCRMTask(false)}
        customerId={customer.id}
        customerName={customer.name}
        onTaskCreated={refreshTasks}
      />
    </div>
  );
}
