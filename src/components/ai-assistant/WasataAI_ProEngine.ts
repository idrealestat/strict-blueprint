// 🌟 WASATA AI - Pro Mode Engine
// نواة الذكاء الاصطناعي الاحترافية

// ============================================
// WasataAI Smart Operating Layer v1 - Global States
// ============================================

export const WasataAI_GlobalStates = {
  currentPage: '',
  currentSnapshot: {} as Record<string, unknown>,
  lastExitReason: '',
  userConfusionLevel: 0,
  lastCapturedText: '',
  lastCapturedImage: null as string | null,
  resumeAvailable: false,
  activeClient: {} as Record<string, unknown>,
  activeListing: {} as Record<string, unknown>,
  exitReasonsHistory: [] as Array<{
    reasonCode: string;
    note: string | null;
    at: string;
    page: string;
  }>,
  incomingCallMock: false,
  incomingCallData: null as Record<string, unknown> | null
};

// ============================================
// WasataAI Smart Layer - Function Shells (Phase 0)
// ============================================

// Floating Assistant Functions
export const wasataFloating_openMenu = () => {
  console.log('WasataAI: Opening floating menu...');
};

export const wasataFloating_capture = () => {
  console.log('WasataAI: Opening Smart Capture modal...');
  // Trigger event to open modal
  window.dispatchEvent(new CustomEvent('openWasataSmartCapture'));
};

export const wasataFloating_translate = () => {
  console.log('WasataAI: Translating...');
};

export const wasataFloating_lastClient = () => {
  console.log('WasataAI: Loading last client...');
};

export const wasataFloating_lastListing = () => {
  console.log('WasataAI: Loading last listing...');
};

export const wasataFloating_settings = () => {
  console.log('WasataAI: Opening settings...');
};

// Smart Capture System Functions
export const wasataCapture_runOCR = (input: string) => {
  console.log('WasataAI: Running OCR on input:', input);
  // Placeholder: Will process text extraction in future phase
  return 'Sample extracted text from: ' + input;
};

export const wasataCapture_extractImage = (region: string) => {
  console.log('WasataAI: Extracting image from region:', region);
  // Placeholder: Will capture image in future phase
  return { imageData: 'base64_placeholder', region };
};

export const wasataCapture_autoDetect = (input: string) => {
  console.log('WasataAI: Auto-detecting input type:', input);
  // Placeholder: Random detection for UI demonstration
  return Math.random() > 0.5 ? 'text' : 'image';
};

// Frosted Glass Popup Functions
export const wasataPopup_showTextOptions = (text: string) => {
  console.log('WasataAI: Showing text options for:', text);
};

export const wasataPopup_showImageOptions = (image: string) => {
  console.log('WasataAI: Showing image options for:', image);
};

// Smart-Intent Engine Functions
export const wasataIntent_trackBehavior = (event: { type?: string; [key: string]: unknown }) => {
  console.log('WasataAI: Tracking behavior event:', event);
  
  // Trigger system intelligence event
  if (typeof window !== 'undefined' && (window as any).wasataAI_event) {
    (window as any).wasataAI_event("behavior", { detail: "user_action", event });
  }
  
  // Placeholder: Will implement real behavior analysis in future phase
  
  // Update global state flags (placeholder)
  if (event.type === 'confusion_detected') {
    WasataAI_GlobalStates.userConfusionLevel += 1;
    
    // Notify components about state change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wasataGlobalStateChanged'));
    }
  }
};

export const wasataIntent_detectConfusion = () => {
  console.log('WasataAI: Detecting user confusion...');
  
  // Trigger system intelligence event
  if (typeof window !== 'undefined' && (window as any).wasataAI_event) {
    (window as any).wasataAI_event("behavior", { detail: "confusion_detected" });
  }
  
  // Placeholder: Will implement real confusion detection in future phase
  
  // Update confusion level
  WasataAI_GlobalStates.userConfusionLevel += 1;
  
  // Notify components about state change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wasataGlobalStateChanged'));
  }
  
  // Trigger hint event (placeholder)
  window.dispatchEvent(new CustomEvent('showWasataHint', { 
    detail: { text: 'يبدو أنك تحتاج مساعدة؟', element: 'screen' }
  }));
};

