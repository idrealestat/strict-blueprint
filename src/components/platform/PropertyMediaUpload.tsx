/**
 * PropertyMediaUpload.tsx
 * مكون رفع الصور والفيديو بشكل Instagram Grid
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Video, 
  Upload, 
  X, 
  Star, 
  Loader2, 
  Play,
  Link,
  Globe,
  Camera
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  isMain: boolean;
  fileName: string;
  uploadProgress?: number;
}

interface PropertyMediaUploadProps {
  media: MediaFile[];
  onMediaChange: (media: MediaFile[]) => void;
  tour3DUrl: string;
  onTour3DChange: (url: string) => void;
}

export default function PropertyMediaUpload({
  media,
  onMediaChange,
  tour3DUrl,
  onTour3DChange,
}: PropertyMediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload file to Supabase Storage
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `properties/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }, []);

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newMedia: MediaFile[] = [];
    const totalFiles = files.length;
    let uploadedCount = 0;

    for (const file of Array.from(files)) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast.error(`الملف ${file.name} غير مدعوم`);
        continue;
      }

      // Validate file size (max 50MB for video, 10MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`الملف ${file.name} كبير جداً`);
        continue;
      }

      const url = await uploadFile(file);
      if (url) {
        newMedia.push({
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          type: isVideo ? 'video' : 'image',
          isMain: media.length === 0 && newMedia.length === 0,
          fileName: file.name,
        });
      }

      uploadedCount++;
      setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
    }

    if (newMedia.length > 0) {
      onMediaChange([...media, ...newMedia]);
      toast.success(`تم رفع ${newMedia.length} ملف بنجاح`);
    }

    setIsUploading(false);
    setUploadProgress(0);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove media
  const removeMedia = async (mediaId: string) => {
    const mediaItem = media.find(m => m.id === mediaId);
    if (!mediaItem) return;

    // Try to delete from storage
    try {
      const urlParts = mediaItem.url.split('/');
      const filePath = `properties/${urlParts[urlParts.length - 1]}`;
      await supabase.storage.from('property-media').remove([filePath]);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    const updatedMedia = media.filter(m => m.id !== mediaId);
    
    // If removed media was main, set first remaining as main
    if (mediaItem.isMain && updatedMedia.length > 0) {
      updatedMedia[0].isMain = true;
    }

    onMediaChange(updatedMedia);
    toast.success('تم حذف الملف');
  };

  // Set as main image
  const setAsMain = (mediaId: string) => {
    const updatedMedia = media.map(m => ({
      ...m,
      isMain: m.id === mediaId,
    }));
    onMediaChange(updatedMedia);
    toast.success('تم تعيين الصورة الرئيسية');
  };

  // Get images and videos separately
  const images = media.filter(m => m.type === 'image');
  const videos = media.filter(m => m.type === 'video');

  return (
    <Card className="border-2 border-[hsl(var(--gold))]">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
        <CardTitle className="text-[hsl(var(--forest-green))] flex items-center gap-2">
          <Camera className="w-5 h-5" />
          صور وفيديوهات العقار
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Upload Button */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-[hsl(var(--gold))] rounded-lg p-8 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 hover:bg-amber-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-[hsl(var(--gold))] animate-spin" />
              <p className="text-[hsl(var(--forest-green))] font-semibold">جاري الرفع... {uploadProgress}%</p>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[hsl(var(--gold))] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-[hsl(var(--gold))] mb-3" />
              <p className="text-[hsl(var(--forest-green))] font-semibold text-lg">اضغط لرفع الصور والفيديوهات</p>
              <p className="text-muted-foreground text-sm mt-1">
                PNG, JPG, WEBP, MP4, MOV - حتى 10MB للصور و 50MB للفيديو
              </p>
            </>
          )}
        </div>

        {/* Media Summary */}
        {media.length > 0 && (
          <div className="flex gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              {images.length} صورة
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              {videos.length} فيديو
            </Badge>
          </div>
        )}

        {/* Instagram-style Grid */}
        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {media.map((item, index) => (
              <div
                key={item.id}
                className={`relative aspect-square rounded-lg overflow-hidden group ${
                  item.isMain ? 'ring-2 ring-[hsl(var(--gold))] ring-offset-2' : ''
                }`}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full bg-black">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                  </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {item.type === 'image' && !item.isMain && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsMain(item.id);
                      }}
                      className="h-8"
                    >
                      <Star className="w-4 h-4 ml-1" />
                      رئيسية
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(item.id);
                    }}
                    className="h-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Main Badge */}
                {item.isMain && (
                  <div className="absolute top-2 right-2 bg-[hsl(var(--gold))] text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    رئيسية
                  </div>
                )}

                {/* Video Badge */}
                {item.type === 'video' && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    <Video className="w-3 h-3 inline ml-1" />
                    فيديو
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 3D Tour Link */}
        <div className="pt-4 border-t">
          <Label className="text-[hsl(var(--forest-green))] flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4" />
            رابط تصوير 3D
          </Label>
          <div className="flex gap-2">
            <Input
              value={tour3DUrl}
              onChange={(e) => onTour3DChange(e.target.value)}
              placeholder="https://my.matterport.com/show/?m=..."
              className="border-[hsl(var(--gold))] focus:border-[hsl(var(--forest-green))]"
              dir="ltr"
            />
            {tour3DUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(tour3DUrl, '_blank')}
                className="border-[hsl(var(--gold))]"
              >
                <Link className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            أضف رابط جولة افتراضية من Matterport أو أي منصة مشابهة
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
