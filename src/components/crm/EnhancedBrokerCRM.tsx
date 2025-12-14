/**
 * EnhancedBrokerCRM.tsx
 * نظام إدارة العملاء (كانبان)
 * Enhanced Broker CRM with Kanban Board - Literal Implementation
 */

import { useState, useEffect } from "react";
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
  Download,
  FileSpreadsheet,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

// Default Columns (6 columns)
const defaultColumns: Column[] = [
  { id: 'leads', title: 'عملاء محتملين', customerIds: [] },
  { id: 'contacted', title: 'تم التواصل', customerIds: [] },
  { id: 'viewing', title: 'معاينة', customerIds: [] },
  { id: 'negotiation', title: 'تفاوض', customerIds: [] },
  { id: 'closed', title: 'صفقة مكتملة', customerIds: [] },
  { id: 'lost', title: 'ضائع', customerIds: [] },
];

// Column Colors
const COLUMN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'leads': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  'contacted': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  'viewing': { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
  'negotiation': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  'closed': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  'lost': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
};

// Customer Type Colors
const CUSTOMER_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'buyer': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  'seller': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  'renter': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  'owner': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  'investor': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  'other': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
};

// Interest Level Colors
const INTEREST_LEVEL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'hot': { bg: 'bg-red-50', border: 'border-l-4 border-l-red-500', text: 'text-red-700' },
  'warm': { bg: 'bg-orange-50', border: 'border-l-4 border-l-orange-500', text: 'text-orange-700' },
  'moderate': { bg: 'bg-yellow-50', border: 'border-l-4 border-l-yellow-500', text: 'text-yellow-700' },
  'cold': { bg: 'bg-blue-50', border: 'border-l-4 border-l-blue-500', text: 'text-blue-700' },
};

