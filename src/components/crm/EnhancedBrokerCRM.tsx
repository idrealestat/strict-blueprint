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
} from "lucide-react";
import { toast } from "sonner";

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
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [showColorsManager, setShowColorsManager] = useState(false);
  const [unreadCustomers, setUnreadCustomers] = useState<string[]>(['1', '3']);
  const [draggedCustomer, setDraggedCustomer] = useState<string | null>(null);
  
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

  // Filtered customers
  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.company?.toLowerCase().includes(query)
    );
  });

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

      {/* Tabs */}
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
                                draggable
                                onDragStart={() => handleDragStart(customer.id)}
                                className={`
                                  bg-white rounded-lg shadow-md p-3 cursor-move
                                  hover:shadow-xl transition-all duration-200
                                  ${typeColors.border}
                                  ${interestColors.border}
                                  ${typeColors.bg}
                                `}
                                onClick={() => handleOpenCustomerDetails(customer)}
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
                                  
                                  {/* 1.3 الاسم والشركة */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[14px] text-gray-900 truncate">
                                      {customer.name}
                                    </h3>
                                    {customer.company && (
                                      <p className="text-xs text-gray-600 truncate">{customer.company}</p>
                                    )}
                                  </div>
                                  
                                  {/* 1.4 أيقونة السحب */}
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                </div>
                                
                                {/* 2. معلومات الاتصال */}
                                <div className="space-y-1 mb-2">
                                  {/* 2.1 رقم الجوال */}
                                  <div className="flex items-center gap-1 text-xs text-gray-700">
                                    <Phone className="w-3 h-3" />
                                    <span className="truncate" dir="ltr">{customer.phone}</span>
                                  </div>
                                  
                                  {/* 2.2 البريد الإلكتروني */}
                                  {customer.email && (
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate" dir="ltr">{customer.email}</span>
                                    </div>
                                  )}
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
                                
                                {/* 4. الأزرار السريعة */}
                                <div className="flex items-center gap-1">
                                  {/* 4.1 زر واتساب */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs hover:bg-green-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`https://wa.me/${customer.phone}`, '_blank');
                                    }}
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </Button>
                                  
                                  {/* 4.2 زر الاتصال */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs hover:bg-blue-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.href = `tel:${customer.phone}`;
                                    }}
                                  >
                                    <Phone className="w-3 h-3" />
                                  </Button>
                                  
                                  {/* 4.3 زر جدولة موعد */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs hover:bg-purple-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast.info('سيتم فتح نموذج جدولة موعد');
                                    }}
                                  >
                                    <Calendar className="w-3 h-3" />
                                  </Button>
                                </div>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>استيراد العملاء</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-gray-500">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>اسحب ملف Excel أو CSV هنا</p>
            <p className="text-sm mt-2">أو اضغط للاختيار</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tags Manager Dialog */}
      <Dialog open={showTagsManager} onOpenChange={setShowTagsManager}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة التاقات</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-gray-500">
            <Tag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>قريباً - إدارة التاقات</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Colors Manager Dialog */}
      <Dialog open={showColorsManager} onOpenChange={setShowColorsManager}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة الألوان</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
            <p>قريباً - تخصيص ألوان الأعمدة</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spacer for bottom bar */}
      <div className="h-24"></div>
    </div>
  );
}
