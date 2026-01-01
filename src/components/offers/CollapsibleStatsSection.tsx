import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BarChart3, Eye, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import OffersStatsCards from "./OffersStatsCards";
import OffersViewsChart from "./OffersViewsChart";

interface CollapsibleStatsSectionProps {
  currentViews: number;
  monthlyViews: number;
  yearlyViews: number;
  totalInteractions: number;
  history: Array<{ date: string; views: number; interactions: number }>;
}

export default function CollapsibleStatsSection({
  currentViews,
  monthlyViews,
  yearlyViews,
  totalInteractions,
  history,
}: CollapsibleStatsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full">
      {/* Header - Collapsible Trigger */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer"
        whileTap={{ scale: 0.99 }}
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-l from-primary/5 to-primary/10 hover:border-primary/40 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">إحصائيات المشاهدات</h3>
                  <p className="text-muted-foreground text-sm">
                    اليوم: {currentViews.toLocaleString()} | الشهر: {monthlyViews.toLocaleString()} | السنة: {yearlyViews.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Quick Stats Badges */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs">
                    <Eye className="w-3 h-3" />
                    <span>{currentViews}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>{monthlyViews}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs">
                    <Activity className="w-3 h-3" />
                    <span>{totalInteractions}</span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-6 h-6 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Stats Cards */}
              <OffersStatsCards
                currentViews={currentViews}
                monthlyViews={monthlyViews}
                yearlyViews={yearlyViews}
                totalInteractions={totalInteractions}
              />

              {/* Chart */}
              <OffersViewsChart data={history} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
