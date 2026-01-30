/**
 * generateBehavioralPDF.ts
 * إنشاء تقرير PDF لبيانات دراسة سلوك المستخدمين
 */

import jsPDF from 'jspdf';

interface BehavioralSession {
  id: string;
  session_id: string;
  user_id?: string;
  started_at?: string;
  ended_at?: string;
  pages_visited?: string[];
  total_signals?: number;
  was_stuck?: boolean;
  was_rescued?: boolean;
  exit_type?: string;
  exit_reason?: string;
  assistant_interventions?: number;
}

interface BehavioralSignal {
  id: string;
  signal_type: string;
  page_path: string;
  page_name?: string;
  duration_seconds?: number;
  assistant_intervened?: boolean;
  intervention_result?: string;
  created_at?: string;
}

interface OverviewStats {
  totalSessions: number;
  stuckSessions: number;
  rescuedSessions: number;
  silentExits: number;
  explainedExits: number;
  assistantInterventions: number;
  rescueRate: number;
}

interface BehavioralPDFData {
  overviewStats: OverviewStats;
  sessions: BehavioralSession[];
  signals: BehavioralSignal[];
  timeRange: string;
  generatedAt: Date;
}

// ترجمة أنواع الإشارات
const SIGNAL_LABELS: Record<string, string> = {
  freeze: 'توقف/تجمّد',
  exit: 'خروج',
  hesitation: 'تردد',
  rapid_navigation: 'تصفح سريع',
  repeated_errors: 'أخطاء متكررة',
  typing_hesitation: 'تردد في الكتابة',
};

// ترجمة أنواع الخروج
const EXIT_TYPE_LABELS: Record<string, string> = {
  silent: 'خروج صامت',
  explained: 'خروج موضح',
  helped: 'خروج بعد مساعدة',
  frustrated: 'خروج محبط',
};

