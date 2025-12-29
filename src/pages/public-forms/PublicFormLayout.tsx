/**
 * PublicFormLayout.tsx
 * Layout مشترك لجميع الصفحات العامة للعملاء
 * يحتوي على هيدر الوسيط ومعلوماته
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
      <header className="bg-gradient-to-r from-[#01411C] to-[#065f41] text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Profile Image */}
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden">
              {broker.profileImage ? (
                <img src={broker.profileImage} alt={broker.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-[#D4AF37]" />
              )}
            </div>

            {/* Broker Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{broker.name}</h1>
                {broker.verified && (
                  <Badge className="bg-[#D4AF37] text-[#01411C] text-xs">
                    <Shield className="w-3 h-3 ml-1" />
                    موثق
                  </Badge>
                )}
              </div>
              <p className="text-white/80 text-sm">{broker.company}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {broker.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {broker.location}
                </span>
              </div>
            </div>

            {/* Rating */}
            <div className="text-center">
              <div className="flex items-center gap-1 text-[#D4AF37]">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold">{broker.rating}</span>
              </div>
              <p className="text-xs text-white/60">التقييم</p>
            </div>
          </div>

          {/* License Info */}
          <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
            <Award className="w-3 h-3" />
            <span>رخصة فال: {broker.licenseNumber}</span>
          </div>
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
