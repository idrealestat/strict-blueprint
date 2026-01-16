/**
 * PropertyMediaUpload.tsx
 * مكون رفع الصور والفيديو بشكل Instagram Grid مع إعادة الترتيب بالسحب
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
  Camera,
  Expand,
  GripVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageLightbox from './ImageLightbox';

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
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newMedia = [...media];
    const [draggedItem] = newMedia.splice(draggedIndex, 1);
    newMedia.splice(dropIndex, 0, draggedItem);

    // If the first item changed, update main status
    if (draggedIndex === 0 || dropIndex === 0) {
      newMedia.forEach((item, idx) => {
        item.isMain = idx === 0;
      });
    }

    onMediaChange(newMedia);
    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.success('تم إعادة ترتيب الوسائط');
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Upload file to Supabase Storage with user ownership path
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    // Get current user for ownership-based storage path
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('يجب تسجيل الدخول لرفع الملفات');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    // SECURITY: Path must start with user_id for RLS policy enforcement
    const filePath = `${user.id}/properties/${fileName}`;

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

  // Remove media with ownership verification
  const removeMedia = async (mediaId: string) => {
    const mediaItem = media.find(m => m.id === mediaId);
    if (!mediaItem) return;

    // Try to delete from storage - extract full path including user_id
    try {
      const url = new URL(mediaItem.url);
      // Path format: /storage/v1/object/public/property-media/{user_id}/properties/{filename}
      const pathParts = url.pathname.split('/property-media/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1]; // Gets: {user_id}/properties/{filename}
        await supabase.storage.from('property-media').remove([filePath]);
      }
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
          {media.length > 0 && (
            <Badge variant="outline" className="mr-2 text-xs">
              <GripVertical className="w-3 h-3 ml-1" />
              اسحب لإعادة الترتيب
            </Badge>
          )}
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

        {/* Instagram-style Grid with Drag & Drop */}
        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {media.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-square rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing transition-all duration-200 ${
                  item.isMain ? 'ring-2 ring-[hsl(var(--gold))] ring-offset-2' : ''
                } ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' : ''
                }`}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
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

                {/* Drag Handle */}
                <div className="absolute top-2 left-2 bg-black/50 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-white" />
                </div>

                {/* Order Number */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-bold">
                  {index + 1}
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(index);
                    }}
                    className="h-8"
                  >
                    <Expand className="w-4 h-4 ml-1" />
                    عرض
                  </Button>
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

        {/* Lightbox */}
        <ImageLightbox
          media={media.map(m => ({ url: m.url, type: m.type }))}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </CardContent>
    </Card>
  );
}
