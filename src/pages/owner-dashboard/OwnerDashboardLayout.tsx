/**
 * OwnerDashboardLayout.tsx
 * Layout wrapper لصفحات لوحة تحكم المالك
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, ChevronLeft, RefreshCw, Home } from "lucide-react";

interface OwnerDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const OwnerDashboardLayout: React.FC<OwnerDashboardLayoutProps> = ({
  children,
  title,
  icon,
  onRefresh,
  isLoading = false
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] to-[#065f41] border-b-2 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-2">
            {/* Title Row */}
            <div className="flex items-center justify-center gap-2">
              {icon}
              <h1 className="text-lg md:text-xl font-bold text-white whitespace-nowrap">{title}</h1>
            </div>
            
            {/* Actions Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/app/owner-dashboard')}
                  className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
                >
                  <Home className="w-3 h-3 ml-1" />
                  الرئيسية
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-3 h-3 ml-1" />
                  رجوع
                </Button>
              </div>

              {onRefresh && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
                >
                  <RefreshCw className={`w-3 h-3 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default OwnerDashboardLayout;
