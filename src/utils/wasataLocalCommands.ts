// نظام معالجة الأوامر المحلية لوساطه AI
// يتعامل مع الحسابات والأسئلة العقارية محلياً

export interface CommandResult {
  text: string;
  buttons?: CommandButton[];
  handled: boolean;
}

export interface CommandButton {
  label: string;
  action: string;
  icon?: string;
}

// البيانات المرجعية
const bankRates = {
  rajhi: { name: 'مصرف الراجحي', rate: 5.25, type: 'ثابت' },
  ahli: { name: 'البنك الأهلي', rate: 5.15, type: 'متغير' },
  riyad: { name: 'بنك الرياض', rate: 5.35, type: 'ثابت' },
  bilad: { name: 'بنك البلاد', rate: 5.30, type: 'ثابت' },
  inma: { name: 'مصرف الإنماء', rate: 5.10, type: 'ثابت' },
  jazira: { name: 'بنك الجزيرة', rate: 5.40, type: 'ثابت' }
};

const averagePrices = {
  riyadh: {
    city: 'الرياض',
    villa: { min: 1500000, max: 4000000 },
    apartment: { min: 400000, max: 1200000 },
    land: { min: 1500, max: 3500 } // ريال/م²
  },
  jeddah: {
    city: 'جدة',
    villa: { min: 1200000, max: 3500000 },
    apartment: { min: 350000, max: 1000000 },
    land: { min: 1200, max: 3000 }
  },
  dammam: {
    city: 'الدمام',
    villa: { min: 1000000, max: 3000000 },
    apartment: { min: 300000, max: 900000 },
    land: { min: 1000, max: 2500 }
  }
};

// استخراج الأرقام من النص
const extractNumbers = (text: string): number[] => {
  const matches = text.match(/[\d,]+/g);
  if (!matches) return [];
  return matches.map(m => parseFloat(m.replace(/,/g, '')));
};

// معالجة حساب سعر المتر المربع
const handleMeterPriceCalculation = (text: string): CommandResult | null => {
  const lowerText = text.toLowerCase();
  
  if (
    (lowerText.includes('احسب') || lowerText.includes('حساب') || lowerText.includes('كيف احسب')) &&
    (lowerText.includes('متر') || lowerText.includes('م²'))
  ) {
    const numbers = extractNumbers(text);
    
    if (numbers.length >= 2) {
      // نفترض أن الرقم الأصغر هو المساحة والأكبر هو السعر
      const sortedNumbers = [...numbers].sort((a, b) => a - b);
      let area = sortedNumbers[0];
      let price = sortedNumbers[sortedNumbers.length - 1];
      
      // إذا كانت المساحة أكبر من 10000، نعكس الافتراض
      if (area > 10000) {
        [area, price] = [price, area];
      }
      
      const pricePerMeter = Math.round(price / area);
      
      return {
        handled: true,
        text: `🧮 **حساب سعر المتر المربع:**

📏 المساحة: ${area.toLocaleString('ar-SA')} متر مربع
💰 السعر الإجمالي: ${price.toLocaleString('ar-SA')} ريال

━━━━━━━━━━━━━━━━━
✅ **سعر المتر المربع = ${pricePerMeter.toLocaleString('ar-SA')} ريال/م²**
━━━━━━━━━━━━━━━━━

📊 **طريقة الحساب:**
${price.toLocaleString('ar-SA')} ÷ ${area.toLocaleString('ar-SA')} = ${pricePerMeter.toLocaleString('ar-SA')} ريال/م²

ابشر طال عمرك، هل تحتاج أي حسابات أخرى؟ 🏠`,
        buttons: [
          { label: '🧮 حاسبة التمويل', action: 'navigate:calculator', icon: '🧮' },
          { label: '📊 مقارنة الأسعار', action: 'prices', icon: '📊' }
        ]
      };
    }
    
    return {
      handled: true,
      text: `طال عمرك، عشان أحسب لك سعر المتر المربع، أحتاج منك:

📏 **المساحة** (بالمتر المربع)
💰 **السعر الإجمالي** (بالريال)

**مثال:**
"احسب سعر المتر لأرض 500 متر بسعر 1,500,000"

سم.. أعطني المعلومات وأنا حاضر أحسبها لك! 🧮`,
      buttons: []
    };
  }
  
  return null;
};

// معالجة حساب القسط الشهري
const handleMonthlyPaymentCalculation = (text: string): CommandResult | null => {
  const lowerText = text.toLowerCase();
  
  if (
    (lowerText.includes('احسب') || lowerText.includes('حساب')) &&
    (lowerText.includes('قسط') || lowerText.includes('تمويل') || lowerText.includes('شهري'))
  ) {
    const numbers = extractNumbers(text);
    
    if (numbers.length >= 1) {
      const principal = numbers[0];
      const rate = numbers[1] || 5.25; // نسبة افتراضية
      const years = numbers[2] || 25; // 25 سنة افتراضي
      
      const monthlyRate = rate / 100 / 12;
      const numPayments = years * 12;
      const monthlyPayment = Math.round(
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      );
      
      const totalPayment = monthlyPayment * numPayments;
      const totalInterest = totalPayment - principal;
      
      return {
        handled: true,
        text: `🏦 **حساب القسط الشهري للتمويل العقاري:**

💰 مبلغ التمويل: ${principal.toLocaleString('ar-SA')} ريال
📊 نسبة الفائدة: ${rate}% سنوياً
⏰ مدة التمويل: ${years} سنة (${numPayments} شهر)

━━━━━━━━━━━━━━━━━
✅ **القسط الشهري = ${monthlyPayment.toLocaleString('ar-SA')} ريال**
━━━━━━━━━━━━━━━━━

📈 **التفاصيل:**
• إجمالي المبلغ المسدد: ${totalPayment.toLocaleString('ar-SA')} ريال
• إجمالي الفوائد: ${totalInterest.toLocaleString('ar-SA')} ريال

ابشر طال عمرك! هل تريد مقارنة مع بنوك أخرى؟ 🏦`,
        buttons: [
          { label: '🏦 مقارنة البنوك', action: 'banks', icon: '🏦' },
          { label: '🧮 حاسبة أخرى', action: 'navigate:calculator', icon: '🧮' }
        ]
      };
    }
  }
  
  return null;
};

