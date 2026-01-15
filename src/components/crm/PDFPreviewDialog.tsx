/**
 * PDFPreviewDialog.tsx
 * معاينة PDF قبل التحميل مع خيارات اختيار المعلومات
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Download,
  Eye,
  Home,
  MapPin,
  User,
  Phone,
  Ruler,
  CheckCircle,
  Mail,
  MessageSquare,
  X,
  Loader2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { generatePropertyPDF } from "@/utils/generatePropertyPDF";
import { supabase } from "@/integrations/supabase/client";

interface PDFSection {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface PDFPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
}

export default function PDFPreviewDialog({
  isOpen,
  onClose,
  property,
}: PDFPreviewDialogProps) {
  const [sections, setSections] = useState<PDFSection[]>([
    { id: 'basic', label: 'المعلومات الأساسية', description: 'نوع العقار، الغرض، السعر، المساحة', icon: <Home className="w-4 h-4" />, enabled: true },
    { id: 'location', label: 'معلومات الموقع', description: 'المدينة، الحي، الشارع، الرمز البريدي', icon: <MapPin className="w-4 h-4" />, enabled: true },
    { id: 'specs', label: 'المواصفات التفصيلية', description: 'الغرف، الحمامات، الأدوار، عمر العقار', icon: <Ruler className="w-4 h-4" />, enabled: true },
    { id: 'images', label: 'صور العقار', description: 'جميع صور العقار المرفقة', icon: <Eye className="w-4 h-4" />, enabled: true },
    { id: 'owner', label: 'معلومات المالك', description: 'اسم المالك ورقم الجوال', icon: <User className="w-4 h-4" />, enabled: true },
    { id: 'features', label: 'المميزات', description: 'قائمة مميزات العقار', icon: <CheckCircle className="w-4 h-4" />, enabled: true },
    { id: 'description', label: 'الوصف', description: 'الوصف التفصيلي للعقار', icon: <FileText className="w-4 h-4" />, enabled: true },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const getFilteredProperty = () => {
    const filtered: any = { ...property };
    
    if (!sections.find(s => s.id === 'owner')?.enabled) {
      delete filtered.ownerName;
      delete filtered.ownerPhone;
      delete filtered.ownerEmail;
    }
    
    if (!sections.find(s => s.id === 'features')?.enabled) {
      delete filtered.features;
    }
    
    if (!sections.find(s => s.id === 'description')?.enabled) {
      delete filtered.aiDescription;
    }
    
    if (!sections.find(s => s.id === 'specs')?.enabled) {
      delete filtered.bedrooms;
      delete filtered.bathrooms;
      delete filtered.livingRooms;
      delete filtered.floors;
      delete filtered.floorNumber;
      delete filtered.streetWidth;
      delete filtered.propertyAge;
      delete filtered.facade;
      delete filtered.furnishing;
    }

    // إزالة الصور إذا لم يتم اختيارها
    if (!sections.find(s => s.id === 'images')?.enabled) {
      delete filtered.images;
      delete filtered.image;
    }

    return filtered;
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const filteredProperty = getFilteredProperty();
      const includeOwner = sections.find(s => s.id === 'owner')?.enabled ?? true;
      
      // إضافة معلومات الوسيط ورابط العرض
      const brokerData = property.broker || {
        name: property.brokerName,
        phone: property.brokerPhone,
        company: property.brokerCompany,
        location: property.locationDetails?.city,
        licenseNumber: property.brokerLicense,
        profileImage: property.brokerProfileImage,
        coverImage: property.brokerCoverImage,
        logoImage: property.brokerLogoImage,
      };
      
      // إنشاء رابط العرض (باستخدام الدومين المنشور)
      const publishedDomain = import.meta.env.VITE_PUBLIC_BASE_DOMAIN || 'strict-page-playbook.lovable.app';
      const offerUrl = property.slug && property.locationDetails?.city && property.locationDetails?.district
        ? `https://${publishedDomain}/${property.slug}/${property.locationDetails.city}/${property.locationDetails.district}/${property.id}`
        : '';
      
      filteredProperty.offerUrl = offerUrl;
      
      await generatePropertyPDF(filteredProperty, includeOwner, brokerData);
      toast.success('تم تحميل ملف PDF بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء ملف PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareViaWhatsApp = () => {
    const selectedSections = sections.filter(s => s.enabled);
    let text = `🏠 *${property.purpose || ''} ${property.propertyType || ''}*\n\n`;
    
    if (selectedSections.find(s => s.id === 'location')) {
      text += `📍 الموقع: ${property.locationDetails?.city || ''} - ${property.locationDetails?.district || ''}\n`;
    }
    
    if (selectedSections.find(s => s.id === 'basic')) {
      text += `📐 المساحة: ${property.area || '-'} م²\n`;
      text += `💰 السعر: ${property.price ? `${parseInt(property.price).toLocaleString()} ريال` : 'اتصل للسعر'}\n`;
    }
    
    if (selectedSections.find(s => s.id === 'specs')) {
      if (property.bedrooms) text += `🛏️ الغرف: ${property.bedrooms}\n`;
      if (property.bathrooms) text += `🚿 الحمامات: ${property.bathrooms}\n`;
    }
    
    if (selectedSections.find(s => s.id === 'description') && property.aiDescription) {
      text += `\n📝 ${property.aiDescription.slice(0, 200)}${property.aiDescription.length > 200 ? '...' : ''}\n`;
    }
    
    if (selectedSections.find(s => s.id === 'owner')) {
      text += `\n📞 للتواصل: ${property.brokerPhone || property.ownerPhone || ''}\n`;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast.success('تم فتح واتساب للمشاركة');
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setIsSendingEmail(true);
    try {
      const selectedSections = sections.filter(s => s.enabled);
      
      const { data, error } = await supabase.functions.invoke('send-property-email', {
        body: {
          recipientEmail,
          property: getFilteredProperty(),
          selectedSections: selectedSections.map(s => s.id),
        },
      });

      if (error) throw error;

      toast.success(`تم إرسال تفاصيل العقار إلى ${recipientEmail}`);
      setShowEmailInput(false);
      setRecipientEmail('');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'حدث خطأ أثناء إرسال البريد الإلكتروني');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0 bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-[#01411C] flex items-center gap-2">
              <Eye className="w-6 h-6" />
              معاينة وتصدير تفاصيل العقار
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* خيارات المعلومات */}
            <Card className="border-2 border-[#D4AF37]/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  اختر المعلومات المراد تضمينها
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      section.enabled 
                        ? 'border-[#01411C] bg-[#01411C]/5' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={section.enabled}
                        onCheckedChange={() => toggleSection(section.id)}
                        className="data-[state=checked]:bg-[#01411C] data-[state=checked]:border-[#01411C]"
                      />
                      <div className={`p-2 rounded-lg ${section.enabled ? 'bg-[#01411C] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {section.icon}
                      </div>
                      <div>
                        <p className="font-medium text-[#01411C]">{section.label}</p>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </div>
                    {section.enabled && (
                      <Badge className="bg-emerald-100 text-emerald-700">مُفعّل</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* معاينة المحتوى */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="pb-3 bg-gray-50">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  معاينة المحتوى
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* المعلومات الأساسية */}
                {sections.find(s => s.id === 'basic')?.enabled && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      المعلومات الأساسية
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                      <span>نوع العقار: <strong>{property.propertyType || '-'}</strong></span>
                      <span>الغرض: <strong>{property.purpose || '-'}</strong></span>
                      <span>السعر: <strong className="text-[#D4AF37]">{property.price ? `${parseInt(property.price).toLocaleString()} ريال` : '-'}</strong></span>
                      <span>المساحة: <strong>{property.area ? `${property.area} م²` : '-'}</strong></span>
                    </div>
                  </div>
                )}

                {/* الموقع */}
                {sections.find(s => s.id === 'location')?.enabled && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      معلومات الموقع
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                      <span>المدينة: <strong>{property.locationDetails?.city || '-'}</strong></span>
                      <span>الحي: <strong>{property.locationDetails?.district || '-'}</strong></span>
                    </div>
                  </div>
                )}

                {/* المواصفات */}
                {sections.find(s => s.id === 'specs')?.enabled && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      المواصفات
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {property.bedrooms && <Badge variant="outline">🛏️ {property.bedrooms} غرف</Badge>}
                      {property.bathrooms && <Badge variant="outline">🚿 {property.bathrooms} حمام</Badge>}
                      {property.floors && <Badge variant="outline">🏢 {property.floors} أدوار</Badge>}
                    </div>
                  </div>
                )}

                {/* الصور */}
                {sections.find(s => s.id === 'images')?.enabled && property.images?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      صور العقار ({property.images.length} صورة)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {property.images.slice(0, 6).map((img: string, i: number) => (
                        <img 
                          key={i} 
                          src={img} 
                          alt={`صورة ${i + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      ))}
                      {property.images.length > 6 && (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-sm">
                          +{property.images.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* المالك */}
                {sections.find(s => s.id === 'owner')?.enabled && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                      <User className="w-4 h-4" />
                      معلومات المالك
                    </h4>
                    <div className="flex gap-4 text-sm bg-green-50 p-3 rounded-lg">
                      <span>الاسم: <strong>{property.ownerName || '-'}</strong></span>
                      <span>الجوال: <strong dir="ltr">{property.ownerPhone || '-'}</strong></span>
                    </div>
                  </div>
                )}

                {/* المميزات */}
                {sections.find(s => s.id === 'features')?.enabled && property.features?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      المميزات
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {property.features.slice(0, 6).map((f: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-blue-50">{f}</Badge>
                      ))}
                      {property.features.length > 6 && (
                        <Badge variant="outline">+{property.features.length - 6}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* الوصف */}
                {sections.find(s => s.id === 'description')?.enabled && property.aiDescription && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      الوصف
                    </h4>
                    <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg line-clamp-3">
                      {property.aiDescription}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* خيارات الإيميل */}
            {showEmailInput && (
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="أدخل البريد الإلكتروني..."
                      className="flex-1 border-blue-300"
                      dir="ltr"
                    />
                    <Button
                      onClick={handleSendEmail}
                      disabled={isSendingEmail}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSendingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-4 h-4 ml-1" />
                          إرسال
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowEmailInput(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2 w-full justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailInput(!showEmailInput)}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Mail className="w-4 h-4 ml-1" />
                مشاركة بالإيميل
              </Button>
              <Button
                variant="outline"
                onClick={handleShareViaWhatsApp}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <MessageSquare className="w-4 h-4 ml-1" />
                مشاركة بالواتساب
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={isGenerating || sections.filter(s => s.enabled).length === 0}
                className="bg-[#01411C] hover:bg-[#01411C]/90 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 ml-1" />
                    تحميل PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