export const wasataIntent_showHint = (element: string) => {
  console.log('WasataAI: Showing hint for element:', element);
  
  // Log event
  if (typeof window !== 'undefined' && (window as any).wasataAI_event) {
    (window as any).wasataAI_event("behavior", { detail: "hint_requested" });
  }
  
  // Trigger hint bubble display
  window.dispatchEvent(new CustomEvent('showWasataHint', { 
    detail: { text: `تلميح حول ${element}`, element }
  }));
};

export const wasataIntent_askUser = (question: string) => {
  console.log('WasataAI: Asking user:', question);
  // Placeholder: Will implement real user dialog in future phase
  
  // Show hint bubble with question
  window.dispatchEvent(new CustomEvent('showWasataHint', { 
    detail: { text: question, element: 'dialog' }
  }));
};

// Auto-Recovery Engine Functions
export const wasataRecovery_saveSnapshot = () => {
  console.log('WasataAI: Saving snapshot...');
  
  // Trigger system intelligence event
  if (typeof window !== 'undefined' && (window as any).wasataAI_event) {
    (window as any).wasataAI_event("snapshot", { info: "state_saved" });
  }
  
  // Prepare snapshot object (placeholder structure)
  const snapshot = {
    page: WasataAI_GlobalStates.currentPage,
    fields: {},          // placeholder
    images: [],          // placeholder
    modalState: null,    // placeholder
    scrollPosition: 0,   // placeholder
    lastInteractionAt: new Date().toISOString()
  };
  
  // Store in global state
  WasataAI_GlobalStates.currentSnapshot = snapshot;
  WasataAI_GlobalStates.resumeAvailable = true;
  
  console.log('WasataAI: Snapshot saved:', snapshot);
};

export const wasataRecovery_detectExit = () => {
  console.log('WasataAI: Detecting exit...');
  
  // Trigger system intelligence event
  if (typeof window !== 'undefined' && (window as any).wasataAI_event) {
    (window as any).wasataAI_event("snapshot", { info: "exit_detected" });
  }
  
  // Set exit reason (placeholder)
  WasataAI_GlobalStates.lastExitReason = 'unknown';
  
  // Set resume available if snapshot exists
  if (WasataAI_GlobalStates.currentSnapshot && Object.keys(WasataAI_GlobalStates.currentSnapshot).length > 0) {
    WasataAI_GlobalStates.resumeAvailable = true;
  }
  
  console.log('WasataAI: Exit detected, resumeAvailable:', WasataAI_GlobalStates.resumeAvailable);
};

export const wasataRecovery_showResumePanel = () => {
  console.log('WasataAI: Showing resume panel...');
  
  // Trigger resume panel display
  window.dispatchEvent(new CustomEvent('showWasataResumePanel'));
};

// Exit Reason Intelligence Functions
export const wasataExit_saveReason = (reasonCode: string, extraData: Record<string, unknown> = {}) => {
  console.log('WasataAI: Exit reason:', reasonCode, extraData);
  
  // Trigger system intelligence event
  if (typeof window !== 'undefined' && (window as any).wasataAI_event) {
    (window as any).wasataAI_event("exit", { reason: reasonCode, extraData });
  }
  
  // Update global state lastExitReason
  WasataAI_GlobalStates.lastExitReason = reasonCode;
  
  // Optionally append to exitReasonsHistory
  const historyEntry = {
    reasonCode: reasonCode,
    note: (extraData.note as string) || null,
    at: new Date().toISOString(),
    page: WasataAI_GlobalStates.currentPage,
    ...extraData
  };
  
  WasataAI_GlobalStates.exitReasonsHistory.push(historyEntry as any);
  
  console.log('WasataAI: Exit reason saved to history:', historyEntry);
};

// Call Interaction Layer Functions
export const wasataCall_handleIncoming = (callData: Record<string, unknown>) => {
  console.log('WasataAI: Handling incoming call:', callData);
};

