/**
 * QuickCalculatorPage.tsx
 * صفحة الحاسبة السريعة الكاملة
 */

import { ChevronRight, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuickCalculator from '@/components/QuickCalculator';

interface QuickCalculatorPageProps {
  onBack?: () => void;
}

const QuickCalculatorPage = ({ onBack }: QuickCalculatorPageProps) => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#01411C] to-[#065f41] text-white p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="text-white hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4 ml-2" />
                رجوع
              </Button>
            )}
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6 text-[#D4AF37]" />
              الحاسبة السريعة
            </h1>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <QuickCalculator />
        </div>
      </div>
    </div>
  );
};

export default QuickCalculatorPage;
