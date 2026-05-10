'use client';

import { Eye, QrCode, Share2, Trash2, Edit, ExternalLink, ToggleLeft, ToggleRight, Download, Copy, Phone, Mail, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { HelpHint } from '@/components/ui/help-hint';

interface DigitalCard {
  id: string;
  slug: string;
  fullName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  primaryColor: string;
  secondaryColor: string;
  template: string;
  layout: string;
  totalViews: number;
  totalScans: number;
  totalClicks: number;
  totalSaves: number;
  isActive: boolean;
  qrCode: string;
  createdAt: string;
}

interface Props {
  cards: DigitalCard[];
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onEdit: (card: DigitalCard) => void;
}

export function CardsGrid({ cards, onDelete, onToggleActive, onEdit }: Props) {
  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(`https://wasata.ai/cards/${slug}`);
    toast.success('تم نسخ الرابط');
  };

  const handleShare = async (card: DigitalCard) => {
    const url = `https://wasata.ai/cards/${card.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: card.fullName,
          text: `${card.jobTitle} - ${card.company}`,
          url,
        });
      } catch (error) {
        handleCopyLink(card.slug);
      }
    } else {
      handleCopyLink(card.slug);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
      onDelete(id);
      toast.success('تم حذف البطاقة');
    }
  };

  const getTemplateLabel = (template: string) => {
    const labels: Record<string, string> = {
      modern: 'عصري',
      luxury: 'فاخر',
      minimal: 'بسيط',
      creative: 'إبداعي',
    };
    return labels[template] || template;
  };

  if (cards.length === 0) {
    return (
      <Card className="p-12 text-center">
        <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-xl font-semibold mb-2">لا توجد بطاقات</h3>
        <p className="text-muted-foreground">
          أنشئ أول بطاقة رقمية لك بالضغط على "بطاقة جديدة"
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Card Preview Header */}
            <div 
              className="h-24 relative"
              style={{ 
                background: `linear-gradient(135deg, ${card.primaryColor} 0%, ${card.secondaryColor} 100%)` 
              }}
            >
              <div className="absolute inset-0 bg-black/10" />
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <Badge 
                  className={card.isActive 
                    ? 'bg-green-500/90 text-white' 
                    : 'bg-gray-500/90 text-white'
                  }
                >
                  {card.isActive ? 'نشطة' : 'معطلة'}
                </Badge>
              </div>
              {/* Template Badge */}
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-white/90 text-gray-800">
                  {getTemplateLabel(card.template)}
                </Badge>
              </div>
              {/* Profile Avatar */}
              <div className="absolute -bottom-8 right-4">
                <div 
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: card.primaryColor }}
                >
                  {card.fullName.charAt(0)}
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="pt-10 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{card.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{card.jobTitle}</p>
                  {card.company && (
                    <p className="text-xs text-muted-foreground">{card.company}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleActive(card.id)}
                  className={card.isActive ? 'text-green-600' : 'text-gray-400'}
                >
                  {card.isActive ? (
                    <ToggleRight className="h-5 w-5" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">مشاهدات</p>
                  <p className="font-semibold">{card.totalViews}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">مسح QR</p>
                  <p className="font-semibold">{card.totalScans}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">نقرات</p>
                  <p className="font-semibold">{card.totalClicks}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">حفظ</p>
                  <p className="font-semibold">{card.totalSaves}</p>
                </div>
              </div>

              {/* QR Code Preview */}
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg mb-4">
                <img 
                  src={card.qrCode} 
                  alt="QR Code" 
                  className="w-16 h-16 rounded"
                />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">رابط البطاقة:</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-background px-2 py-1 rounded truncate flex-1">
                      wasata.ai/cards/{card.slug}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopyLink(card.slug)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(`/cards/${card.slug}`, '_blank')}
                >
                  <Eye className="h-4 w-4 ml-1" />
                  معاينة
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="معاينة"
                    description="فتح بطاقتك الرقمية في نافذة جديدة كما يراها العملاء."
                    source="TODO: spec/digital-card-grid.md#preview"
                  />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => handleShare(card)}
                >
                  <Share2 className="h-4 w-4 ml-1" />
                  مشاركة
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="مشاركة"
                    description="مشاركة رابط بطاقتك الرقمية عبر الواتساب أو وسائل التواصل."
                    source="TODO: spec/digital-card-grid.md#share"
                  />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEdit(card)}
                >
                  <Edit className="h-4 w-4" />
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="تحرير"
                    description="تعديل بيانات وألوان وقالب البطاقة."
                    source="TODO: spec/digital-card-grid.md#edit"
                  />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(card.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="حذف"
                    description="حذف هذه البطاقة الرقمية نهائياً (يتطلب تأكيد)."
                    source="TODO: spec/digital-card-grid.md#delete"
                  />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