// Analytics Functions
export const wasataAnalytics_record = (event: string, data: Record<string, unknown>) => {
  console.log('WasataAI: Recording analytics event:', event, data);
};

export const wasataAnalytics_generateReport = () => {
  console.log('WasataAI: Generating analytics report...');
};

// Deep-Link Routing Functions
export const wasataDeepLink_route = (command: string) => {
  console.log('WasataAI: Routing deep-link command:', command);
  
  // Trigger system intelligence event
  if (typeof window !== 'undefined' && (window as any).wasataAI_event) {
    (window as any).wasataAI_event("routing", { command });
  }
  
  // Log current page
  console.log('DeepLink: currentPage =', WasataAI_GlobalStates.currentPage);
  
  // Static routing table
  const WASATA_DEEP_LINK_ROUTES: Record<string, { page: string }> = {
    "open:client": { page: "ClientPage" },
    "open:listing": { page: "ListingPage" },
    "open:platform": { page: "MyPlatform" },
    "new:listing": { page: "ListingCreate" },
    "resume:flow": { page: "ResumeFlowPage" }
  };
  
  // Check if command exists in routing table
  if (WASATA_DEEP_LINK_ROUTES[command]) {
    const target = WASATA_DEEP_LINK_ROUTES[command];
    console.log('Routing to:', target.page);
    
    // Dispatch placeholder navigation event
    window.dispatchEvent(new CustomEvent('navigateToPage', { detail: target.page }));
  } else {
    console.log('Unknown deep-link command');
  }
};

// ============================================
// Interfaces
// ============================================

interface Offer {
  id?: string;
  title?: string;
  price?: number;
  area?: number;
  city?: string;
  district?: string;
  property_type?: string;
  street_width?: number;
  direction?: string;
  age?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  status?: string;
  owner_phone?: string;
}

interface Request {
  property_type?: string;
  city?: string;
  district?: string;
  bedrooms?: number;
  area_min?: number;
  area_max?: number;
  budget_min?: number;
  budget_max?: number;
}

interface Customer {
  name?: string;
  type?: string;
  status?: string;
  priority?: string;
  budget_max?: number;
}

interface Deal {
  final_price?: number;
  initial_price?: number;
  commission_rate?: number;
  payment_method?: string;
  documents?: string[];
  status?: string;
}

interface Context {
  customers: Customer[];
  offers: Offer[];
  requests: Request[];
  deals: Deal[];
}

// ============================================
// AI Actions Handler
// ============================================

export class WasataAI_ProEngine {
  context: Context;
  smartLayer: typeof WasataAI_GlobalStates;

  constructor() {
    this.context = {
      customers: [],
      offers: [],
      requests: [],
      deals: []
    };
    // Initialize WasataAI Smart Layer
    this.smartLayer = WasataAI_GlobalStates;
  }

  // تحديث السياق
  updateContext(data: Partial<Context>) {
    this.context = { ...this.context, ...data };
  }

  // ============================================
  // Action 1: AnalyzeOffer - تحليل عرض عقاري
  // ============================================
  async analyzeOffer(offer: Offer) {
    const analysis = {
      title: `تحليل العرض: ${offer.title}`,
      priceAnalysis: this.analyzePriceRange(offer),
      locationAnalysis: this.analyzeLocation(offer),
      qualityScore: this.calculateQualityScore(offer),
      recommendations: this.generateOfferRecommendations(offer),
      marketComparison: this.compareToMarket(offer)
    };

    return this.formatOfferAnalysis(analysis);
  }

  analyzePriceRange(offer: Offer) {
    const pricePerMeter = (offer.price || 0) / (offer.area || 1);
    const cityAverage = this.getCityAveragePrice(offer.city || '', offer.property_type || '');
    const difference = ((pricePerMeter - cityAverage) / cityAverage * 100).toFixed(1);

    return {
      pricePerMeter: Math.round(pricePerMeter),
      cityAverage: cityAverage,
      difference: difference,
      verdict: parseFloat(difference) > 10 ? 'مرتفع عن السوق' : parseFloat(difference) < -10 ? 'أقل من السوق' : 'مناسب للسوق'
    };
  }

