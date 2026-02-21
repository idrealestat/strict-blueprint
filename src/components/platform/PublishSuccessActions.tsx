/**
 * PublishSuccessActions.tsx
 * أزرار ما بعد نشر الإعلان
 * - إعادة النشر
 * - تحميل PDF
 * - الانتقال لبطاقة المالك
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, 
  FileDown, 
  UserCircle, 
  Loader2,
  FileText,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { PublishedAdData } from '@/hooks/usePublishedAdsManager';

interface PublishSuccessActionsProps {
  publishedAd: PublishedAdData;
  onRepublish: () => void;
  onNavigateToOwner: (customerId: string) => void;
  brokerInfo?: {
    name: string;
    phone: string;
    company?: string;
    licenseNumber?: string;
    city?: string;
  };
}

export default function PublishSuccessActions({
  publishedAd,
  onRepublish,
  onNavigateToOwner,
  brokerInfo,
}: PublishSuccessActionsProps) {
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfOption, setPdfOption] = useState<'with_owner' | 'without_owner'>('without_owner');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRepublish = () => {
    // Dispatch event to open publish form with data
    window.dispatchEvent(new CustomEvent('republishAd', { 
      detail: { adData: publishedAd } 
    }));
    onRepublish();
  };

  const handleNavigateToOwner = () => {
    if (publishedAd.linkedCustomerId) {
      onNavigateToOwner(publishedAd.linkedCustomerId);
      // Navigate to CRM with customer selected - open published_ads tab
      window.dispatchEvent(new CustomEvent('openCustomerDetails', {
        detail: { customerId: publishedAd.linkedCustomerId, activeTab: 'published_ads' }
      }));
    } else {
      toast.error('لم يتم ربط المالك بعد');
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add Arabic font support
      doc.setFont('helvetica');
      
      let yPos = 20;
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Header with broker info
      if (brokerInfo) {
        doc.setFillColor(1, 65, 28); // #01411C
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(212, 175, 55); // #D4AF37
        doc.setFontSize(18);
        doc.text(brokerInfo.name || 'الوسيط العقاري', pageWidth / 2, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        if (brokerInfo.company) {
          doc.text(brokerInfo.company, pageWidth / 2, 23, { align: 'center' });
        }
        doc.text(`${brokerInfo.phone || ''} | ${brokerInfo.city || ''}`, pageWidth / 2, 30, { align: 'center' });
        if (brokerInfo.licenseNumber) {
          doc.text(`رقم الترخيص: ${brokerInfo.licenseNumber}`, pageWidth / 2, 37, { align: 'center' });
        }
        
        yPos = 50;
      }

      // Title
      doc.setTextColor(1, 65, 28);
      doc.setFontSize(16);
      doc.text('تفاصيل الإعلان العقاري', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Property Details Section
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setFontSize(12);
      doc.setTextColor(1, 65, 28);
      doc.text('معلومات العقار', pageWidth - margin, yPos + 6, { align: 'right' });
      yPos += 15;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      const propertyDetails = [
        { label: 'نوع العقار', value: publishedAd.propertyType },
        { label: 'الغرض', value: publishedAd.purpose },
        { label: 'المدينة', value: publishedAd.locationDetails?.city },
        { label: 'الحي', value: publishedAd.locationDetails?.district },
        { label: 'المساحة', value: publishedAd.area ? `${publishedAd.area} م²` : '-' },
        { label: 'السعر', value: publishedAd.price ? `${publishedAd.price} ريال` : '-' },
        { label: 'غرف النوم', value: publishedAd.bedrooms || '-' },
        { label: 'دورات المياه', value: publishedAd.bathrooms || '-' },
      ];

      propertyDetails.forEach(item => {
        if (item.value) {
          doc.text(`${item.label}: ${item.value}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 7;
        }
      });

      yPos += 10;

      // Features
      if (publishedAd.features && publishedAd.features.length > 0) {
        doc.setFillColor(240, 253, 244);
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(1, 65, 28);
        doc.text('المميزات', pageWidth - margin, yPos + 6, { align: 'right' });
        yPos += 15;

        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const featuresText = publishedAd.features.join(' • ');
        const lines = doc.splitTextToSize(featuresText, contentWidth);
        lines.forEach((line: string) => {
          doc.text(line, pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
        });
        yPos += 10;
      }

      // Owner & Deed Info (if selected)
      if (pdfOption === 'with_owner') {
        // Owner Info
        doc.setFillColor(255, 254, 247);
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(1, 65, 28);
        doc.text('معلومات المالك', pageWidth - margin, yPos + 6, { align: 'right' });
        yPos += 15;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(`اسم المالك: ${publishedAd.ownerName || '-'}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
        doc.text(`رقم الجوال: ${publishedAd.ownerPhone || '-'}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
        if (publishedAd.ownerIdNumber) {
          doc.text(`رقم الهوية: ${publishedAd.ownerIdNumber}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 7;
        }
        if (publishedAd.ownerNationalAddress) {
          doc.text(`العنوان الوطني: ${publishedAd.ownerNationalAddress}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 7;
        }
        yPos += 10;

        // Deed Info
        if (publishedAd.deedNumber) {
          doc.setFillColor(255, 254, 247);
          doc.rect(margin, yPos, contentWidth, 8, 'F');
          doc.setFontSize(12);
          doc.setTextColor(1, 65, 28);
          doc.text('معلومات الصك', pageWidth - margin, yPos + 6, { align: 'right' });
          yPos += 15;

          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          doc.text(`رقم الصك: ${publishedAd.deedNumber}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 7;
          if (publishedAd.deedDate) {
            doc.text(`تاريخ الصك: ${publishedAd.deedDate}`, pageWidth - margin, yPos, { align: 'right' });
            yPos += 7;
          }
          if (publishedAd.deedCity) {
            doc.text(`مدينة الصك: ${publishedAd.deedCity}`, pageWidth - margin, yPos, { align: 'right' });
          }
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`تم إنشاء هذا الملف بواسطة نظام عقاري AI - ${new Date().toLocaleDateString('ar-SA')}`, pageWidth / 2, 285, { align: 'center' });

      // Save PDF
      const fileName = `عقار_${publishedAd.propertyType}_${publishedAd.locationDetails?.city || ''}_${Date.now()}.pdf`;
      doc.save(fileName);
      
      toast.success('تم تحميل ملف PDF بنجاح');
      setShowPdfDialog(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء ملف PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-[#D4AF37]/30 pt-6 mt-6">
      <h3 className="text-lg font-bold text-[#01411C] text-center mb-4">
        خيارات الإعلان المنشور
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Republish Button */}
        <Button
          onClick={handleRepublish}
          variant="outline"
          className="flex items-center justify-center gap-2 h-14 border-2 border-[#01411C] text-[#01411C] hover:bg-[#01411C] hover:text-white transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="font-medium">نشر الإعلان مرة أخرى</span>
        </Button>

        {/* Download PDF Button */}
        <Button
          onClick={() => setShowPdfDialog(true)}
          variant="outline"
          className="flex items-center justify-center gap-2 h-14 border-2 border-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37] hover:text-[#01411C] transition-all"
        >
          <FileDown className="w-5 h-5" />
          <span className="font-medium">تحميل المعلومات PDF</span>
        </Button>

        {/* Navigate to Owner Card Button */}
        <Button
          onClick={handleNavigateToOwner}
          className="flex items-center justify-center gap-2 h-14 bg-[#01411C] text-[#D4AF37] hover:bg-[#01411C]/90 transition-all"
        >
          <UserCircle className="w-5 h-5" />
          <span className="font-medium">الانتقال إلى بطاقة اسم المالك</span>
        </Button>
      </div>

      {/* PDF Options Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[#01411C] text-right">تحميل ملف PDF</DialogTitle>
            <DialogDescription className="text-right">
              اختر المعلومات التي تريد تضمينها في الملف
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup
              value={pdfOption}
              onValueChange={(value) => setPdfOption(value as 'with_owner' | 'without_owner')}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-[#D4AF37] transition-all cursor-pointer">
                <RadioGroupItem value="without_owner" id="without_owner" />
                <Label htmlFor="without_owner" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Eye className="w-5 h-5 text-[#01411C]" />
                  <div>
                    <p className="font-medium">معلومات العقار فقط</p>
                    <p className="text-sm text-gray-500">بدون معلومات المالك والصك</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-[#D4AF37] transition-all cursor-pointer">
                <RadioGroupItem value="with_owner" id="with_owner" />
                <Label htmlFor="with_owner" className="flex items-center gap-2 cursor-pointer flex-1">
                  <ShieldCheck className="w-5 h-5 text-[#01411C]" />
                  <div>
                    <p className="font-medium">جميع المعلومات</p>
                    <p className="text-sm text-gray-500">مع معلومات المالك والصك</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPdfDialog(false)}
              className="border-gray-300"
            >
              إلغاء
            </Button>
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-[#01411C] text-[#D4AF37] hover:bg-[#01411C]/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 ml-2" />
                  تحميل PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
