/**
 * ReceivedQuoteResponseModal.tsx
 * مودال الرد على طلب عرض السعر المستلم
 * مع الموافقة/الرفض والملاحظات والمشاركة
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X, Check, XCircle, Send, Phone, MessageCircle, Star, 
  FileText, User, DollarSign, MapPin, Home, Calendar,
  Download, Edit2, Plus, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceivedDocument {
  id: string;
  type: string;
  typeName: string;
  source: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  propertyType?: string;
  city?: string;
  notes?: string;
  items: { id: string; description: string; amount: number }[];
  subtotal: number;
  vatPercent: number;
  vatAmount: number;
  total: number;
  status: string;
  createdAt: string;
}

interface UserData {
  name: string;
  companyName: string;
  falLicense: string;
  phone: string;
  profileImage?: string;
  logoImage?: string;
}

interface ReceivedQuoteResponseModalProps {
  document: ReceivedDocument;
  userData: UserData;
  onClose: () => void;
  onRespond?: (response: any) => void;
}

export default function ReceivedQuoteResponseModal({
  document,
  userData,
  onClose,
  onRespond
}: ReceivedQuoteResponseModalProps) {
  const [responseType, setResponseType] = useState<'approve' | 'reject' | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [showOfficialQuote, setShowOfficialQuote] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // بنود عرض السعر الرسمي
  const [officialItems, setOfficialItems] = useState(
    document.items.length > 0 
      ? document.items 
      : [{ id: '1', description: '', amount: 0 }]
  );
  const [vat, setVat] = useState(document.vatPercent || 15);

  // الحسابات
  const subtotal = officialItems.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = (subtotal * vat) / 100;
  const total = subtotal + vatAmount;

  // الصور
  const defaultProfileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'وسيط')}&background=01411C&color=D4AF37&size=192&bold=true&font-size=0.4`;
  const defaultLogoImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.companyName || 'شركة')}&background=D4AF37&color=01411C&size=192&bold=true&font-size=0.35`;
  
  const profileImage = userData?.profileImage || defaultProfileImage;
  const logoImage = userData?.logoImage || defaultLogoImage;
  const mainImage = swapped ? logoImage : profileImage;
  const smallImage = swapped ? profileImage : logoImage;

  // إضافة/حذف/تحديث بنود
  const addItem = () => {
    setOfficialItems([...officialItems, { id: Date.now().toString(), description: '', amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (officialItems.length > 1) {
      setOfficialItems(officialItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: 'description' | 'amount', value: string | number) => {
    setOfficialItems(officialItems.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'amount' ? Number(value) : value }
        : item
    ));
  };

  // إرسال الرد عبر WhatsApp
  const sendViaWhatsApp = (isApproval: boolean) => {
    const phone = document.customerPhone.replace(/^0/, '966');
    let message = '';
    
    if (isApproval) {
      const itemsList = officialItems
        .filter(i => i.description)
        .map((item, i) => `${i + 1}. ${item.description}: ${item.amount.toLocaleString()} ر.س`)
        .join('\n');
      
      message = `*عرض سعر رسمي*\n\nالسيد/ة ${document.customerName} المحترم/ة\n\nبناءً على طلبكم، نرفق لكم عرض السعر التالي:\n\n📋 البنود:\n${itemsList}\n\n💰 المجموع الفرعي: ${subtotal.toLocaleString()} ر.س\n📊 الضريبة (${vat}%): ${vatAmount.toLocaleString()} ر.س\n✅ الإجمالي: ${total.toLocaleString()} ر.س\n\n${responseNotes ? `📝 ملاحظات: ${responseNotes}\n\n` : ''}---\n${userData.name}\n${userData.companyName}\n📞 ${userData.phone}${userData.falLicense ? `\n🏷️ رخصة فال: ${userData.falLicense}` : ''}`;
    } else {
      message = `السيد/ة ${document.customerName} المحترم/ة\n\nنشكرك على تواصلك معنا.\n\nللأسف لا نستطيع تلبية طلبك في الوقت الحالي.\n\n${responseNotes ? `📝 السبب: ${responseNotes}\n\n` : ''}نتمنى لك التوفيق.\n\n---\n${userData.name}\n${userData.companyName}\n📞 ${userData.phone}`;
    }
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    saveResponse(isApproval ? 'approved' : 'rejected');
  };

  // إرسال عبر SMS
  const sendViaSMS = (isApproval: boolean) => {
    let message = '';
    
    if (isApproval) {
      message = `عرض سعر من ${userData.name} - الإجمالي: ${total.toLocaleString()} ر.س. للتفاصيل تواصل: ${userData.phone}`;
    } else {
      message = `شكراً لتواصلك. للأسف لا نستطيع تلبية طلبك حالياً. ${userData.name} - ${userData.phone}`;
    }
    
    window.open(`sms:${document.customerPhone}?body=${encodeURIComponent(message)}`, '_blank');
    saveResponse(isApproval ? 'approved' : 'rejected');
  };

  // حفظ الرد وتحديث المستند
  const saveResponse = (status: 'approved' | 'rejected') => {
    const response = {
      status,
      responseNotes,
      respondedAt: new Date().toISOString(),
      officialQuote: status === 'approved' ? {
        items: officialItems,
        subtotal,
        vatPercent: vat,
        vatAmount,
        total,
      } : null,
    };

    // تحديث المستند في localStorage
    const receivedDocs = JSON.parse(localStorage.getItem('received_documents') || '[]');
    const docIndex = receivedDocs.findIndex((d: any) => d.id === document.id);
    if (docIndex !== -1) {
      receivedDocs[docIndex] = { ...receivedDocs[docIndex], ...response };
      localStorage.setItem('received_documents', JSON.stringify(receivedDocs));
    }

    // تحديث المستند في بطاقة العميل
    const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
    customers.forEach((customer: any, idx: number) => {
      if (customer.documents) {
        const docIdx = customer.documents.findIndex((d: any) => d.id === document.id);
        if (docIdx !== -1) {
          customers[idx].documents[docIdx] = { ...customers[idx].documents[docIdx], ...response };
        }
      }
    });
    localStorage.setItem('crm_customers', JSON.stringify(customers));

    // إطلاق حدث الإشعار
    window.dispatchEvent(new CustomEvent('addNotification', {
      detail: {
        title: status === 'approved' ? '✅ تم الموافقة على الطلب' : '❌ تم رفض الطلب',
        message: `${status === 'approved' ? 'تمت الموافقة على' : 'تم رفض'} طلب ${document.customerName}`,
        type: status === 'approved' ? 'success' : 'warning',
        category: 'document_response',
      }
    }));

    if (onRespond) {
      onRespond(response);
    }

    toast.success(status === 'approved' ? 'تمت الموافقة وإرسال عرض السعر' : 'تم رفض الطلب');
    onClose();
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
      
      const fileName = `عرض_سعر_${document.customerName.replace(/\s/g, '_')}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.pdf`;
      
      pdf.save(fileName);
      toast.success('تم تحميل عرض السعر بصيغة PDF');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // شاشة عرض السعر الرسمي
  if (showOfficialQuote) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 overflow-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* محتوى عرض السعر للـ PDF */}
          <div ref={previewRef} className="bg-white">
            {/* رأس بطاقة الأعمال */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-[#01411C] to-[#065f41] relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
              </div>

              <div className="absolute bottom-0 right-4 transform translate-y-1/2 flex items-end">
                <div className="relative cursor-pointer" onClick={() => setSwapped(!swapped)}>
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                    <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -left-2 bottom-0 w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
                    <img src={smallImage} alt="Secondary" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 left-4 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                ))}
              </div>
            </div>

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
                <h2 className="text-xl font-bold text-[#01411C]">عرض سعر رسمي</h2>
                <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('ar-SA')}</p>
              </div>

              {/* معلومات العميل */}
              <Card className="border-[#D4AF37]/30">
                <CardContent className="p-3">
                  <p className="text-sm text-gray-600">العميل</p>
                  <p className="font-bold text-gray-800">{document.customerName}</p>
                  <p className="text-sm text-gray-500 dir-ltr text-right">{document.customerPhone}</p>
                  {document.propertyType && (
                    <p className="text-xs text-gray-500 mt-1">
                      <Home className="w-3 h-3 inline ml-1" />
                      {document.propertyType}
                      {document.city && ` - ${document.city}`}
                    </p>
                  )}
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
                    {officialItems.filter(i => i.description).map((item) => (
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

              {/* الملاحظات */}
              {responseNotes && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">ملاحظات:</p>
                  <p className="text-sm text-gray-700">{responseNotes}</p>
                </div>
              )}

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
          </div>

          {/* أزرار الإجراءات */}
          <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => setShowOfficialQuote(false)}
            >
              <Edit2 className="w-4 h-4" />
              تعديل
            </Button>
            <Button 
              className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={downloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? <span className="animate-spin">⏳</span> : <Download className="w-4 h-4" />}
              PDF
            </Button>
            <Button 
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => sendViaWhatsApp(true)}
            >
              <MessageCircle className="w-4 h-4" />
              واتساب
            </Button>
            <Button 
              className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => sendViaSMS(true)}
            >
              <Phone className="w-4 h-4" />
              SMS
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // الشاشة الرئيسية - عرض الطلب المستلم
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 overflow-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* الهيدر */}
        <div className="p-4 bg-gradient-to-r from-[#01411C] to-[#065f41] text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">طلب عرض سعر مستلم</h3>
                <p className="text-xs text-white/70">
                  {new Date(document.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* معلومات العميل */}
          <Card className="border-[#D4AF37]/30">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                <User className="w-4 h-4" />
                معلومات العميل
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">الاسم:</span>
                  <p className="font-medium">{document.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-500">الجوال:</span>
                  <p className="font-medium dir-ltr text-right">{document.customerPhone}</p>
                </div>
                {document.propertyType && (
                  <div>
                    <span className="text-gray-500">نوع العقار:</span>
                    <p className="font-medium">{document.propertyType}</p>
                  </div>
                )}
                {document.city && (
                  <div>
                    <span className="text-gray-500">المدينة:</span>
                    <p className="font-medium">{document.city}</p>
                  </div>
                )}
              </div>
              {document.notes && (
                <div className="pt-2 border-t">
                  <span className="text-gray-500 text-sm">ملاحظات العميل:</span>
                  <p className="text-sm text-gray-700">{document.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* الميزانية المتوقعة */}
          {document.total > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 font-medium">الميزانية المتوقعة:</span>
                  <span className="text-xl font-bold text-green-700">{document.total.toLocaleString()} ر.س</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* الرد - الموافقة */}
          {responseType === 'approve' && (
            <Card className="border-green-300">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-bold text-green-700 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  إنشاء عرض سعر رسمي
                </h4>
                
                {/* بنود عرض السعر */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">البنود</Label>
                    <Button variant="outline" size="sm" onClick={addItem} className="text-xs gap-1">
                      <Plus className="w-3 h-3" />
                      إضافة
                    </Button>
                  </div>
                  {officialItems.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input 
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder={`بند ${index + 1}`}
                          className="text-sm"
                        />
                      </div>
                      <div className="w-24">
                        <Input 
                          type="number"
                          value={item.amount || ''}
                          onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                          placeholder="المبلغ"
                          className="text-sm"
                          dir="ltr"
                        />
                      </div>
                      {officialItems.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-red-500 h-9 w-9">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* المجموع */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-medium">{subtotal.toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الضريبة ({vat}%):</span>
                    <span className="font-medium">{vatAmount.toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span className="text-[#01411C]">الإجمالي:</span>
                    <span className="text-[#01411C]">{total.toLocaleString()} ر.س</span>
                  </div>
                </div>

                {/* ملاحظات */}
                <div>
                  <Label className="text-sm">ملاحظات للعميل</Label>
                  <textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية..."
                    className="w-full border rounded-lg p-2 text-sm mt-1 resize-none"
                    rows={2}
                  />
                </div>

                {/* أزرار الإرسال */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setResponseType(null)}
                  >
                    رجوع
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                    onClick={() => setShowOfficialQuote(true)}
                  >
                    <FileText className="w-4 h-4" />
                    معاينة
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* الرد - الرفض */}
          {responseType === 'reject' && (
            <Card className="border-red-300">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-bold text-red-700 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  رفض الطلب
                </h4>
                
                <div>
                  <Label className="text-sm">سبب الرفض أو ملاحظات</Label>
                  <textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="اذكر سبب الرفض أو أي ملاحظات للعميل..."
                    className="w-full border rounded-lg p-2 text-sm mt-1 resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setResponseType(null)}
                  >
                    رجوع
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => sendViaWhatsApp(false)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    واتساب
                  </Button>
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2"
                    onClick={() => sendViaSMS(false)}
                  >
                    <Phone className="w-4 h-4" />
                    SMS
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* أزرار الإجراءات الرئيسية */}
          {!responseType && (
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 gap-2"
                onClick={() => setResponseType('approve')}
              >
                <Check className="w-5 h-5" />
                موافقة وإرسال عرض سعر
              </Button>
              <Button 
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 py-6 gap-2"
                onClick={() => setResponseType('reject')}
              >
                <XCircle className="w-5 h-5" />
                رفض
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
