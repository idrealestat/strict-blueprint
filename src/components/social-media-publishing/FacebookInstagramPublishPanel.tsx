/**
 * FacebookInstagramPublishPanel.tsx
 * لوحة النشر على Facebook و Instagram
 * للاستخدام في تبويب "الترويج / المحتوى"
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { useFacebookPublish } from '@/hooks/useFacebookPublish';
import { toast } from 'sonner';
import { 
  Facebook, Instagram, Send, Check, Clock, 
  AlertCircle, RefreshCw, XCircle, Loader2
} from 'lucide-react';

interface FacebookInstagramPublishPanelProps {
  description?: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  onPublishComplete?: (results: any[]) => void;
}

export default function FacebookInstagramPublishPanel({
  description = '',
  mediaUrl,
  mediaType,
  onPublishComplete
}: FacebookInstagramPublishPanelProps) {
  const { isAuthenticated, pages, startAuth, isLoading: authLoading } = useFacebookAuth();
  const { publishToAll, isPublishing, publishStatus, resetStatus } = useFacebookPublish();
  
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  // Build target list from pages
  const targets: Array<{
    id: string;
    type: 'facebook' | 'instagram';
    name: string;
    accessToken: string;
    icon: 'facebook' | 'instagram';
  }> = [];

  pages.forEach(page => {
    targets.push({
      id: page.id,
      type: 'facebook',
      name: page.name,
      accessToken: page.accessToken,
      icon: 'facebook'
    });
    
    if (page.instagram) {
      targets.push({
        id: page.instagram.id,
        type: 'instagram',
        name: `@${page.instagram.username}`,
        accessToken: page.accessToken,
        icon: 'instagram'
      });
    }
  });

  const toggleTarget = (id: string) => {
    const newSet = new Set(selectedTargets);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTargets(newSet);
  };

  const handlePublish = async () => {
    if (selectedTargets.size === 0) {
      toast.error('اختر منصة واحدة على الأقل');
      return;
    }

    // For Instagram, media is required
    const hasInstagram = targets.some(t => t.type === 'instagram' && selectedTargets.has(t.id));
    if (hasInstagram && !mediaUrl) {
      toast.error('Instagram يتطلب صورة أو فيديو');
      return;
    }

    const publishTargets = targets
      .filter(t => selectedTargets.has(t.id))
      .map(t => ({
        type: t.type,
        id: t.id,
        accessToken: t.accessToken
      }));

    const results = await publishToAll(publishTargets, {
      message: description,
      mediaUrl,
      mediaType
    });

    onPublishComplete?.(results);
  };

  const getStatusIcon = (targetId: string) => {
    const fbStatus = publishStatus[`fb_${targetId}`];
    const igStatus = publishStatus[`ig_${targetId}`];
    const status = fbStatus || igStatus;

    if (status === 'pending') return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (status === 'success') return <Check className="w-4 h-4 text-green-500" />;
    if (status === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-4 text-center">
          <div className="flex justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Facebook className="w-5 h-5 text-blue-600" />
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
          </div>
          <h4 className="font-bold mb-2">Facebook & Instagram</h4>
          <p className="text-xs text-muted-foreground mb-3">
            اربط حسابك للنشر المباشر
          </p>
          <Button
            size="sm"
            onClick={startAuth}
            disabled={authLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {authLoading ? (
              <Clock className="w-4 h-4 ml-1 animate-spin" />
            ) : (
              <Facebook className="w-4 h-4 ml-1" />
            )}
            ربط الحساب
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm">اختر المنصات للنشر</h4>
        <Badge variant="outline" className="text-xs">
          {selectedTargets.size} / {targets.length}
        </Badge>
      </div>

      {/* Targets List */}
      <div className="space-y-2">
        {targets.map(target => (
          <Card 
            key={target.id}
            className={`cursor-pointer transition-all ${
              selectedTargets.has(target.id) 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleTarget(target.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={selectedTargets.has(target.id)}
                  onCheckedChange={() => toggleTarget(target.id)}
                />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  target.icon === 'facebook' 
                    ? 'bg-blue-100' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {target.icon === 'facebook' ? (
                    <Facebook className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Instagram className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{target.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{target.type}</p>
                </div>
                {getStatusIcon(target.id)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instagram Warning */}
      {targets.some(t => t.type === 'instagram' && selectedTargets.has(t.id)) && !mediaUrl && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700">
                Instagram يتطلب صورة أو فيديو. أضف وسائط من محرر الفيديو أولاً.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publish Button */}
      <Button
        className="w-full"
        onClick={handlePublish}
        disabled={isPublishing || selectedTargets.size === 0}
      >
        {isPublishing ? (
          <>
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            جاري النشر...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 ml-2" />
            نشر على {selectedTargets.size} منصة
          </>
        )}
      </Button>

      {/* Retry Button */}
      {Object.values(publishStatus).some(s => s === 'error') && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={resetStatus}
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
