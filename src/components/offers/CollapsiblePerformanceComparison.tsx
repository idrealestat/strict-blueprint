import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, BarChart2, TrendingUp } from "lucide-react";
import { OffersPerformanceComparison } from "@/components/analytics";

interface OfferPerformance {
  id: string;
  title: string;
  city: string;
  views: number;
  calls: number;
  whatsapp: number;
  shares: number;
  favorites: number;
  conversionRate: number;
  avgTimeOnPage: number;
}

interface CollapsiblePerformanceComparisonProps {
  offers: OfferPerformance[];
  mode?: 'top5' | 'manual' | 'all';
  onModeChange?: (mode: 'top5' | 'manual' | 'all') => void;
}

const CollapsiblePerformanceComparison = ({
  offers,
  mode = 'top5',
  onModeChange
}: CollapsiblePerformanceComparisonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const topOffer = offers.length > 0 
    ? offers.reduce((max, o) => o.views > max.views ? o : max, offers[0])
    : null;

  return (
    <div className="space-y-0" dir="rtl">
      {/* Header Bar - Clickable */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer"
        whileTap={{ scale: 0.99 }}
      >
        <Card className="border-2 border-orange-500/20 bg-gradient-to-l from-orange-500/5 to-amber-500/10 hover:border-orange-500/40 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <BarChart2 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">مقارنة أداء العروض</h3>
                  <p className="text-muted-foreground text-sm">
                    {offers.length} عرض | الأعلى مشاهدة: {topOffer?.title?.substring(0, 20) || 'لا يوجد'}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Quick Stats Badges */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs">
                    <BarChart2 className="w-3 h-3" />
                    <span>{offers.length} عرض</span>
                  </div>
                  {topOffer && (
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span>{topOffer.views} مشاهدة</span>
                    </div>
                  )}
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
            <div className="pt-4">
              <OffersPerformanceComparison
                offers={offers}
                mode={mode}
                onModeChange={onModeChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsiblePerformanceComparison;
