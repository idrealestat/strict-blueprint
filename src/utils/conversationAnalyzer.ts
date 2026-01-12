/**
 * conversationAnalyzer.ts
 * تحليل ذكي للمحادثات لاستخراج النية، نوع المشكلة، ومستوى الثقة
 */

export interface ConversationAnalysis {
  intent: 'seeking_help' | 'reporting_problem' | 'asking_question' | 'giving_feedback' | 'confused' | 'browsing' | 'unknown';
  problemType: 'technical' | 'design' | 'linguistic' | 'process' | 'pricing' | 'navigation' | 'none';
  confidenceLevel: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated';
  userUnderstandingLevel: 'expert' | 'intermediate' | 'beginner';
  actionNeeded: 'immediate' | 'follow_up' | 'monitor' | 'none';
  keywords: string[];
  suggestedAction: string;
}

// كلمات مفتاحية لتحديد نوع المشكلة
const PROBLEM_KEYWORDS = {
  technical: ['خطأ', 'error', 'bug', 'ما يشتغل', 'مشكلة تقنية', 'توقف', 'بطيء', 'crash', 'freeze', 'loading'],
  design: ['تصميم', 'لون', 'شكل', 'مكان', 'زر', 'صغير', 'كبير', 'غير واضح', 'مخفي', 'ما أشوف'],
  linguistic: ['ما فهمت', 'معنى', 'ترجمة', 'عربي', 'انجليزي', 'كلمة', 'نص', 'غير مفهوم', 'صعب'],
  process: ['خطوات', 'كيف', 'طريقة', 'ترتيب', 'تسلسل', 'إجراء', 'عملية', 'ماذا بعد'],
  pricing: ['سعر', 'تسعير', 'قيمة', 'تكلفة', 'فلوس', 'ريال', 'دفع', 'اشتراك'],
  navigation: ['وين', 'أين', 'مكان', 'صفحة', 'رابط', 'زر', 'قائمة', 'تبويب', 'أروح'],
};

// كلمات مفتاحية لتحديد النية
const INTENT_KEYWORDS = {
  seeking_help: ['مساعدة', 'ساعدني', 'أحتاج', 'help', 'أريد'],
  reporting_problem: ['مشكلة', 'خطأ', 'عطل', 'ما يشتغل', 'problem', 'issue'],
  asking_question: ['كيف', 'متى', 'وين', 'ليش', 'هل', 'ما هو', 'ما معنى'],
  giving_feedback: ['اقتراح', 'رأي', 'أفضل', 'ياليت', 'أتمنى', 'ممتاز', 'رائع'],
  confused: ['ما فهمت', 'مو واضح', 'حيران', 'ضايع', 'مو فاهم', 'confused'],
};

// كلمات مفتاحية للمشاعر
const SENTIMENT_KEYWORDS = {
  positive: ['شكراً', 'ممتاز', 'رائع', 'جميل', 'تمام', 'حلو', 'thanks', 'great'],
  frustrated: ['مستحيل', 'زهقت', 'تعبت', 'صعب', 'معقد', 'يأس', 'frustrated'],
  negative: ['سيء', 'مو زين', 'ضعيف', 'bad', 'terrible'],
};

/**
 * تحليل رسالة واحدة
 */
function analyzeMessage(message: string): Partial<ConversationAnalysis> {
  const lowerMessage = message.toLowerCase();
  const analysis: Partial<ConversationAnalysis> = {
    keywords: [],
  };

  // تحديد نوع المشكلة
  for (const [type, keywords] of Object.entries(PROBLEM_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        analysis.problemType = type as ConversationAnalysis['problemType'];
        analysis.keywords?.push(keyword);
        break;
      }
    }
    if (analysis.problemType) break;
  }

  // تحديد النية
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        analysis.intent = intent as ConversationAnalysis['intent'];
        if (!analysis.keywords?.includes(keyword)) {
          analysis.keywords?.push(keyword);
        }
        break;
      }
    }
    if (analysis.intent) break;
  }

  // تحديد المشاعر
  for (const [sentiment, keywords] of Object.entries(SENTIMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        analysis.sentiment = sentiment as ConversationAnalysis['sentiment'];
        break;
      }
    }
    if (analysis.sentiment) break;
  }

  return analysis;
}

/**
 * تحليل محادثة كاملة
 */