// Tag Colors
const getTagColor = (tag: string) => {
  const colors = [
    { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
    { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
    { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
    { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' },
    { bg: '#f3e8ff', text: '#9333ea', border: '#e9d5ff' },
    { bg: '#fce7f3', text: '#db2777', border: '#fbcfe8' },
  ];
  const index = tag.charCodeAt(0) % colors.length;
  return colors[index];
};

// Mock Data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'أحمد محمد',
    phone: '0501234567',
    email: 'ahmed@email.com',
    whatsapp: '0501234567',
    company: 'شركة الأمل',
    type: 'buyer',
    interestLevel: 'hot',
    propertyType: 'فيلا',
    budget: '2,000,000 ريال',
    location: 'الرياض - حي النرجس',
    notes: 'يبحث عن فيلا مع مسبح',
    source: 'موقع إلكتروني',
    status: 'active',
    columnId: 'leads',
    tags: ['VIP', 'فيلا', 'مستعجل'],
    createdAt: '2024-01-15',
    lastContact: '2024-01-20',
  },
  {
    id: '2',
    name: 'سارة أحمد',
    phone: '0559876543',
    email: 'sara@email.com',
    type: 'renter',
    interestLevel: 'warm',
    propertyType: 'شقة',
    budget: '50,000 ريال/سنوياً',
    location: 'جدة - حي الروضة',
    status: 'active',
    columnId: 'contacted',
    tags: ['شقة', 'إيجار'],
    createdAt: '2024-01-16',
  },
  {
    id: '3',
    name: 'محمد علي',
    phone: '0541112233',
    type: 'investor',
    interestLevel: 'hot',
    propertyType: 'أرض تجارية',
    budget: '5,000,000 ريال',
    location: 'الدمام',
    status: 'active',
    columnId: 'negotiation',
    tags: ['استثمار', 'أرض'],
    createdAt: '2024-01-10',
  },
  {
    id: '4',
    name: 'فاطمة خالد',
    phone: '0533334444',
    type: 'seller',
    interestLevel: 'moderate',
    propertyType: 'عمارة سكنية',
    budget: '3,500,000 ريال',
    location: 'الرياض - حي الملقا',
    status: 'active',
    columnId: 'viewing',
    tags: ['بيع', 'عمارة'],
    createdAt: '2024-01-18',
  },
  {
    id: '5',
    name: 'عبدالله سعد',
    phone: '0512223344',
    type: 'buyer',
    interestLevel: 'cold',
    propertyType: 'شقة',
    budget: '800,000 ريال',
    location: 'الرياض - حي العليا',
    status: 'active',
    columnId: 'closed',
    tags: ['تم البيع'],
    createdAt: '2024-01-05',
  },
];

export default function EnhancedBrokerCRM({ onBack, user }: EnhancedBrokerCRMProps) {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [columns, setColumns] = useState<Column[]>(() => {
    // Distribute customers to columns
    const cols = defaultColumns.map(col => ({
      ...col,
      customerIds: mockCustomers.filter(c => c.columnId === col.id).map(c => c.id)
    }));
    return cols;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('kanban');
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // التبويب الجديد: الكل، نشط، محتمل، VIP، أرشيف
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [showColorsManager, setShowColorsManager] = useState(false);
  const [unreadCustomers, setUnreadCustomers] = useState<string[]>(['1', '3']);
  const [draggedCustomer, setDraggedCustomer] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null); // البطاقة الموسعة
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  
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
  
  // Tags Manager State
  const [customTags, setCustomTags] = useState<{ name: string; color: string }[]>([
    { name: 'VIP', color: '#ef4444' },
    { name: 'مستعجل', color: '#f97316' },
    { name: 'متابعة', color: '#10b981' },
    { name: 'تمويل', color: '#3b82f6' },
    { name: 'استثمار', color: '#8b5cf6' },
  ]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#01411C');
  
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
  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    if (customTags.find(t => t.name === newTagName.trim())) {
      toast.error('التاق موجود مسبقاً');
      return;
    }
    setCustomTags([...customTags, { name: newTagName.trim(), color: newTagColor }]);
    setNewTagName('');
    toast.success('تم إضافة التاق');
  };

  // Delete tag
  const handleDeleteTag = (tagName: string) => {
    setCustomTags(customTags.filter(t => t.name !== tagName));
    toast.success('تم حذف التاق');
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
  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    setSelectedCustomer(updatedCustomer);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  // Confirm delete customer
  const confirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    
    // Remove from customers array
    setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
    
    // Remove from columns
    setColumns(prev => prev.map(col => ({
      ...col,
      customerIds: col.customerIds.filter(id => id !== customerToDelete.id)
    })));
    
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
    toast.success('تم حذف العميل بنجاح');
  };

  // Check if customer is unread
  const isCustomerUnread = (customerId: string) => unreadCustomers.includes(customerId);

  // Mark customer as read
  const markAsRead = (customerId: string) => {
    setUnreadCustomers(prev => prev.filter(id => id !== customerId));
  };

  // Handle opening customer details
  const handleOpenCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
    markAsRead(customer.id);
  };

  // Handle drag start
  const handleDragStart = (customerId: string) => {
    setDraggedCustomer(customerId);
  };

  // Handle drop
  const handleDrop = (columnId: string) => {
    if (!draggedCustomer) return;

    setColumns(prev => {
      const newColumns = prev.map(col => ({
        ...col,
        customerIds: col.customerIds.filter(id => id !== draggedCustomer)
      }));
      
      const targetColumn = newColumns.find(col => col.id === columnId);
      if (targetColumn) {
        targetColumn.customerIds.push(draggedCustomer);
      }
      
      return newColumns;
    });

    setCustomers(prev => prev.map(c => 
      c.id === draggedCustomer ? { ...c, columnId } : c
    ));

    setDraggedCustomer(null);
    toast.success('تم نقل العميل بنجاح');
  };

  // Handle add customer
  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error('الاسم ورقم الجوال مطلوبان');
      return;
    }

    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || undefined,
      company: newCustomer.company || undefined,
      type: newCustomer.type as Customer['type'],
      interestLevel: newCustomer.interestLevel as Customer['interestLevel'],
      propertyType: newCustomer.propertyType || undefined,
      budget: newCustomer.budget || undefined,
      location: newCustomer.location || undefined,
      notes: newCustomer.notes || undefined,
      tags: newCustomer.tags,
      status: 'active',
      columnId: 'leads',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCustomers(prev => [...prev, customer]);
    setColumns(prev => prev.map(col => 
      col.id === 'leads' 
        ? { ...col, customerIds: [...col.customerIds, customer.id] }
        : col
    ));

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
    toast.success('تم إضافة العميل بنجاح');
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
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] border-b-4 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-2 border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة
            </Button>
            
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6" />
              إدارة العملاء
            </h1>
            
            <div className="w-20"></div>
          </div>
          
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عميل بالاسم أو الجوال..."
                className="pr-10 bg-white/90 border-2 border-[#D4AF37] focus:bg-white"
              />
            </div>
          </div>
        </div>
      </header>

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
      </div>

      {/* View Tabs */}
      <div className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border-2 border-[#D4AF37] mb-4">
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              كانبان
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              قائمة
            </TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban" className="mt-0">
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {columns.map((column) => {
                  const colors = COLUMN_COLORS[column.id] || COLUMN_COLORS['leads'];
                  const columnCustomers = getCustomersForColumn(column.id);
                  
                  return (
                    <div
                      key={column.id}
                      className={`w-72 flex-shrink-0 rounded-xl ${colors.bg} ${colors.border} border-2`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(column.id)}
                    >
                      {/* Column Header */}
                      <div className={`p-3 border-b-2 ${colors.border}`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`font-bold ${colors.text}`}>
                            {column.title}
                          </h3>
                          <Badge className={`${colors.bg} ${colors.text} border ${colors.border}`}>
                            {columnCustomers.length}
                          </Badge>
                        </div>
                      </div>

                      {/* Column Content */}
                      <div className="p-2 space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto">
                        <AnimatePresence>
                          {columnCustomers.map((customer) => {
                            const typeColors = CUSTOMER_TYPE_COLORS[customer.type || 'other'];
                            const interestColors = INTEREST_LEVEL_COLORS[customer.interestLevel || 'moderate'];
                            
                            return (
                              <motion.div
                                key={customer.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                layout
                                draggable
                                onDragStart={() => handleDragStart(customer.id)}
                                className={`
                                  bg-white rounded-lg shadow-md cursor-move
                                  hover:shadow-xl transition-all duration-200
                                  ${typeColors.border}
                                  ${interestColors.border}
                                  ${typeColors.bg}
                                  ${expandedCardId === customer.id ? 'ring-2 ring-[#D4AF37]' : ''}
                                `}
                              >
                                {/* البطاقة المضغوطة */}
                                <div 
                                  className="p-3"
                                  onClick={() => toggleCardExpansion(customer.id)}
                                >
                                  {/* 1. Header: الصورة + الاسم + أيقونة السحب */}
                                  <div className="flex items-center gap-2 mb-2">
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
                                      
                                      {/* 1.2 مؤشر غير مقروء */}
                                      {isCustomerUnread(customer.id) && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                      )}
                                    </div>
                                    
                                    {/* 1.3 الاسم والشركة + VIP Badge */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <h3 className="font-bold text-[14px] text-gray-900 truncate">
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
                                      
                                      {expandedCardId === customer.id ? (
                                        <ChevronUp className="w-4 h-4 text-[#D4AF37]" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                      )}
                                      <GripVertical className="w-4 h-4 text-gray-400" />
                                    </div>
                                  </div>
                                  
                                  {/* 2. معلومات الاتصال + مستوى الاهتمام */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1 text-xs text-gray-700">
                                      <Phone className="w-3 h-3" />
                                      <span className="truncate" dir="ltr">{customer.phone}</span>
                                    </div>
                                    <Badge className={`text-xs ${
                                      customer.interestLevel === 'hot' ? 'bg-red-100 text-red-700' :
                                      customer.interestLevel === 'warm' ? 'bg-orange-100 text-orange-700' :
                                      customer.interestLevel === 'moderate' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {customer.interestLevel === 'hot' ? '🔥 ساخن' :
                                       customer.interestLevel === 'warm' ? '☀️ دافئ' :
                                       customer.interestLevel === 'moderate' ? '🌤️ متوسط' : '❄️ بارد'}
                                    </Badge>
                                  </div>
                                  
                                  {/* 3. التاقات */}
                                  {customer.tags && customer.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {customer.tags.slice(0, 3).map((tag, idx) => {
                                        const tagColor = getTagColor(tag);
                                        return (
                                          <Badge 
                                            key={idx}
                                            style={{ 
                                              backgroundColor: tagColor.bg,
                                              color: tagColor.text,
                                              borderColor: tagColor.border
                                            }}
                                            className="text-xs px-2 py-0.5 border"
                                          >
                                            {tag}
                                          </Badge>
                                        );
                                      })}
                                      {customer.tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                                          +{customer.tags.length - 3}
                                        </Badge>
                                      )}
                                    </div>
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
                                      {/* معلومات إضافية */}
                                      <div className="px-3 py-2 space-y-1 text-xs">
                                        {customer.email && (
                                          <div className="flex items-center gap-1 text-gray-600">
                                            <Mail className="w-3 h-3" />
                                            <span dir="ltr">{customer.email}</span>
                                          </div>
                                        )}
                                        {customer.propertyType && (
                                          <div className="flex items-center gap-1 text-gray-600">
                                            <Building2 className="w-3 h-3" />
                                            <span>{customer.propertyType}</span>
                                          </div>
                                        )}
                                        {customer.budget && (
                                          <div className="flex items-center gap-1 text-[#01411C] font-medium">
                                            <DollarSign className="w-3 h-3" />
                                            <span>{customer.budget}</span>
                                          </div>
                                        )}
                                        {customer.location && (
                                          <div className="flex items-center gap-1 text-gray-600">
                                            <MapPin className="w-3 h-3" />
                                            <span>{customer.location}</span>
                                          </div>
                                        )}
                                        {customer.lastContact && (
                                          <div className="flex items-center gap-1 text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>آخر تفاعل: {customer.lastContact}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* 7 أزرار سريعة */}
                                      <div className="px-3 py-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 mb-2">⚡ إجراءات سريعة</p>
                                        <div className="grid grid-cols-4 gap-1">
                                          {/* 1. اتصال */}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-1 text-xs hover:bg-blue-100 flex flex-col items-center gap-0.5"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.location.href = `tel:${customer.phone}`;
                                            }}
                                          >
                                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                                            <span className="text-[10px]">اتصال</span>
                                          </Button>
                                          
                                          {/* 2. واتساب */}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-1 text-xs hover:bg-green-100 flex flex-col items-center gap-0.5"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(`https://wa.me/${customer.phone}`, '_blank');
                                            }}
                                          >
                                            <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                                            <span className="text-[10px]">واتساب</span>
                                          </Button>
                                          
                                          {/* 3. بريد */}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-1 text-xs hover:bg-purple-100 flex flex-col items-center gap-0.5"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (customer.email) {
                                                window.location.href = `mailto:${customer.email}`;
                                              } else {
                                                toast.error('لا يوجد بريد إلكتروني');
                                              }
                                            }}
                                          >
                                            <Mail className="w-3.5 h-3.5 text-purple-600" />
                                            <span className="text-[10px]">بريد</span>
                                          </Button>
                                          
                                          {/* 4. موعد - مع ربط العميل */}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-1 text-xs hover:bg-orange-100 flex flex-col items-center gap-0.5"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // إرسال حدث لإنشاء موعد مع ربط العميل
                                              window.dispatchEvent(new CustomEvent('createAppointmentFromCRM', {
                                                detail: {
                                                  customerId: customer.id,
                                                  customerName: customer.name,
                                                  customerPhone: customer.phone,
                                                }
                                              }));
                                            }}
                                          >
                                            <Calendar className="w-3.5 h-3.5 text-orange-600" />
                                            <span className="text-[10px]">موعد</span>
                                          </Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 mt-1">
                                          {/* 5. مهمة - مع ربط العميل */}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-1 text-xs hover:bg-yellow-100 flex flex-col items-center gap-0.5"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // إرسال حدث لإنشاء مهمة مع ربط العميل
                                              window.dispatchEvent(new CustomEvent('createTaskFromCRM', {
                                                detail: {
                                                  customerId: customer.id,
                                                  customerName: customer.name,
                                                  customerPhone: customer.phone,
                                                }
                                              }));
                                            }}
                                          >
                                            <Check className="w-3.5 h-3.5 text-yellow-600" />
                                            <span className="text-[10px]">مهمة</span>
                                          </Button>
                                          
                                          {/* 6. عقار */}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-1 text-xs hover:bg-teal-100 flex flex-col items-center gap-0.5"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toast.info('سيتم ربط عقار');
                                            }}
                                          >
                                            <Building2 className="w-3.5 h-3.5 text-teal-600" />
                                            <span className="text-[10px]">عقار</span>
                                          </Button>
                                          
                                          {/* 7. حاسبة */}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-1 text-xs hover:bg-indigo-100 flex flex-col items-center gap-0.5"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toast.info('سيتم فتح حاسبة التمويل');
                                            }}
                                          >
                                            <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                                            <span className="text-[10px]">حاسبة</span>
                                          </Button>
                                        </div>
                                      </div>

                                      {/* أزرار عرض التفاصيل وتعديل */}
                                      <div className="px-3 py-2 border-t border-gray-100 flex gap-2">
                                        <Button
                                          size="sm"
                                          className="flex-1 bg-[#01411C] hover:bg-[#065f41] text-xs h-8"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCustomer(customer);
                                            setShowFullDetails(true);
                                            markAsRead(customer.id);
                                          }}
                                        >
                                          <Eye className="w-3 h-3 ml-1" />
                                          التفاصيل الكاملة
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-8 border-[#D4AF37]"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCustomer(customer);
                                            setShowCustomerDetails(true);
                                          }}
                                        >
                                          <Edit className="w-3 h-3 ml-1" />
                                          تعديل
                                        </Button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
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
                  );
                })}
              </div>
            </div>
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

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1a1d29] to-[#232639] border-t border-[#374151] backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-around gap-2">
            {/* 1. زر إضافة عميل */}
            <button
              onClick={() => setShowAddCustomer(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#01411C] to-[#065f41] flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <span className="text-xs text-gray-300">إضافة عميل</span>
            </button>
            
            {/* 2. زر استيراد */}
            <button
              onClick={() => setShowImport(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-300">استيراد</span>
            </button>
            
            {/* 3. زر التاقات */}
            <button
              onClick={() => setShowTagsManager(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-300">التاقات</span>
            </button>
            
            {/* 4. زر الألوان */}
            <button
              onClick={() => setShowColorsManager(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-600 to-pink-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-5 h-5 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-xs text-gray-300">الألوان</span>
            </button>
            
            {/* 5. زر الفلاتر */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-600 to-orange-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-300">فلاتر</span>
            </button>
          </div>
        </div>
      </div>

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

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              استيراد العملاء
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#01411C] transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">اسحب ملف Excel أو CSV هنا</p>
              <p className="text-sm text-gray-400">أو اضغط للاختيار</p>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleExportCSV}>
                <Download className="w-4 h-4 ml-2" />
                تصدير العملاء الحاليين
              </Button>
              <Button variant="outline" className="flex-1">
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                تحميل قالب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tags Manager Dialog */}
      <Dialog open={showTagsManager} onOpenChange={setShowTagsManager}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              إدارة التاقات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add new tag */}
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="اسم التاق الجديد"
                className="flex-1"
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
            
            {/* Existing tags */}
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {customTags.map((tag) => (
                  <div key={tag.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteTag(tag.name)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Color palette */}
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

      {/* Spacer for bottom bar */}
      <div className="h-24"></div>
    </div>
  );
}