  analyzeLocation(offer: Offer) {
    const locationFactors = {
      city: offer.city || '',
      district: offer.district || '',
      streetWidth: offer.street_width || 0,
      direction: offer.direction || ''
    };

    return {
      score: this.calculateLocationScore(locationFactors),
      strengths: this.getLocationStrengths(locationFactors),
      weaknesses: this.getLocationWeaknesses(locationFactors)
    };
  }

  calculateQualityScore(offer: Offer) {
    let score = 60; // Base score
    
    if ((offer.age || 0) < 5) score += 10;
    if ((offer.street_width || 0) >= 20) score += 10;
    if (offer.direction === 'north' || offer.direction === 'south') score += 5;
    if ((offer.features?.length || 0) > 5) score += 10;
    if ((offer.area || 0) > 400) score += 5;

    return Math.min(score, 100);
  }

  generateOfferRecommendations(offer: Offer) {
    const recommendations: string[] = [];
    const priceAnalysis = this.analyzePriceRange(offer);

    if (parseFloat(priceAnalysis.difference) > 10) {
      recommendations.push('💡 السعر مرتفع - يمكن التفاوض لخفضه 5-10%');
    }
    if ((offer.age || 0) > 10) {
      recommendations.push('🔧 يُنصح بفحص العقار جيدًا قبل الشراء');
    }
    if ((offer.street_width || 0) < 15) {
      recommendations.push('⚠️ الشارع ضيق - قد يؤثر على السعر');
    }
    if ((offer.area || 0) > 500) {
      recommendations.push('✨ مساحة ممتازة للاستثمار');
    }

    return recommendations;
  }

  compareToMarket(offer: Offer) {
    const similarOffers = this.context.offers.filter(o => 
      o.city === offer.city && 
      o.property_type === offer.property_type &&
      o.id !== offer.id
    );

    const avgPrice = similarOffers.reduce((sum, o) => sum + (o.price || 0), 0) / (similarOffers.length || 1);
    const avgArea = similarOffers.reduce((sum, o) => sum + (o.area || 0), 0) / (similarOffers.length || 1);

    return {
      similarOffersCount: similarOffers.length,
      avgPrice: Math.round(avgPrice),
      avgArea: Math.round(avgArea),
      comparison: (offer.price || 0) > avgPrice ? 'أعلى من المتوسط' : 'أقل من المتوسط'
    };
  }

  formatOfferAnalysis(analysis: any) {
    return `أبشر طال عمرك… إليك التحليل الكامل:\n\n` +
      `📊 **تحليل السعر:**\n` +
      `• سعر المتر: ${analysis.priceAnalysis.pricePerMeter.toLocaleString()} ريال\n` +
      `• متوسط السوق: ${analysis.priceAnalysis.cityAverage.toLocaleString()} ريال\n` +
      `• الفرق: ${analysis.priceAnalysis.difference}% (${analysis.priceAnalysis.verdict})\n\n` +
      `📍 **تحليل الموقع:**\n` +
      `• التقييم: ${analysis.locationAnalysis.score}/100\n` +
      `• المميزات: ${analysis.locationAnalysis.strengths.join('، ')}\n\n` +
      `⭐ **جودة العقار:**\n` +
      `• التقييم العام: ${analysis.qualityScore}/100\n\n` +
      `💡 **التوصيات:**\n` +
      analysis.recommendations.map((r: string) => `${r}`).join('\n') + '\n\n' +
      `📈 **مقارنة السوق:**\n` +
      `• عروض مشابهة: ${analysis.marketComparison.similarOffersCount}\n` +
      `• متوسط السعر: ${analysis.marketComparison.avgPrice.toLocaleString()} ريال\n` +
      `• الحكم: ${analysis.marketComparison.comparison}`;
  }