export function analyzeConversation(
  messages: Array<{ role: string; content: string }>,
  pageContext?: {
    pagePath: string;
    pageName: string;
    formProgress: number;
    timeOnPage: number;
  }
): ConversationAnalysis {
  const analysis: ConversationAnalysis = {
    intent: 'unknown',
    problemType: 'none',
    confidenceLevel: 'low',
    sentiment: 'neutral',
    userUnderstandingLevel: 'intermediate',
    actionNeeded: 'none',
    keywords: [],
    suggestedAction: '',
  };

  // تحليل جميع رسائل المستخدم
  const userMessages = messages.filter(m => m.role === 'user');
  
  for (const msg of userMessages) {
    const msgAnalysis = analyzeMessage(msg.content);
    
    // دمج النتائج
    if (msgAnalysis.intent && analysis.intent === 'unknown') {
      analysis.intent = msgAnalysis.intent;
    }
    if (msgAnalysis.problemType && analysis.problemType === 'none') {
      analysis.problemType = msgAnalysis.problemType;
    }
    if (msgAnalysis.sentiment) {
      analysis.sentiment = msgAnalysis.sentiment;
    }
    if (msgAnalysis.keywords) {
      analysis.keywords = [...new Set([...analysis.keywords, ...msgAnalysis.keywords])];
    }
  }

  // تحديد مستوى الثقة بناءً على السياق
  if (pageContext) {
    const hasLongSession = pageContext.timeOnPage > 120;
    const hasFormProgress = pageContext.formProgress > 0;
    const hasMultipleMessages = userMessages.length >= 2;

    if (hasLongSession && hasFormProgress && hasMultipleMessages) {
      analysis.confidenceLevel = 'high';
    } else if (hasMultipleMessages || hasFormProgress) {
      analysis.confidenceLevel = 'medium';
    }
  }

  // تحديد مستوى فهم المستخدم
  if (analysis.intent === 'confused' || analysis.problemType === 'linguistic') {
    analysis.userUnderstandingLevel = 'beginner';
  } else if (analysis.keywords.length > 3 || userMessages.length > 3) {
    analysis.userUnderstandingLevel = 'intermediate';
  }

  // تحديد الإجراء المطلوب
  if (analysis.problemType === 'technical' || analysis.sentiment === 'frustrated') {
    analysis.actionNeeded = 'immediate';
  } else if (analysis.intent === 'reporting_problem') {
    analysis.actionNeeded = 'follow_up';
  } else if (analysis.intent === 'giving_feedback') {
    analysis.actionNeeded = 'monitor';
  }

  // اقتراح إجراء
  analysis.suggestedAction = getSuggestedAction(analysis);

  return analysis;
}

/**
 * اقتراح إجراء بناءً على التحليل
 */
function getSuggestedAction(analysis: ConversationAnalysis): string {
  if (analysis.actionNeeded === 'immediate') {
    if (analysis.problemType === 'technical') {
      return 'فحص السجلات التقنية وإصلاح الخطأ';
    }
    return 'تواصل عاجل مع المستخدم لحل المشكلة';
  }

  if (analysis.problemType === 'design') {
    return 'مراجعة تصميم العنصر المذكور وتحسين الوضوح';
  }

  if (analysis.problemType === 'linguistic') {
    return 'تبسيط النصوص أو إضافة شروحات توضيحية';
  }

  if (analysis.problemType === 'navigation') {
    return 'تحسين التنقل وإضافة روابط سريعة';
  }

  if (analysis.intent === 'giving_feedback') {
    return 'تسجيل الاقتراح للمراجعة في التحديث القادم';
  }

  return 'متابعة ومراقبة';
}

/**
 * تحديد نوع الخروج بناءً على سلوك المستخدم
 */
export function determineExitType(
  hasConversation: boolean,
  conversationOutcome?: string,
  lastMessages?: Array<{ role: string; content: string }>
): 'silent' | 'explained' | 'helped' | 'frustrated' {
  if (!hasConversation) {
    return 'silent';
  }

  if (conversationOutcome === 'helped') {
    return 'helped';
  }

  // تحقق من المشاعر في آخر رسائل
  if (lastMessages && lastMessages.length > 0) {
    const lastUserMessage = lastMessages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      const analysis = analyzeMessage(lastUserMessage.content);
      if (analysis.sentiment === 'frustrated') {
        return 'frustrated';
      }
      if (analysis.sentiment === 'positive') {
        return 'helped';
      }
    }
    return 'explained';
  }

  return 'silent';
}

/**
 * حساب درجة الإحباط
 */
export function calculateFrustrationScore(
  signals: Array<{ signal_type: string; duration_seconds?: number }>,
  timeOnPage: number,
  formProgress: number
): number {
  let score = 0;

  // إشارات سلبية
  const freezeSignals = signals.filter(s => s.signal_type === 'freeze').length;
  const errorSignals = signals.filter(s => s.signal_type === 'repeated_errors').length;
  const hesitationSignals = signals.filter(s => s.signal_type === 'typing_hesitation').length;

  score += freezeSignals * 15;
  score += errorSignals * 25;
  score += hesitationSignals * 10;

  // وقت طويل بدون تقدم
  if (timeOnPage > 180 && formProgress < 30) {
    score += 20;
  }

  // تقييد الدرجة بين 0 و 100
  return Math.min(100, Math.max(0, score));
}
