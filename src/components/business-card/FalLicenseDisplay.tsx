/**
 * FalLicenseDisplay Component
 * عرض معلومات رخصة فال مع العد التنازلي والألوان المتدرجة
 */

import React from "react";
import { Award, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useFalLicenseAlert } from "@/hooks/useFalLicenseAlert";
import { Skeleton } from "@/components/ui/skeleton";

interface FalLicenseDisplayProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const FalLicenseDisplay: React.FC<FalLicenseDisplayProps> = ({ 
  variant = 'compact',
  className = ''
}) => {
  const { licenseInfo, loading } = useFalLicenseAlert();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (!licenseInfo || !licenseInfo.licenseNumber) {
    return null;
  }

  // أيقونة الحالة
  const StatusIcon = licenseInfo.isExpired 
    ? AlertTriangle 
    : licenseInfo.isExpiringVeryClose || licenseInfo.isExpiringSoon
    ? Clock
    : CheckCircle;

  // ألوان الخلفية المتدرجة
  const getBgGradient = () => {
    if (licenseInfo.isExpired) {
      return 'bg-gradient-to-r from-red-600/20 to-red-500/10 border-red-500/30';
    }
    if (licenseInfo.isExpiringVeryClose) {
      return 'bg-gradient-to-r from-red-500/20 to-orange-500/10 border-red-400/30';
    }
    if (licenseInfo.isExpiringSoon) {
      return 'bg-gradient-to-r from-orange-500/20 to-yellow-500/10 border-orange-400/30';
    }
    if (licenseInfo.daysRemaining <= 60) {
      return 'bg-gradient-to-r from-yellow-500/20 to-lime-500/10 border-yellow-400/30';
    }
    return 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-green-400/30';
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getBgGradient()} ${className}`}>
        <Award className={`w-4 h-4 ${licenseInfo.statusColor}`} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/80">
            فال: {licenseInfo.licenseNumber}
          </span>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-1">
            <StatusIcon className={`w-3 h-3 ${licenseInfo.statusColor}`} />
            <span className={`text-xs font-bold ${licenseInfo.statusColor}`}>
              {licenseInfo.statusMessage}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`p-3 rounded-xl border ${getBgGradient()} ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${licenseInfo.isExpired ? 'bg-red-500/20' : 'bg-white/10'}`}>
          <Award className={`w-5 h-5 ${licenseInfo.statusColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">رخصة فال</span>
            <div className="flex items-center gap-1">
              <StatusIcon className={`w-4 h-4 ${licenseInfo.statusColor}`} />
              <span className={`text-sm font-bold ${licenseInfo.statusColor}`}>
                {licenseInfo.statusMessage}
              </span>
            </div>
          </div>
          
          <p className="text-lg font-bold text-white/90 mt-1 tracking-wide" dir="ltr">
            {licenseInfo.licenseNumber}
          </p>
          
          <div className="flex items-center justify-between mt-2 text-xs text-white/60">
            <span>تاريخ الانتهاء: {licenseInfo.expiryDate}</span>
            <span>
              {licenseInfo.accountType === 'individual' ? 'فردي' : 
               licenseInfo.accountType === 'office' ? 'مكتب' : 'شركة'}
              {licenseInfo.durationYears > 1 && ` (${licenseInfo.durationYears} سنوات)`}
            </span>
          </div>
          
          {/* شريط التقدم */}
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                licenseInfo.isExpired ? 'bg-red-500' :
                licenseInfo.isExpiringVeryClose ? 'bg-red-400' :
                licenseInfo.isExpiringSoon ? 'bg-orange-400' :
                licenseInfo.daysRemaining <= 60 ? 'bg-yellow-400' :
                'bg-green-400'
              }`}
              style={{ 
                width: `${Math.min(100, (licenseInfo.daysRemaining / (licenseInfo.durationYears * 365)) * 100)}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FalLicenseDisplay;