  // ============================================
  // Action 2: AnalyzeRequest - تحليل طلب عميل
  // ============================================
  async analyzeRequest(request: Request, customer: Customer) {
    const needs = this.extractCustomerNeeds(request, customer);
    const budget = this.analyzeBudget(request);
    const matchingOffers = this.findMatchingOffers(request);

    return `أبشر طال عمرك… تحليل الطلب:\n\n` +
      `👤 **احتياجات العميل:**\n` +
      `${needs.map(n => `• ${n}`).join('\n')}\n\n` +
      `💰 **تحليل الميزانية:**\n` +
      `• النطاق: ${budget.min.toLocaleString()} - ${budget.max.toLocaleString()} ريال\n` +
      `• التقييم: ${budget.assessment}\n\n` +
      `🏠 **العروض المطابقة:**\n` +
      `وجدت ${matchingOffers.length} عرض مناسب\n` +
      (matchingOffers.length > 0 ? 
        `أفضل مطابقة: ${matchingOffers[0].title} - ${(matchingOffers[0].price || 0).toLocaleString()} ريال` : 
        'لا توجد مطابقات حالياً');
  }

  extractCustomerNeeds(request: Request, customer: Customer) {
    const needs: string[] = [];
    
    if (request.property_type) needs.push(`نوع العقار: ${this.translatePropertyType(request.property_type)}`);
    if (request.city) needs.push(`المدينة المفضلة: ${request.city}`);
    if (request.district) needs.push(`الحي المفضل: ${request.district}`);
    if (request.bedrooms) needs.push(`عدد الغرف: ${request.bedrooms}`);
    if (request.area_min) needs.push(`المساحة المطلوبة: من ${request.area_min} م²`);
    
    return needs;
  }

  analyzeBudget(request: Request) {
    const min = request.budget_min || 0;
    const max = request.budget_max || 0;
    const range = max - min;

    return {
      min,
      max,
      assessment: range > 500000 ? 'مرن' : range > 200000 ? 'متوسط' : 'محدد'
    };
  }

  findMatchingOffers(request: Request) {
    return this.context.offers.filter(offer => {
      if (offer.status !== 'available') return false;
      if (request.property_type && offer.property_type !== request.property_type) return false;
      if (request.city && offer.city !== request.city) return false;
      if (request.budget_min && (offer.price || 0) < request.budget_min) return false;
      if (request.budget_max && (offer.price || 0) > request.budget_max) return false;
      return true;
    }).sort((a, b) => {
      // Sort by price (closest to middle of budget range)
      const targetPrice = ((request.budget_min || 0) + (request.budget_max || 0)) / 2;
      return Math.abs((a.price || 0) - targetPrice) - Math.abs((b.price || 0) - targetPrice);
    }).slice(0, 5);
  }

  // ============================================
  // Action 3: MatchOfferRequest - مطابقة عرض × طلب
  // ============================================
  async matchOfferRequest(offer: Offer, request: Request) {
    const matchScore = this.calculateMatchScore(offer, request);
    const details = this.getMatchDetails(offer, request);

    return `أبشر طال عمرك… نتيجة المطابقة:\n\n` +
      `🎯 **نسبة التطابق: ${matchScore}%**\n\n` +
      `✅ **نقاط التطابق:**\n` +
      `${details.matches.map(m => `• ${m}`).join('\n')}\n\n` +
      `⚠️ **نقاط الاختلاف:**\n` +
      `${details.mismatches.map(m => `• ${m}`).join('\n')}\n\n` +
      `💡 **التوصية:**\n` +
      `${this.getMatchRecommendation(matchScore)}`;
  }

  calculateMatchScore(offer: Offer, request: Request) {
    let score = 0;
    let total = 0;

    // Property type
    total += 20;
    if (offer.property_type === request.property_type) score += 20;

    // City
    total += 20;
    if (offer.city === request.city) score += 20;

    // District
    if (request.district) {
      total += 10;
      if (offer.district === request.district) score += 10;
    }

    // Price
    total += 25;
    if ((offer.price || 0) >= (request.budget_min || 0) && (offer.price || 0) <= (request.budget_max || Infinity)) {
      score += 25;
    } else {
      const avgBudget = ((request.budget_min || 0) + (request.budget_max || 0)) / 2;
      const priceDiff = Math.abs((offer.price || 0) - avgBudget);
      const tolerance = avgBudget * 0.2; // 20% tolerance
      if (priceDiff <= tolerance) score += 15;
    }

    // Area
    if (request.area_min || request.area_max) {
      total += 15;
      if ((offer.area || 0) >= (request.area_min || 0) && (offer.area || 0) <= (request.area_max || Infinity)) {
        score += 15;
      }
    }

    // Bedrooms
    if (request.bedrooms) {
      total += 10;
      if (offer.bedrooms === request.bedrooms) score += 10;
    }

    return Math.round((score / total) * 100);
  }

