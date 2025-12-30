/**
 * TabActionsPanel.tsx
 * مكون أزرار الإجراءات للتبويبات: PDF، إعادة نشر، إرسال
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, RefreshCw, Send, FileText, Loader2, Calendar, Clock, MapPin, Home } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';

interface TabData {
  id: string;
  name: string;
  type: 'property_offer' | 'property_request' | 'price_quote' | 'appointment' | 'published_ad' | string;
  data: any;
  createdAt: string;
  isNew?: boolean;
}

interface TabActionsPanelProps {
  tab: TabData;
  customerName: string;
  customerPhone: string;
  onRepublish?: (data: any) => void;
}

export default function TabActionsPanel({ tab, customerName, customerPhone, onRepublish }: TabActionsPanelProps) {
  const navigate = useNavigate();
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [includeOwnerInfo, setIncludeOwnerInfo] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate PDF
  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add Arabic font support (basic)
      doc.setFont('helvetica');
      
      const data = tab.data;
      let yPosition = 20;
      const lineHeight = 8;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(1, 65, 28); // Forest green
      const title = tab.type === 'property_offer' ? 'عرض عقاري' :
                   tab.type === 'property_request' ? 'طلب عقار' :
                   tab.type === 'price_quote' ? 'عرض سعر' :
                   tab.type === 'appointment' ? 'موعد' : 'تفاصيل';
      doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`التاريخ: ${new Date(tab.createdAt).toLocaleDateString('ar-SA')}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += lineHeight * 2;

      // Owner/Client Info
      if (includeOwnerInfo && data) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('معلومات العميل', pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        
        const ownerName = data.ownerName || data.clientName || customerName;
        const ownerPhone = data.ownerPhone || data.clientPhone || customerPhone;
        
        doc.text(`الاسم: ${ownerName}`, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        doc.text(`الجوال: ${ownerPhone}`, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        if (data.ownerIdNumber) {
          doc.text(`رقم الهوية: ${data.ownerIdNumber}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        
        yPosition += lineHeight;
      }

      // Property Info
      if (tab.type === 'property_offer' || tab.type === 'property_request') {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('معلومات العقار', pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        
        if (data.propertyType) {
          doc.text(`نوع العقار: ${data.propertyType}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.purpose) {
          doc.text(`الغرض: ${data.purpose}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.city) {
          doc.text(`المدينة: ${data.city}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.district) {
          doc.text(`الحي: ${data.district}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.area) {
          doc.text(`المساحة: ${data.area} م²`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.price) {
          doc.text(`السعر: ${Number(data.price).toLocaleString()} ريال`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.bedrooms) {
          doc.text(`غرف النوم: ${data.bedrooms}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.bathrooms) {
          doc.text(`دورات المياه: ${data.bathrooms}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.description) {
          yPosition += lineHeight;
          doc.text('الوصف:', pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
          
          // Split long description
          const descLines = doc.splitTextToSize(data.description, pageWidth - 40);
          descLines.forEach((line: string) => {
            doc.text(line, pageWidth - 20, yPosition, { align: 'right' });
            yPosition += lineHeight;
          });
        }
      }

      // Appointment Info
      if (tab.type === 'appointment') {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('تفاصيل الموعد', pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        
        if (data.appointmentType) {
          doc.text(`نوع الموعد: ${data.appointmentType}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.preferredDate) {
          doc.text(`التاريخ: ${data.preferredDate}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.preferredTime) {
          doc.text(`الوقت: ${data.preferredTime}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.meetingLocation) {
          doc.text(`المكان: ${data.meetingLocation}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
      }

      // Price Quote Info
      if (tab.type === 'price_quote') {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('تفاصيل عرض السعر', pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        
        if (data.quoteType) {
          doc.text(`نوع الخدمة: ${data.quoteType}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.budget) {
          doc.text(`الميزانية: ${data.budget} ريال`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
      }

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('تم إنشاؤه بواسطة منصة وساطة', pageWidth / 2, 280, { align: 'center' });

      // Save PDF
      const fileName = `${title}_${customerName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('تم تحميل PDF بنجاح');
      setShowPdfDialog(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle republish - navigate to publish form with auto-fill
  const handleRepublish = () => {
    if (tab.type === 'property_offer') {
      // Store data for auto-fill
      localStorage.setItem('republish_data', JSON.stringify({
        ...tab.data,
        source: 'customer_tab',
        originalTabId: tab.id,
      }));
      
      // Trigger republish callback if provided
      if (onRepublish) {
        onRepublish(tab.data);
      }
      
      toast.success('تم تجهيز البيانات للنشر - انتقل إلى منصتي لإكمال النشر');
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('republishOffer', { 
        detail: tab.data 
      }));
    } else if (tab.type === 'property_request') {
      localStorage.setItem('request_to_platform', JSON.stringify(tab.data));
      toast.success('تم إرسال الطلب إلى قسم الطلبات في منصتي');
    }
  };

  // Render different actions based on tab type
  const renderActions = () => {
    switch (tab.type) {
      case 'property_offer':
        return (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleRepublish}
              className="flex items-center gap-2 bg-[#01411C] hover:bg-[#065f41]"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة نشر
            </Button>
          </div>
        );
      
      case 'property_request':
        return (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleRepublish}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
              إرسال لقسم الطلبات
            </Button>
          </div>
        );
      
      case 'price_quote':
        return (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </Button>
          </div>
        );
      
      case 'appointment':
        return (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                toast.success('تم فتح التقويم');
              }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Calendar className="w-4 h-4" />
              عرض في التقويم
            </Button>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </Button>
          </div>
        );
    }
  };

  // Render tab content
  const renderTabContent = () => {
    const data = tab.data;
    if (!data) return null;

    switch (tab.type) {
      case 'property_offer':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {data.propertyType && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <Home className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{data.propertyType}</span>
                </div>
              )}
              {data.purpose && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{data.purpose}</span>
                </div>
              )}
              {data.city && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span className="text-sm">{data.city} {data.district && `- ${data.district}`}</span>
                </div>
              )}
              {data.price && (
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                  <span className="text-sm font-bold text-purple-700">
                    {Number(data.price).toLocaleString()} ريال
                  </span>
                </div>
              )}
            </div>
            {data.area && (
              <p className="text-sm text-gray-600">المساحة: {data.area} م²</p>
            )}
            {data.bedrooms && data.bathrooms && (
              <p className="text-sm text-gray-600">
                {data.bedrooms} غرف نوم • {data.bathrooms} دورات مياه
              </p>
            )}
            {data.media && data.media.length > 0 && (
              <div className="grid grid-cols-4 gap-1 mt-2">
                {data.media.slice(0, 4).map((m: any, i: number) => (
                  <img 
                    key={i} 
                    src={m.url} 
                    alt={`Property ${i + 1}`}
                    className="aspect-square object-cover rounded"
                  />
                ))}
                {data.media.length > 4 && (
                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                    +{data.media.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'appointment':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium">{data.appointmentType}</p>
                <p className="text-sm text-gray-600">
                  {data.preferredDate} الساعة {data.preferredTime}
                </p>
              </div>
            </div>
            {data.meetingLocation && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {data.meetingLocation}
              </div>
            )}
            {data.notes && (
              <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{data.notes}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="p-3 bg-gray-50 rounded-lg">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Content */}
      {renderTabContent()}

      {/* Action Buttons */}
      {renderActions()}

      {/* PDF Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحميل PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeOwner"
                checked={includeOwnerInfo}
                onCheckedChange={(checked) => setIncludeOwnerInfo(checked === true)}
              />
              <Label htmlFor="includeOwner">تضمين معلومات المالك/العميل</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdfDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={generatePDF} 
              disabled={isGenerating}
              className="bg-[#01411C] hover:bg-[#065f41]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 ml-2" />
                  تحميل
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}