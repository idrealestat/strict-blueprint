/**
 * QuickCalculator.tsx
 * حاسبة عقارية متكاملة - 4 أدوات حسابية
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Percent, 
  Building2, 
  Landmark, 
  SquareStack,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type CalculatorType = 'meter-price' | 'commission' | 'tax' | 'building-area';

interface CalculatorOption {
  id: CalculatorType;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}

const calculatorOptions: CalculatorOption[] = [
  {
    id: 'meter-price',
    title: 'سعر المتر المربع',
    description: 'احسب سعر المتر من إجمالي السعر والمساحة',
    icon: SquareStack,
    gradient: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-500'
  },
  {
    id: 'commission',
    title: 'حساب العمولة',
    description: 'احسب عمولة الوساطة العقارية',
    icon: Percent,
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-500'
  },
  {
    id: 'tax',
    title: 'ضريبة التصرفات العقارية',
    description: 'احسب الضريبة 5% على قيمة العقار',
    icon: Landmark,
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500'
  },
  {
    id: 'building-area',
    title: 'مسطح البناء',
    description: 'احسب المساحة الإجمالية للمبنى',
    icon: Building2,
    gradient: 'from-purple-500 to-pink-500',
    iconBg: 'bg-purple-500'
  }
];

const QuickCalculator = () => {
  const [selectedCalculator, setSelectedCalculator] = useState<CalculatorType | null>(null);
  const [copied, setCopied] = useState(false);

  // Meter Price Calculator
  const [meterTotalPrice, setMeterTotalPrice] = useState<string>('');
  const [meterArea, setMeterArea] = useState<string>('');
  const meterPriceResult = meterTotalPrice && meterArea && parseFloat(meterArea) > 0
    ? parseFloat(meterTotalPrice) / parseFloat(meterArea)
    : 0;

  // Commission Calculator
  const [commissionPrice, setCommissionPrice] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<string>('2.5');
  const commissionResult = commissionPrice && commissionRate
    ? (parseFloat(commissionPrice) * parseFloat(commissionRate)) / 100
    : 0;

  // Tax Calculator
  const [taxPrice, setTaxPrice] = useState<string>('');
  const taxRate = 5; // 5% ضريبة التصرفات العقارية في السعودية
  const taxResult = taxPrice ? (parseFloat(taxPrice) * taxRate) / 100 : 0;
  const taxNetPrice = taxPrice ? parseFloat(taxPrice) - taxResult : 0;

  // Building Area Calculator
  const [floorArea, setFloorArea] = useState<string>('');
  const [floorCount, setFloorCount] = useState<string>('');
  const [basementArea, setBasementArea] = useState<string>('');
  const [roofArea, setRoofArea] = useState<string>('');
  const buildingAreaResult = 
    (parseFloat(floorArea || '0') * parseFloat(floorCount || '0')) +
    parseFloat(basementArea || '0') +
    parseFloat(roofArea || '0');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-SA').format(Math.round(num * 100) / 100);
  };

  const copyResult = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: 'تم النسخ', description: 'تم نسخ النتيجة إلى الحافظة' });
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCalculator = () => {
    setMeterTotalPrice('');
    setMeterArea('');
    setCommissionPrice('');
    setCommissionRate('2.5');
    setTaxPrice('');
    setFloorArea('');
    setFloorCount('');
    setBasementArea('');
    setRoofArea('');
  };

  const renderCalculatorContent = () => {
    switch (selectedCalculator) {
      case 'meter-price':
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">إجمالي سعر العقار (ريال)</Label>
                <Input
                  type="number"
                  placeholder="مثال: 1,500,000"
                  value={meterTotalPrice}
                  onChange={(e) => setMeterTotalPrice(e.target.value)}
                  className="text-lg h-12"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">المساحة (م²)</Label>
                <Input
                  type="number"
                  placeholder="مثال: 500"
                  value={meterArea}
                  onChange={(e) => setMeterArea(e.target.value)}
                  className="text-lg h-12"
                  dir="ltr"
                />
              </div>
            </div>
            
            {meterPriceResult > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800"
              >
                <div className="text-center">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    سعر المتر المربع
                  </div>
                  <div className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                    {formatNumber(meterPriceResult)} <span className="text-lg">ريال/م²</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyResult(meterPriceResult.toFixed(2))}
                    className="mt-2"
                  >
                    {copied ? <Check className="w-4 h-4 ml-1" /> : <Copy className="w-4 h-4 ml-1" />}
                    نسخ
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        );

      case 'commission':
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">قيمة الصفقة (ريال)</Label>
                <Input
                  type="number"
                  placeholder="مثال: 2,000,000"
                  value={commissionPrice}
                  onChange={(e) => setCommissionPrice(e.target.value)}
                  className="text-lg h-12"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">نسبة العمولة (%)</Label>
                <div className="flex gap-2">
                  {['1', '2', '2.5', '3', '5'].map((rate) => (
                    <Button
                      key={rate}
                      variant={commissionRate === rate ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCommissionRate(rate)}
                      className={commissionRate === rate ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                      {rate}%
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="أو أدخل نسبة مخصصة"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="mt-2 h-10"
                  dir="ltr"
                  step="0.1"
                />
              </div>
            </div>
            
            {commissionResult > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800"
              >
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">العمولة</div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatNumber(commissionResult)} ريال
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">شاملة الضريبة (15%)</div>
                    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                      {formatNumber(commissionResult * 1.15)} ريال
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyResult(commissionResult.toFixed(2))}
                  className="mt-4 w-full"
                >
                  {copied ? <Check className="w-4 h-4 ml-1" /> : <Copy className="w-4 h-4 ml-1" />}
                  نسخ مبلغ العمولة
                </Button>
              </motion.div>
            )}
          </div>
        );

      case 'tax':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Landmark className="w-5 h-5" />
                <span className="font-medium">ضريبة التصرفات العقارية: {taxRate}%</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                تُفرض على جميع التصرفات العقارية في المملكة العربية السعودية
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">قيمة العقار (ريال)</Label>
              <Input
                type="number"
                placeholder="مثال: 1,000,000"
                value={taxPrice}
                onChange={(e) => setTaxPrice(e.target.value)}
                className="text-lg h-12"
                dir="ltr"
              />
            </div>
            
            {taxResult > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-800"
              >
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                  <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
                    <div className="text-sm text-amber-600 dark:text-amber-400 mb-1">مبلغ الضريبة</div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {formatNumber(taxResult)} ريال
                    </div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">صافي للبائع</div>
                    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                      {formatNumber(taxNetPrice)} ريال
                    </div>
                  </div>
                </div>
                <div className="text-center p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <span className="text-sm text-amber-700 dark:text-amber-400">
                    إجمالي المبلغ شامل الضريبة: <strong>{formatNumber(parseFloat(taxPrice || '0'))} ريال</strong>
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        );

      case 'building-area':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">مساحة الدور الواحد (م²)</Label>
                <Input
                  type="number"
                  placeholder="مثال: 300"
                  value={floorArea}
                  onChange={(e) => setFloorArea(e.target.value)}
                  className="h-11"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">عدد الأدوار</Label>
                <Input
                  type="number"
                  placeholder="مثال: 3"
                  value={floorCount}
                  onChange={(e) => setFloorCount(e.target.value)}
                  className="h-11"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">مساحة السرداب (م²)</Label>
                <Input
                  type="number"
                  placeholder="اختياري"
                  value={basementArea}
                  onChange={(e) => setBasementArea(e.target.value)}
                  className="h-11"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">ملحق السطح (م²)</Label>
                <Input
                  type="number"
                  placeholder="اختياري"
                  value={roofArea}
                  onChange={(e) => setRoofArea(e.target.value)}
                  className="h-11"
                  dir="ltr"
                />
              </div>
            </div>
            
            {buildingAreaResult > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800"
              >
                <div className="text-center mb-4">
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-2 flex items-center justify-center gap-2">
                    <Building2 className="w-4 h-4" />
                    إجمالي مسطح البناء
                  </div>
                  <div className="text-4xl font-bold text-purple-700 dark:text-purple-300">
                    {formatNumber(buildingAreaResult)} <span className="text-lg">م²</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {parseFloat(floorArea || '0') > 0 && parseFloat(floorCount || '0') > 0 && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 text-center">
                      <span className="text-gray-600 dark:text-gray-400">الأدوار: </span>
                      <span className="font-medium">{formatNumber(parseFloat(floorArea) * parseFloat(floorCount))} م²</span>
                    </div>
                  )}
                  {parseFloat(basementArea || '0') > 0 && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 text-center">
                      <span className="text-gray-600 dark:text-gray-400">السرداب: </span>
                      <span className="font-medium">{formatNumber(parseFloat(basementArea))} م²</span>
                    </div>
                  )}
                  {parseFloat(roofArea || '0') > 0 && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 text-center">
                      <span className="text-gray-600 dark:text-gray-400">السطح: </span>
                      <span className="font-medium">{formatNumber(parseFloat(roofArea))} م²</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedCalculator ? (
          <motion.div
            key="options"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {calculatorOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    onClick={() => setSelectedCalculator(option.id)}
                    className="cursor-pointer border-2 border-gray-200 dark:border-gray-700 hover:border-[#D4AF37] transition-all duration-300 hover:shadow-xl group overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl ${option.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <IconComponent className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1 group-hover:text-[#01411C] transition-colors">
                            {option.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {option.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#D4AF37] group-hover:translate-x-[-4px] transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
          >
            <Card className="border-2 border-[#D4AF37] shadow-xl">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const option = calculatorOptions.find(o => o.id === selectedCalculator);
                      if (!option) return null;
                      const IconComponent = option.icon;
                      return (
                        <>
                          <div className={`w-12 h-12 rounded-xl ${option.iconBg} flex items-center justify-center shadow-lg`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                              {option.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              حاسبة عقارية
                            </Badge>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={resetCalculator}
                      className="h-9 w-9"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCalculator(null);
                        resetCalculator();
                      }}
                    >
                      <ArrowRight className="w-4 h-4 ml-1 rotate-180" />
                      رجوع
                    </Button>
                  </div>
                </div>

                {/* Calculator Content */}
                {renderCalculatorContent()}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickCalculator;
