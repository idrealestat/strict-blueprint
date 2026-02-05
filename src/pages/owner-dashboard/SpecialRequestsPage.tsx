/**
 * SpecialRequestsPage.tsx
 * صفحة طلبات VIP
 */

import React from "react";
import { Target } from "lucide-react";
import OwnerDashboardLayout from "./OwnerDashboardLayout";
import SpecialRequestsAdminPanel from "@/components/admin/SpecialRequestsAdminPanel";

const SpecialRequestsPage: React.FC = () => {
  return (
    <OwnerDashboardLayout
      title="طلبات VIP"
      icon={<Target className="w-5 h-5 text-[#D4AF37]" />}
    >
      <SpecialRequestsAdminPanel />
    </OwnerDashboardLayout>
  );
};

export default SpecialRequestsPage;