  getMatchDetails(offer: Offer, request: Request) {
    const matches: string[] = [];
    const mismatches: string[] = [];

    if (offer.property_type === request.property_type) {
      matches.push(`نوع العقار متطابق: ${this.translatePropertyType(offer.property_type || '')}`);
    } else {
      mismatches.push(`نوع العقار مختلف`);
    }

    if (offer.city === request.city) {
      matches.push(`المدينة متطابقة: ${offer.city}`);
    } else {
      mismatches.push(`المدينة مختلفة`);
    }

    if ((offer.price || 0) >= (request.budget_min || 0) && (offer.price || 0) <= (request.budget_max || Infinity)) {
      matches.push(`السعر ضمن الميزانية`);
    } else {
      mismatches.push(`السعر خارج الميزانية المحددة`);
    }

    return { matches, mismatches };
  }

  getMatchRecommendation(score: number) {
    if (score >= 80) return '⭐ تطابق ممتاز - يُنصح بعرضه على العميل فوراً';
    if (score >= 60) return '✅ تطابق جيد - مناسب للعرض على العميل';
    if (score >= 40) return '⚠️ تطابق متوسط - قد يحتاج لتفاوض';
    return '❌ تطابق ضعيف - ابحث عن خيارات أفضل';
  }

  // ============================================
  // Action 4: ImproveAd - تحسين الإعلان
  // ============================================
  async improveAd(offer: Offer) {
    const title = this.generateAdTitle(offer);
    const description = this.generateAdDescription(offer);
    const hashtags = this.generateHashtags(offer);

    return `أبشر طال عمرك… إليك الإعلان المحسّن:\n\n` +
      `📢 **العنوان:**\n` +
      `${title}\n\n` +
      `📝 **الوصف:**\n` +
      `${description}\n\n` +
      `#️⃣ **الهاشتاقات:**\n` +
      `${hashtags.join(' ')}`;
  }

  generateAdTitle(offer: Offer) {
    const propertyType = this.translatePropertyType(offer.property_type || '');
    const priceFormatted = ((offer.price || 0) / 1000).toFixed(0) + 'K';
    
    return `🌟 ${propertyType} فاخر${offer.district ? ' في ' + offer.district : ''} | ${priceFormatted} ريال | ${offer.area}م²`;
  }

  generateAdDescription(offer: Offer) {
    let desc = `${this.translatePropertyType(offer.property_type || '')} `;
    
    if (offer.bedrooms) desc += `بـ ${offer.bedrooms} غرف `;
    if (offer.bathrooms) desc += `و ${offer.bathrooms} دورات مياه `;
    desc += `بمساحة ${offer.area} م² `;
    if (offer.city) desc += `في ${offer.city}`;
    if (offer.district) desc += ` - ${offer.district}`;
    
    desc += '\n\n✨ المميزات:\n';
    if (offer.street_width) desc += `• شارع بعرض ${offer.street_width} متر\n`;
    if (offer.direction) desc += `• اتجاه ${this.translateDirection(offer.direction)}\n`;
    if (offer.age) desc += `• عمر العقار ${offer.age} سنوات\n`;
    if (offer.features && offer.features.length > 0) {
      desc += offer.features.slice(0, 5).map(f => `• ${f}`).join('\n');
    }

    desc += `\n\n💰 السعر: ${(offer.price || 0).toLocaleString()} ريال\n`;
    desc += `📞 للتواصل: ${offer.owner_phone || 'راسلنا للاستفسار'}`;

    return desc;
  }

