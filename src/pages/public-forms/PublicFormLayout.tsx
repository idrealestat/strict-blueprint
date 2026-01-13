/**
 * PublicFormLayout.tsx
 * Layout مشترك لجميع الصفحات العامة للعملاء
 * يحتوي على هيدر الوسيط مع الصور (الخلفية، البروفايل، الشعار)
 */

import { Building2, Phone, Mail, MapPin, Star, Award, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface BrokerInfo {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  location: string;
  licenseNumber: string;
  rating: number;
  verified: boolean;
  profileImage?: string;
  coverImage?: string;
  logoImage?: string;
}

interface PublicFormLayoutProps {
  broker: BrokerInfo;
  title: string;
  children: React.ReactNode;
}

export default function PublicFormLayout({ broker, title, children }: PublicFormLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01411C] via-[#065f41] to-[#01411C]" dir="rtl">
      {/* Header with Broker Info */}
      <header className="relative text-white shadow-lg overflow-hidden">
        {/* Cover Image Background */}
        {broker.coverImage ? (
          <div className="absolute inset-0">
            <img 
              src={broker.coverImage} 
              alt="غلاف" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#01411C]/70 via-[#01411C]/60 to-[#01411C]/90" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#01411C] to-[#065f41]" />
        )}
        
        <div className="relative max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Profile Image */}
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden flex-shrink-0">
              {broker.profileImage ? (
                <img src={broker.profileImage} alt={broker.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-[#D4AF37]" />
              )}
            </div>

            {/* Broker Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">{broker.name}</h1>
                {broker.verified && (
                  <Badge className="bg-[#D4AF37] text-[#01411C] text-xs flex-shrink-0">
                    <Shield className="w-3 h-3 ml-1" />
                    موثق
                  </Badge>
                )}
              </div>
              <p className="text-white/80 text-sm truncate">{broker.company}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/70 flex-wrap">
                {broker.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {broker.phone}
                  </span>
                )}
                {broker.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {broker.location}
                  </span>
                )}
              </div>
            </div>

            {/* Logo Image */}
            {broker.logoImage ? (
              <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={broker.logoImage} alt="شعار" className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              /* Rating if no logo */
              <div className="text-center flex-shrink-0">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{broker.rating}</span>
                </div>
                <p className="text-xs text-white/60">التقييم</p>
              </div>
            )}
          </div>

          {/* License Info */}
          {broker.licenseNumber && (
            <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
              <Award className="w-3 h-3" />
              <span>رخصة فال: {broker.licenseNumber}</span>
            </div>
          )}
        </div>
      </header>

      {/* Page Title */}
      <div className="bg-[#D4AF37] py-3">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-lg font-bold text-[#01411C] text-center">{title}</h2>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-white/50 text-sm">
        <p>مدعوم من وساطة AI</p>
      </footer>
    </div>
  );
}
