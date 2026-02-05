/**
 * TikTokIntegrationPanel.tsx
 * لوحة تكامل TikTok - Login Kit + Content Posting
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Video,
  Upload,
  Link2,
  Unlink,
  Check,
  X,
  Loader2,
  User,
  Hash,
  FileVideo,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Send,
  Music,
  Wand2,
} from 'lucide-react';
import { useTikTokAuth, TikTokUser } from '@/hooks/useTikTokAuth';
import { useTikTokUpload, TikTokUploadOptions } from '@/hooks/useTikTokUpload';
import { supabase } from '@/integrations/supabase/client';

interface TikTokIntegrationPanelProps {
  videoFile?: File | null;
  defaultDescription?: string;
  defaultHashtags?: string[];
}

export default function TikTokIntegrationPanel({
  videoFile: externalVideoFile,
  defaultDescription = '',
  defaultHashtags = [],
}: TikTokIntegrationPanelProps) {
  // Auth hook
  const {
    isConnected,
    isLoading: isAuthLoading,
    user,
    initiateLogin,
    disconnect,
  } = useTikTokAuth();

  // Upload hook
  const {
    uploadVideo,
    uploadProgress,
    resetUpload,
    isUploading,
  } = useTikTokUpload();

  // Local state
  const [videoFile, setVideoFile] = useState<File | null>(externalVideoFile || null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(defaultDescription);
  const [hashtags, setHashtags] = useState<string[]>(defaultHashtags);
  const [customHashtag, setCustomHashtag] = useState('');
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  
  // Privacy settings
  const [privacyLevel, setPrivacyLevel] = useState<'SELF_ONLY' | 'MUTUAL_FOLLOW_FRIENDS' | 'PUBLIC_TO_EVERYONE'>('SELF_ONLY');
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);
  const [disableComment, setDisableComment] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external video file
  useEffect(() => {
    if (externalVideoFile) {
      setVideoFile(externalVideoFile);
      const url = URL.createObjectURL(externalVideoFile);
      setVideoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [externalVideoFile]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast.error('يرجى اختيار ملف فيديو');
        return;
      }
      // Validate file size (max 4GB for TikTok)
      if (file.size > 4 * 1024 * 1024 * 1024) {
        toast.error('حجم الفيديو يجب أن يكون أقل من 4 جيجابايت');
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  // Add hashtag
  const addHashtag = (tag: string) => {
    const normalized = tag.startsWith('#') ? tag : `#${tag}`;
    if (!hashtags.includes(normalized) && hashtags.length < 30) {
      setHashtags(prev => [...prev, normalized]);
    }
  };

  // Remove hashtag
  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  // Generate hashtags with AI
  const generateHashtags = async () => {
    if (!description.trim() || description.length < 10) {
      toast.error('يرجى كتابة وصف أطول لتوليد الهاشتاقات');
      return;
    }
    
    setIsGeneratingHashtags(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-hashtags', {
        body: { description: description.trim() }
      });
      
      if (error) throw error;
      
      if (data?.hashtags && Array.isArray(data.hashtags)) {
        setHashtags(data.hashtags);
        toast.success(`تم توليد ${data.hashtags.length} هاشتاق`);
      }
    } catch (error) {
      toast.error('فشل في توليد الهاشتاقات');
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!videoFile) {
      toast.error('يرجى اختيار فيديو');
      return;
    }
    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان الفيديو');
      return;
    }

    const options: TikTokUploadOptions = {
      title: title.trim(),
      description: description.trim(),
      hashtags,
      privacyLevel,
      disableDuet,
      disableStitch,
      disableComment,
    };

    await uploadVideo(videoFile, options);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#25F4EE] via-[#FE2C55] to-[#000000] flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#01411C]">تيك توك</h2>
            <p className="text-sm text-gray-600">رفع الفيديوهات كمسودة للمراجعة</p>
          </div>
        </div>

        {/* Connection Status */}
        <Card className={`border-2 ${isConnected ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isConnected && user ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25F4EE] to-[#FE2C55] flex items-center justify-center">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.display_name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{user.display_name}</p>
                      <Badge className="bg-green-500 text-xs">
                        <Check className="w-3 h-3 ml-1" />
                        مرتبط
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-gray-600">غير مرتبط</span>
                  </div>
                )}
              </div>

              {isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Unlink className="w-4 h-4 ml-1" />
                  فك الربط
                </Button>
              ) : (
                <Button
                  onClick={initiateLogin}
                  disabled={isAuthLoading}
                  className="bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] text-white hover:opacity-90"
                >
                  {isAuthLoading ? (
                    <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4 ml-1" />
                  )}
                  ربط حساب تيك توك
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">تعليمات الاستخدام:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>استعمل هذه الأداة لرفع الفيديوهات لمراجعة TikTok مباشرة</li>
              <li>الفيديو يُرفع كمسودة (Draft) للمراجعة قبل النشر</li>
              <li>يمكنك تعديل الفيديو ونشره من تطبيق تيك توك</li>
            </ul>
          </div>
        </div>

        {isConnected && (
          <>
            <Separator />

            {/* Video Upload Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  اختيار الفيديو
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {videoFile ? (
                  <div className="space-y-3">
                    {/* Video Preview */}
                    {videoPreview && (
                      <div className="relative aspect-[9/16] max-h-64 mx-auto rounded-lg overflow-hidden bg-black">
                        <video
                          src={videoPreview}
                          className="w-full h-full object-contain"
                          controls
                        />
                      </div>
                    )}
                    {/* File Info */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileVideo className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-48">{videoFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(videoFile.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Change Video */}
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 ml-1" />
                      تغيير الفيديو
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-1">اسحب الفيديو هنا أو انقر للاختيار</p>
                    <p className="text-xs text-gray-400">الحد الأقصى: 4 جيجابايت</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Title & Description */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  العنوان والوصف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm mb-1.5 block">العنوان</Label>
                  <Input
                    placeholder="عنوان جذاب للفيديو..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {title.length}/150 حرف
                  </p>
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">الوصف</Label>
                  <Textarea
                    placeholder="وصف الفيديو..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={2200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {description.length}/2200 حرف
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Hashtags */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary" />
                    الهاشتاقات
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateHashtags}
                    disabled={isGeneratingHashtags}
                  >
                    {isGeneratingHashtags ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span className="mr-1">توليد تلقائي</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Add Custom Hashtag */}
                <div className="flex gap-2">
                  <Input
                    placeholder="أضف هاشتاق..."
                    value={customHashtag}
                    onChange={(e) => setCustomHashtag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customHashtag.trim()) {
                        addHashtag(customHashtag.trim());
                        setCustomHashtag('');
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (customHashtag.trim()) {
                        addHashtag(customHashtag.trim());
                        setCustomHashtag('');
                      }
                    }}
                  >
                    إضافة
                  </Button>
                </div>
                
                {/* Selected Hashtags */}
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeHashtag(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3 mr-1" />
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{hashtags.length}/30 هاشتاق</p>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {privacyLevel === 'SELF_ONLY' ? (
                    <EyeOff className="w-4 h-4 text-primary" />
                  ) : (
                    <Eye className="w-4 h-4 text-primary" />
                  )}
                  إعدادات الخصوصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Privacy Level */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'SELF_ONLY', label: 'مسودة (خاص)', icon: EyeOff },
                    { value: 'MUTUAL_FOLLOW_FRIENDS', label: 'الأصدقاء', icon: User },
                    { value: 'PUBLIC_TO_EVERYONE', label: 'عام', icon: Eye },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPrivacyLevel(option.value as typeof privacyLevel)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        privacyLevel === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <option.icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>

                <Separator />

                {/* Toggle Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">تعطيل الدويتو</Label>
                    <Switch
                      checked={disableDuet}
                      onCheckedChange={setDisableDuet}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">تعطيل الستيتش</Label>
                    <Switch
                      checked={disableStitch}
                      onCheckedChange={setDisableStitch}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">تعطيل التعليقات</Label>
                    <Switch
                      checked={disableComment}
                      onCheckedChange={setDisableComment}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {uploadProgress.status !== 'idle' && (
              <Card className={`border-2 ${
                uploadProgress.status === 'success' ? 'border-green-300 bg-green-50' :
                uploadProgress.status === 'failed' ? 'border-red-300 bg-red-50' :
                'border-primary/30'
              }`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{uploadProgress.message}</span>
                    {uploadProgress.status === 'success' && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                    {uploadProgress.status === 'failed' && (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <Progress value={uploadProgress.progress} className="h-2" />
                  {uploadProgress.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetUpload}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 ml-1" />
                      إعادة المحاولة
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!videoFile || !title.trim() || isUploading}
                className="flex-1 bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] text-white hover:opacity-90"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-1" />
                )}
                {privacyLevel === 'SELF_ONLY' ? 'رفع كمسودة' : 'رفع ونشر'}
              </Button>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
