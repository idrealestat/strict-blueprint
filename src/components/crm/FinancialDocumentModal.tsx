/**
 * FinancialDocumentModal.tsx
 * مكون المستندات المالية - سند قبض / عرض سعر
 * مع معاينة احترافية وحفظ في المستندات
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, FileText, DollarSign, Download, Send, Phone, Mail,
  ArrowRight, Star, Edit2, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { triggerSavedDocumentNotification } from '@/utils/notificationTriggers';

interface UserData {
  name: string;
  companyName: string;
  falLicense: string;
  phone: string;
  profileImage?: string;
  logoImage?: string;
  coverImage?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

interface FinancialDocumentModalProps {
  customerName: string;
  customerPhone: string;
  customerId: string;
  userData: UserData;
  onClose: () => void;
  onSave?: (document: any) => void;
}

export default function FinancialDocumentModal({
  customerName,
  customerPhone,
  customerId,
  userData,
  onClose,
  onSave
}: FinancialDocumentModalProps) {
  const [docType, setDocType] = useState<'receipt' | 'quotation' | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', amount: 0 }]);
  const [vat, setVat] = useState(15);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // الحسابات التلقائية
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = (subtotal * vat) / 100;
  const total = subtotal + vatAmount;

  // إضافة بند جديد
  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', amount: 0 }]);
  };

  // حذف بند
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // تحديث بند
  const updateItem = (id: string, field: 'description' | 'amount', value: string | number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'amount' ? Number(value) : value }
        : item
    ));
  };

  // الصور الافتراضية
  const defaultProfileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'وسيط')}&background=01411C&color=D4AF37&size=192&bold=true&font-size=0.4`;
  const defaultLogoImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.companyName || 'شركة')}&background=D4AF37&color=01411C&size=192&bold=true&font-size=0.35`;
  
  const profileImage = userData?.profileImage || defaultProfileImage;
  const logoImage = userData?.logoImage || defaultLogoImage;
  const mainImage = swapped ? logoImage : profileImage;
  const smallImage = swapped ? profileImage : logoImage;

  // حفظ المستند مع إشعار
  const saveDocument = async (showNotification = true) => {
    const document = {
      id: `doc_${Date.now()}`,
      type: docType,
      typeName: docType === 'quotation' ? 'عرض سعر' : 'سند قبض',
      customerId, // إضافة معرف العميل للوصول السريع
      customerName,
      customerPhone,
      items,
      subtotal,
      vatPercent: vat,
      vatAmount,
      total,
      brokerName: userData.name,
      brokerPhone: userData.phone,
      brokerCompany: userData.companyName,
      falLicense: userData.falLicense,
      createdAt: new Date().toISOString(),
    };

    // حفظ في localStorage للعميل
    const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
    const customerIndex = customers.findIndex((c: any) => c.id === customerId || c.phone === customerPhone);
    
    if (customerIndex !== -1) {
      if (!customers[customerIndex].documents) {
        customers[customerIndex].documents = [];
      }
      customers[customerIndex].documents.push(document);
      localStorage.setItem('crm_customers', JSON.stringify(customers));
    }

    // إطلاق حدث التحديث
    window.dispatchEvent(new CustomEvent('customerDocumentAdded', { 
      detail: { customerId, document } 
    }));

    // إرسال إشعار مع صوت
    if (showNotification) {
      // إطلاق إشعار في واجهة المستخدم مباشرة
      window.dispatchEvent(new CustomEvent('addNotification', {
        detail: {
          title: `💾 تم حفظ ${document.typeName}`,
          message: `تم حفظ ${document.typeName} للعميل ${customerName} - ${total.toLocaleString()} ر.س`,
          type: 'success',
          category: 'saved_document',
        }
      }));
    }

    if (onSave) {
      onSave(document);
    }

    toast.success(`تم حفظ ${document.typeName} بنجاح`);
    onClose();
  };

  // إرسال عبر WhatsApp
  const sendViaWhatsApp = () => {
    const docName = docType === 'quotation' ? 'عرض سعر' : 'سند قبض';
    const itemsList = items.map((item, i) => `${i + 1}. ${item.description}: ${item.amount.toLocaleString()} ر.س`).join('\n');
    const message = `*${docName}*\n\nالعميل: ${customerName}\n\n📋 البنود:\n${itemsList}\n\n💰 المجموع الفرعي: ${subtotal.toLocaleString()} ر.س\n📊 الضريبة (${vat}%): ${vatAmount.toLocaleString()} ر.س\n✅ الإجمالي: ${total.toLocaleString()} ر.س\n\n---\n${userData.name}\n${userData.companyName}\n📞 ${userData.phone}`;
    
    const phone = customerPhone.replace(/^0/, '966');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    setShowSendMenu(false);
    saveDocument();
  };

  // إرسال عبر SMS
  const sendViaSMS = () => {
    const docName = docType === 'quotation' ? 'عرض سعر' : 'سند قبض';
    const message = `${docName} من ${userData.name} - الإجمالي: ${total.toLocaleString()} ر.س`;
    window.open(`sms:${customerPhone}?body=${encodeURIComponent(message)}`, '_blank');
    setShowSendMenu(false);
    saveDocument();
  };

  // إرسال عبر Email
  const sendViaEmail = () => {
    const docName = docType === 'quotation' ? 'عرض سعر' : 'سند قبض';
    const itemsList = items.map((item, i) => `${i + 1}. ${item.description}: ${item.amount.toLocaleString()} ر.س`).join('%0D%0A');
    const subject = `${docName} - ${userData.companyName}`;
    const body = `${docName}%0D%0A%0D%0Aالعميل: ${customerName}%0D%0A%0D%0Aالبنود:%0D%0A${itemsList}%0D%0A%0D%0Aالمجموع الفرعي: ${subtotal.toLocaleString()} ر.س%0D%0Aالضريبة (${vat}%): ${vatAmount.toLocaleString()} ر.س%0D%0Aالإجمالي: ${total.toLocaleString()} ر.س%0D%0A%0D%0A----%0D%0A${userData.name}%0D%0A${userData.companyName}%0D%0A${userData.phone}`;
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setShowSendMenu(false);
    saveDocument();
  };

  // تحميل PDF
  const downloadPDF = async () => {
    if (!previewRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const docName = docType === 'quotation' ? 'عرض_سعر' : 'سند_قبض';
      const fileName = `${docName}_${customerName.replace(/\s/g, '_')}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.pdf`;
      
      pdf.save(fileName);
      toast.success('تم تحميل المستند بصيغة PDF');
      saveDocument();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // شاشة اختيار نوع المستند
  if (!docType) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">اختر نوع المستند</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setDocType('quotation')}
              className="p-6 border-2 border-[#D4AF37] rounded-lg hover:bg-gradient-to-r hover:from-[#fffef7] hover:to-[#f0fdf4] transition-all text-center"
            >
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <p className="font-bold text-gray-800">عرض سعر</p>
              <p className="text-xs text-gray-500 mt-1">لتقديم عروض الأسعار للعملاء</p>
            </button>
            <button
              onClick={() => setDocType('receipt')}
              className="p-6 border-2 border-[#D4AF37] rounded-lg hover:bg-gradient-to-r hover:from-[#fffef7] hover:to-[#f0fdf4] transition-all text-center"
            >
              <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="font-bold text-gray-800">سند قبض</p>
              <p className="text-xs text-gray-500 mt-1">لتوثيق استلام المبالغ</p>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // شاشة المعاينة
  if (showPreview) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 overflow-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* محتوى المستند للتصوير PDF */}
          <div ref={previewRef} className="bg-white">
          {/* رأس بطاقة الأعمال */}
          <div className="relative">
            {/* التدرج اللوني */}
            <div className="h-32 bg-gradient-to-r from-[#01411C] to-[#065f41] relative">
              {userData.coverImage && (
                <img 
                  src={userData.coverImage} 
                  alt="Cover"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
            </div>

            {/* الصور */}
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 flex items-end">
              {/* الصورة الرئيسية */}
              <div 
                className="relative cursor-pointer"
                onClick={() => setSwapped(!swapped)}
              >
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                  <img 
                    src={mainImage} 
                    alt="Main"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* الصورة الصغيرة */}
                <div className="absolute -left-2 bottom-0 w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
                  <img 
                    src={smallImage} 
                    alt="Secondary"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* النجوم */}
            <div className="absolute bottom-2 left-4 flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
              ))}
            </div>
          </div>

          {/* محتوى المستند */}
          <div className="pt-16 px-4 pb-4 space-y-4">
            {/* معلومات الوسيط */}
            <div className="text-right">
              <h3 className="font-bold text-lg text-[#01411C]">{userData.name}</h3>
              <p className="text-sm text-gray-600">{userData.companyName}</p>
              {userData.falLicense && (
                <Badge variant="outline" className="mt-1 text-xs border-[#D4AF37] text-[#D4AF37]">
                  رخصة فال: {userData.falLicense}
                </Badge>
              )}
            </div>

            {/* عنوان المستند */}
            <div className="text-center py-3 bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] rounded-lg border border-[#D4AF37]">
              <h2 className="text-xl font-bold text-[#01411C]">
                {docType === 'quotation' ? 'عرض سعر' : 'سند قبض'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {new Date().toLocaleDateString('ar-SA')}
              </p>
            </div>

            {/* معلومات العميل */}
            <Card className="border-[#D4AF37]/30">
              <CardContent className="p-3">
                <p className="text-sm text-gray-600">العميل</p>
                <p className="font-bold text-gray-800">{customerName}</p>
                <p className="text-sm text-gray-500 dir-ltr text-right">{customerPhone}</p>
              </CardContent>
            </Card>

            {/* جدول البنود */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-3 text-right font-medium text-gray-600">الوصف</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-600">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => i.description).map((item, index) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-2 px-3 text-gray-800">{item.description}</td>
                      <td className="py-2 px-3 text-gray-800 text-left" dir="ltr">
                        {item.amount.toLocaleString()} ر.س
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* المجاميع */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">المجموع الفرعي</span>
                <span className="font-medium">{subtotal.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ضريبة القيمة المضافة ({vat}%)</span>
                <span className="font-medium">{vatAmount.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span className="text-[#01411C]">الإجمالي</span>
                <span className="text-[#01411C]">{total.toLocaleString()} ر.س</span>
              </div>
            </div>

            {/* قسم التوقيع */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500">
                  <p>{userData.phone}</p>
                </div>
                <div className="text-center">
                  <div className="border-t border-dashed border-gray-300 w-32 mb-1" />
                  <p className="text-xs text-gray-500">التوقيع</p>
                </div>
              </div>
            </div>
          </div>
          </div> {/* نهاية previewRef */}

          {/* الأزرار */}
          <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-2 relative">
            <Button 
              variant="outline" 
              className="flex-1 min-w-[80px] gap-2"
              onClick={() => setShowPreview(false)}
            >
              <Edit2 className="w-4 h-4" />
              تعديل
            </Button>
            <Button 
              className="flex-1 min-w-[80px] gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={downloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Download className="w-4 h-4" />
              )}
              تحميل PDF
            </Button>
            <Button 
              className="flex-1 min-w-[80px] gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                saveDocument();
                toast.success('تم حفظ المستند');
              }}
            >
              <Printer className="w-4 h-4" />
              حفظ
            </Button>
            <div className="relative flex-1">
              <Button 
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => setShowSendMenu(!showSendMenu)}
              >
                <Send className="w-4 h-4" />
                إرسال
              </Button>
              
              {/* القائمة المنبثقة */}
              <AnimatePresence>
                {showSendMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg border border-[#D4AF37] overflow-hidden min-w-[140px]"
                  >
                    <button
                      onClick={sendViaSMS}
                      className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Phone className="w-4 h-4 text-blue-600" />
                      رسائل نصية
                    </button>
                    <button
                      onClick={sendViaWhatsApp}
                      className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Send className="w-4 h-4 text-green-600" />
                      واتساب
                    </button>
                    <button
                      onClick={sendViaEmail}
                      className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Mail className="w-4 h-4 text-red-600" />
                      إيميل
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // شاشة إدخال البيانات
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 overflow-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-md w-full p-6 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* الرأس */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {docType === 'quotation' ? (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-800">
                {docType === 'quotation' ? 'عرض سعر' : 'سند قبض'}
              </h3>
              <p className="text-sm text-gray-500">{customerName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* البنود */}
        <div className="space-y-3 mb-4">
          <label className="text-sm font-medium text-gray-700">البنود</label>
          {items.map((item, index) => (
            <div key={item.id} className="flex gap-2">
              <Input
                placeholder="وصف البند"
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="المبلغ"
                value={item.amount || ''}
                onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                className="w-28"
                dir="ltr"
              />
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            className="w-full gap-2 border-dashed"
          >
            <Plus className="w-4 h-4" />
            إضافة بند
          </Button>
        </div>

        {/* الضريبة */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-gray-700">ضريبة القيمة المضافة</label>
          <Input
            type="number"
            value={vat}
            onChange={(e) => setVat(Number(e.target.value))}
            className="w-20"
            dir="ltr"
          />
          <span className="text-gray-500">%</span>
        </div>

        {/* الملخص */}
        <div className="bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] rounded-lg p-4 mb-6 border border-[#D4AF37]/30">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">المجموع الفرعي</span>
            <span className="font-medium">{subtotal.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">الضريبة ({vat}%)</span>
            <span className="font-medium">{vatAmount.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-[#D4AF37]/30 pt-2">
            <span className="text-[#01411C]">الإجمالي</span>
            <span className="text-[#01411C]">{total.toLocaleString()} ر.س</span>
          </div>
        </div>

        {/* الأزرار */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setDocType(null)}
          >
            رجوع
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-[#01411C] to-[#065f41] text-white gap-2"
            onClick={() => setShowPreview(true)}
            disabled={items.every(i => !i.description || i.amount === 0)}
          >
            <ArrowRight className="w-4 h-4" />
            معاينة
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
