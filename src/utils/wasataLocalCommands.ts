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

// بيانات العقارات المؤجرة (Mock Data)
export const rentedPropertiesData = [
  {
    id: '1',
    propertyTitle: 'فيلا فاخرة في حي النرجس',
    location: 'الرياض - حي النرجس',
    city: 'الرياض',
    district: 'النرجس',
    ownerName: 'محمد أحمد العتيبي',
    ownerId: 'owner-1',
    ownerEmail: 'mohammed@example.com',
    ownerPhone: '0501234567',
    tenantName: 'خالد سعيد',
    contractStartDate: '2024-01-15',
    contractEndDate: '2025-01-15',
    contractDuration: 12,
    monthlyRent: 8000,
    status: 'active',
    daysRemaining: 32
  },
  {
    id: '2',
    propertyTitle: 'شقة مفروشة في العليا',
    location: 'الرياض - حي العليا',
    city: 'الرياض',
    district: 'العليا',
    ownerName: 'عبدالله محمد الشمري',
    ownerId: 'owner-2',
    ownerEmail: 'abdullah@example.com',
    ownerPhone: '0559876543',
    tenantName: 'أحمد فهد',
    contractStartDate: '2024-03-01',
    contractEndDate: '2025-03-01',
    contractDuration: 12,
    monthlyRent: 4500,
    status: 'active',
    daysRemaining: 78
  },
  {
    id: '3',
    propertyTitle: 'مكتب تجاري في طريق الملك فهد',
    location: 'الرياض - طريق الملك فهد',
    city: 'الرياض',
    district: 'طريق الملك فهد',
    ownerName: 'سعد عبدالرحمن',
    ownerId: 'owner-3',
    ownerEmail: 'saad@example.com',
    ownerPhone: '0561112233',
    tenantName: 'شركة الأمل للتجارة',
    contractStartDate: '2023-12-01',
    contractEndDate: '2024-12-01',
    contractDuration: 12,
    monthlyRent: 15000,
    status: 'expired',
    daysRemaining: 0
  },
  {
    id: '4',
    propertyTitle: 'شقة في حي الياسمين',
    location: 'الرياض - حي الياسمين',
    city: 'الرياض',
    district: 'الياسمين',
    ownerName: 'فهد سليمان',
    ownerId: 'owner-4',
    ownerEmail: 'fahad@example.com',
    ownerPhone: '0544445555',
    tenantName: 'ناصر العنزي',
    contractStartDate: '2024-06-01',
    contractEndDate: '2025-06-01',
    contractDuration: 12,
    monthlyRent: 3500,
    status: 'active',
    daysRemaining: 170
  },
  {
    id: '5',
    propertyTitle: 'فيلا دوبلكس في الملقا',
    location: 'الرياض - حي الملقا',
    city: 'الرياض',
    district: 'الملقا',
    ownerName: 'محمد أحمد العتيبي',
    ownerId: 'owner-1',
    ownerEmail: 'mohammed@example.com',
    ownerPhone: '0501234567',
    tenantName: 'عمر الحربي',
    contractStartDate: '2024-02-01',
    contractEndDate: '2025-02-01',
    contractDuration: 12,
    monthlyRent: 12000,
    status: 'expiring_soon',
    daysRemaining: 48
  }
];

