/**
 * BehavioralPage.tsx
 * صفحة الذكاء السلوكي
 */

import React from "react";
import { Brain } from "lucide-react";
import OwnerDashboardLayout from "./OwnerDashboardLayout";
import { BehavioralDashboard } from "@/components/behavioral";

const BehavioralPage: React.FC = () => {
  return (
    <OwnerDashboardLayout
      title="الذكاء السلوكي"
      icon={<Brain className="w-5 h-5 text-[#D4AF37]" />}
    >
      <BehavioralDashboard />
    </OwnerDashboardLayout>
  );
};

export default BehavioralPage;
