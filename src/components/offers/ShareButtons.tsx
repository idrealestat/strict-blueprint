// ملف: src/components/offers/ShareButtons.tsx
// أزرار المشاركة - حرفي من البرومبت

'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, MessageSquare } from 'lucide-react';

interface ShareButtonsProps {
  onShare: (method: string) => void;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ onShare }) => {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">مشاركة عبر</div>
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="gap-2 hover:bg-green-50 hover:border-green-500"
          onClick={() => onShare('whatsapp')}
        >
          <MessageCircle className="w-5 h-5 text-green-600" />
          واتساب
        </Button>

        <Button
          variant="outline"
          className="gap-2 hover:bg-blue-50 hover:border-blue-500"
          onClick={() => onShare('email')}
        >
          <Mail className="w-5 h-5 text-blue-600" />
          بريد
        </Button>

        <Button
          variant="outline"
          className="gap-2 hover:bg-purple-50 hover:border-purple-500"
          onClick={() => onShare('sms')}
        >
          <MessageSquare className="w-5 h-5 text-purple-600" />
          رسالة
        </Button>
      </div>
    </div>
  );
};

export default ShareButtons;