// معالجة استعلامات العقارات المؤجرة
const handleRentalQueries = (text: string): CommandResult | null => {
  const lowerText = text.toLowerCase();
  
  // البحث عن عقارات في حي معين
  const districtMatch = text.match(/(?:حي|منطقة|شارع)\s+(\S+)/);
  if (districtMatch && (lowerText.includes('مؤجر') || lowerText.includes('تأجير') || lowerText.includes('إيجار') || lowerText.includes('ملاك'))) {
    const searchDistrict = districtMatch[1];
    const matchingProperties = rentedPropertiesData.filter(p => 
      p.district.includes(searchDistrict) || p.location.includes(searchDistrict)
    );
    
    if (matchingProperties.length > 0) {
      let response = `🏠 **العقارات المؤجرة في ${searchDistrict}:**\n\n`;
      const uniqueOwners = new Map();
      
      matchingProperties.forEach(prop => {
        response += `📍 **${prop.propertyTitle}**\n`;
        response += `   • المالك: ${prop.ownerName}\n`;
        response += `   • المستأجر: ${prop.tenantName}\n`;
        response += `   • الإيجار: ${prop.monthlyRent.toLocaleString()} ريال/شهر\n`;
        response += `   • ينتهي العقد: ${prop.contractEndDate} (${prop.daysRemaining} يوم متبقي)\n\n`;
        
        if (!uniqueOwners.has(prop.ownerId)) {
          uniqueOwners.set(prop.ownerId, prop);
        }
      });
      
      response += `\n━━━━━━━━━━━━━━━━━\n`;
      response += `📊 **الإحصائيات:**\n`;
      response += `• إجمالي العقارات: ${matchingProperties.length}\n`;
      response += `• عدد الملاك: ${uniqueOwners.size}\n`;
      response += `• إجمالي الإيجار الشهري: ${matchingProperties.reduce((sum, p) => sum + p.monthlyRent, 0).toLocaleString()} ريال\n`;
      response += `\nابشر طال عمرك، تبي أنقلك لبطاقة مالك معين؟ 🏠`;
      
      return {
        handled: true,
        text: response,
        buttons: Array.from(uniqueOwners.values()).map(owner => ({
          label: `👤 ${owner.ownerName}`,
          action: `owner_details:${owner.ownerId}`,
          icon: '👤'
        }))
      };
    } else {
      return {
        handled: true,
        text: `لم أجد عقارات مؤجرة في ${searchDistrict}. تبي تبحث في حي ثاني؟`,
        buttons: [
          { label: '🏠 كل العقارات المؤجرة', action: 'all_rented', icon: '🏠' },
          { label: '📊 تقرير الإيجارات', action: 'navigate:rental-report', icon: '📊' }
        ]
      };
    }
  }
  
  // البحث عن عقارات تنتهي في تاريخ معين أو خلال فترة
  if ((lowerText.includes('ينتهي') || lowerText.includes('انتهاء') || lowerText.includes('تنتهي')) && 
      (lowerText.includes('عقد') || lowerText.includes('عقود') || lowerText.includes('إيجار'))) {
    
    let filterDays = 60; // افتراضي شهرين
    if (lowerText.includes('شهر') && !lowerText.includes('شهرين')) filterDays = 30;
    if (lowerText.includes('شهرين') || lowerText.includes('شهران')) filterDays = 60;
    if (lowerText.includes('ثلاث') || lowerText.includes('3')) filterDays = 90;
    if (lowerText.includes('أسبوع')) filterDays = 7;
    if (lowerText.includes('منتهي') || lowerText.includes('منتهية')) filterDays = 0;
    
    let filteredProperties;
    let timeLabel;
    
    if (filterDays === 0) {
      filteredProperties = rentedPropertiesData.filter(p => p.status === 'expired' || p.daysRemaining === 0);
      timeLabel = 'المنتهية';
    } else {
      filteredProperties = rentedPropertiesData.filter(p => p.daysRemaining > 0 && p.daysRemaining <= filterDays);
      timeLabel = `خلال ${filterDays} يوم`;
    }
    
    if (filteredProperties.length > 0) {
      let response = `⏰ **العقود ${timeLabel}:**\n\n`;
      
      filteredProperties.forEach(prop => {
        const statusIcon = prop.daysRemaining === 0 ? '🔴' : prop.daysRemaining <= 30 ? '🟠' : '🟡';
        response += `${statusIcon} **${prop.propertyTitle}**\n`;
        response += `   • المالك: ${prop.ownerName} (${prop.ownerPhone})\n`;
        response += `   • تاريخ الانتهاء: ${prop.contractEndDate}\n`;
        response += `   • المتبقي: ${prop.daysRemaining > 0 ? `${prop.daysRemaining} يوم` : 'منتهي'}\n\n`;
      });
      
      response += `\n━━━━━━━━━━━━━━━━━\n`;
      response += `⚠️ **تنبيه:** يجب التواصل مع الملاك لتجديد العقود أو ترتيب الإخلاء.\n`;
      response += `\nتبي أرسل تنبيه للملاك؟ 📧`;
      
      return {
        handled: true,
        text: response,
        buttons: [
          { label: '📧 إرسال تنبيهات', action: 'send_rental_notifications', icon: '📧' },
          { label: '📊 تقرير كامل', action: 'navigate:rental-report', icon: '📊' },
          ...filteredProperties.slice(0, 2).map(p => ({
            label: `👤 ${p.ownerName}`,
            action: `owner_details:${p.ownerId}`,
            icon: '👤'
          }))
        ]
      };
    } else {
      return {
        handled: true,
        text: `✅ لا توجد عقود تنتهي ${timeLabel}. كل العقود بحالة جيدة.`,
        buttons: [
          { label: '🏠 كل العقارات المؤجرة', action: 'all_rented', icon: '🏠' }
        ]
      };
    }
  }
  
  // البحث عن معلومات مالك معين
  const ownerMatch = text.match(/(?:المالك|مالك|صاحب)\s+(\S+\s*\S*)/);
  if (ownerMatch || (lowerText.includes('معلومات') && lowerText.includes('مالك'))) {
    const searchName = ownerMatch ? ownerMatch[1] : '';
    const ownerProperties = searchName 
      ? rentedPropertiesData.filter(p => p.ownerName.includes(searchName))
      : rentedPropertiesData;
    
    if (ownerProperties.length > 0 && searchName) {
      const owner = ownerProperties[0];
      const totalRent = ownerProperties.reduce((sum, p) => sum + p.monthlyRent, 0);
      const expiringSoon = ownerProperties.filter(p => p.daysRemaining <= 60 && p.daysRemaining > 0);
      const expired = ownerProperties.filter(p => p.daysRemaining === 0);
      
      let response = `👤 **معلومات المالك: ${owner.ownerName}**\n\n`;
      response += `📞 الجوال: ${owner.ownerPhone}\n`;
      response += `📧 البريد: ${owner.ownerEmail}\n\n`;
      
      response += `🏠 **العقارات المؤجرة (${ownerProperties.length}):**\n`;
      ownerProperties.forEach(prop => {
        const statusIcon = prop.daysRemaining === 0 ? '🔴' : prop.daysRemaining <= 30 ? '🟠' : '🟢';
        response += `${statusIcon} ${prop.propertyTitle}\n`;
        response += `   • الإيجار: ${prop.monthlyRent.toLocaleString()} ريال/شهر\n`;
        response += `   • ينتهي: ${prop.contractEndDate} (${prop.daysRemaining > 0 ? `${prop.daysRemaining} يوم` : 'منتهي'})\n`;
      });
      
      response += `\n━━━━━━━━━━━━━━━━━\n`;
      response += `💰 **إجمالي الإيجار الشهري:** ${totalRent.toLocaleString()} ريال\n`;
      if (expiringSoon.length > 0) response += `⚠️ عقود تنتهي قريباً: ${expiringSoon.length}\n`;
      if (expired.length > 0) response += `🔴 عقود منتهية: ${expired.length}\n`;
      
      response += `\nتبي أفتح لك بطاقة المالك؟ 👤`;
      
      return {
        handled: true,
        text: response,
        buttons: [
          { label: `👤 فتح بطاقة ${owner.ownerName}`, action: `owner_details:${owner.ownerId}:rented`, icon: '👤' },
          { label: '📞 اتصال', action: `call:${owner.ownerPhone}`, icon: '📞' },
          { label: '💬 واتساب', action: `whatsapp:${owner.ownerPhone}`, icon: '💬' }
        ]
      };
    }
  }
  
  // إحصائيات عامة للعقارات المؤجرة
  if ((lowerText.includes('مؤجر') || lowerText.includes('تأجير') || lowerText.includes('إيجار')) && 
      (lowerText.includes('إحصائيات') || lowerText.includes('كم') || lowerText.includes('تقرير') || lowerText.includes('ملخص'))) {
    const totalProperties = rentedPropertiesData.length;
    const activeContracts = rentedPropertiesData.filter(p => p.status === 'active').length;
    const expiringSoon = rentedPropertiesData.filter(p => p.daysRemaining <= 60 && p.daysRemaining > 0).length;
    const expired = rentedPropertiesData.filter(p => p.status === 'expired' || p.daysRemaining === 0).length;
    const totalMonthlyRent = rentedPropertiesData.reduce((sum, p) => sum + p.monthlyRent, 0);
    const uniqueOwners = new Set(rentedPropertiesData.map(p => p.ownerId)).size;
    
    // تجميع حسب الحي
    const byDistrict = rentedPropertiesData.reduce((acc, p) => {
      acc[p.district] = (acc[p.district] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let response = `📊 **إحصائيات العقارات المؤجرة:**\n\n`;
    response += `🏠 إجمالي العقارات: ${totalProperties}\n`;
    response += `✅ عقود نشطة: ${activeContracts}\n`;
    response += `⚠️ تنتهي خلال شهرين: ${expiringSoon}\n`;
    response += `🔴 عقود منتهية: ${expired}\n`;
    response += `👥 عدد الملاك: ${uniqueOwners}\n`;
    response += `💰 إجمالي الإيجار الشهري: ${totalMonthlyRent.toLocaleString()} ريال\n`;
    response += `📅 الإيجار السنوي المتوقع: ${(totalMonthlyRent * 12).toLocaleString()} ريال\n\n`;
    
    response += `📍 **التوزيع حسب الأحياء:**\n`;
    Object.entries(byDistrict).forEach(([district, count]) => {
      response += `   • ${district}: ${count} عقار\n`;
    });
    
    response += `\n━━━━━━━━━━━━━━━━━\n`;
    response += `ابشر طال عمرك، تبي تفاصيل أكثر؟ 🏠`;
    
    return {
      handled: true,
      text: response,
      buttons: [
        { label: '📊 تقرير كامل', action: 'navigate:rental-report', icon: '📊' },
        { label: '⚠️ العقود التي تنتهي', action: 'expiring_contracts', icon: '⚠️' },
        { label: '🏠 كل العقارات', action: 'all_rented', icon: '🏠' }
      ]
    };
  }
  
  // عرض كل العقارات المؤجرة
  if (lowerText.includes('كل') && (lowerText.includes('مؤجر') || lowerText.includes('تأجير'))) {
    let response = `🏠 **جميع العقارات المؤجرة:**\n\n`;
    
    rentedPropertiesData.forEach((prop, index) => {
      const statusIcon = prop.status === 'expired' ? '🔴' : prop.daysRemaining <= 30 ? '🟠' : '🟢';
      response += `${index + 1}. ${statusIcon} **${prop.propertyTitle}**\n`;
      response += `   المالك: ${prop.ownerName} | الإيجار: ${prop.monthlyRent.toLocaleString()} ريال\n`;
      response += `   ينتهي: ${prop.contractEndDate}\n\n`;
    });
    
    return {
      handled: true,
      text: response,
      buttons: rentedPropertiesData.slice(0, 3).map(p => ({
        label: `👤 ${p.ownerName}`,
        action: `owner_details:${p.ownerId}:rented`,
        icon: '👤'
      }))
    };
  }
  
  return null;
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
  // 0. استعلامات العقارات المؤجرة (أولوية عالية)
  const rentalResult = handleRentalQueries(text);
  if (rentalResult) return rentalResult;
  
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
