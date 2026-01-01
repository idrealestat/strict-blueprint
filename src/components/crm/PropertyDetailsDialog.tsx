/**
 * PropertyDetailsDialog.tsx
 * مكون عرض تفاصيل العقار الكاملة
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Home,
  DollarSign,
  User,
  Phone,
  Calendar,
  Building2,
  Bed,
  Bath,
  Ruler,
  FileText,
  Copy,
  Share2,
  X,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface PropertyDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
}

export default function PropertyDetailsDialog({
  isOpen,
  onClose,
  property,
}: PropertyDetailsDialogProps) {
  if (!property) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const shareViaWhatsApp = () => {
    const text = `
🏠 *${property.purpose || ''} ${property.propertyType || ''}*

📍 الموقع: ${property.locationDetails?.city || ''} - ${property.locationDetails?.district || ''}
📐 المساحة: ${property.area || '-'} م²
💰 السعر: ${property.price ? `${parseInt(property.price).toLocaleString()} ريال` : 'اتصل للسعر'}

${property.bedrooms ? `🛏️ الغرف: ${property.bedrooms}` : ''}
${property.bathrooms ? `🚿 الحمامات: ${property.bathrooms}` : ''}

${property.aiDescription || ''}

للتواصل: ${property.brokerPhone || ''}
    `.trim();

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0 bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-[#01411C] flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              تفاصيل العقار
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            {/* العنوان والحالة */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
              <div>
                <h2 className="text-2xl font-bold text-[#01411C]">
                  {property.purpose} {property.propertyType}
                </h2>
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {property.locationDetails?.city || ''} - {property.locationDetails?.district || ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 text-lg px-4 py-2">
                  {property.status === 'published' ? 'منشور' : property.status === 'sold' ? 'مباع' : 'مسودة'}
                </Badge>
                <Badge className="bg-[#D4AF37]/20 text-[#01411C] text-lg px-4 py-2">
                  {property.purpose}
                </Badge>
              </div>
            </div>

            {/* صور العقار */}
            {property.images && property.images.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-[#01411C] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  صور العقار ({property.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {property.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`صورة ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-[#D4AF37]/30 hover:border-[#D4AF37] transition-colors cursor-pointer"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* معلومات العقار الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* المعلومات الأساسية */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-[#01411C] flex items-center gap-2 border-b pb-2">
                  <Home className="w-5 h-5" />
                  المعلومات الأساسية
                </h3>
                <div className="space-y-3">
                  <InfoRow label="نوع العقار" value={property.propertyType || '-'} />
                  <InfoRow label="التصنيف" value={property.category || '-'} />
                  <InfoRow label="الغرض" value={property.purpose || '-'} />
                  <InfoRow 
                    label="السعر" 
                    value={property.price ? `${parseInt(property.price).toLocaleString()} ريال` : '-'} 
                    highlight 
                  />
                  <InfoRow label="المساحة" value={property.area ? `${property.area} م²` : '-'} />
                </div>
              </div>

              {/* معلومات الموقع */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-[#01411C] flex items-center gap-2 border-b pb-2">
                  <MapPin className="w-5 h-5" />
                  معلومات الموقع
                </h3>
                <div className="space-y-3">
                  <InfoRow label="المدينة" value={property.locationDetails?.city || '-'} />
                  <InfoRow label="الحي" value={property.locationDetails?.district || '-'} />
                  <InfoRow label="الشارع" value={property.locationDetails?.street || '-'} />
                  <InfoRow label="رقم المبنى" value={property.locationDetails?.buildingNumber || '-'} />
                  <InfoRow label="الرمز البريدي" value={property.locationDetails?.postalCode || '-'} />
                </div>
              </div>
            </div>

            {/* المواصفات التفصيلية */}
            <div className="space-y-4 p-4 bg-amber-50/50 rounded-lg border border-[#D4AF37]/30">
              <h3 className="font-bold text-[#01411C] flex items-center gap-2 border-b pb-2">
                <Ruler className="w-5 h-5" />
                المواصفات التفصيلية
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.bedrooms && (
                  <SpecCard icon={<Bed className="w-5 h-5" />} label="غرف النوم" value={property.bedrooms} />
                )}
                {property.bathrooms && (
                  <SpecCard icon={<Bath className="w-5 h-5" />} label="دورات المياه" value={property.bathrooms} />
                )}
                {property.livingRooms && (
                  <SpecCard icon={<Home className="w-5 h-5" />} label="الصالات" value={property.livingRooms} />
                )}
                {property.floors && (
                  <SpecCard icon={<Building2 className="w-5 h-5" />} label="الأدوار" value={property.floors} />
                )}
                {property.floorNumber && (
                  <SpecCard icon={<Building2 className="w-5 h-5" />} label="رقم الدور" value={property.floorNumber} />
                )}
                {property.streetWidth && (
                  <SpecCard icon={<Ruler className="w-5 h-5" />} label="عرض الشارع" value={`${property.streetWidth} م`} />
                )}
                {property.propertyAge && (
                  <SpecCard icon={<Calendar className="w-5 h-5" />} label="عمر العقار" value={`${property.propertyAge} سنة`} />
                )}
                {property.facade && (
                  <SpecCard icon={<MapPin className="w-5 h-5" />} label="الواجهة" value={property.facade} />
                )}
              </div>
            </div>

            {/* معلومات المالك */}
            <div className="space-y-4 p-4 bg-green-50/50 rounded-lg border border-emerald-200">
              <h3 className="font-bold text-[#01411C] flex items-center gap-2 border-b pb-2">
                <User className="w-5 h-5" />
                معلومات المالك
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">اسم المالك:</span>
                    <span className="font-medium">{property.ownerName || '-'}</span>
                  </div>
                  {property.ownerName && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(property.ownerName, 'اسم المالك')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">جوال المالك:</span>
                    <span className="font-medium" dir="ltr">{property.ownerPhone || '-'}</span>
                  </div>
                  {property.ownerPhone && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(property.ownerPhone, 'رقم الجوال')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600"
                        onClick={() => window.open(`https://wa.me/${property.ownerPhone.replace(/\D/g, '')}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* المميزات */}
            {property.features && property.features.length > 0 && (
              <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-[#01411C] flex items-center gap-2 border-b pb-2">
                  <CheckCircle className="w-5 h-5" />
                  المميزات
                </h3>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-white">
                      <CheckCircle className="w-3 h-3 ml-1 text-green-500" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* الوصف */}
            {property.aiDescription && (
              <div className="space-y-4 p-4 bg-purple-50/50 rounded-lg border border-purple-200">
                <h3 className="font-bold text-[#01411C] flex items-center gap-2 border-b pb-2">
                  <FileText className="w-5 h-5" />
                  وصف العقار
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {property.aiDescription}
                </p>
              </div>
            )}

            {/* معلومات النشر */}
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  تاريخ النشر: {property.publishedAt ? new Date(property.publishedAt).toLocaleDateString('ar-SA') : '-'}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  ID: {property.id?.slice(0, 8) || '-'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-600"
                onClick={shareViaWhatsApp}
              >
                <Share2 className="w-4 h-4 ml-1" />
                مشاركة
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// مكون صف المعلومات
function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className={`font-medium ${highlight ? 'text-[#D4AF37] text-lg' : ''}`}>{value}</span>
    </div>
  );
}

// مكون بطاقة المواصفات
function SpecCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-[#D4AF37]/20 text-center">
      <div className="text-[#01411C] mb-1">{icon}</div>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-bold text-[#01411C]">{value}</span>
    </div>
  );
}
