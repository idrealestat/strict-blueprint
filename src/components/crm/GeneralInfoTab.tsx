/**
 * GeneralInfoTab.tsx
 * تبويب المعلومات العامة - مطابق للتصميم من Figma
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Briefcase,
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Upload,
  FileText,
  Image,
  Calendar,
  CheckCircle,
  Lock,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

interface GeneralInfoTabProps {
  customer: Customer;
  isEditing: boolean;
  editedCustomer: Customer;
  setEditedCustomer: (customer: Customer) => void;
}

// نوع العميل مع الألوان
const CUSTOMER_TYPES = [
  { id: 'buyer', name: 'مشتري', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'seller', name: 'بائع', color: 'bg-red-100 text-red-800 border-red-300' },
  { id: 'renter', name: 'مستأجر', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'owner', name: 'مالك', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'investor', name: 'مستثمر', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'other', name: 'آخر', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

// درجة الاهتمام مع الألوان
const INTEREST_LEVELS = [
  { id: 'hot', name: 'متحمس', color: 'bg-red-500 text-white', dotColor: 'bg-red-500' },
  { id: 'warm', name: 'مهتم', color: 'bg-orange-500 text-white', dotColor: 'bg-orange-500' },
  { id: 'moderate', name: 'متوسط', color: 'bg-yellow-400 text-gray-800', dotColor: 'bg-yellow-400' },
  { id: 'cold', name: 'بارد', color: 'bg-blue-400 text-white', dotColor: 'bg-blue-400' },
];

export default function GeneralInfoTab({ 
  customer, 
  isEditing, 
  editedCustomer, 
  setEditedCustomer 
}: GeneralInfoTabProps) {
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);

  const customerType = CUSTOMER_TYPES.find(t => t.id === customer.type);
  const interestLevel = INTEREST_LEVELS.find(l => l.id === customer.interestLevel);

  const handleAddPhone = () => {
    setAdditionalPhones([...additionalPhones, '']);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* القسم الرئيسي - المعلومات العامة */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-700" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-800">المعلومات العامة</CardTitle>
          </div>
          <p className="text-xs text-gray-500 mr-10">البيانات الأساسية والأنشطة</p>
        </CardHeader>
        <CardContent className="p-0">
          {/* المعلومات العامة - القسم الداخلي */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">المعلومات العامة</span>
            </div>
            
            {/* الاسم */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">الاسم</Label>
                  {isEditing ? (
                    <Input 
                      value={editedCustomer.name}
                      onChange={(e) => setEditedCustomer({...editedCustomer, name: e.target.value})}
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">{customer.name}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* الوظيفة */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">الوظيفة</Label>
                  {isEditing ? (
                    <Input 
                      placeholder="مدير مبيعات"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">مدير مبيعات</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* الشركة */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">الشركة</Label>
                  {isEditing ? (
                    <Input 
                      value={editedCustomer.company || ''}
                      onChange={(e) => setEditedCustomer({...editedCustomer, company: e.target.value})}
                      placeholder="شركة العقارات الذكية"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">{customer.company || 'شركة العقارات الذكية'}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* نوع العميل */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">نوع العميل</Label>
                  {isEditing ? (
                    <Select 
                      value={editedCustomer.type} 
                      onValueChange={(value: any) => setEditedCustomer({...editedCustomer, type: value})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOMER_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${customerType?.color} border px-3 py-1`}>
                      {customerType?.name || 'غير محدد'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* درجة الاهتمام */}
            <div className="flex items-center justify-between py-3 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">درجة الاهتمام</Label>
                  {isEditing ? (
                    <Select 
                      value={editedCustomer.interestLevel} 
                      onValueChange={(value: any) => setEditedCustomer({...editedCustomer, interestLevel: value})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEREST_LEVELS.map(level => (
                          <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${interestLevel?.dotColor}`}></span>
                      <Badge className={`${interestLevel?.color} px-3 py-1`}>
                        {interestLevel?.name || 'غير محدد'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* رقم إضافي (فرعي) */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">رقم إضافي (فرعي)</span>
            </div>
          </div>
          <div className="mt-3">
            <Button 
              variant="ghost" 
              className="text-gray-500 hover:text-gray-700 gap-2"
              onClick={handleAddPhone}
            >
              <Plus className="w-4 h-4" />
              إضافة رقم فرعي
            </Button>
            {additionalPhones.map((phone, index) => (
              <Input 
                key={index}
                placeholder="أدخل الرقم الفرعي"
                className="mt-2 h-9"
                value={phone}
                onChange={(e) => {
                  const newPhones = [...additionalPhones];
                  newPhones[index] = e.target.value;
                  setAdditionalPhones(newPhones);
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* بريد الشركة (اختياري) */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">بريد الشركة (اختياري)</span>
            <Lock className="w-3 h-3 text-gray-400 mr-auto" />
          </div>
          <Input 
            placeholder="work@company.com"
            defaultValue="work@company.com"
            className="h-9"
            dir="ltr"
          />
        </CardContent>
      </Card>

      {/* الموقع - خريطة */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <MapPin className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-3">اضغط للاختيار من خرائط قوقل</p>
            <Button variant="outline" className="gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50">
              <MapPin className="w-4 h-4" />
              فتح الخريطة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الوسائط المتعددة */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">الوسائط المتعددة (0/27)</span>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 gap-1">
              <Upload className="w-4 h-4" />
              رفع صور/فيديو
            </Button>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-400">اسحب وأفلت الملفات هنا أو اضغط للرفع</p>
          </div>
        </CardContent>
      </Card>

      {/* المستندات والملفات */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">المستندات والملفات (0)</span>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 gap-1">
              <Upload className="w-4 h-4" />
              رفع مستند
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-gray-600">
              <Upload className="w-4 h-4" />
              رفع PDF, Word, Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدولة الاجتماعات */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">جدولة الاجتماعات (0)</span>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 gap-1">
              <Plus className="w-4 h-4" />
              جدولة اجتماع
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* سجل النشاط التلقائي */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="w-4 h-4 text-purple-700" />
            </div>
            <span className="text-sm font-medium text-gray-700">سجل النشاط التلقائي</span>
          </div>
          
          {/* فلاتر النشاط */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              اتصالات
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              رسائل
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              🗓️ مواعيد
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              📎 مستندات
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              👁️ معاينات
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              ✓ واتساب
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              📧 إيميلات
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              📤 عروض مرسلة
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              📍 مواقع جغرافية
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              ✓ تعديلات
            </Badge>
          </div>

          {/* حالة فارغة */}
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full text-gray-300">
                <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M50 30 L70 50 L50 70 L30 50 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <p className="text-sm text-gray-400">لا يوجد نشاط مسجل بعد</p>
          </div>
        </CardContent>
      </Card>

      {/* المهام */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">لا توجد مهام. اضغط "إضافة مهمة" للبدء</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