export async function generateBehavioralPDF(data: BehavioralPDFData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // إعداد الخط للعربية
  doc.setFont('helvetica');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // ===== رأس التقرير =====
  doc.setFillColor(1, 65, 28); // #01411C
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('Behavioral Intelligence Report', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('User Flow Study Report', pageWidth / 2, 23, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text(`Generated: ${data.generatedAt.toLocaleString('en-US')} | Range: ${data.timeRange}`, pageWidth / 2, 30, { align: 'center' });
  
  yPos = 45;

  // ===== ملخص الإحصائيات =====
  doc.setTextColor(1, 65, 28);
  doc.setFontSize(16);
  doc.text('Overview Statistics', margin, yPos);
  yPos += 10;

  // صناديق الإحصائيات
  const stats = data.overviewStats;
  const boxWidth = (pageWidth - margin * 2 - 10) / 4;
  const boxHeight = 25;

  const statBoxes = [
    { label: 'Total Sessions', value: stats.totalSessions.toString(), color: [59, 130, 246] }, // blue
    { label: 'Stuck Sessions', value: stats.stuckSessions.toString(), color: [239, 68, 68] }, // red
    { label: 'Rescued', value: stats.rescuedSessions.toString(), color: [34, 197, 94] }, // green
    { label: 'Rescue Rate', value: `${stats.rescueRate.toFixed(1)}%`, color: [168, 85, 247] }, // purple
  ];

  statBoxes.forEach((box, index) => {
    const x = margin + index * (boxWidth + 3);
    
    doc.setFillColor(box.color[0], box.color[1], box.color[2]);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(box.value, x + boxWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(box.label, x + boxWidth / 2, yPos + 18, { align: 'center' });
  });

  yPos += boxHeight + 10;

  // صف ثاني من الإحصائيات
  const statBoxes2 = [
    { label: 'Silent Exits', value: stats.silentExits.toString(), color: [107, 114, 128] },
    { label: 'Explained Exits', value: stats.explainedExits.toString(), color: [14, 165, 233] },
    { label: 'Interventions', value: stats.assistantInterventions.toString(), color: [249, 115, 22] },
    { label: 'Self-Service Rate', value: `${((stats.totalSessions - stats.stuckSessions) / Math.max(stats.totalSessions, 1) * 100).toFixed(0)}%`, color: [20, 184, 166] },
  ];

  statBoxes2.forEach((box, index) => {
    const x = margin + index * (boxWidth + 3);
    
    doc.setFillColor(box.color[0], box.color[1], box.color[2]);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(box.value, x + boxWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(box.label, x + boxWidth / 2, yPos + 18, { align: 'center' });
  });

  yPos += boxHeight + 15;

  // ===== جدول الجلسات =====
  doc.setTextColor(1, 65, 28);
  doc.setFontSize(14);
  doc.text('Recent Sessions', margin, yPos);
  yPos += 8;

  // رأس الجدول
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  const colWidths = [40, 25, 25, 30, 35, 25];
  const headers = ['Session ID', 'Signals', 'Pages', 'Status', 'Exit Type', 'Rescued'];
  let xPos = margin + 2;
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos + 5);
    xPos += colWidths[i];
  });
  yPos += 10;

  // صفوف الجلسات (أول 15 جلسة)
  doc.setTextColor(0, 0, 0);
  const sessionsToShow = data.sessions.slice(0, 15);
  
  sessionsToShow.forEach((session, rowIndex) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos - 3, pageWidth - margin * 2, 7, 'F');
    }

    xPos = margin + 2;
    doc.setFontSize(7);
    
    // Session ID (مختصر)
    doc.text(session.session_id.substring(0, 15) + '...', xPos, yPos);
    xPos += colWidths[0];
    
    // Total signals
    doc.text((session.total_signals || 0).toString(), xPos, yPos);
    xPos += colWidths[1];
    
    // Pages visited
    doc.text((session.pages_visited?.length || 0).toString(), xPos, yPos);
    xPos += colWidths[2];
    
    // Status
    const status = session.was_stuck ? 'Stuck' : 'Normal';
    doc.setTextColor(session.was_stuck ? 239 : 34, session.was_stuck ? 68 : 197, session.was_stuck ? 68 : 94);
    doc.text(status, xPos, yPos);
    xPos += colWidths[3];
    
    // Exit type
    doc.setTextColor(0, 0, 0);
    doc.text(session.exit_type || 'N/A', xPos, yPos);
    xPos += colWidths[4];
    
    // Was rescued
    const rescued = session.was_rescued ? 'Yes' : 'No';
    doc.setTextColor(session.was_rescued ? 34 : 107, session.was_rescued ? 197 : 114, session.was_rescued ? 94 : 128);
    doc.text(rescued, xPos, yPos);
    
    doc.setTextColor(0, 0, 0);
    yPos += 7;
  });

  yPos += 10;

  // ===== جدول الإشارات =====
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  doc.setTextColor(1, 65, 28);
  doc.setFontSize(14);
  doc.text('Recent Signals', margin, yPos);
  yPos += 8;

  // رأس جدول الإشارات
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  const signalColWidths = [35, 50, 25, 30, 35];
  const signalHeaders = ['Type', 'Page', 'Duration', 'Intervened', 'Date'];
  xPos = margin + 2;
  signalHeaders.forEach((header, i) => {
    doc.text(header, xPos, yPos + 5);
    xPos += signalColWidths[i];
  });
  yPos += 10;

  // صفوف الإشارات (أول 20 إشارة)
  doc.setTextColor(0, 0, 0);
  const signalsToShow = data.signals.slice(0, 20);
  
  signalsToShow.forEach((signal, rowIndex) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = margin;
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos - 3, pageWidth - margin * 2, 7, 'F');
    }

    xPos = margin + 2;
    doc.setFontSize(7);
    
    // Signal type
    doc.text(SIGNAL_LABELS[signal.signal_type] || signal.signal_type, xPos, yPos);
    xPos += signalColWidths[0];
    
    // Page (مختصر)
    const pagePath = signal.page_path?.length > 25 ? signal.page_path.substring(0, 25) + '...' : signal.page_path || 'N/A';
    doc.text(pagePath, xPos, yPos);
    xPos += signalColWidths[1];
    
    // Duration
    doc.text((signal.duration_seconds || 0) + 's', xPos, yPos);
    xPos += signalColWidths[2];
    
    // Intervened
    const intervened = signal.assistant_intervened ? 'Yes' : 'No';
    doc.setTextColor(signal.assistant_intervened ? 34 : 107, signal.assistant_intervened ? 197 : 114, signal.assistant_intervened ? 94 : 128);
    doc.text(intervened, xPos, yPos);
    xPos += signalColWidths[3];
    
    // Date
    doc.setTextColor(0, 0, 0);
    const date = signal.created_at ? new Date(signal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
    doc.text(date, xPos, yPos);
    
    yPos += 7;
  });

  // ===== تذييل =====
  doc.setFillColor(243, 244, 246);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text('WasataAI - Behavioral Intelligence Dashboard', pageWidth / 2, pageHeight - 8, { align: 'center' });
  doc.text(`Page ${doc.internal.pages.length}`, pageWidth - margin, pageHeight - 8, { align: 'right' });

  // حفظ الملف
  const fileName = `behavioral-study-${data.timeRange}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
