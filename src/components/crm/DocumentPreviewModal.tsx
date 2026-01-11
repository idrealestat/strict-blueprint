/**
 * DocumentPreviewModal.tsx
 * مكون معاينة المستند المحفوظ مع إمكانية تحميل PDF
 */

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, FileText, DollarSign, Download, Star, Send, Phone, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DocumentPreviewModalProps {
  document: {
    id: string;
    type: 'receipt' | 'quotation';
    typeName: string;
    customerName: string;
    customerPhone: string;
    items: Array<{ id: string; description: string; amount: number }>;
    subtotal: number;
    vatPercent: number;
    vatAmount: number;
    total: number;
    brokerName: string;
    brokerPhone: string;
    brokerCompany: string;
    falLicense: string;
    createdAt: string;
  };
  userData?: {
    profileImage?: string;
    logoImage?: string;
    coverImage?: string;
  };
  onClose: () => void;
}

export default function DocumentPreviewModal({
  document,
  userData,
  onClose
}: DocumentPreviewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [swapped, setSwapped] = useState(false);

  // الصور الافتراضية
  const defaultProfileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(document.brokerName || 'وسيط')}&background=01411C&color=D4AF37&size=192&bold=true&font-size=0.4`;
  const defaultLogoImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(document.brokerCompany || 'شركة')}&background=D4AF37&color=01411C&size=192&bold=true&font-size=0.35`;
  
  const profileImage = userData?.profileImage || defaultProfileImage;
  const logoImage = userData?.logoImage || defaultLogoImage;
  const mainImage = swapped ? logoImage : profileImage;
  const smallImage = swapped ? profileImage : logoImage;

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
      
      const docName = document.type === 'quotation' ? 'عرض_سعر' : 'سند_قبض';
      const fileName = `${docName}_${document.customerName.replace(/\s/g, '_')}_${new Date(document.createdAt).toLocaleDateString('ar-SA').replace(/\//g, '-')}.pdf`;
      
      pdf.save(fileName);
      toast.success('تم تحميل المستند بصيغة PDF');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // إرسال عبر WhatsApp
  const sendViaWhatsApp = () => {
    const itemsList = document.items.map((item, i) => `${i + 1}. ${item.description}: ${item.amount.toLocaleString()} ر.س`).join('\n');
    const message = `*${document.typeName}*\n\nالعميل: ${document.customerName}\n\n📋 البنود:\n${itemsList}\n\n💰 المجموع الفرعي: ${document.subtotal.toLocaleString()} ر.س\n📊 الضريبة (${document.vatPercent}%): ${document.vatAmount.toLocaleString()} ر.س\n✅ الإجمالي: ${document.total.toLocaleString()} ر.س\n\n---\n${document.brokerName}\n${document.brokerCompany}\n📞 ${document.brokerPhone}`;
    
    const phone = document.customerPhone.replace(/^0/, '966');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

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
              {userData?.coverImage && (
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
              <h3 className="font-bold text-lg text-[#01411C]">{document.brokerName}</h3>
              <p className="text-sm text-gray-600">{document.brokerCompany}</p>
              {document.falLicense && (
                <Badge variant="outline" className="mt-1 text-xs border-[#D4AF37] text-[#D4AF37]">
                  رخصة فال: {document.falLicense}
                </Badge>
              )}
            </div>

            {/* عنوان المستند */}
            <div className="text-center py-3 bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] rounded-lg border border-[#D4AF37]">
              <h2 className="text-xl font-bold text-[#01411C]">
                {document.typeName}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(document.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>

            {/* معلومات العميل */}
            <Card className="border-[#D4AF37]/30">
              <CardContent className="p-3">
                <p className="text-sm text-gray-600">العميل</p>
                <p className="font-bold text-gray-800">{document.customerName}</p>
                <p className="text-sm text-gray-500 dir-ltr text-right">{document.customerPhone}</p>
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
                  {document.items.filter(i => i.description).map((item) => (
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
                <span className="font-medium">{document.subtotal.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ضريبة القيمة المضافة ({document.vatPercent}%)</span>
                <span className="font-medium">{document.vatAmount.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span className="text-[#01411C]">الإجمالي</span>
                <span className="text-[#01411C]">{document.total.toLocaleString()} ر.س</span>
              </div>
            </div>

            {/* قسم التوقيع */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500">
                  <p>{document.brokerPhone}</p>
                </div>
                <div className="text-center">
                  <div className="border-t border-dashed border-gray-300 w-32 mb-1" />
                  <p className="text-xs text-gray-500">التوقيع</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* الأزرار */}
        <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="flex-1 min-w-[80px] gap-2"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
            إغلاق
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
            className="flex-1 min-w-[80px] gap-2 bg-green-600 hover:bg-green-700"
            onClick={sendViaWhatsApp}
          >
            <Send className="w-4 h-4" />
            واتساب
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