// معالجة أسعار البنوك
const handleBankRates = (text: string): CommandResult | null => {
  const lowerText = text.toLowerCase();
  
  if (
    lowerText.includes('فائدة') || 
    lowerText.includes('فوائد') || 
    lowerText.includes('بنك') ||
    lowerText.includes('بنوك')
  ) {
    let response = `🏦 **أسعار فوائد التمويل العقاري (تقريبية):**\n\n`;
    
    Object.values(bankRates).forEach(bank => {
      response += `• **${bank.name}**: ${bank.rate}% (${bank.type})\n`;
    });
    
    response += `\n📌 **ملاحظة:** هذه الأسعار تقريبية وقد تختلف حسب الملف الائتماني للعميل.

ابشر، هل تريد حساب القسط الشهري لأحد هذه البنوك؟ 🏦`;
    
    return {
      handled: true,
      text: response,
      buttons: [
        { label: '🧮 احسب القسط', action: 'calculate_payment', icon: '🧮' },
        { label: '📞 تواصل مع مستشار', action: 'contact', icon: '📞' }
      ]
    };
  }
  
  return null;
};

// معالجة الضريبة والعمولة
const handleTaxAndCommission = (text: string): CommandResult | null => {
  const lowerText = text.toLowerCase();
  const numbers = extractNumbers(text);
  
  if (lowerText.includes('ضريبة') && numbers.length >= 1) {
    const price = numbers[0];
    const vat = Math.round(price * 0.15);
    const total = price + vat;
    
    return {
      handled: true,
      text: `🧾 **حساب ضريبة القيمة المضافة (15%):**

💰 السعر الأساسي: ${price.toLocaleString('ar-SA')} ريال
📊 ضريبة القيمة المضافة (15%): ${vat.toLocaleString('ar-SA')} ريال

━━━━━━━━━━━━━━━━━
✅ **الإجمالي شامل الضريبة = ${total.toLocaleString('ar-SA')} ريال**
━━━━━━━━━━━━━━━━━

تم طال عمرك! 🏠`,
      buttons: []
    };
  }
  
  if (lowerText.includes('عمولة') && numbers.length >= 1) {
    const price = numbers[0];
    const commission = Math.round(price * 0.025);
    
    return {
      handled: true,
      text: `💼 **حساب عمولة الوساطة العقارية (2.5%):**

💰 قيمة العقار: ${price.toLocaleString('ar-SA')} ريال
📊 عمولة الوساطة (2.5%): ${commission.toLocaleString('ar-SA')} ريال

━━━━━━━━━━━━━━━━━
✅ **العمولة = ${commission.toLocaleString('ar-SA')} ريال**
━━━━━━━━━━━━━━━━━

📌 **ملاحظة:** العمولة تُقسم عادةً بين البائع والمشتري.

ابشر طال عمرك! 🏠`,
      buttons: []
    };
  }
  
  return null;
};

// معالجة أسعار السوق
const handleMarketPrices = (text: string): CommandResult | null => {
  const lowerText = text.toLowerCase();
  
  if (
    lowerText.includes('أسعار') || 
    lowerText.includes('سعر السوق') ||
    lowerText.includes('متوسط الأسعار')
  ) {
    let response = `📊 **متوسط أسعار العقارات في المملكة (تقريبي):**\n\n`;
    
    Object.values(averagePrices).forEach(city => {
      response += `🏙️ **${city.city}:**\n`;
      response += `   • فلل: ${city.villa.min.toLocaleString('ar-SA')} - ${city.villa.max.toLocaleString('ar-SA')} ريال\n`;
      response += `   • شقق: ${city.apartment.min.toLocaleString('ar-SA')} - ${city.apartment.max.toLocaleString('ar-SA')} ريال\n`;
      response += `   • أراضي: ${city.land.min.toLocaleString('ar-SA')} - ${city.land.max.toLocaleString('ar-SA')} ريال/م²\n\n`;
    });
    
    response += `📌 **المصدر:** المؤشرات العقارية - الهيئة العامة للعقار

الله يسعدك، هل تبي تفاصيل أكثر عن منطقة معينة؟ 🏠`;
    
    return {
      handled: true,
      text: response,
      buttons: [
        { label: '🏠 عروض الرياض', action: 'offers_riyadh', icon: '🏠' },
        { label: '🏠 عروض جدة', action: 'offers_jeddah', icon: '🏠' }
      ]
    };
  }
  
  return null;
};

// الدالة الرئيسية لمعالجة الأوامر
export function processLocalCommand(text: string): CommandResult | null {
  // 1. الحسابات (أولوية قصوى)
  const meterResult = handleMeterPriceCalculation(text);
  if (meterResult) return meterResult;
  
  const paymentResult = handleMonthlyPaymentCalculation(text);
  if (paymentResult) return paymentResult;
  
  const taxResult = handleTaxAndCommission(text);
  if (taxResult) return taxResult;
  
  // 2. معلومات البنوك
  const bankResult = handleBankRates(text);
  if (bankResult) return bankResult;
  
  // 3. أسعار السوق
  const pricesResult = handleMarketPrices(text);
  if (pricesResult) return pricesResult;
  
  // لم يتم التعامل محلياً، سيُرسل للـ AI
  return null;
}
