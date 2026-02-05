/**
 * EnhancedBrokerCRM.tsx
 * نظام إدارة العملاء (كانبان)
 * Enhanced Broker CRM with Kanban Board - Literal Implementation
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCRMCustomers, type CRMCustomer } from "@/hooks/useCRMCustomers";
import { useCRMCustomTags } from "@/hooks/useCRMCustomTags";
import { usePulsingDot, markAsViewed, isNew, getAllCustomers, type LinkedCustomer } from "@/hooks/usePublishedAdsManager";
import PulsingDot from "@/components/ui/PulsingDot";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowRight,
  Search,
  Filter,
  GripVertical,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  UserPlus,
  Upload,
  Tag,
  SlidersHorizontal,
  X,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Building2,
  MapPin,
  DollarSign,
  User,
  Briefcase,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Download,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Loader2,
  FileUp,
  Share2,
  Copy,
  Users,
  CloudUpload,
  RefreshCw,
  HardDrive,
  Link,
  Settings,
  CheckSquare,
  ArrowRightLeft,
  UserCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import CustomerDetailsPage from "./CustomerDetailsPage";
import ContactsPanel from "./ContactsPanel";
import TasksPanel from "./TasksPanel";
import AssignCustomerPopover from "@/components/team/AssignCustomerPopover";
import AssignColleagueSubMenu from "./AssignColleagueSubMenu";
import { useCallLogs } from "@/hooks/useCallLogs";
import { useCallLogsPermission } from "@/hooks/useCallLogsPermission";
import { useCRMTasks } from "@/hooks/useCRMTasks";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useSharedCustomers } from "@/hooks/useSharedCustomers";
import { clientTypes, interestLevels, reportCategories, ClientType, InterestLevel } from "@/types/offer";
import { getFullUrl } from "@/utils/slugify";
import CallLogsLinkingBanner from "./CallLogsLinkingBanner";
import RecentCallsColumn from "./RecentCallsColumn";

// Types
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
  hasUnreadPublishedAd?: boolean;
  hasUnreadOffer?: boolean;
  isNewCard?: boolean;
  metadata?: Record<string, any>;
}

interface Column {
  id: string;
  title: string;
  customerIds: string[];
}

interface EnhancedBrokerCRMProps {
  onBack: () => void;
  user?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

// Recent Calls (Mock phone records)
interface RecentCall {
  id: string;
  phone: string;
  name?: string;
  time: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration?: string;
}

// Activity Types for tracking recent activities
type ActivityType = 
  | 'call' 
  | 'tab_update' 
  | 'property_published' 
  | 'quote_received' 
  | 'request_received' 
  | 'document_added' 
  | 'task_added' 
  | 'appointment_added' 
  | 'offer_received' 
  | 'offer_published';

interface CustomerActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

// Helper function to get recent activities for a customer
const getCustomerActivities = (customer: Customer): CustomerActivity[] => {
  const activities: CustomerActivity[] = [];
  
  // آخر اتصال (من metadata.lastCall أو lastContact)
  if (customer.metadata?.lastCall) {
    const lastCall = customer.metadata.lastCall as { timestamp: string; type?: string; description?: string };
    const callType = lastCall.type === 'whatsapp' ? 'واتساب' : lastCall.type === 'email' ? 'بريد' : 'اتصال';
    activities.push({
      id: `call-${customer.id}`,
      type: 'call',
      title: callType,
      description: lastCall.description || callType,
      timestamp: new Date(lastCall.timestamp),
      icon: lastCall.type === 'whatsapp' ? '💬' : lastCall.type === 'email' ? '📧' : '📞',
      color: lastCall.type === 'whatsapp' ? 'text-green-600 bg-green-50' : lastCall.type === 'email' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'
    });
  } else if (customer.lastContact) {
    activities.push({
      id: `call-${customer.id}`,
      type: 'call',
      title: 'آخر تواصل',
      description: customer.lastContact,
      timestamp: new Date(customer.lastContact),
      icon: '📞',
      color: 'text-blue-600 bg-blue-50'
    });
  }
  
  // تحديثات التبويبات من metadata
  if (customer.metadata?.lastTabUpdate) {
    activities.push({
      id: `tab-${customer.id}`,
      type: 'tab_update',
      title: 'تحديث في التبويبات',
      description: customer.metadata.lastTabUpdate.tabName || 'تحديث',
      timestamp: new Date(customer.metadata.lastTabUpdate.timestamp),
      icon: '📝',
      color: 'text-purple-600 bg-purple-50'
    });
  }
  
  // نشر إعلان للمالك
  if (customer.metadata?.lastPropertyPublished) {
    activities.push({
      id: `property-${customer.id}`,
      type: 'property_published',
      title: 'نشر إعلان',
      description: customer.metadata.lastPropertyPublished.title || 'عقار جديد',
      timestamp: new Date(customer.metadata.lastPropertyPublished.timestamp),
      icon: '🏠',
      color: 'text-green-600 bg-green-50'
    });
  }
  
  // استلام عرض سعر
  if (customer.metadata?.lastQuoteReceived) {
    activities.push({
      id: `quote-${customer.id}`,
      type: 'quote_received',
      title: 'عرض سعر مستلم',
      description: customer.metadata.lastQuoteReceived.title || 'عرض سعر',
      timestamp: new Date(customer.metadata.lastQuoteReceived.timestamp),
      icon: '💰',
      color: 'text-yellow-600 bg-yellow-50'
    });
  }
  
  // استلام طلب عقار
  if (customer.metadata?.lastRequestReceived) {
    activities.push({
      id: `request-${customer.id}`,
      type: 'request_received',
      title: 'طلب عقار مستلم',
      description: customer.metadata.lastRequestReceived.title || 'طلب عقار',
      timestamp: new Date(customer.metadata.lastRequestReceived.timestamp),
      icon: '📥',
      color: 'text-indigo-600 bg-indigo-50'
    });
  }
  
  // إضافة مستند
  if (customer.metadata?.lastDocumentAdded) {
    activities.push({
      id: `doc-${customer.id}`,
      type: 'document_added',
      title: customer.metadata.lastDocumentAdded.docType === 'receipt' ? 'سند قبض' : 'عرض سعر',
      description: customer.metadata.lastDocumentAdded.title || 'مستند جديد',
      timestamp: new Date(customer.metadata.lastDocumentAdded.timestamp),
      icon: '📄',
      color: 'text-teal-600 bg-teal-50'
    });
  }
  
  // إضافة مهمة
  if (customer.metadata?.lastTaskAdded) {
    activities.push({
      id: `task-${customer.id}`,
      type: 'task_added',
      title: 'مهمة جديدة',
      description: customer.metadata.lastTaskAdded.title || 'مهمة',
      timestamp: new Date(customer.metadata.lastTaskAdded.timestamp),
      icon: '✅',
      color: 'text-orange-600 bg-orange-50'
    });
  }
  
  // إضافة موعد
  if (customer.metadata?.lastAppointmentAdded) {
    activities.push({
      id: `appt-${customer.id}`,
      type: 'appointment_added',
      title: 'موعد جديد',
      description: customer.metadata.lastAppointmentAdded.title || 'موعد',
      timestamp: new Date(customer.metadata.lastAppointmentAdded.timestamp),
      icon: '📅',
      color: 'text-pink-600 bg-pink-50'
    });
  }
  
  // استلام أو نشر عرض
  if (customer.metadata?.lastOfferActivity) {
    activities.push({
      id: `offer-${customer.id}`,
      type: customer.metadata.lastOfferActivity.isPublished ? 'offer_published' : 'offer_received',
      title: customer.metadata.lastOfferActivity.isPublished ? 'عرض منشور' : 'عرض مستلم',
      description: customer.metadata.lastOfferActivity.title || 'عرض',
      timestamp: new Date(customer.metadata.lastOfferActivity.timestamp),
      icon: customer.metadata.lastOfferActivity.isPublished ? '📤' : '📩',
      color: customer.metadata.lastOfferActivity.isPublished ? 'text-emerald-600 bg-emerald-50' : 'text-cyan-600 bg-cyan-50'
    });
  }
  
  // ترتيب الأنشطة حسب التاريخ (الأحدث أولاً) وإرجاع أول 3
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 3);
};

// Helper to format activity timestamp
const formatActivityTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString('ar-SA');
};

const mockRecentCalls: RecentCall[] = [
  { id: 'rc1', phone: '0501234567', name: 'أحمد محمد', time: '10:30', type: 'incoming', duration: '3:45' },
  { id: 'rc2', phone: '0559876543', time: '09:15', type: 'outgoing', duration: '2:10' },
  { id: 'rc3', phone: '0541112233', name: 'محمد علي', time: '08:45', type: 'missed' },
  { id: 'rc4', phone: '0533334444', time: 'أمس', type: 'incoming', duration: '5:20' },
  { id: 'rc5', phone: '0512223344', name: 'عبدالله سعد', time: 'أمس', type: 'outgoing', duration: '1:30' },
];

// Default Columns (6 columns)
const defaultColumns: Column[] = [
  { id: 'leads', title: 'عملاء محتملين', customerIds: [] },
  { id: 'contacted', title: 'تم التواصل', customerIds: [] },
  { id: 'viewing', title: 'معاينة', customerIds: [] },
  { id: 'negotiation', title: 'تفاوض', customerIds: [] },
  { id: 'closed', title: 'صفقة مكتملة', customerIds: [] },
  { id: 'lost', title: 'ضائع', customerIds: [] },
];

// دالة لتحميل الأعمدة المخصصة من localStorage
const getCustomColumns = (): Column[] => {
  try {
    const saved = localStorage.getItem('crm_custom_columns');
    if (saved) {
      const customCols = JSON.parse(saved) as { id: string; title: string; color: string }[];
      return customCols.map(col => ({ id: col.id, title: col.title, customerIds: [] }));
    }
  } catch {
    // ignore
  }
  return [];
};

// Column Colors
const COLUMN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'leads': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  'contacted': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  'viewing': { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
  'negotiation': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  'closed': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  'lost': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
};

// Customer Type Colors - Extended with all types from documentation
const CUSTOMER_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'buyer': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '🛒' },
  'seller': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '💰' },
  'renter': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '🏠' },
  'owner': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '🔑' },
  'investor': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '📈' },
  'individual': { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', icon: '👤' },
  'corporate': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: '🏢' },
  'vip': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '⭐' },
  'government': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '🏛️' },
  'international': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🌍' },
  'partner': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: '🤝' },
  'other': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '📋' },
};

// Interest Level Colors - Extended with lead and prospect
const INTEREST_LEVEL_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'hot': { bg: 'bg-red-50', border: 'border-l-4 border-l-red-500', text: 'text-red-700', icon: '🔥' },
  'warm': { bg: 'bg-orange-50', border: 'border-l-4 border-l-orange-500', text: 'text-orange-700', icon: '🌡️' },
  'moderate': { bg: 'bg-yellow-50', border: 'border-l-4 border-l-yellow-500', text: 'text-yellow-700', icon: '🌤️' },
  'cold': { bg: 'bg-blue-50', border: 'border-l-4 border-l-blue-500', text: 'text-blue-700', icon: '❄️' },
  'lead': { bg: 'bg-green-50', border: 'border-l-4 border-l-green-500', text: 'text-green-700', icon: '👑' },
  'prospect': { bg: 'bg-violet-50', border: 'border-l-4 border-l-violet-500', text: 'text-violet-700', icon: '🔍' },
};

// Customer Statuses
const CUSTOMER_STATUS_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'active': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '✅' },
  'inactive': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '⏸️' },
  'pending': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '⏳' },
  'suspended': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🚫' },
  'archived': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '📁' },
};

// Tag Colors
// Helper to convert hex to rgba for backgrounds
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper to determine if color is light or dark for text contrast
const isLightColor = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// ✅ تم إزالة البيانات الوهمية - يتم جلب العملاء من قاعدة البيانات الحقيقية
const mockCustomers: Customer[] = [];

export default function EnhancedBrokerCRM({ onBack, user }: EnhancedBrokerCRMProps) {
  // Reference for scrolling to right
  const kanbanContainerRef = useRef<HTMLDivElement>(null);
  
  // Feature Flags for visibility control
  const { flags: featureFlags } = useFeatureFlags();
  
  // Use the new CRM hook with real database
  const { 
    customers: dbCustomers, 
    loading: crmLoading, 
    createCustomer: dbAddCustomer,
    updateCustomer: dbUpdateCustomer,
    deleteCustomer: dbDeleteCustomer,
    logActivity: logCustomerActivity
  } = useCRMCustomers();

  // Team Management for colleague assignment
  const { members: teamMembers } = useTeamManagement();
  const { assignCustomerToMember } = useSharedCustomers(user?.id);

  // Map CRM customers to local Customer type
  const mapCRMToCustomer = useCallback((c: CRMCustomer): Customer => {
    const columnMap: Record<string, string> = {
      'new': 'leads',
      'جديد': 'leads',
      'active': 'contacted',
      'نشط': 'contacted',
      'viewing': 'viewing',
      'معاينة': 'viewing',
      'negotiation': 'negotiation',
      'تفاوض': 'negotiation',
      'closed': 'closed',
      'مغلق': 'closed',
      'lost': 'lost',
      'ضائع': 'lost'
    };

    const metadataObj = (c.metadata && typeof c.metadata === 'object' && !Array.isArray(c.metadata))
      ? (c.metadata as Record<string, any>)
      : {};

    // ✅ دعم الأعمدة المخصصة: نقرأ columnId من metadata إن وجد (مع fallback على status)
    const metaColumnId = typeof metadataObj.columnId === 'string' ? metadataObj.columnId : undefined;
    const fallbackColumnId = columnMap[c.status || 'active'] || 'leads';
    const columnId = metaColumnId || fallbackColumnId;

    const metaClientType = metadataObj.clientType as string | undefined;
    const metaInterestLevel = metadataObj.interestLevel as string | undefined;

    const normalizedClientType = (metaClientType && metaClientType in clientTypes)
      ? (metaClientType as Customer['type'])
      : (undefined);

    const normalizedInterestLevel = (metaInterestLevel && metaInterestLevel in interestLevels)
      ? (metaInterestLevel as Customer['interestLevel'])
      : (undefined);

    return {
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      email: c.email || undefined,
      whatsapp: c.whatsapp || c.phone || undefined,
      company: c.company || undefined,

      // ✅ نستخدم metadata لحفظ نوع العميل/درجة الاهتمام لكل بطاقة (بدلاً من الحقول العامة)
      type: normalizedClientType || 'other',
      interestLevel: normalizedInterestLevel || undefined,

      status: c.status || 'active',
      columnId,
      budget: c.budget || undefined,
      location: c.location || undefined,
      notes: c.notes || undefined,
      source: c.source || undefined,
      tags: c.tags || [],
      createdAt: c.created_at || new Date().toISOString(),
      lastContact: c.last_contact || undefined,
      nextFollowUp: c.next_follow_up || undefined,

      // ✅ نقل بيانات metadata للنقطة النابضة
      hasUnreadOffer: !!metadataObj.hasUnreadOffer,
      isNewCard: !!metadataObj.isNewCard,
      metadata: metadataObj,
    };
  }, []);

  const mapLinkedToCustomer = useCallback((c: LinkedCustomer): Customer => {
    // ملاحظة: الـ Kanban يستخدم أعمدة مختلفة عن hook (new/...). نُحوّلها لأقرب قيمة.
    const columnId = c.columnId === 'new' ? 'leads' : (c.columnId as any) || 'leads';
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      whatsapp: c.phone,
      type: c.type === 'seller' ? 'owner' : (c.type as any),
      status: c.status || 'active',
      columnId,
      createdAt: c.createdAt,
      lastContact: c.lastContact,
      notes: c.nationalAddress || undefined,
    };
  }, []);

  // Use database customers if available, otherwise fallback to mock
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  
  // Sync with database customers
  useEffect(() => {
    if (dbCustomers.length > 0) {
      setCustomers(dbCustomers.map(mapCRMToCustomer));
    } else if (!crmLoading) {
      // ✅ حالة "أول استخدام" - لا بيانات وهمية
      setCustomers([]);
    }
  }, [dbCustomers, crmLoading, mapCRMToCustomer, mapLinkedToCustomer]);

  const [columns, setColumns] = useState<Column[]>(() => {
    // دمج الأعمدة الافتراضية مع الأعمدة المخصصة
    const customCols = getCustomColumns();
    const allDefaultCols = [...defaultColumns, ...customCols];
    
    // Try to load saved column order from localStorage
    const savedOrder = localStorage.getItem('crm_column_order');
    const baseColumns = (() => {
      if (savedOrder) {
        try {
          const orderIds = JSON.parse(savedOrder) as string[];
          const reorderedColumns = orderIds
            .map(id => allDefaultCols.find(col => col.id === id))
            .filter(Boolean) as Column[];
          allDefaultCols.forEach(col => {
            if (!reorderedColumns.find(c => c.id === col.id)) reorderedColumns.push(col);
          });
          return reorderedColumns;
        } catch {
          return allDefaultCols;
        }
      }
      return allDefaultCols;
    })();
    return baseColumns;
  });
  
  // الاستماع لتغييرات الأعمدة المخصصة من لوحة تحكم المالك
  useEffect(() => {
    const handleColumnsChanged = () => {
      const customCols = getCustomColumns();
      const allCols = [...defaultColumns, ...customCols];
      
      setColumns(prev => {
        // الحفاظ على الترتيب الحالي وإضافة الأعمدة الجديدة
        const existingIds = prev.map(c => c.id);
        const newCols = allCols.filter(c => !existingIds.includes(c.id));
        // إزالة الأعمدة المحذوفة (الأعمدة المخصصة فقط)
        const validIds = allCols.map(c => c.id);
        const filteredPrev = prev.filter(c => validIds.includes(c.id));
        // تحديث أسماء الأعمدة المعدلة
        const updatedPrev = filteredPrev.map(col => {
          const updated = allCols.find(c => c.id === col.id);
          return updated ? { ...col, title: updated.title } : col;
        });
        return [...updatedPrev, ...newCols];
      });
    };
    
    window.addEventListener('crmColumnsChanged', handleColumnsChanged);
    return () => window.removeEventListener('crmColumnsChanged', handleColumnsChanged);
  }, []);
  
  // Sync columns with customers
  useEffect(() => {
    setColumns(prev => prev.map(col => ({
      ...col,
      customerIds: customers.filter(c => c.columnId === col.id).map(c => c.id),
    })));
  }, [customers]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('kanban');
  const [activeFilterTab, setActiveFilterTab] = useState('all');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [tagSelectCustomer, setTagSelectCustomer] = useState<Customer | null>(null); // العميل المراد إضافة تاق له
  const [showColorsManager, setShowColorsManager] = useState(false);
  const [unreadCustomers, setUnreadCustomers] = useState<string[]>(['1', '3']);
  const [draggedCustomer, setDraggedCustomer] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ columnId: string; position: number } | null>(null);
  const [columnDropIndicator, setColumnDropIndicator] = useState<number | null>(null);
  
  // Touch drag state for mobile
  const [touchDragCustomer, setTouchDragCustomer] = useState<string | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [touchCurrentPos, setTouchCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const touchDragRef = useRef<HTMLDivElement | null>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);
  const [showDragHint, setShowDragHint] = useState(false);
  const [dragHintDismissed, setDragHintDismissed] = useState(() => {
    return localStorage.getItem('crm_drag_hint_dismissed') === 'true';
  });
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);
  const [showImportCallLogs, setShowImportCallLogs] = useState(false);
  const [showAddCallLog, setShowAddCallLog] = useState(false);
  const [newCallLog, setNewCallLog] = useState({ phone: '', name: '', type: 'incoming' as const });
  
  // ✅ وضع التحديد المتعدد للحذف/النقل
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  
  // ✅ تنبيه الرقم المكرر
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ existingCustomer: Customer; newName: string; phone: string } | null>(null);
  const callLogFileInputRef = useRef<HTMLInputElement>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportCustomer, setReportCustomer] = useState<Customer | null>(null);
  const [selectedReportCategory, setSelectedReportCategory] = useState<string>('');
  const [selectedReportSubCategory, setSelectedReportSubCategory] = useState<string>('');
  const [searchType, setSearchType] = useState<'name' | 'tag'>('name');
  const [searchTab, setSearchTab] = useState<'all' | 'offers' | 'requests'>('all');
  // تم استبدال showColleagueDialog و colleagueCustomer بـ AssignCustomerPopover المتكامل
  const [showContactsPanel, setShowContactsPanel] = useState(false);
  const [showTasksPanel, setShowTasksPanel] = useState(false);
  
  // إدارة الأعمدة المخصصة
  const [showColumnsManager, setShowColumnsManager] = useState(false);
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState('');
  
  // تحميل الأعمدة المخصصة
  const [customColumnsData, setCustomColumnsData] = useState<{ id: string; title: string; color: string }[]>(() => {
    try {
      const saved = localStorage.getItem('crm_custom_columns');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // إضافة عمود جديد
  const handleAddNewColumn = () => {
    if (!newColumnTitle.trim()) {
      toast.error('يرجى إدخال اسم العمود');
      return;
    }
    
    const newColumn = {
      id: `custom_${Date.now()}`,
      title: newColumnTitle.trim(),
      color: '#6366f1',
    };
    
    const updatedData = [...customColumnsData, newColumn];
    setCustomColumnsData(updatedData);
    localStorage.setItem('crm_custom_columns', JSON.stringify(updatedData));
    
    // إضافة العمود للكانبان
    setColumns(prev => [...prev, { id: newColumn.id, title: newColumn.title, customerIds: [] }]);
    
    setNewColumnTitle('');
    setShowAddColumnDialog(false);
    toast.success('تم إضافة العمود بنجاح');
  };
  
  // تعديل اسم عمود
  const handleEditColumnName = (columnId: string) => {
    if (!editColumnTitle.trim()) {
      toast.error('يرجى إدخال اسم العمود');
      return;
    }
    
    // تحديث الأعمدة المخصصة
    const updatedData = customColumnsData.map(col => 
      col.id === columnId ? { ...col, title: editColumnTitle.trim() } : col
    );
    setCustomColumnsData(updatedData);
    localStorage.setItem('crm_custom_columns', JSON.stringify(updatedData));
    
    // تحديث الأعمدة في الكانبان
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, title: editColumnTitle.trim() } : col
    ));
    
    setEditingColumnId(null);
    setEditColumnTitle('');
    toast.success('تم تعديل اسم العمود');
  };
  
  // حذف عمود مخصص
  const handleDeleteCustomColumn = (columnId: string) => {
    const updatedData = customColumnsData.filter(col => col.id !== columnId);
    setCustomColumnsData(updatedData);
    localStorage.setItem('crm_custom_columns', JSON.stringify(updatedData));
    
    // إزالة من الكانبان
    setColumns(prev => prev.filter(col => col.id !== columnId));
    
    toast.success('تم حذف العمود');
  };
  
  // التحقق إذا كان العمود مخصص
  const isCustomColumn = (columnId: string) => columnId.startsWith('custom_');
  
  // إظهار/إخفاء قسم الاتصالات الأخيرة (من إعدادات لوحة تحكم المالك)
  const [recentCallsVisible, setRecentCallsVisible] = useState(() => {
    return localStorage.getItem('recent_calls_visible') !== 'false';
  });
  
  // الاستماع لتغييرات إعدادات CRM
  useEffect(() => {
    const handleCRMSettingsChanged = () => {
      setRecentCallsVisible(localStorage.getItem('recent_calls_visible') !== 'false');
    };
    window.addEventListener('crmSettingsChanged', handleCRMSettingsChanged);
    return () => window.removeEventListener('crmSettingsChanged', handleCRMSettingsChanged);
  }, []);
  
  // استخدام hook المهام
  const { 
    tasks: crmTasks, 
    isLoading: tasksLoading, 
    toggleComplete: toggleTaskComplete,
    updateTask: updateCRMTask,
    deleteTask: deleteCRMTask,
  } = useCRMTasks();
  
  // تم استبدال الزملاء الوهميين بـ AssignCustomerToMemberDialog الذي يجلب الزملاء من قاعدة البيانات
  
  // استخدام hook سجل المكالمات
  const { 
    callLogs: recentCalls, 
    isLoading: callLogsLoading, 
    addCallLog, 
    importFromCSV, 
    exportToCSV,
    addSampleData,
    clearAllLogs 
  } = useCallLogs();
  
  // ✅ نظام ربط الاتصالات الجديد (متوافق مع سياسات المتاجر)
  const {
    isNativePlatform,
    isAndroid,
    isIOS,
    isLinkingEnabled,
    callLogs: nativeCallLogs,
    isLoading: permissionLoading,
    error: permissionError,
    requestPermissions,
    fetchCallLogs: refreshNativeCallLogs,
    disableLinking,
    matchCallWithCustomer,
  } = useCallLogsPermission();
  
  // حالة إخفاء البانر مؤقتاً
  const [linkingBannerDismissed, setLinkingBannerDismissed] = useState(() => {
    return localStorage.getItem('call_logs_banner_dismissed') === 'true';
  });
  
  // دالة تفعيل الربط
  const handleEnableLinking = async () => {
    const success = await requestPermissions();
    if (success) {
      setLinkingBannerDismissed(true);
      localStorage.setItem('call_logs_banner_dismissed', 'true');
    }
  };
  
  // دالة إخفاء البانر
  const handleDismissBanner = () => {
    setLinkingBannerDismissed(true);
    localStorage.setItem('call_logs_banner_dismissed', 'true');
  };
  
  // التعامل مع الضغط على بطاقة اتصال
  const handleCallCardClick = (callLog: any, matchedCustomer: any) => {
    if (matchedCustomer) {
      const customer = customers.find(c => c.id === matchedCustomer.id);
      if (customer) {
        setSelectedCustomer(customer);
        setShowFullDetails(true);
      }
    } else {
      // اقتراح إنشاء عميل جديد
      setNewCustomer(prev => ({ ...prev, name: callLog.name || '', phone: callLog.phone }));
      setShowAddCustomer(true);
    }
  };
  
  // إنشاء عميل جديد من مكالمة
  const handleCreateCustomerFromCall = (phone: string, name?: string) => {
    setNewCustomer(prev => ({ ...prev, name: name || '', phone }));
    setShowAddCustomer(true);
  };
  
  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  
  // Scroll to right (RTL start) when loaded
  useEffect(() => {
    if (!isLoading && kanbanContainerRef.current) {
      // Scroll to the far right for RTL
      kanbanContainerRef.current.scrollLeft = kanbanContainerRef.current.scrollWidth;
    }
  }, [isLoading]);
  
  // Save column order to localStorage whenever it changes
  useEffect(() => {
    const orderIds = columns.map(col => col.id);
    localStorage.setItem('crm_column_order', JSON.stringify(orderIds));
  }, [columns]);
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);
  
  // Filter State
  const [filters, setFilters] = useState({
    type: '',
    interestLevel: '',
    budgetMin: '',
    budgetMax: '',
    source: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // Tags Manager - from database
  const { 
    customTags, 
    isLoading: tagsLoading, 
    addTag: dbAddTag, 
    deleteTag: dbDeleteTag 
  } = useCRMCustomTags();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#01411C');
  
  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  
  // Available tag colors
  const TAG_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#ec4899', '#f43f5e'
  ];
  
  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    type: 'buyer',
    interestLevel: 'moderate',
    propertyType: '',
    budget: '',
    location: '',
    notes: '',
    tags: [] as string[],
  });

  // Function to get tag color from customTags or fallback
  const getTagColor = (tagName: string) => {
    const customTag = customTags.find(t => t.name === tagName);
    if (customTag) {
      // Use the custom color
      const baseColor = customTag.color;
      return {
        bg: hexToRgba(baseColor, 0.15),
        text: baseColor,
        border: hexToRgba(baseColor, 0.4),
      };
    }
    // Fallback colors for tags not in customTags
    const fallbackColors = [
      { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
      { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
      { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
      { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' },
      { bg: '#f3e8ff', text: '#9333ea', border: '#e9d5ff' },
      { bg: '#fce7f3', text: '#db2777', border: '#fbcfe8' },
    ];
    const index = tagName.charCodeAt(0) % fallbackColors.length;
    return fallbackColors[index];
  };

  // Handle CSV file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast.error('يرجى اختيار ملف CSV');
      return;
    }
    
    setImportFile(file);
    
    // Parse CSV preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(0, 6); // First 5 rows + header
      const preview = lines.map(line => line.split(','));
      setImportPreview(preview);
    };
    reader.readAsText(file);
  };

  // Handle import submit
  const handleImportSubmit = () => {
    if (!importFile) {
      toast.error('يرجى اختيار ملف أولاً');
      return;
    }
    
    setIsImporting(true);
    
    // Simulate import
    setTimeout(() => {
      setIsImporting(false);
      setShowImport(false);
      setImportFile(null);
      setImportPreview([]);
      toast.success('تم استيراد العملاء بنجاح');
    }, 1500);
  };

  // Filtered customers with advanced filters + tab filter
  const filteredCustomers = customers.filter(customer => {
    // Tab filter (الكل، نشط، محتمل، VIP، أرشيف)
    if (activeFilterTab === 'active' && customer.columnId === 'lost') return false;
    if (activeFilterTab === 'potential' && customer.interestLevel !== 'warm' && customer.interestLevel !== 'moderate') return false;
    if (activeFilterTab === 'vip' && !customer.tags?.includes('VIP')) return false;
    if (activeFilterTab === 'archived' && customer.columnId !== 'lost') return false;
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.company?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filters.type && customer.type !== filters.type) return false;
    
    // Interest level filter
    if (filters.interestLevel && customer.interestLevel !== filters.interestLevel) return false;
    
    // Source filter
    if (filters.source && customer.source !== filters.source) return false;
    
    // Date range filter
    if (filters.dateFrom && customer.createdAt < filters.dateFrom) return false;
    if (filters.dateTo && customer.createdAt > filters.dateTo) return false;
    
    return true;
  });

  // حساب الإحصائيات للتبويبات
  const tabCounts = {
    all: customers.length,
    active: customers.filter(c => c.columnId !== 'lost').length,
    potential: customers.filter(c => c.interestLevel === 'warm' || c.interestLevel === 'moderate').length,
    vip: customers.filter(c => c.tags?.includes('VIP')).length,
    archived: customers.filter(c => c.columnId === 'lost').length,
  };

  // Toggle card expansion
  const toggleCardExpansion = (customerId: string) => {
    setExpandedCardId(expandedCardId === customerId ? null : customerId);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: '',
      interestLevel: '',
      budgetMin: '',
      budgetMax: '',
      source: '',
      dateFrom: '',
      dateTo: '',
    });
    setSearchQuery('');
  };

  // Add new tag
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    const result = await dbAddTag(newTagName.trim(), newTagColor);
    if (result) {
      setNewTagName('');
    }
  };

  // Delete tag
  const handleDeleteTag = async (tagId: string) => {
    await dbDeleteTag(tagId);
  };

  // Export customers to CSV
  const handleExportCSV = () => {
    const headers = ['الاسم', 'الجوال', 'البريد', 'الشركة', 'النوع', 'الميزانية', 'الموقع'];
    const rows = customers.map(c => [
      c.name, c.phone, c.email || '', c.company || '', c.type || '', c.budget || '', c.location || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير العملاء بنجاح');
  };

  // Handle customer update from details page
  const handleCustomerUpdate = async (updatedCustomer: Customer) => {
    // تحديث فوري للواجهة (Optimistic)
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    setSelectedCustomer(updatedCustomer);

    // حفظ حقيقي في قاعدة البيانات لضمان عدم رجوع القيم القديمة
    try {
      const currentMeta = (updatedCustomer.metadata && typeof updatedCustomer.metadata === 'object' && !Array.isArray(updatedCustomer.metadata))
        ? (updatedCustomer.metadata as Record<string, any>)
        : {};

      const metadataToSave = {
        ...currentMeta,
        clientType: updatedCustomer.type,
        interestLevel: updatedCustomer.interestLevel,
      };

      await dbUpdateCustomer(updatedCustomer.id, {
        name: updatedCustomer.name,
        phone: updatedCustomer.phone || null,
        whatsapp: updatedCustomer.whatsapp || null,
        email: updatedCustomer.email || null,
        company: updatedCustomer.company || null,
        status: updatedCustomer.status || 'active',
        budget: updatedCustomer.budget || null,
        location: updatedCustomer.location || null,
        notes: updatedCustomer.notes || null,
        source: updatedCustomer.source || null,
        tags: updatedCustomer.tags || [],
        next_follow_up: updatedCustomer.nextFollowUp || null,
        metadata: metadataToSave,
      });
    } catch (e) {
      console.error('[CRM] Failed to persist customer update:', e);
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  // ✅ دالة أرشفة العميل (للأسماء غير المكررة)
  const archiveCustomer = async (customer: Customer) => {
    try {
      await dbUpdateCustomer(customer.id, { status: 'archived' });
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      setColumns(prev => prev.map(col => ({
        ...col,
        customerIds: col.customerIds.filter(id => id !== customer.id)
      })));
      toast.success('تم أرشفة العميل - يمكنك استعادته من الأرشيف');
    } catch (error) {
      console.error('[CRM] Archive error:', error);
      toast.error('فشل في أرشفة العميل');
    }
  };

  // ✅ التحقق من التكرار بالرقم
  const checkDuplicateByPhone = (phone: string, excludeId?: string): Customer | undefined => {
    const normalizedPhone = phone.replace(/\D/g, '');
    return customers.find(c => {
      if (excludeId && c.id === excludeId) return false;
      const cPhone = (c.phone || '').replace(/\D/g, '');
      const cWhatsapp = (c.whatsapp || '').replace(/\D/g, '');
      return cPhone === normalizedPhone || cWhatsapp === normalizedPhone;
    });
  };

  // ✅ تبديل تحديد عميل
  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomerIds);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomerIds(newSelection);
  };

  // ✅ تحديد/إلغاء تحديد الكل في العمود
  const toggleSelectAllInColumn = (columnId: string) => {
    const columnCustomerIds = customers.filter(c => c.columnId === columnId).map(c => c.id);
    const allSelected = columnCustomerIds.every(id => selectedCustomerIds.has(id));
    const newSelection = new Set(selectedCustomerIds);
    
    if (allSelected) {
      columnCustomerIds.forEach(id => newSelection.delete(id));
    } else {
      columnCustomerIds.forEach(id => newSelection.add(id));
    }
    setSelectedCustomerIds(newSelection);
  };

  // ✅ حذف/أرشفة متعدد
  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedCustomerIds);
    let archivedCount = 0;
    let deletedCount = 0;
    
    for (const id of selectedIds) {
      const customer = customers.find(c => c.id === id);
      if (!customer) continue;
      
      // التحقق من التكرار - إذا مكرر نحذف نهائياً
      const duplicate = checkDuplicateByPhone(customer.phone, customer.id);
      if (duplicate) {
        await dbDeleteCustomer(id);
        deletedCount++;
      } else {
        // غير مكرر - أرشفة
        await dbUpdateCustomer(id, { status: 'archived' });
        archivedCount++;
      }
    }
    
    setCustomers(prev => prev.filter(c => !selectedCustomerIds.has(c.id)));
    setColumns(prev => prev.map(col => ({
      ...col,
      customerIds: col.customerIds.filter(id => !selectedCustomerIds.has(id))
    })));
    
    setSelectedCustomerIds(new Set());
    setIsSelectionMode(false);
    
    if (archivedCount > 0 && deletedCount > 0) {
      toast.success(`تم أرشفة ${archivedCount} وحذف ${deletedCount} مكرر نهائياً`);
    } else if (archivedCount > 0) {
      toast.success(`تم أرشفة ${archivedCount} عميل`);
    } else {
      toast.success(`تم حذف ${deletedCount} مكرر نهائياً`);
    }
  };

  // ✅ نقل متعدد إلى عمود
  const handleBulkMove = async (targetColumnId: string) => {
    const selectedIds = Array.from(selectedCustomerIds);
    const statusMap: Record<string, string> = {
      'leads': 'new',
      'contacted': 'active',
      'viewing': 'viewing',
      'negotiation': 'negotiation',
      'closed': 'closed',
      'lost': 'lost'
    };
    
    for (const id of selectedIds) {
      const customer = customers.find(c => c.id === id);
      if (!customer) continue;
      
      const currentMeta = (customer.metadata && typeof customer.metadata === 'object' && !Array.isArray(customer.metadata))
        ? (customer.metadata as Record<string, any>)
        : {};
      
      await dbUpdateCustomer(id, {
        status: statusMap[targetColumnId] || targetColumnId,
        metadata: { ...currentMeta, columnId: targetColumnId }
      });
    }
    
    setCustomers(prev => prev.map(c => 
      selectedCustomerIds.has(c.id) 
        ? { ...c, columnId: targetColumnId, status: statusMap[targetColumnId] || targetColumnId }
        : c
    ));
    
    setSelectedCustomerIds(new Set());
    setIsSelectionMode(false);
    
    const targetColumn = columns.find(c => c.id === targetColumnId);
    toast.success(`تم نقل ${selectedIds.length} عميل إلى "${targetColumn?.title}"`);
  };

  // Confirm delete customer - أرشفة أو حذف حسب التكرار
  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      // التحقق من التكرار
      const duplicate = checkDuplicateByPhone(customerToDelete.phone, customerToDelete.id);
      
      if (duplicate) {
        // مكرر - حذف نهائي
        const success = await dbDeleteCustomer(customerToDelete.id);
        if (!success) {
          toast.error('فشل في حذف العميل من قاعدة البيانات');
          return;
        }
        toast.success('تم حذف العميل المكرر نهائياً');
      } else {
        // غير مكرر - أرشفة
        await dbUpdateCustomer(customerToDelete.id, { status: 'archived' });
        toast.success('تم أرشفة العميل - يمكنك استعادته من الأرشيف');
      }
      
      // Remove from customers array
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      
      // Remove from columns
      setColumns(prev => prev.map(col => ({
        ...col,
        customerIds: col.customerIds.filter(id => id !== customerToDelete.id)
      })));
      
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('[CRM] Delete error:', error);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // ✅ معالجة تنبيه التكرار - اختيار الاسم الرئيسي
  const handleDuplicateChoice = async (keepExisting: boolean) => {
    if (!duplicateInfo) return;
    
    if (keepExisting) {
      // إبقاء الموجود - لا نفعل شيء
      toast.info('تم الإبقاء على البطاقة الحالية');
    } else {
      // تحديث الاسم الموجود بالاسم الجديد
      await dbUpdateCustomer(duplicateInfo.existingCustomer.id, { name: duplicateInfo.newName });
      setCustomers(prev => prev.map(c => 
        c.id === duplicateInfo.existingCustomer.id 
          ? { ...c, name: duplicateInfo.newName }
          : c
      ));
      toast.success('تم تحديث اسم البطاقة');
    }
    
    setShowDuplicateAlert(false);
    setDuplicateInfo(null);
  };

  // Check if customer is unread
  const isCustomerUnread = (customerId: string) => unreadCustomers.includes(customerId);

  // Mark customer as read
  const markAsRead = useCallback(async (customerId: string) => {
    setUnreadCustomers(prev => prev.filter(id => id !== customerId));
    // أيضاً إزالة علامة "جديد" من نظام التتبع
    markAsViewed('customer', customerId);
    
    // ✅ تحديث قاعدة البيانات لإزالة hasUnreadOffer و isNewCard
    const customer = dbCustomers.find(c => c.id === customerId);
    if (customer) {
      const currentMeta = (customer.metadata && typeof customer.metadata === 'object' && !Array.isArray(customer.metadata))
        ? (customer.metadata as Record<string, any>)
        : {};
      
      // فقط نحدث إذا كان هناك علامات للإزالة
      if (currentMeta.hasUnreadOffer || currentMeta.isNewCard) {
        await dbUpdateCustomer(customerId, {
          metadata: {
            ...currentMeta,
            hasUnreadOffer: false,
            isNewCard: false,
          },
        });
        
        // تحديث الحالة المحلية
        setCustomers(prev => prev.map(c => 
          c.id === customerId 
            ? { ...c, hasUnreadOffer: false, isNewCard: false }
            : c
        ));
      }
    }
  }, [dbCustomers, dbUpdateCustomer]);

  // Handle opening customer details
  const handleOpenCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
    markAsRead(customer.id);
  };

  // Handle drag start for customer
  const handleDragStart = (customerId: string) => {
    setDraggedCustomer(customerId);
  };

  // Handle column drag start
  const handleColumnDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  // Handle drag over for card positioning with green line indicator
  const handleDragOverCard = (e: React.DragEvent, columnId: string, position: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCustomer) {
      setDropIndicator({ columnId, position });
    }
  };

  // Handle column drag over
  const handleColumnDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    if (draggedColumn) {
      setColumnDropIndicator(position);
    }
  };

  // Handle drop with position
  const handleDrop = (columnId: string, position?: number) => {
    if (!draggedCustomer) return;

     const statusMap: Record<string, string> = {
       leads: 'new',
       contacted: 'active',
       viewing: 'viewing',
       negotiation: 'negotiation',
       closed: 'closed',
       lost: 'lost',
     };

    setColumns(prev => {
      const newColumns = prev.map(col => ({
        ...col,
        customerIds: col.customerIds.filter(id => id !== draggedCustomer)
      }));
      
      const targetColumn = newColumns.find(col => col.id === columnId);
      if (targetColumn) {
        if (position !== undefined && position >= 0) {
          targetColumn.customerIds.splice(position, 0, draggedCustomer);
        } else {
          targetColumn.customerIds.push(draggedCustomer);
        }
      }
      
      return newColumns;
    });

    setCustomers(prev => prev.map(c => 
      c.id === draggedCustomer ? { ...c, columnId } : c
    ));

    // ✅ حفظ النقل في قاعدة البيانات حتى لا يرجع العميل لعموده السابق بعد الخروج والعودة
    try {
      const currentCustomer = customers.find(c => c.id === draggedCustomer);
      const currentMeta = (currentCustomer?.metadata && typeof currentCustomer.metadata === 'object' && !Array.isArray(currentCustomer.metadata))
        ? (currentCustomer.metadata as Record<string, any>)
        : {};

      void dbUpdateCustomer(
        draggedCustomer,
        {
          status: statusMap[columnId] || (currentCustomer?.status || 'active'),
          metadata: {
            ...currentMeta,
            columnId,
          },
        },
        { isStatusChange: true }
      );
    } catch (e) {
      console.error('[CRM] Failed to persist drag drop:', e);
    }

    setDraggedCustomer(null);
    setDropIndicator(null);
    toast.success('تم نقل العميل بنجاح');
  };

  // Handle column drop (reorder columns)
  const handleColumnDrop = (targetPosition: number) => {
    if (!draggedColumn) return;
    
    setColumns(prev => {
      const currentIndex = prev.findIndex(col => col.id === draggedColumn);
      if (currentIndex === -1 || currentIndex === targetPosition) return prev;
      
      const newColumns = [...prev];
      const [movedColumn] = newColumns.splice(currentIndex, 1);
      newColumns.splice(targetPosition, 0, movedColumn);
      return newColumns;
    });
    
    setDraggedColumn(null);
    setColumnDropIndicator(null);
    toast.success('تم نقل العمود بنجاح');
  };

  // Handle drag end - cleanup
  const handleDragEnd = () => {
    setDraggedCustomer(null);
    setDraggedColumn(null);
    setDropIndicator(null);
    setColumnDropIndicator(null);
  };

  // ===================== TOUCH DRAG HANDLERS FOR MOBILE =====================
  
  // Find which column contains a point
  const findColumnAtPoint = useCallback((x: number, y: number): { columnId: string; position: number } | null => {
    const columnElements = document.querySelectorAll('[data-column-id]');
    for (const colEl of Array.from(columnElements)) {
      const rect = colEl.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const columnId = colEl.getAttribute('data-column-id');
        if (!columnId) continue;
        
        // Find position within column
        const cardElements = colEl.querySelectorAll('[data-customer-id]');
        let position = 0;
        for (const cardEl of Array.from(cardElements)) {
          const cardRect = cardEl.getBoundingClientRect();
          const cardMiddle = cardRect.top + cardRect.height / 2;
          if (y > cardMiddle) {
            position++;
          }
        }
        return { columnId, position };
      }
    }
    return null;
  }, []);

  // Touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent, customerId: string) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    isLongPressRef.current = false;
    
    // Start long press timer (700ms) — avoid blocking normal vertical scrolling
    touchTimeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setTouchDragCustomer(customerId);
      setDraggedCustomer(customerId);
      
      // تثبيت الشاشة عند بدء السحب - منع التمرير التلقائي
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      // Vibrate for haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 700);
  }, []);

  // Touch move handler with RTL-aware auto-scroll (horizontal + vertical)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchCurrentPos({ x: touch.clientX, y: touch.clientY });
    
    // Cancel long press quickly if user is clearly scrolling/moving (so scroll works immediately)
    if (touchStartPos && !isLongPressRef.current) {
      const dx = Math.abs(touch.clientX - touchStartPos.x);
      const dy = Math.abs(touch.clientY - touchStartPos.y);
      if (dx > 6 || dy > 6) {
        if (touchTimeoutRef.current) {
          clearTimeout(touchTimeoutRef.current);
          touchTimeoutRef.current = null;
        }
      }
    }
    
    // If we're in drag mode, find drop target
    if (touchDragCustomer && isLongPressRef.current) {
      e.preventDefault();
      const target = findColumnAtPoint(touch.clientX, touch.clientY);
      if (target) {
        setDropIndicator(target);
      }
      
      // Clear existing auto-scroll
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      
      const container = kanbanContainerRef.current;
      const edgeThreshold = 60;
      const scrollSpeed = 8;
      const verticalEdgeThreshold = 50;
      const verticalScrollSpeed = 6;
      
      // Find the column's scrollable area for vertical scrolling
      const columnElement = target ? document.querySelector(`[data-column-id="${target.columnId}"][data-column-scroll]`) : null;
      
      if (container) {
        const containerRect = container.getBoundingClientRect();
        
        // Check for VERTICAL scroll first (within column)
        // المنطق: عند السحب للأسفل (قرب الحافة السفلية) → scroll DOWN لإظهار المزيد من الأسفل
        // عند السحب للأعلى (قرب الحافة العلوية) → scroll UP لإظهار المزيد من الأعلى
        if (columnElement) {
          const columnRect = columnElement.getBoundingClientRect();
          
          if (touch.clientY > columnRect.bottom - verticalEdgeThreshold) {
            // قريب من الحافة السفلية - المستخدم يسحب للأسفل - نريد scroll DOWN لإظهار المزيد
            autoScrollIntervalRef.current = setInterval(() => {
              columnElement.scrollTop += verticalScrollSpeed;

              // تحديث المؤشر الأخضر أثناء التمرير حتى لو الإصبع ثابت
              const pos = lastTouchPosRef.current;
              if (pos) {
                const updatedTarget = findColumnAtPoint(pos.x, pos.y);
                if (updatedTarget) setDropIndicator(updatedTarget);
              }
            }, 16);
            return;
          } else if (touch.clientY < columnRect.top + verticalEdgeThreshold) {
            // قريب من الحافة العلوية - المستخدم يسحب للأعلى - نريد scroll UP لإظهار المزيد
            autoScrollIntervalRef.current = setInterval(() => {
              columnElement.scrollTop -= verticalScrollSpeed;

              // تحديث المؤشر الأخضر أثناء التمرير حتى لو الإصبع ثابت
              const pos = lastTouchPosRef.current;
              if (pos) {
                const updatedTarget = findColumnAtPoint(pos.x, pos.y);
                if (updatedTarget) setDropIndicator(updatedTarget);
              }
            }, 16);
            return;
          }
        }
        
        // HORIZONTAL scrolling for columns (if not doing vertical)
        // RTL: عند الحافة اليمنى نريد التمرير لليمين (scrollLeft يقل)
        // عند الحافة اليسرى نريد التمرير لليسار (scrollLeft يزيد)
        if (touch.clientX > containerRect.right - edgeThreshold) {
          // الحافة اليمنى في RTL - نريد إظهار المزيد من اليمين
          autoScrollIntervalRef.current = setInterval(() => {
            if (kanbanContainerRef.current) {
              kanbanContainerRef.current.scrollLeft -= scrollSpeed;
              
              // تحديث المؤشر الأخضر أثناء التمرير
              const pos = lastTouchPosRef.current;
              if (pos) {
                const updatedTarget = findColumnAtPoint(pos.x, pos.y);
                if (updatedTarget) setDropIndicator(updatedTarget);
              }
            }
          }, 16);
        } else if (touch.clientX < containerRect.left + edgeThreshold) {
          // الحافة اليسرى في RTL - نريد إظهار المزيد من اليسار
          autoScrollIntervalRef.current = setInterval(() => {
            if (kanbanContainerRef.current) {
              kanbanContainerRef.current.scrollLeft += scrollSpeed;
              
              // تحديث المؤشر الأخضر أثناء التمرير
              const pos = lastTouchPosRef.current;
              if (pos) {
                const updatedTarget = findColumnAtPoint(pos.x, pos.y);
                if (updatedTarget) setDropIndicator(updatedTarget);
              }
            }
          }, 16);
        }
      }
    }
  }, [touchStartPos, touchDragCustomer, findColumnAtPoint]);

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    // Clear timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    
    // If we were dragging and have a drop target
    if (touchDragCustomer && dropIndicator) {
      const statusMap: Record<string, string> = {
        leads: 'new',
        contacted: 'active',
        viewing: 'viewing',
        negotiation: 'negotiation',
        closed: 'closed',
        lost: 'lost',
      };

      // Move customer to new column
      setColumns(prev => {
        const newColumns = prev.map(col => ({
          ...col,
          customerIds: col.customerIds.filter(id => id !== touchDragCustomer)
        }));
        
        const targetColumn = newColumns.find(col => col.id === dropIndicator.columnId);
        if (targetColumn) {
          if (dropIndicator.position >= 0) {
            targetColumn.customerIds.splice(dropIndicator.position, 0, touchDragCustomer);
          } else {
            targetColumn.customerIds.push(touchDragCustomer);
          }
        }
        
        return newColumns;
      });

      setCustomers(prev => prev.map(c => 
        c.id === touchDragCustomer ? { ...c, columnId: dropIndicator.columnId } : c
      ));

      // ✅ حفظ النقل في قاعدة البيانات (حتى لا يرجع للعمود السابق)
      try {
        const currentCustomer = customers.find(c => c.id === touchDragCustomer);
        const currentMeta = (currentCustomer?.metadata && typeof currentCustomer.metadata === 'object' && !Array.isArray(currentCustomer.metadata))
          ? (currentCustomer.metadata as Record<string, any>)
          : {};

        void dbUpdateCustomer(
          touchDragCustomer,
          {
            status: statusMap[dropIndicator.columnId] || (currentCustomer?.status || 'active'),
            metadata: {
              ...currentMeta,
              columnId: dropIndicator.columnId,
            },
          },
          { isStatusChange: true }
        );
      } catch (e) {
        console.error('[CRM] Failed to persist touch drop:', e);
      }

      toast.success('تم نقل العميل بنجاح');
    }
    
    // Clear auto-scroll
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    // إعادة تفعيل التمرير بعد انتهاء السحب
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    // Reset touch state
    setTouchDragCustomer(null);
    setDraggedCustomer(null);
    setTouchStartPos(null);
    setTouchCurrentPos(null);
    setDropIndicator(null);
    isLongPressRef.current = false;
  }, [touchDragCustomer, dropIndicator, customers, dbUpdateCustomer]);

  // Show drag hint on first load for mobile users
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && !dragHintDismissed && customers.length > 0) {
      const timer = setTimeout(() => {
        setShowDragHint(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [dragHintDismissed, customers.length]);

  // Dismiss drag hint
  const dismissDragHint = useCallback(() => {
    setShowDragHint(false);
    setDragHintDismissed(true);
    localStorage.setItem('crm_drag_hint_dismissed', 'true');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

  // Handle actions menu
  const handleActionsClick = (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation();
    setShowActionsMenu(showActionsMenu === customerId ? null : customerId);
    setShowShareMenu(null);
  };

  // Handle share menu
  const handleShareClick = (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation();
    setShowShareMenu(showShareMenu === customerId ? null : customerId);
    setShowActionsMenu(null);
  };

  // Share actions - إرسال روابط الصفحات عبر واتساب للعميل
  const getPublicPlatformSlug = () => {
    return localStorage.getItem('public_platform_slug') || 'broker';
  };

  const normalizeWhatsAppPhone = (raw: string) => {
    const digits = (raw || '').replace(/[^0-9]/g, '');
    if (!digits) return '';

    // تحويل أرقام السعودية الشائعة (05xxxxxxxx) إلى 9665xxxxxxxx
    if (digits.startsWith('0')) return `966${digits.slice(1)}`;

    return digits;
  };

  const openWhatsApp = (rawPhone: string, message: string) => {
    const phone = normalizeWhatsAppPhone(rawPhone);
    const text = encodeURIComponent(message);

    if (!phone) {
      toast.error('رقم واتساب غير صالح');
      return;
    }

    // 1) محاولة فتح التطبيق مباشرة (يمنع كثير من حالات تحويل الرابط)
    const appUrl = `whatsapp://send?phone=${phone}&text=${text}`;

    // 2) احتياطي: رابط الويب
    const webUrl = `https://wa.me/${phone}?text=${text}`;

    // بعض المتصفحات تمنع window.open بدون تفاعل مباشر؛ لذلك نستخدم location أولاً ثم احتياطي سريع
    window.location.href = appUrl;
    window.setTimeout(() => {
      window.open(webUrl, '_blank');
    }, 600);
  };

  const handleShareOffer = (customer: Customer) => {
    const offerUrl = getFullUrl(`/public/offer?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}`);
    const message = `مرحباً ${customer.name}،\n\nيسعدنا تقديم عروضنا العقارية لك.\n\nيمكنك الاطلاع على العروض المتاحة من خلال الرابط:\n${offerUrl}\n\nنتطلع لخدمتك 🏠`;
    openWhatsApp(customer.whatsapp || customer.phone, message);
    setShowShareMenu(null);
    toast.success('تم فتح واتساب لإرسال العرض');
  };

  const handleShareRequest = (customer: Customer) => {
    const requestUrl = getFullUrl(`/public/request?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}`);
    const message = `مرحباً ${customer.name}،\n\nنحن هنا لمساعدتك في البحث عن عقارك المثالي.\n\nيمكنك تسجيل طلبك من خلال الرابط:\n${requestUrl}\n\nسنتواصل معك فور توفر ما يناسب احتياجاتك 🔍`;
    openWhatsApp(customer.whatsapp || customer.phone, message);
    setShowShareMenu(null);
    toast.success('تم فتح واتساب لإرسال الطلب');
  };

  const handleShareQuote = (customer: Customer) => {
    const quoteUrl = getFullUrl(`/public/quote?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}`);
    const message = `مرحباً ${customer.name}،\n\nيسرنا تقديم عرض سعر خاص لك.\n\nيمكنك الاطلاع على التفاصيل من خلال الرابط:\n${quoteUrl}\n\nنحن بانتظار ردك 💰`;
    openWhatsApp(customer.whatsapp || customer.phone, message);
    setShowShareMenu(null);
    toast.success('تم فتح واتساب لإرسال عرض السعر');
  };

  const handleShareAppointment = (customer: Customer) => {
    const appointmentUrl = getFullUrl(`/public/appointment?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}`);
    const message = `مرحباً ${customer.name}،\n\nيسعدنا ترتيب موعد لك لمعاينة العقارات المتاحة.\n\nيمكنك حجز موعدك من خلال الرابط:\n${appointmentUrl}\n\nنتطلع للقائك 📅`;
    openWhatsApp(customer.whatsapp || customer.phone, message);
    setShowShareMenu(null);
    toast.success('تم فتح واتساب لإرسال رابط الموعد');
  };

  const handleShareReminderToClient = (customer: Customer) => {
    const slug = getPublicPlatformSlug();
    const reminderUrl = getFullUrl(`/${slug}/appointmentapproval/customer/{appointmentId}`);
    const message = `مرحباً ${customer.name}،\n\nتذكير بموعد المعاينة.\n\nيرجى تأكيد الحضور عبر الرابط التالي (ضع رقم الموعد مكان {appointmentId}):\n${reminderUrl}\n\nشاكرين تعاونك.`;
    openWhatsApp(customer.whatsapp || customer.phone, message);
    setShowShareMenu(null);
    toast.success('تم فتح واتساب لإرسال تذكير للعميل');
  };

  const handleShareApology = (customer: Customer) => {
    const slug = getPublicPlatformSlug();
    const sorryUrl = getFullUrl(`/${slug}/appointmentapproval/sorry`);
    const message = `مرحباً ${customer.name}،\n\nنعتذر عن تعذر الموعد لظرف طارئ.\n\nيمكنك اختيار موعد بديل عبر الرابط:\n${sorryUrl}\n\nنقدر تفهمك.`;
    openWhatsApp(customer.whatsapp || customer.phone, message);
    setShowShareMenu(null);
    toast.success('تم فتح واتساب لإرسال الاعتذار');
  };

  // Handle add customer - مع التحقق من التكرار
  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error('الاسم ورقم الجوال مطلوبان');
      return;
    }

    // ✅ التحقق من التكرار بالرقم
    const existingCustomer = checkDuplicateByPhone(newCustomer.phone);
    if (existingCustomer) {
      // إذا الاسم مختلف - نعرض تنبيه اختيار
      if (existingCustomer.name !== newCustomer.name) {
        setDuplicateInfo({
          existingCustomer,
          newName: newCustomer.name,
          phone: newCustomer.phone,
        });
        setShowDuplicateAlert(true);
        return;
      } else {
        // نفس الاسم والرقم - موجود بالفعل
        toast.error('هذا العميل موجود بالفعل');
        return;
      }
    }

    // ✅ إضافة إلى قاعدة البيانات
    const result = await dbAddCustomer({
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || undefined,
      company: newCustomer.company || undefined,
      status: 'جديد',
      property_type: newCustomer.propertyType || undefined,
      budget: newCustomer.budget || undefined,
      location: newCustomer.location || undefined,
      notes: newCustomer.notes || undefined,
      tags: newCustomer.tags,
      metadata: {
        clientType: newCustomer.type,
        interestLevel: newCustomer.interestLevel,
        columnId: 'leads',
      },
    });

    if (result) {
      // تحديث الواجهة سيحدث تلقائياً عبر Realtime
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        company: '',
        type: 'buyer',
        interestLevel: 'moderate',
        propertyType: '',
        budget: '',
        location: '',
        notes: '',
        tags: [],
      });
      setShowAddCustomer(false);
    }
  };

  // Get customers for column
  const getCustomersForColumn = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return [];
    return column.customerIds
      .map(id => filteredCustomers.find(c => c.id === id))
      .filter(Boolean) as Customer[];
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] border-b-2 border-[#D4AF37] shadow-md">
        <div className="container mx-auto px-4 py-3">
          {/* الهيدر للجوال: اسم الصفحة في سطر واحد + الأزرار أسفله */}
          <div className="flex flex-col gap-2">
            {/* اسم الصفحة في الأعلى */}
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center justify-center gap-2 whitespace-nowrap">
              <User className="w-5 h-5" />
              إدارة العملاء
            </h1>
            
            {/* الأزرار في سطر منفصل */}
            <div className="flex items-center justify-between">
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowRight className="w-3 h-3 ml-1" />
                العودة
              </Button>
              
              <div className="w-16"></div>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ Banner ربط الاتصالات - يظهر فقط إذا لم يتم تفعيل الربط ولم يتم إخفاؤه */}
      {!linkingBannerDismissed && !isLinkingEnabled && (
        <div className="container mx-auto px-4 pt-4">
          <CallLogsLinkingBanner
            isIOS={isIOS}
            isLinkingEnabled={isLinkingEnabled}
            isLoading={permissionLoading}
            onEnableLinking={handleEnableLinking}
            onDismiss={handleDismissBanner}
          />
        </div>
      )}

      {/* Filter Tabs - التبويبات الخمسة */}
      <div className="container mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button

            variant={activeFilterTab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilterTab('all')}
            className={activeFilterTab === 'all' ? 'bg-[#01411C] hover:bg-[#065f41]' : 'border-[#D4AF37]'}
          >
            الكل ({tabCounts.all})
          </Button>
          <Button
            variant={activeFilterTab === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilterTab('active')}
            className={activeFilterTab === 'active' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500 text-green-700'}
          >
            نشط ({tabCounts.active})
          </Button>
          <Button
            variant={activeFilterTab === 'potential' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilterTab('potential')}
            className={activeFilterTab === 'potential' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-500 text-orange-700'}
          >
            محتمل ({tabCounts.potential})
          </Button>
          <Button
            variant={activeFilterTab === 'vip' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilterTab('vip')}
            className={activeFilterTab === 'vip' ? 'bg-[#D4AF37] hover:bg-[#c9a432] text-[#01411C]' : 'border-[#D4AF37] text-[#D4AF37]'}
          >
            ⭐ VIP ({tabCounts.vip})
          </Button>
          <Button
            variant={activeFilterTab === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilterTab('archived')}
            className={activeFilterTab === 'archived' ? 'bg-gray-500 hover:bg-gray-600' : 'border-gray-400 text-gray-600'}
          >
            🗄️ أرشيف ({tabCounts.archived})
          </Button>
        </div>

        {/* Dashboard Stats - إحصائيات مصغرة قابلة للسحب */}
        <div className="mt-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max pb-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-sm whitespace-nowrap">
              <span className="text-sm">👥</span>
              <span className="text-sm font-bold text-gray-900">{customers.length}</span>
              <span className="text-xs text-gray-500">إجمالي</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-green-200 shadow-sm whitespace-nowrap">
              <span className="text-sm">✅</span>
              <span className="text-sm font-bold text-gray-900">{tabCounts.active}</span>
              <span className="text-xs text-gray-500">نشط</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-purple-200 shadow-sm whitespace-nowrap">
              <span className="text-sm">🆕</span>
              <span className="text-sm font-bold text-gray-900">{customers.filter(c => c.columnId === 'leads').length}</span>
              <span className="text-xs text-gray-500">جدد</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-amber-200 shadow-sm whitespace-nowrap">
              <span className="text-sm">💰</span>
              <span className="text-sm font-bold text-gray-900">{customers.filter(c => c.columnId === 'negotiation').length}</span>
              <span className="text-xs text-gray-500">صفقات</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-emerald-200 shadow-sm whitespace-nowrap">
              <span className="text-sm">🎯</span>
              <span className="text-sm font-bold text-gray-900">{customers.filter(c => c.columnId === 'closed').length}</span>
              <span className="text-xs text-gray-500">مغلق</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-red-200 shadow-sm whitespace-nowrap">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-bold text-gray-900">{customers.filter(c => c.interestLevel === 'hot').length}</span>
              <span className="text-xs text-gray-500">ساخن</span>
            </div>
          </div>
        </div>
        
        {/* شريط البحث + المزامنة */}
        <div className="mt-3 bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* البحث */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchType === 'name' ? "ابحث باسم العميل..." : "ابحث بالتاق..."}
                  className="pr-9 h-9 text-sm"
                />
              </div>
              {/* نوع البحث */}
              <Select value={searchType} onValueChange={(v) => setSearchType(v as 'name' | 'tag')}>
                <SelectTrigger className="w-24 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="name">الاسم</SelectItem>
                  <SelectItem value="tag">التاق</SelectItem>
                </SelectContent>
              </Select>
              {/* تبويب العرض/الطلب */}
              <Select value={searchTab} onValueChange={(v) => setSearchTab(v as 'all' | 'offers' | 'requests')}>
                <SelectTrigger className="w-24 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="offers">عروض</SelectItem>
                  <SelectItem value="requests">طلبات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* أزرار المزامنة والحفظ */}
            <div className="flex gap-2">
              {/* مزامنة */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => {
                  toast.success('جاري المزامنة...');
                  setTimeout(() => toast.success('تمت المزامنة بنجاح'), 1500);
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">مزامنة</span>
              </Button>
              
              {/* رفع/استيراد */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">رفع/حفظ</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white z-50">
                  <DropdownMenuItem
                    onClick={() => {
                      const dataStr = JSON.stringify(customers, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `wasata_customers_${new Date().toISOString().split('T')[0]}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                      toast.success('تم حفظ البيانات في الجهاز');
                    }}
                    className="flex items-center gap-2"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>حفظ في الجهاز (JSON)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportCSV}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تصدير Excel/CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      toast.info('سيتم الرفع إلى iCloud');
                    }}
                    className="flex items-center gap-2"
                  >
                    <CloudUpload className="w-4 h-4 text-blue-500" />
                    <span>رفع إلى iCloud</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      toast.info('سيتم الرفع إلى Google Drive');
                    }}
                    className="flex items-center gap-2"
                  >
                    <CloudUpload className="w-4 h-4 text-green-500" />
                    <span>رفع إلى Google Drive</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowImport(true)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>استيراد من ملف</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-2 bg-white border-2 border-[#D4AF37]">
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                كانبان
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                قائمة
              </TabsTrigger>
            </TabsList>
            
            {/* زر إدارة الأعمدة */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnsManager(true)}
              className="flex items-center gap-2 border-[#D4AF37] text-[#01411C] hover:bg-[#01411C]/10"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">إدارة الأعمدة</span>
              <Plus className="w-3 h-3 sm:hidden" />
            </Button>
          </div>

          {/* Kanban View */}
          <TabsContent value="kanban" className="mt-0 relative">
            {/* Mobile Drag Hint Overlay - مع زر إغلاق واضح واختفاء تلقائي */}
            <AnimatePresence>
              {showDragHint && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-2 left-2 right-2 z-40"
                >
                  <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] text-white rounded-xl p-3 shadow-2xl border-2 border-[#D4AF37] relative">
                    {/* زر الإغلاق - أكبر وأوضح */}
                    <button
                      onClick={dismissDragHint}
                      className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg border-2 border-white transition-colors z-10"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                    
                    <div className="flex items-center gap-3 pr-2">
                      <div className="flex-shrink-0 w-10 h-10 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                        <GripVertical className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm mb-1">💡 نقل بطاقات العملاء</h4>
                        <p className="text-[11px] text-white/90 leading-relaxed">
                          اضغط مطولاً على البطاقة ثم اسحبها للعمود المطلوب
                        </p>
                      </div>
                    </div>
                    
                    {/* شريط تقدم للاختفاء التلقائي */}
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 8, ease: 'linear' }}
                      onAnimationComplete={dismissDragHint}
                      className="absolute bottom-0 left-0 h-1 bg-[#D4AF37] rounded-b-xl"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading ? (
              // Loading Skeleton
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="w-72 flex-shrink-0 rounded-xl bg-gray-100 border-2 border-gray-200 animate-pulse">
                      <div className="p-3 border-b-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="h-5 w-24 bg-gray-300 rounded"></div>
                          <div className="h-5 w-8 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                      <div className="p-2 space-y-2 min-h-[400px]">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="bg-white rounded-lg shadow-md p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                              <div className="flex-1 space-y-1">
                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                <div className="h-3 w-16 bg-gray-100 rounded"></div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <div className="h-5 w-12 bg-gray-100 rounded"></div>
                              <div className="h-5 w-12 bg-gray-100 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
            <div 
              ref={kanbanContainerRef}
              className="overflow-x-auto pb-4 scroll-smooth"
              dir="rtl"
            >
              <div className="flex gap-3 md:gap-4 min-w-max px-2">
                {/* ✅ عمود الاتصالات الأخيرة المحسّن - متوافق مع سياسات المتاجر */}
                {recentCallsVisible && isLinkingEnabled && (
                  <RecentCallsColumn
                    callLogs={nativeCallLogs.length > 0 ? nativeCallLogs : recentCalls.map(c => ({
                      id: c.id,
                      phone: c.phone,
                      name: c.name,
                      type: c.type,
                      timestamp: c.date || new Date(),
                      duration: c.duration ? parseInt(c.duration.split(':')[0]) * 60 + parseInt(c.duration.split(':')[1] || '0') : undefined,
                    }))}
                    customers={customers.map(c => ({ id: c.id, name: c.name, phone: c.phone }))}
                    isLoading={permissionLoading || callLogsLoading}
                    error={permissionError}
                    isIOS={isIOS}
                    isLinkingEnabled={isLinkingEnabled}
                    onRefresh={refreshNativeCallLogs}
                    onDisableLinking={disableLinking}
                    onCallCardClick={handleCallCardClick}
                    onCreateCustomer={handleCreateCustomerFromCall}
                    resolveDisplayName={(callLog, custs) => {
                      // 🔴 Matching Logic الإلزامي
                      const matchResult = matchCallWithCustomer(callLog.phone, custs);
                      if (matchResult.isLinkedToCustomer && matchResult.customerName) {
                        return matchResult;
                      }
                      // استخدم اسم الجهاز إن وجد
                      const deviceName = callLog.name || callLog.deviceName;
                      if (deviceName && deviceName.trim()) {
                        return {
                          customerId: null,
                          customerName: null,
                          deviceName: deviceName,
                          finalDisplayName: deviceName,
                          isLinkedToCustomer: false,
                        };
                      }
                      return {
                        customerId: null,
                        customerName: null,
                        deviceName: null,
                        finalDisplayName: 'جهة اتصال غير معروفة',
                        isLinkedToCustomer: false,
                      };
                    }}
                  />
                )}
                
                {/* عمود الاتصالات القديم - يظهر فقط إذا لم يتم تفعيل الربط */}
                {recentCallsVisible && !isLinkingEnabled && (
                <div className="w-56 md:w-64 flex-shrink-0 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 border-2 border-gray-300">
                  <div className="p-2 md:p-3 border-b-2 border-gray-300 bg-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-700 flex items-center gap-1 text-sm">
                        <Phone className="w-4 h-4" />
                        الاتصالات
                      </h3>
                      <Badge className="bg-gray-300 text-gray-700 border border-gray-400 text-xs">
                        {recentCalls.length}
                      </Badge>
                    </div>
                    {/* أزرار الإدارة */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] hover:bg-green-100"
                        onClick={() => setShowAddCallLog(true)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] hover:bg-blue-100"
                        onClick={() => callLogFileInputRef.current?.click()}
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] hover:bg-purple-100"
                        onClick={() => {
                          const csv = exportToCSV();
                          const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `call_logs_${new Date().toISOString().split('T')[0]}.csv`;
                          link.click();
                          toast.success('تم تصدير سجل المكالمات');
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                    {/* مدخل ملف CSV مخفي */}
                    <input
                      ref={callLogFileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const text = event.target?.result as string;
                            const count = importFromCSV(text);
                            toast.success(`تم استيراد ${count} مكالمة`);
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </div>
                  <div className="p-2 space-y-2 min-h-[350px] max-h-[500px] overflow-y-auto">
                    {recentCalls.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Phone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">لا توجد مكالمات</p>
                        <p className="text-[10px] mt-1">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-primary"
                            onClick={handleEnableLinking}
                          >
                            فعّل ربط الاتصالات
                          </Button>
                        </p>
                      </div>
                    ) : (
                    recentCalls.map((call) => (
                      <div
                        key={call.id}
                        className={`bg-white rounded-lg shadow-sm p-3 border-r-4 cursor-pointer hover:shadow-md transition-all ${
                          call.type === 'incoming' ? 'border-r-green-500' :
                          call.type === 'outgoing' ? 'border-r-blue-500' :
                          'border-r-red-500'
                        }`}
                        onClick={() => {
                          const existingCustomer = customers.find(c => c.phone === call.phone);
                          if (existingCustomer) {
                            setSelectedCustomer(existingCustomer);
                            setShowFullDetails(true);
                          } else {
                            setNewCustomer(prev => ({ ...prev, name: call.name || '', phone: call.phone }));
                            setShowAddCustomer(true);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            call.type === 'incoming' ? 'bg-green-100' :
                            call.type === 'outgoing' ? 'bg-blue-100' :
                            'bg-red-100'
                          }`}>
                            <Phone className={`w-4 h-4 ${
                              call.type === 'incoming' ? 'text-green-600' :
                              call.type === 'outgoing' ? 'text-blue-600' :
                              'text-red-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {call.name || call.phone}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span dir="ltr">{call.phone}</span>
                              {call.duration && <span>({call.duration})</span>}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">{call.time}</div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs hover:bg-green-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/${call.phone}`, '_blank');
                            }}
                          >
                            <MessageSquare className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${call.phone}`;
                            }}
                          >
                            <Phone className="w-3 h-3 text-blue-600" />
                          </Button>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                </div>
                )}

                {/* ✅ شريط التحديد المتعدد */}
                {isSelectionMode && (
                  <div className="w-full flex-shrink-0 mb-3 p-3 bg-blue-50 border-2 border-blue-300 rounded-xl">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-blue-800">تم تحديد {selectedCustomerIds.size} عميل</span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* نقل إلى عمود */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                              <ArrowRightLeft className="w-4 h-4 ml-1" />
                              نقل إلى
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-white z-50">
                            {columns.map(col => (
                              <DropdownMenuItem
                                key={col.id}
                                onClick={() => handleBulkMove(col.id)}
                                className="flex items-center gap-2"
                              >
                                <div className={`w-3 h-3 rounded-full ${COLUMN_COLORS[col.id]?.border || 'border-gray-300'}`} />
                                {col.title}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* حذف/أرشفة */}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={handleBulkDelete}
                          disabled={selectedCustomerIds.size === 0}
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف المحدد
                        </Button>
                        
                        {/* إلغاء */}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setIsSelectionMode(false);
                            setSelectedCustomerIds(new Set());
                          }}
                        >
                          <X className="w-4 h-4 ml-1" />
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* خط أخضر مؤشر للإفلات بين الأعمدة */}
                {columnDropIndicator === 0 && (
                  <div className="w-1 bg-green-500 rounded-full animate-pulse self-stretch" />
                )}

                {columns.map((column, columnIndex) => {
                  const colors = COLUMN_COLORS[column.id] || COLUMN_COLORS['leads'];
                  const columnCustomers = getCustomersForColumn(column.id);
                  
                  return (
                    <React.Fragment key={column.id}>
                      <div
                        draggable
                        onDragStart={() => handleColumnDragStart(column.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedColumn) {
                            handleColumnDragOver(e, columnIndex);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedColumn) {
                            handleColumnDrop(columnIndex);
                          } else if (draggedCustomer) {
                            handleDrop(column.id, dropIndicator?.position);
                          }
                        }}
                        className={`w-64 md:w-72 flex-shrink-0 rounded-xl ${colors.bg} ${colors.border} border-2 transition-all ${
                          draggedColumn === column.id ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Column Header */}
                        <div className={`p-2 md:p-3 border-b-2 ${colors.border} cursor-move`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <h3 className={`font-bold ${colors.text}`}>
                                {column.title}
                              </h3>
                            </div>
                            <Badge className={`${colors.bg} ${colors.text} border ${colors.border}`}>
                              {columnCustomers.length}
                            </Badge>
                          </div>
                        </div>

                        {/* Column Content */}
                        <div 
                          className="p-2 space-y-0 min-h-[400px] max-h-[600px] overflow-y-auto"
                          data-column-id={column.id}
                          data-column-scroll="true"
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedCustomer && columnCustomers.length === 0) {
                              setDropIndicator({ columnId: column.id, position: 0 });
                            }
                          }}
                        >
                          {/* خط أخضر أول إذا كان العمود فارغ */}
                          {dropIndicator?.columnId === column.id && dropIndicator.position === 0 && columnCustomers.length === 0 && (
                            <div className="h-1 bg-green-500 rounded-full animate-pulse my-1" />
                          )}
                          
                          <AnimatePresence>
                          {columnCustomers.map((customer, customerIndex) => {
                            const typeColors = CUSTOMER_TYPE_COLORS[customer.type || 'other'];
                            const interestColors = INTEREST_LEVEL_COLORS[customer.interestLevel || 'moderate'];
                            
                            return (
                              <div key={customer.id} className="relative">
                                {/* خط أخضر مؤشر للإفلات قبل البطاقة - absolute لا يدفع البطاقات */}
                                {dropIndicator?.columnId === column.id && dropIndicator.position === customerIndex && (
                                  <div className="absolute -top-1 left-0 right-0 h-1.5 bg-green-500 rounded-full animate-pulse z-50 shadow-lg shadow-green-500/50" />
                                )}
                                
                                <div
                                  data-customer-id={customer.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    handleDragStart(customer.id);
                                  }}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={(e) => handleDragOverCard(e, column.id, customerIndex)}
                                  onDrop={(e) => {
                                    e.stopPropagation();
                                    handleDrop(column.id, customerIndex);
                                  }}
                                  // Touch handlers for mobile drag and drop
                                  onTouchStart={(e) => handleTouchStart(e, customer.id)}
                                  onTouchMove={handleTouchMove}
                                  onTouchEnd={handleTouchEnd}
                                  onContextMenu={(e) => {
                                    // Prevent context menu on long press
                                    if (touchDragCustomer) {
                                      e.preventDefault();
                                    }
                                  }}
                                  className={`
                                    bg-white rounded-lg shadow-md cursor-move mb-2 overflow-hidden relative flex flex-col
                                    hover:shadow-xl transition-shadow duration-200
                                    ${draggedCustomer === customer.id ? 'opacity-50 scale-95' : ''}
                                    ${touchDragCustomer === customer.id ? 'opacity-70 scale-105 shadow-2xl z-50 ring-2 ring-[#D4AF37] touch-none' : ''}
                                    select-none
                                  `}
                                  style={{
                                    // If being dragged on touch, follow finger
                                    ...(touchDragCustomer === customer.id && touchCurrentPos ? {
                                      position: 'fixed',
                                      left: touchCurrentPos.x - 100,
                                      top: touchCurrentPos.y - 50,
                                      width: '200px',
                                      zIndex: 9999,
                                      pointerEvents: 'none',
                                    } : {})
                                  }}
                                >
                                {/* خط نوع العميل في أعلى البطاقة */}
                                <div 
                                  className="h-1.5 w-full flex-shrink-0"
                                  style={{ 
                                    backgroundColor: clientTypes[customer.type as ClientType]?.color || '#9CA3AF'
                                  }}
                                />

                                {/* البطاقة المضغوطة */}
                                  <div 
                                    className="p-3"
                                    onClick={() => {
                                      if (isSelectionMode) {
                                        toggleCustomerSelection(customer.id);
                                      } else {
                                        toggleCardExpansion(customer.id);
                                      }
                                    }}
                                  >
                                    {/* 1. Header: الصورة + الاسم + أيقونة السحب */}
                                    <div className="flex items-center gap-2 mb-2">
                                      {/* ✅ مربع الاختيار في وضع التحديد المتعدد */}
                                      {isSelectionMode && (
                                        <div 
                                          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                                            selectedCustomerIds.has(customer.id) 
                                              ? 'bg-blue-600 border-blue-600' 
                                              : 'border-gray-300 hover:border-blue-400'
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCustomerSelection(customer.id);
                                          }}
                                        >
                                          {selectedCustomerIds.has(customer.id) && (
                                            <Check className="w-3 h-3 text-white" />
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* 1.1 الصورة الشخصية */}
                                      {/* 1.1 الصورة الشخصية */}
                                      <div className="relative">
                                        <Avatar className="w-10 h-10 border-2 border-[#D4AF37]">
                                          {(customer.image || customer.profileImage) && (
                                            <AvatarImage 
                                              src={customer.image || customer.profileImage} 
                                              alt={customer.name} 
                                            />
                                          )}
                                          <AvatarFallback className="bg-gradient-to-br from-[#01411C] to-[#065f41] text-white font-bold">
                                            {customer.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        
                                        {/* 1.2 مؤشر غير مقروء - النقطة الحمراء النابضة */}
                                        {(isCustomerUnread(customer.id) || isNew('customer', customer.id) || customer.hasUnreadOffer || customer.isNewCard) && (
                                          <PulsingDot show={true} size="sm" position="top-right" />
                                        )}
                                      </div>
                                      
                                      {/* 1.3 الاسم والشركة + VIP Badge - مع خلفية هادئة لنوع العميل */}
                                      <div 
                                        className="flex-1 min-w-0 px-2 py-1 rounded-md"
                                        style={{
                                          backgroundColor: clientTypes[customer.type as ClientType]?.bgColor || '#F9FAFB',
                                        }}
                                      >
                                        <div className="flex items-center gap-1">
                                          <h3 
                                            className="font-bold text-[14px] truncate"
                                            style={{
                                              color: clientTypes[customer.type as ClientType]?.color || '#374151',
                                            }}
                                          >
                                            {customer.name}
                                          </h3>
                                          {customer.tags?.includes('VIP') && (
                                            <span className="text-[#D4AF37] text-sm">⭐</span>
                                          )}
                                        </div>
                                        {customer.company && (
                                          <p className="text-xs text-gray-600 truncate">{customer.company}</p>
                                        )}
                                      </div>
                                      
                                      {/* 1.4 ثلاث نقاط + أيقونة التوسيع + السحب */}
                                      <div className="flex items-center gap-1">
                                        {/* زر ثلاث نقاط مع Dropdown */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 hover:bg-gray-100"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48 bg-white z-50">
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedCustomer(customer);
                                                setShowFullDetails(true);
                                                markAsRead(customer.id);
                                              }}
                                              className="flex items-center gap-2"
                                            >
                                              <Eye className="w-4 h-4" />
                                              <span>عرض التفاصيل</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedCustomer(customer);
                                                setShowCustomerDetails(true);
                                              }}
                                              className="flex items-center gap-2"
                                            >
                                              <Edit className="w-4 h-4" />
                                              <span>تعديل</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            
                                            {/* الانتقال إلى - قائمة فرعية بالأعمدة */}
                                            <DropdownMenuSub>
                                              <DropdownMenuSubTrigger className="flex items-center gap-2">
                                                <ArrowRightLeft className="w-4 h-4" />
                                                <span>الانتقال إلى</span>
                                              </DropdownMenuSubTrigger>
                                              <DropdownMenuPortal>
                                                <DropdownMenuSubContent className="bg-white min-w-[140px]">
                                                  {columns.filter(col => col.id !== customer.columnId).map((col) => (
                                                    <DropdownMenuItem
                                                      key={col.id}
                                                      onClick={async (e) => {
                                                        e.stopPropagation();
                                                        // نقل العميل إلى العمود المحدد
                                                        const statusMap: Record<string, string> = {
                                                          'leads': 'new',
                                                          'contacted': 'active',
                                                          'viewing': 'viewing',
                                                          'negotiation': 'negotiation',
                                                          'closed': 'closed',
                                                          'lost': 'lost'
                                                        };
                                                        const currentMeta = (customer.metadata && typeof customer.metadata === 'object' && !Array.isArray(customer.metadata))
                                                          ? (customer.metadata as Record<string, any>)
                                                          : {};
                                                        const nextMeta = { ...currentMeta, columnId: col.id };
                                                        
                                                        setCustomers(prev => prev.map(c =>
                                                          c.id === customer.id
                                                            ? { ...c, columnId: col.id, status: statusMap[col.id] || col.id, metadata: nextMeta }
                                                            : c
                                                        ));
                                                        
                                                        await dbUpdateCustomer(customer.id, {
                                                          status: statusMap[col.id] || col.id,
                                                          metadata: nextMeta
                                                        }, { isStatusChange: true });
                                                        
                                                        toast.success(`تم نقل "${customer.name}" إلى "${col.title}"`);
                                                      }}
                                                      className="flex items-center gap-2"
                                                    >
                                                      <span>{col.title}</span>
                                                    </DropdownMenuItem>
                                                  ))}
                                                </DropdownMenuSubContent>
                                              </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            
                                            {/* معين لـ: - قائمة فرعية بالزملاء */}
                                            {featureFlags.business_card_add_colleague_enabled && (
                                              <AssignColleagueSubMenu
                                                customerId={customer.id}
                                                customerName={customer.name}
                                                onSuccess={(assigned) => {
                                                  const currentMeta = (customer.metadata && typeof customer.metadata === 'object' && !Array.isArray(customer.metadata))
                                                    ? (customer.metadata as Record<string, any>)
                                                    : {};
                                                  const nextMeta = {
                                                    ...currentMeta,
                                                    assignedColleagueUserId: assigned.userId,
                                                    assignedColleagueName: assigned.name,
                                                  };
                                                  setCustomers(prev => prev.map(c =>
                                                    c.id === customer.id
                                                      ? { ...c, metadata: nextMeta }
                                                      : c
                                                  ));
                                                  void dbUpdateCustomer(customer.id, { metadata: nextMeta });
                                                }}
                                              />
                                            )}
                                            
                                            <DropdownMenuSeparator />
                                            {/* البلاغات */}
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setReportCustomer(customer);
                                                setShowReportDialog(true);
                                              }}
                                              className="flex items-center gap-2 text-orange-600 focus:text-orange-600"
                                            >
                                              <AlertTriangle className="w-4 h-4" />
                                              <span>بلاغ</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCustomer(customer);
                                              }}
                                              className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                              <span>حذف</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setIsSelectionMode(true);
                                                setSelectedCustomerIds(new Set([customer.id]));
                                              }}
                                              className="flex items-center gap-2 text-blue-600 focus:text-blue-600"
                                            >
                                              <CheckSquare className="w-4 h-4" />
                                              <span>تحديد متعدد</span>
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        
                                        {expandedCardId === customer.id ? (
                                          <ChevronUp className="w-4 h-4 text-[#D4AF37]" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )}
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                      </div>
                                    </div>
                                    
                                    {/* 2. معلومات الاتصال + أزرار اتصال/واتساب */}
                                    <div className="flex items-center justify-between gap-2 text-xs text-gray-700 mb-2">
                                      <div className="flex items-center gap-1 min-w-0">
                                        <Phone className="w-3 h-3" />
                                        <span className="truncate" dir="ltr">{customer.phone}</span>
                                      </div>

                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `tel:${customer.phone}`;
                                          }}
                                          title="اتصال"
                                        >
                                          <Phone className="w-3.5 h-3.5" />
                                        </Button>

                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://wa.me/${customer.whatsapp || customer.phone}`, '_blank');
                                          }}
                                          title="واتساب"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* 3. نوع العميل + درجة الاهتمام (يسار الشاشة) + التاقات (يمين الشاشة) */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      {/* التاقات - يمين الشاشة (لأنها أول عنصر في RTL) */}
                                      <div className="order-1 flex flex-wrap items-start gap-1 justify-end max-w-[160px]" style={{ maxHeight: expandedCardId === customer.id ? '80px' : '44px', overflow: 'hidden' }}>
                                        {/* زر إضافة تاق - يفتح شاشة التاقات مع وضع الاختيار */}
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center h-6 w-6 rounded-full border-2 border-dashed border-amber-400 text-amber-500 hover:bg-amber-50 hover:border-amber-500 transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTagSelectCustomer(customer);
                                            setShowTagsManager(true);
                                          }}
                                          title="إضافة تاق"
                                        >
                                          <Plus className="h-3.5 w-3.5" />
                                        </button>

                                        {(customer.tags || []).slice(0, expandedCardId === customer.id ? 9 : 4).map((tag, idx) => {
                                          const tagColor = getTagColor(tag);
                                          return (
                                            <span
                                              key={`${tag}-${idx}`}
                                              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 border h-5 rounded-md"
                                              style={{
                                                backgroundColor: tagColor.bg,
                                                color: tagColor.text,
                                                borderColor: tagColor.border,
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <span>{tag}</span>
                                              <button
                                                type="button"
                                                className="text-[11px] leading-none opacity-70 hover:opacity-100"
                                                title="حذف التاق"
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  const nextTags = (customer.tags || []).filter((t, i) => !(t === tag && i === idx));
                                                  setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, tags: nextTags } : c));
                                                  await dbUpdateCustomer(customer.id, { tags: nextTags });
                                                }}
                                              >
                                                ×
                                              </button>
                                            </span>
                                          );
                                        })}

                                        {(customer.tags || []).length > (expandedCardId === customer.id ? 9 : 4) && (
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5 border-dashed">
                                            +{(customer.tags || []).length - (expandedCardId === customer.id ? 9 : 4)}
                                          </Badge>
                                        )}
                                      </div>

                                      {/* نوع العميل + درجة الاهتمام - عرض فقط بدون تحكم */}
                                      <div className="order-2 flex flex-col gap-1">
                                        {/* نوع العميل - Badge فقط */}
                                        <div 
                                          className="h-6 text-[10px] px-2 rounded-md flex items-center justify-center min-w-[70px]"
                                          style={{ 
                                            backgroundColor: `${clientTypes[customer.type as ClientType]?.color || '#6B7280'}20`,
                                          }}
                                        >
                                          <span 
                                            className="font-medium"
                                            style={{ color: clientTypes[customer.type as ClientType]?.color || '#6B7280' }}
                                          >
                                            {clientTypes[customer.type as ClientType]?.label || 'غير محدد'}
                                          </span>
                                        </div>

                                        {/* درجة الاهتمام - Badge فقط */}
                                        <div 
                                          className="h-6 text-[10px] px-2 rounded-md flex items-center justify-center min-w-[70px]"
                                          style={{ 
                                            backgroundColor: `${interestLevels[customer.interestLevel as InterestLevel]?.color || '#6B7280'}20`,
                                          }}
                                        >
                                          <span 
                                            className="font-medium"
                                            style={{ color: interestLevels[customer.interestLevel as InterestLevel]?.color || '#6B7280' }}
                                          >
                                            {interestLevels[customer.interestLevel as InterestLevel]?.label || 'غير محدد'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* 4. زر إضافة زميل للمتابعة - قائمة منبثقة */}
                                    {featureFlags.business_card_add_colleague_enabled && (
                                      <AssignCustomerPopover
                                        customerId={customer.id}
                                        customerName={customer.name}
                                        onSuccess={(assigned) => {
                                          // ✅ عرض اسم الزميل مكان الزر + حفظه في metadata
                                          const currentMeta = (customer.metadata && typeof customer.metadata === 'object' && !Array.isArray(customer.metadata))
                                            ? (customer.metadata as Record<string, any>)
                                            : {};

                                          const nextMeta = {
                                            ...currentMeta,
                                            assignedColleagueUserId: assigned.userId,
                                            assignedColleagueName: assigned.name,
                                          };

                                          setCustomers(prev => prev.map(c =>
                                            c.id === customer.id
                                              ? { ...c, metadata: nextMeta }
                                              : c
                                          ));

                                          void dbUpdateCustomer(customer.id, { metadata: nextMeta });
                                        }}
                                      >
                                        {(() => {
                                          const meta = (customer.metadata && typeof customer.metadata === 'object' && !Array.isArray(customer.metadata))
                                            ? (customer.metadata as Record<string, any>)
                                            : {};
                                          const assignedName = typeof meta.assignedColleagueName === 'string' ? meta.assignedColleagueName : '';

                                          if (assignedName) {
                                            return (
                                              <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full py-1 text-[10px] border rounded transition-colors flex items-center justify-center"
                                                style={{
                                                  borderColor: '#D4AF37',
                                                  color: '#01411C',
                                                }}
                                              >
                                                <span className="truncate">{assignedName}</span>
                                              </button>
                                            );
                                          }

                                          return (
                                            <button
                                              onClick={(e) => e.stopPropagation()}
                                              className="w-full py-1 text-[10px] text-blue-600 border border-dashed border-blue-400 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                                            >
                                              <Users className="w-3 h-3" />
                                              إضافة زميل للمتابعة
                                            </button>
                                          );
                                        })()}
                                      </AssignCustomerPopover>
                                    )}
                                  </div>
                                  

                                {/* البطاقة الموسعة - 7 أزرار سريعة + معلومات إضافية */}
                                <AnimatePresence>
                                  {expandedCardId === customer.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="border-t-2 border-[#D4AF37]/30 bg-gradient-to-b from-[#f0fdf4] to-white"
                                    >
                                      {/* آخر 3 أنشطة */}
                                      <div className="px-3 py-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 mb-2">🕒 آخر الأنشطة</p>
                                        {(() => {
                                          const activities = getCustomerActivities(customer);
                                          if (activities.length === 0) {
                                            return (
                                              <div className="text-center py-2 text-gray-400 text-xs">
                                                لا توجد أنشطة سابقة
                                              </div>
                                            );
                                          }
                                          return (
                                            <div className="space-y-1.5">
                                              {activities.map((activity) => (
                                                <div 
                                                  key={activity.id}
                                                  className={`flex items-center gap-2 p-1.5 rounded-lg ${activity.color.split(' ')[1]}`}
                                                >
                                                  <span className="text-sm">{activity.icon}</span>
                                                  <div className="flex-1 min-w-0">
                                                    <p className={`text-[10px] font-medium ${activity.color.split(' ')[0]}`}>
                                                      {activity.title}
                                                    </p>
                                                    <p className="text-[9px] text-gray-500 truncate">
                                                      {activity.description}
                                                    </p>
                                                  </div>
                                                  <span className="text-[9px] text-gray-400 whitespace-nowrap">
                                                    {formatActivityTime(activity.timestamp)}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                      </div>

                                      {/* ✅ الشريط السفلي الثلاثي: الإجراءات - التفاصيل - المشاركة */}
                                      <div className="px-2 py-2 border-t border-gray-100 grid grid-cols-3 gap-1">
                                        {/* 1. زر الإجراءات مع قائمة منبثقة */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="w-full text-[10px] h-7 px-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                                            >
                                              <Settings className="w-3 h-3 ml-1" />
                                              الإجراءات
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent 
                                            align="end" 
                                            side="top" 
                                            className="w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <DropdownMenuItem
                                              className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer"
                                              onClick={() => {
                                                logCustomerActivity(customer.id, 'call', { description: 'اتصال صادر' });
                                                window.location.href = `tel:${customer.phone}`;
                                              }}
                                            >
                                              <Phone className="w-3 h-3 text-blue-600" />
                                              اتصال
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer"
                                              onClick={() => {
                                                logCustomerActivity(customer.id, 'whatsapp', { description: 'محادثة واتساب' });
                                                window.open(`https://wa.me/${customer.phone}`, '_blank');
                                              }}
                                            >
                                              <MessageSquare className="w-3 h-3 text-green-600" />
                                              واتساب
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer"
                                              onClick={() => {
                                                if (customer.email) {
                                                  logCustomerActivity(customer.id, 'email', { description: 'بريد إلكتروني' });
                                                  window.location.href = `mailto:${customer.email}`;
                                                } else {
                                                  toast.error('لا يوجد بريد إلكتروني');
                                                }
                                              }}
                                            >
                                              <Mail className="w-3 h-3 text-purple-600" />
                                              بريد إلكتروني
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer"
                                              onClick={() => {
                                                logCustomerActivity(customer.id, 'appointment_added', { title: 'موعد جديد' });
                                                window.dispatchEvent(new CustomEvent('createAppointmentFromCRM', {
                                                  detail: { customerId: customer.id, customerName: customer.name, customerPhone: customer.phone }
                                                }));
                                              }}
                                            >
                                              <Calendar className="w-3 h-3 text-orange-600" />
                                              جدولة موعد
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer"
                                              onClick={() => {
                                                logCustomerActivity(customer.id, 'task_added', { title: 'مهمة جديدة' });
                                                window.dispatchEvent(new CustomEvent('createTaskFromCRM', {
                                                  detail: { customerId: customer.id, customerName: customer.name, customerPhone: customer.phone }
                                                }));
                                              }}
                                            >
                                              <Check className="w-3 h-3 text-yellow-600" />
                                              إنشاء مهمة
                                            </DropdownMenuItem>
                                            
                                            <DropdownMenuSeparator />
                                            
                                            {/* الانتقال إلى - قائمة فرعية */}
                                            <DropdownMenuSub>
                                              <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer">
                                                <ArrowRightLeft className="w-3 h-3 text-gray-600" />
                                                الانتقال إلى
                                              </DropdownMenuSubTrigger>
                                              <DropdownMenuPortal>
                                                <DropdownMenuSubContent className="w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
                                                  {columns.filter(col => col.id !== customer.metadata?.columnId).map(col => {
                                                    const colColors = COLUMN_COLORS[col.id] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' };
                                                    return (
                                                      <DropdownMenuItem
                                                        key={col.id}
                                                        className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer"
                                                        onClick={async () => {
                                                          const columnStatusMap: Record<string, string> = {
                                                            'leads': 'new',
                                                            'contacted': 'contacted',
                                                            'viewing': 'viewing',
                                                            'negotiation': 'negotiation',
                                                            'closed': 'closed',
                                                            'lost': 'lost'
                                                          };
                                                          await dbUpdateCustomer(customer.id, {
                                                            status: columnStatusMap[col.id] || col.id,
                                                            metadata: { ...customer.metadata, columnId: col.id }
                                                          });
                                                          toast.success(`تم نقل العميل إلى ${col.title}`);
                                                        }}
                                                      >
                                                        <div className={`w-2 h-2 rounded-full ${colColors.bg} ${colColors.border} border`} />
                                                        {col.title}
                                                      </DropdownMenuItem>
                                                    );
                                                  })}
                                                </DropdownMenuSubContent>
                                              </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            
                                            {/* معين لـ - قائمة فرعية */}
                                            <DropdownMenuSub>
                                              <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer">
                                                <UserCheck className="w-3 h-3 text-gray-600" />
                                                معين لـ
                                              </DropdownMenuSubTrigger>
                                              <DropdownMenuPortal>
                                                <DropdownMenuSubContent className="w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-48 overflow-y-auto">
                                                  {teamMembers.filter(m => m.status === 'active' && m.member_user_id).length > 0 ? (
                                                    teamMembers.filter(m => m.status === 'active' && m.member_user_id).map(member => (
                                                      <DropdownMenuItem
                                                        key={member.id}
                                                        className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer"
                                                        onClick={async () => {
                                                          if (!member.member_user_id || !user?.id) return;
                                                          await assignCustomerToMember({
                                                            customerId: customer.id,
                                                            assignToUserId: member.member_user_id,
                                                            organizationUserId: user.id,
                                                            notes: 'تعيين من قائمة الإجراءات',
                                                          });
                                                          await dbUpdateCustomer(customer.id, {
                                                            metadata: { ...customer.metadata, assignedColleagueName: member.member_name }
                                                          });
                                                        }}
                                                      >
                                                        <UserCheck className="w-3 h-3 text-green-600" />
                                                        {member.member_name}
                                                      </DropdownMenuItem>
                                                    ))
                                                  ) : (
                                                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                                      لا يوجد زملاء
                                                    </div>
                                                  )}
                                                </DropdownMenuSubContent>
                                              </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer text-red-600 focus:text-red-600"
                                              onClick={() => handleDeleteCustomer(customer)}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              حذف العميل
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        
                                        {/* 2. زر التفاصيل - يفتح الصفحة الكاملة */}
                                        <Button
                                          size="sm"
                                          className="w-full bg-[#01411C] hover:bg-[#065f41] text-[10px] h-7 px-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCustomer(customer);
                                            setShowFullDetails(true);
                                            markAsRead(customer.id);
                                          }}
                                        >
                                          <Eye className="w-3 h-3 ml-0.5" />
                                          التفاصيل
                                        </Button>
                                        
                                        {/* 3. زر المشاركة مع قائمة منبثقة */}
                                        <div className="relative">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-[10px] h-7 px-1 border-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37]/10"
                                            onClick={(e) => handleShareClick(e, customer.id)}
                                          >
                                            <Share2 className="w-3 h-3 ml-0.5" />
                                            مشاركة
                                          </Button>
                                          
                                          {/* قائمة المشاركة المنبثقة - إرسال روابط عبر واتساب */}
                                          {showShareMenu === customer.id && (
                                            <div 
                                              className="absolute bottom-full mb-1 left-0 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <div className="p-1 space-y-1">
                                                <button
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-emerald-50 rounded"
                                                  onClick={() => handleShareOffer(customer)}
                                                >
                                                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                                                  إرسال عرض
                                                </button>
                                                <button
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50 rounded"
                                                  onClick={() => handleShareRequest(customer)}
                                                >
                                                  <MessageSquare className="w-3 h-3 text-blue-600" />
                                                  إرسال طلب
                                                </button>
                                                <button
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-amber-50 rounded"
                                                  onClick={() => handleShareQuote(customer)}
                                                >
                                                  <MessageSquare className="w-3 h-3 text-amber-600" />
                                                  عرض سعر
                                                </button>
                                                <button
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-purple-50 rounded"
                                                  onClick={() => handleShareAppointment(customer)}
                                                >
                                                  <Calendar className="w-3 h-3 text-purple-600" />
                                                  إنشاء موعد
                                                </button>

                                                <div className="my-1 h-px bg-gray-100" />

                                                <button
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-teal-50 rounded"
                                                  onClick={() => handleShareReminderToClient(customer)}
                                                >
                                                  <Calendar className="w-3 h-3 text-teal-600" />
                                                  إرسال تذكير للعميل
                                                </button>
                                                <button
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-rose-50 rounded"
                                                  onClick={() => handleShareApology(customer)}
                                                >
                                                  <MessageSquare className="w-3 h-3 text-rose-600" />
                                                  إرسال اعتذار
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                
                                {/* خط درجة الاهتمام في أسفل البطاقة - ثابت دائماً */}
                                <div 
                                  className="h-1.5 w-full flex-shrink-0 mt-auto"
                                  style={{ 
                                    backgroundColor: interestLevels[customer.interestLevel as InterestLevel]?.color || '#9CA3AF'
                                  }}
                                />
                                </div>
                              
                              {/* خط أخضر مؤشر للإفلات بعد آخر بطاقة - absolute لا يدفع البطاقات */}
                              {dropIndicator?.columnId === column.id && dropIndicator.position === customerIndex + 1 && customerIndex === columnCustomers.length - 1 && (
                                <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-green-500 rounded-full animate-pulse z-50 shadow-lg shadow-green-500/50" />
                              )}
                            </div>
                          );
                          })}
                        </AnimatePresence>

                        {/* Empty State */}
                        {columnCustomers.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">لا يوجد عملاء</p>
                          </div>
                        )}
                        </div>
                      </div>
                      
                      {/* خط أخضر مؤشر للإفلات بين الأعمدة */}
                      {columnDropIndicator === columnIndex + 1 && (
                        <div className="w-1 bg-green-500 rounded-full animate-pulse self-stretch" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            )}
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-0">
            <Card className="border-2 border-[#D4AF37]">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الاسم</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الهاتف</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">نوع العقار</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الميزانية</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => (
                        <tr 
                          key={customer.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleOpenCustomerDetails(customer)}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border-2 border-[#D4AF37]">
                                <AvatarFallback className="bg-[#01411C] text-white text-sm">
                                  {customer.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{customer.name}</p>
                                {customer.email && (
                                  <p className="text-xs text-gray-500">{customer.email}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm" dir="ltr">{customer.phone}</span>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={COLUMN_COLORS[customer.columnId]?.text || 'text-gray-700'}>
                              {columns.find(c => c.id === customer.columnId)?.title || customer.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-700">{customer.propertyType || '-'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-[#01411C]">{customer.budget || '-'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCustomerDetails(customer);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  logCustomerActivity(customer.id, 'call', { description: 'اتصال صادر' });
                                  window.location.href = `tel:${customer.phone}`;
                                }}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  logCustomerActivity(customer.id, 'whatsapp', { description: 'محادثة واتساب' });
                                  window.open(`https://wa.me/${customer.phone}`, '_blank');
                                }}
                              >
                                <MessageSquare className="w-4 h-4 text-green-600" />
                              </Button>
                              
                              {/* زر ثلاث نقاط في List View */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 bg-white z-50">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCustomer(customer);
                                      setShowFullDetails(true);
                                      markAsRead(customer.id);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>عرض التفاصيل</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCustomer(customer);
                                      setShowCustomerDetails(true);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    <span>تعديل</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomer(customer);
                                    }}
                                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>حذف</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

      {/* Bottom Bar - ⚠️ تحذير: هذا الشريط محمي - لا تعدله بدون إذن صريح من صاحب المشروع */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#01411C] to-[#065f41] border-t-2 border-[#D4AF37] backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-around gap-2">
            {/* 1. زر الرجوع للصفحة الرئيسية (أقصى اليمين) */}
            <button
              onClick={onBack}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowRight className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <span className="text-xs text-white/90">الرئيسية</span>
            </button>
            
            {/* 2. زر جهات الاتصال */}
            <button
              onClick={() => setShowContactsPanel(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <span className="text-xs text-white/90">جهات الاتصال</span>
            </button>
            
            {/* 3. زر إضافة عميل (في الوسط - الأبرز) */}
            <button
              onClick={() => setShowAddCustomer(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Plus className="w-6 h-6 text-[#01411C]" />
              </div>
              <span className="text-xs text-white font-medium">إضافة عميل</span>
            </button>
            
            {/* 4. زر التاقات */}
            <button
              onClick={() => setShowTagsManager(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Tag className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <span className="text-xs text-white/90">التاقات</span>
            </button>
            
            {/* 5. زر المهام (أقصى اليسار) */}
            <button
              onClick={() => setShowTasksPanel(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <span className="text-xs text-white/90">المهام</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contacts Panel */}
      <ContactsPanel
        isOpen={showContactsPanel}
        onClose={() => setShowContactsPanel(false)}
        appContacts={customers.map(c => ({ id: c.id, name: c.name, phone: c.phone, email: c.email }))}
        onImportContact={(contact) => {
          setNewCustomer({
            name: contact.name,
            phone: contact.phone,
            email: contact.email || '',
            company: '',
            type: 'buyer',
            interestLevel: 'moderate',
            propertyType: '',
            budget: '',
            location: '',
            notes: '',
            tags: [],
          });
          setShowAddCustomer(true);
        }}
      />

      {/* Tasks Panel */}
      <TasksPanel
        isOpen={showTasksPanel}
        onClose={() => setShowTasksPanel(false)}
        tasks={crmTasks.map(t => {
          const customer = customers.find(c => c.id === t.customer_id);
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            customerId: t.customer_id,
            customerName: customer?.name,
            customerPhone: customer?.phone,
            dueDate: t.due_date,
            completedAt: t.completed_at,
            createdAt: t.created_at,
          };
        })}
        onToggleComplete={toggleTaskComplete}
        onUpdateTask={updateCRMTask}
        onDeleteTask={deleteCRMTask}
        onViewCustomer={(customerId) => {
          const customer = customers.find(c => c.id === customerId);
          if (customer) {
            setSelectedCustomer(customer);
            setShowTasksPanel(false);
          }
        }}
        customers={customers.map(c => ({ id: c.id, name: c.name, phone: c.phone }))}
      />

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="w-5 h-5 text-[#01411C]" />
              إضافة عميل جديد
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* الاسم */}
            <div className="space-y-2">
              <Label>الاسم الكامل *</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="أدخل اسم العميل"
              />
            </div>
            
            {/* الجوال */}
            <div className="space-y-2">
              <Label>رقم الجوال *</Label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
            
            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                type="email"
                dir="ltr"
              />
            </div>
            
            {/* الشركة */}
            <div className="space-y-2">
              <Label>اسم الشركة</Label>
              <Input
                value={newCustomer.company}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, company: e.target.value }))}
                placeholder="اسم الشركة (اختياري)"
              />
            </div>
            
            {/* نوع العميل */}
            <div className="space-y-2">
              <Label>نوع العميل</Label>
              <Select
                value={newCustomer.type}
                onValueChange={(value) => setNewCustomer(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع العميل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">مشتري</SelectItem>
                  <SelectItem value="seller">بائع</SelectItem>
                  <SelectItem value="renter">مستأجر</SelectItem>
                  <SelectItem value="owner">مالك</SelectItem>
                  <SelectItem value="investor">مستثمر</SelectItem>
                  <SelectItem value="other">آخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* مستوى الاهتمام */}
            <div className="space-y-2">
              <Label>مستوى الاهتمام</Label>
              <Select
                value={newCustomer.interestLevel}
                onValueChange={(value) => setNewCustomer(prev => ({ ...prev, interestLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستوى الاهتمام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">🔥 ساخن</SelectItem>
                  <SelectItem value="warm">☀️ دافئ</SelectItem>
                  <SelectItem value="moderate">🌤️ متوسط</SelectItem>
                  <SelectItem value="cold">❄️ بارد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* نوع العقار */}
            <div className="space-y-2">
              <Label>نوع العقار المطلوب</Label>
              <Input
                value={newCustomer.propertyType}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, propertyType: e.target.value }))}
                placeholder="فيلا، شقة، أرض..."
              />
            </div>
            
            {/* الميزانية */}
            <div className="space-y-2">
              <Label>الميزانية</Label>
              <Input
                value={newCustomer.budget}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="مثال: 1,000,000 ريال"
              />
            </div>
            
            {/* الموقع */}
            <div className="space-y-2">
              <Label>الموقع المطلوب</Label>
              <Input
                value={newCustomer.location}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, location: e.target.value }))}
                placeholder="المدينة - الحي"
              />
            </div>
            
            {/* الملاحظات */}
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleAddCustomer}
              className="bg-[#01411C] hover:bg-[#065f41]"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة العميل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-[#01411C]" />
              تفاصيل العميل
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              {/* Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#f0fdf4] to-white rounded-lg border-2 border-[#D4AF37]">
                <Avatar className="w-16 h-16 border-4 border-[#D4AF37]">
                  <AvatarFallback className="bg-[#01411C] text-white text-xl">
                    {selectedCustomer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-[#01411C]">{selectedCustomer.name}</h3>
                  {selectedCustomer.company && (
                    <p className="text-gray-600">{selectedCustomer.company}</p>
                  )}
                </div>
              </div>
              
              {/* Contact Info */}
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">معلومات الاتصال</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#01411C]" />
                    <span dir="ltr">{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#01411C]" />
                      <span dir="ltr">{selectedCustomer.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Property Info */}
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">متطلبات العقار</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedCustomer.propertyType && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#01411C]" />
                      <span>{selectedCustomer.propertyType}</span>
                    </div>
                  )}
                  {selectedCustomer.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#01411C]" />
                      <span>{selectedCustomer.location}</span>
                    </div>
                  )}
                  {selectedCustomer.budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#01411C]" />
                      <span>{selectedCustomer.budget}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tags */}
              {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.map((tag, idx) => {
                    const tagColor = getTagColor(tag);
                    return (
                      <Badge 
                        key={idx}
                        style={{ 
                          backgroundColor: tagColor.bg,
                          color: tagColor.text,
                        }}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {/* Notes */}
              {selectedCustomer.notes && (
                <Card className="border-2 border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">ملاحظات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedCustomer.notes}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => window.open(`https://wa.me/${selectedCustomer.phone}`, '_blank')}
                >
                  <MessageSquare className="w-4 h-4 ml-2" />
                  واتساب
                </Button>
                <Button
                  className="flex-1 bg-[#01411C] hover:bg-[#065f41]"
                  onClick={() => window.location.href = `tel:${selectedCustomer.phone}`}
                >
                  <Phone className="w-4 h-4 ml-2" />
                  اتصال
                </Button>
              </div>
              
              {/* Full Details Button */}
              <Button
                variant="outline"
                className="w-full mt-2 border-[#D4AF37]"
                onClick={() => {
                  setShowCustomerDetails(false);
                  setShowFullDetails(true);
                }}
              >
                <Eye className="w-4 h-4 ml-2" />
                عرض التفاصيل الكاملة
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog - Enhanced */}
      <Dialog open={showImport} onOpenChange={(open) => {
        setShowImport(open);
        if (!open) {
          setImportFile(null);
          setImportPreview([]);
        }
      }}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#01411C]" />
              استيراد العملاء من ملف CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Upload Area */}
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#01411C] transition-colors cursor-pointer block">
              {importFile ? (
                <div className="space-y-2">
                  <FileUp className="w-12 h-12 mx-auto text-[#01411C]" />
                  <p className="text-[#01411C] font-medium">{importFile.name}</p>
                  <p className="text-sm text-gray-500">{(importFile.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">اسحب ملف CSV هنا</p>
                  <p className="text-sm text-gray-400">أو اضغط للاختيار</p>
                </>
              )}
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
            
            {/* Preview Table */}
            {importPreview.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-700">معاينة البيانات (أول 5 صفوف)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {importPreview[0]?.map((header: string, idx: number) => (
                          <th key={idx} className="px-3 py-2 text-right font-medium text-gray-600 border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(1).map((row: string[], rowIdx: number) => (
                        <tr key={rowIdx} className="hover:bg-gray-50">
                          {row.map((cell: string, cellIdx: number) => (
                            <td key={cellIdx} className="px-3 py-2 border-b text-gray-700">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleExportCSV}>
                <Download className="w-4 h-4 ml-2" />
                تصدير العملاء الحاليين
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                // Create and download template
                const template = 'الاسم,الهاتف,البريد,الشركة,نوع العميل,الميزانية,الموقع\n';
                const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'customers_template.csv';
                link.click();
                URL.revokeObjectURL(url);
                toast.success('تم تحميل القالب');
              }}>
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                تحميل قالب
              </Button>
            </div>
            
            {/* Import Button */}
            {importFile && (
              <Button 
                className="w-full bg-[#01411C] hover:bg-[#065f41]"
                onClick={handleImportSubmit}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الاستيراد...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    استيراد {importPreview.length - 1} عميل
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tags Manager Dialog */}
      <Dialog open={showTagsManager} onOpenChange={(open) => {
        setShowTagsManager(open);
        if (!open) setTagSelectCustomer(null);
      }}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              {tagSelectCustomer ? `اختر تاق لـ "${tagSelectCustomer.name}"` : 'إدارة التاقات'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* شريط معلومات العميل المختار */}
            {tagSelectCustomer && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                <User className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">{tagSelectCustomer.name}</p>
                  <p className="text-xs text-amber-600">{tagSelectCustomer.phone}</p>
                </div>
                <Badge variant="outline" className="border-amber-400 text-amber-700">
                  {(tagSelectCustomer.tags || []).length} تاق
                </Badge>
              </div>
            )}
            
            {/* Add new tag */}
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="اسم التاق الجديد"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <div className="flex items-center gap-1">
                {TAG_COLORS.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-6 h-6 rounded-full transition-transform ${newTagColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button onClick={handleAddTag} size="icon" className="bg-[#01411C]">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Existing tags - مع إمكانية الاختيار للعميل */}
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {customTags.map((tag) => {
                  const isAssigned = tagSelectCustomer && (tagSelectCustomer.tags || []).includes(tag.name);
                  return (
                    <div 
                      key={tag.id} 
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        tagSelectCustomer 
                          ? isAssigned 
                            ? 'bg-green-50 border-2 border-green-300' 
                            : 'bg-gray-50 hover:bg-blue-50 cursor-pointer border-2 border-transparent hover:border-blue-300'
                          : 'bg-gray-50'
                      }`}
                      onClick={async () => {
                        if (!tagSelectCustomer) return;
                        if (isAssigned) {
                          // إزالة التاق
                          const nextTags = (tagSelectCustomer.tags || []).filter(t => t !== tag.name);
                          setCustomers(prev => prev.map(c => c.id === tagSelectCustomer.id ? { ...c, tags: nextTags } : c));
                          setTagSelectCustomer({ ...tagSelectCustomer, tags: nextTags });
                          await dbUpdateCustomer(tagSelectCustomer.id, { tags: nextTags });
                          toast.success(`تم إزالة تاق "${tag.name}"`);
                        } else {
                          // إضافة التاق
                          const nextTags = [...(tagSelectCustomer.tags || []), tag.name];
                          setCustomers(prev => prev.map(c => c.id === tagSelectCustomer.id ? { ...c, tags: nextTags } : c));
                          setTagSelectCustomer({ ...tagSelectCustomer, tags: nextTags });
                          await dbUpdateCustomer(tagSelectCustomer.id, { tags: nextTags });
                          toast.success(`تم إضافة تاق "${tag.name}"`);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium">{tag.name}</span>
                        {tagSelectCustomer && isAssigned && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      {!tagSelectCustomer && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTag(tag.id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            {/* Color palette - فقط في وضع الإدارة */}
            {!tagSelectCustomer && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">الألوان المتاحة</p>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${newTagColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* زر إغلاق في وضع الاختيار */}
            {tagSelectCustomer && (
              <div className="border-t pt-4">
                <Button 
                  className="w-full bg-[#01411C] hover:bg-[#065f41]"
                  onClick={() => {
                    setShowTagsManager(false);
                    setTagSelectCustomer(null);
                  }}
                >
                  <Check className="w-4 h-4 ml-2" />
                  تم
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              فلاتر متقدمة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Type Filter */}
              <div>
                <Label>نوع العميل</Label>
                <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    <SelectItem value="buyer">مشتري</SelectItem>
                    <SelectItem value="seller">بائع</SelectItem>
                    <SelectItem value="renter">مستأجر</SelectItem>
                    <SelectItem value="owner">مالك</SelectItem>
                    <SelectItem value="investor">مستثمر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Interest Level Filter */}
              <div>
                <Label>مستوى الاهتمام</Label>
                <Select value={filters.interestLevel} onValueChange={(v) => setFilters({...filters, interestLevel: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    <SelectItem value="hot">🔥 ساخن</SelectItem>
                    <SelectItem value="warm">☀️ دافئ</SelectItem>
                    <SelectItem value="moderate">🌤️ متوسط</SelectItem>
                    <SelectItem value="cold">❄️ بارد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date From */}
              <div>
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
              </div>
              
              {/* Date To */}
              <div>
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                />
              </div>
            </div>
            
            {/* Active Filters */}
            {(filters.type || filters.interestLevel || filters.dateFrom || filters.dateTo) && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">الفلاتر النشطة:</span>
                {filters.type && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.type}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({...filters, type: ''})} />
                  </Badge>
                )}
                {filters.interestLevel && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.interestLevel}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({...filters, interestLevel: ''})} />
                  </Badge>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={clearFilters}>
              مسح الفلاتر
            </Button>
            <Button onClick={() => setShowFilters(false)} className="bg-[#01411C]">
              تطبيق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Colors Manager Dialog */}
      <Dialog open={showColorsManager} onOpenChange={setShowColorsManager}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
              تخصيص ألوان الأعمدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {columns.map((column) => {
              const colors = COLUMN_COLORS[column.id];
              return (
                <div key={column.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-16 rounded ${colors?.border || 'border-gray-300'}`} 
                         style={{ backgroundColor: colors?.bg?.replace('bg-', '') }} />
                    <span className="font-medium">{column.title}</span>
                  </div>
                  <div className="flex gap-1">
                    {TAG_COLORS.slice(0, 6).map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Customer Details Page */}
      {showFullDetails && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <CustomerDetailsPage
            customer={selectedCustomer}
            onBack={() => setShowFullDetails(false)}
            onUpdate={handleCustomerUpdate}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              تأكيد حذف العميل
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف العميل "{customerToDelete?.name}"؟
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

      {/* حوار إضافة مكالمة جديدة */}
      <Dialog open={showAddCallLog} onOpenChange={setShowAddCallLog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>إضافة مكالمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>رقم الهاتف *</Label>
              <Input
                value={newCallLog.phone}
                onChange={(e) => setNewCallLog(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div>
              <Label>الاسم (اختياري)</Label>
              <Input
                value={newCallLog.name}
                onChange={(e) => setNewCallLog(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم المتصل"
              />
            </div>
            <div>
              <Label>نوع المكالمة</Label>
              <Select value={newCallLog.type} onValueChange={(v: any) => setNewCallLog(prev => ({ ...prev, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">📞 واردة</SelectItem>
                  <SelectItem value="outgoing">📱 صادرة</SelectItem>
                  <SelectItem value="missed">❌ فائتة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCallLog(false)}>إلغاء</Button>
            <Button 
              className="bg-[#01411C]"
              onClick={() => {
                if (!newCallLog.phone) {
                  toast.error('رقم الهاتف مطلوب');
                  return;
                }
                addCallLog({ ...newCallLog, time: 'الآن' });
                setNewCallLog({ phone: '', name: '', type: 'incoming' });
                setShowAddCallLog(false);
                toast.success('تم إضافة المكالمة');
              }}
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار البلاغات */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              إرسال بلاغ عن العميل: {reportCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* فئة البلاغ */}
            <div>
              <Label>فئة البلاغ *</Label>
              <Select 
                value={selectedReportCategory} 
                onValueChange={(v) => {
                  setSelectedReportCategory(v);
                  setSelectedReportSubCategory('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة البلاغ" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {Object.keys(reportCategories).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* نوع البلاغ الفرعي */}
            {selectedReportCategory && (
              <div>
                <Label>نوع البلاغ *</Label>
                <Select value={selectedReportSubCategory} onValueChange={setSelectedReportSubCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع البلاغ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-60">
                    {reportCategories[selectedReportCategory as keyof typeof reportCategories]?.map((subCategory) => (
                      <SelectItem key={subCategory} value={subCategory}>
                        {subCategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* تفاصيل البلاغ */}
            <div>
              <Label>تفاصيل البلاغ</Label>
              <Textarea
                placeholder="اكتب تفاصيل إضافية عن البلاغ..."
                className="min-h-[100px]"
              />
            </div>
            
            {/* مستوى الخطورة */}
            <div>
              <Label>مستوى الخطورة</Label>
              <Select defaultValue="متوسط">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="منخفض">🟢 منخفض</SelectItem>
                  <SelectItem value="متوسط">🟡 متوسط</SelectItem>
                  <SelectItem value="عالي">🟠 عالي</SelectItem>
                  <SelectItem value="حرج">🔴 حرج</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReportDialog(false);
                setSelectedReportCategory('');
                setSelectedReportSubCategory('');
                setReportCustomer(null);
              }}
            >
              إلغاء
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                if (!selectedReportCategory || !selectedReportSubCategory) {
                  toast.error('يرجى اختيار فئة ونوع البلاغ');
                  return;
                }
                toast.success('تم إرسال البلاغ بنجاح');
                setShowReportDialog(false);
                setSelectedReportCategory('');
                setSelectedReportSubCategory('');
                setReportCustomer(null);
              }}
            >
              <AlertTriangle className="w-4 h-4 ml-2" />
              إرسال البلاغ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تم استبدال AssignCustomerToMemberDialog بـ AssignCustomerPopover المتكامل داخل كل بطاقة */}

      {/* حوار إدارة الأعمدة */}
      <Dialog open={showColumnsManager} onOpenChange={setShowColumnsManager}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#01411C]" />
              إدارة أعمدة الكانبان
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* زر إضافة عمود جديد */}
            <Button
              onClick={() => setShowAddColumnDialog(true)}
              className="w-full bg-[#01411C] hover:bg-[#016630]"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة عمود جديد
            </Button>
            
            {/* قائمة الأعمدة */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <p className="text-sm text-gray-500 font-medium">الأعمدة الأساسية (لا يمكن تعديلها)</p>
              {defaultColumns.map((col) => (
                <div key={col.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${COLUMN_COLORS[col.id]?.border || 'border-gray-300'}`} 
                         style={{ backgroundColor: COLUMN_COLORS[col.id]?.bg?.includes('blue') ? '#3b82f6' : 
                                  COLUMN_COLORS[col.id]?.bg?.includes('purple') ? '#8b5cf6' :
                                  COLUMN_COLORS[col.id]?.bg?.includes('yellow') ? '#eab308' :
                                  COLUMN_COLORS[col.id]?.bg?.includes('orange') ? '#f97316' :
                                  COLUMN_COLORS[col.id]?.bg?.includes('green') ? '#22c55e' :
                                  COLUMN_COLORS[col.id]?.bg?.includes('red') ? '#ef4444' : '#6b7280' }} />
                    <span className="font-medium text-sm">{col.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">أساسي</Badge>
                </div>
              ))}
              
              {customColumnsData.length > 0 && (
                <>
                  <p className="text-sm text-gray-500 font-medium mt-4">الأعمدة المخصصة</p>
                  {customColumnsData.map((col) => (
                    <div key={col.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      {editingColumnId === col.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editColumnTitle}
                            onChange={(e) => setEditColumnTitle(e.target.value)}
                            placeholder="اسم العمود..."
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleEditColumnName(col.id)} className="bg-[#01411C] h-8">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingColumnId(null)} className="h-8">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                            <span className="font-medium text-sm">{col.title}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setEditingColumnId(col.id);
                                setEditColumnTitle(col.title);
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteCustomColumn(col.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </>
              )}
              
              {customColumnsData.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  لا توجد أعمدة مخصصة. اضغط على "إضافة عمود جديد" لإنشاء عمود.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowColumnsManager(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* حوار إضافة عمود جديد */}
      <Dialog open={showAddColumnDialog} onOpenChange={setShowAddColumnDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة عمود جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-column-title">اسم العمود</Label>
              <Input
                id="new-column-title"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="مثال: متابعة، مؤجل، VIP..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddColumnDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddNewColumn} className="bg-[#01411C] hover:bg-[#016630]">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ حوار تنبيه الرقم المكرر */}
      <AlertDialog open={showDuplicateAlert} onOpenChange={setShowDuplicateAlert}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              رقم جوال مكرر!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-3">
              <p>الرقم <strong dir="ltr">{duplicateInfo?.phone}</strong> موجود بالفعل باسم:</p>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-bold text-blue-800">{duplicateInfo?.existingCustomer.name}</p>
              </div>
              <p>تريد إدخاله باسم جديد:</p>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-bold text-orange-800">{duplicateInfo?.newName}</p>
              </div>
              <p className="font-medium">أي الاسمين تريد أن يكون الرئيسي؟</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={() => handleDuplicateChoice(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              الإبقاء على "{duplicateInfo?.existingCustomer.name}"
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleDuplicateChoice(false)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              استخدام "{duplicateInfo?.newName}"
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Spacer for bottom bar */}
      <div className="h-24"></div>
    </div>
  );
}