  generateHashtags(offer: Offer) {
    const tags = ['#عقارات_السعودية'];
    
    if (offer.city) tags.push(`#عقارات_${offer.city.replace(/\s/g, '_')}`);
    tags.push(`#${this.translatePropertyType(offer.property_type || '')}`);
    if (offer.property_type === 'villa') tags.push('#فلل_للبيع');
    if (offer.property_type === 'apartment') tags.push('#شقق_للبيع');
    if (offer.property_type === 'land') tags.push('#أراضي_للبيع');
    tags.push('#وساطة_عقارية');

    return tags;
  }

  // ============================================
  // Action 5: GenerateFollowUpPlan - خطة المتابعة
  // ============================================
  async generateFollowUpPlan(customer: Customer) {
    const urgency = this.assessCustomerUrgency(customer);
    const plan = this.createFollowUpSchedule(urgency);

    return `أبشر طال عمرك… خطة المتابعة:\n\n` +
      `👤 **العميل:** ${customer.name}\n` +
      `⚡ **مستوى الإلحاح:** ${urgency}\n\n` +
      `📅 **جدول المتابعة:**\n` +
      `${plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
  }

  assessCustomerUrgency(customer: Customer) {
    if (customer.priority === 'high') return 'عاجل جداً';
    if (customer.status === 'active' && (customer.budget_max || 0) > 1000000) return 'مهم';
    if (customer.status === 'new') return 'متوسط';
    return 'عادي';
  }

  createFollowUpSchedule(urgency: string) {
    if (urgency === 'عاجل جداً') {
      return [
        '📞 اليوم: اتصال مباشر للمتابعة',
        '💬 غداً: رسالة واتساب مع عروض جديدة',
        '📧 بعد 3 أيام: إرسال عروض مخصصة',
        '📞 بعد أسبوع: متابعة هاتفية'
      ];
    } else if (urgency === 'مهم') {
      return [
        '💬 اليوم: رسالة واتساب ترحيبية',
        '📞 بعد يومين: اتصال للمتابعة',
        '📧 بعد أسبوع: عروض جديدة',
        '📞 بعد أسبوعين: متابعة نهائية'
      ];
    } else {
      return [
        '💬 اليوم: رسالة ترحيبية',
        '📧 بعد 3 أيام: عروض عامة',
        '📞 بعد أسبوع: اتصال تعريفي',
        '💬 بعد أسبوعين: تحديث الرغبات'
      ];
    }
  }

  // ============================================
  // Action 6: DealAnalysis - تحليل صفقة
  // ============================================
  async analyzeDeal(deal: Deal, offer: Offer) {
    const profitMargin = this.calculateProfitMargin(deal);
    const risks = this.identifyRisks(deal, offer);
    const timeline = this.estimateTimeline(deal);

    return `أبشر طال عمرك… تحليل الصفقة:\n\n` +
      `💰 **التحليل المالي:**\n` +
      `• السعر النهائي: ${deal.final_price?.toLocaleString() || 'غير محدد'} ريال\n` +
      `• العمولة المتوقعة: ${profitMargin.commission.toLocaleString()} ريال\n` +
      `• نسبة العمولة: ${profitMargin.rate}%\n\n` +
      `⚠️ **المخاطر:**\n` +
      `${risks.map(r => `• ${r}`).join('\n')}\n\n` +
      `⏱️ **الجدول الزمني:**\n` +
      `${timeline}`;
  }

  calculateProfitMargin(deal: Deal) {
    const finalPrice = deal.final_price || deal.initial_price || 0;
    const rate = deal.commission_rate || 2.5;
    const commission = finalPrice * (rate / 100);

    return { commission: Math.round(commission), rate };
  }

  identifyRisks(deal: Deal, offer: Offer) {
    const risks: string[] = [];

    if (deal.payment_method === 'finance') {
      risks.push('⚠️ التمويل: قد يستغرق الموافقة وقتاً');
    }
    if (!deal.documents || deal.documents.length === 0) {
      risks.push('📄 الوثائق: تحتاج للمراجعة والتوثيق');
    }
    if ((offer?.age || 0) > 15) {
      risks.push('🏚️ عمر العقار: يحتاج فحص فني دقيق');
    }
    if (!risks.length) {
      risks.push('✅ لا توجد مخاطر واضحة');
    }

    return risks;
  }

  estimateTimeline(deal: Deal) {
    return `• التفاوض: 1-2 أسبوع\n` +
      `• التوثيق: 3-5 أيام\n` +
      `• الدفع: 1-2 أسبوع\n` +
      `• الإفراغ: 2-3 أيام\n\n` +
      `⏱️ المدة الإجمالية: 2-4 أسابيع`;
  }

  // ============================================
  // Action 7: SmartQuestions - أسئلة ذكية
  // ============================================
  generateSmartQuestions(context: { type: string }) {
    const questions: string[] = [];

    if (context.type === 'buyer') {
      questions.push(
        '🏠 ما المناطق الثلاث المفضلة لك؟',
        '💰 إذا وجدنا عقار مثالي بسعر أعلى 10%، هل ستفكر فيه؟',
        '⏰ ما مدى استعجالك؟ شهر؟ ثلاثة أشهر؟',
        '👨‍👩‍👧‍👦 هل لديك أطفال؟ (لنختار حي مناسب)',
        '🚗 هل توفر مواقف السيارات مهم لك؟'
      );
    } else if (context.type === 'seller') {
      questions.push(
        '📊 هل تعرف سعر السوق الحالي لعقارك؟',
        '⏰ هل لديك موعد محدد للبيع؟',
        '💡 هل أنت منفتح على التفاوض؟',
        '📄 هل جميع الوثائق جاهزة؟',
        '🔑 متى يمكن تسليم العقار للمشتري؟'
      );
    }

    return questions;
  }

  // ============================================
  // Helper Methods
  // ============================================
  getCityAveragePrice(city: string, propertyType: string) {
    const averages: Record<string, Record<string, number>> = {
      'الرياض': { apartment: 2000, villa: 3000, land: 1500 },
      'جدة': { apartment: 1800, villa: 2800, land: 1400 },
      'الدمام': { apartment: 1600, villa: 2500, land: 1200 }
    };

    return averages[city]?.[propertyType] || 2000;
  }

  calculateLocationScore(factors: { city: string; district: string; streetWidth: number; direction: string }) {
    let score = 60;
    if (factors.streetWidth >= 20) score += 15;
    if (factors.streetWidth >= 30) score += 10;
    if (factors.direction === 'north' || factors.direction === 'south') score += 15;
    return Math.min(score, 100);
  }

  getLocationStrengths(factors: { city: string; district: string; streetWidth: number; direction: string }) {
    const strengths: string[] = [];
    if (factors.streetWidth >= 20) strengths.push('شارع واسع');
    if (factors.direction === 'north') strengths.push('اتجاه شمالي ممتاز');
    if (!strengths.length) strengths.push('موقع جيد');
    return strengths;
  }

  getLocationWeaknesses(factors: { city: string; district: string; streetWidth: number; direction: string }) {
    const weaknesses: string[] = [];
    if (factors.streetWidth < 15) weaknesses.push('شارع ضيق');
    if (factors.direction === 'west') weaknesses.push('اتجاه غربي');
    if (!weaknesses.length) weaknesses.push('لا توجد نقاط ضعف واضحة');
    return weaknesses;
  }

  translatePropertyType(type: string) {
    const types: Record<string, string> = {
      apartment: 'شقة',
      villa: 'فيلا',
      land: 'أرض',
      commercial: 'تجاري',
      building: 'عمارة'
    };
    return types[type] || type;
  }

  translateDirection(direction: string) {
    const directions: Record<string, string> = {
      north: 'شمالي',
      south: 'جنوبي',
      east: 'شرقي',
      west: 'غربي',
      northeast: 'شمال شرقي',
      northwest: 'شمال غربي',
      southeast: 'جنوب شرقي',
      southwest: 'جنوب غربي'
    };
    return directions[direction] || direction;
  }
}

// Export singleton instance
export const wasataAI = new WasataAI_ProEngine();
