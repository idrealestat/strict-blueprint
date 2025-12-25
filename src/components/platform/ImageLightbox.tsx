/**
 * ImageLightbox.tsx
 * مكون عرض الصور بالحجم الكامل مع إمكانية التنقل
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  ZoomIn,
  ZoomOut,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface ImageLightboxProps {
  media: MediaItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  media,
  initialIndex,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, media.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const goToNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setZoom(1);
    }
  }, [currentIndex, media.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setZoom(1);
    }
  }, [currentIndex]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    const currentMedia = media[currentIndex];
    if (currentMedia) {
      const link = document.createElement('a');
      link.href = currentMedia.url;
      link.download = `property-media-${currentIndex + 1}`;
      link.click();
    }
  };

  if (!isOpen || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
          onClick={onClose}
        >
          {/* Header Controls */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {currentIndex + 1} / {media.length}
              </span>
              {currentMedia?.type === 'video' && (
                <span className="text-white text-sm bg-emerald-600/80 px-3 py-1 rounded-full flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  فيديو
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {currentMedia?.type === 'image' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomOut();
                    }}
                    className="text-white hover:bg-white/20"
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="w-5 h-5" />
                  </Button>
                  <span className="text-white text-sm min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomIn();
                    }}
                    className="text-white hover:bg-white/20"
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="w-5 h-5" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div
            className="relative w-full h-full flex items-center justify-center p-16"
            onClick={(e) => e.stopPropagation()}
          >
            {currentMedia?.type === 'image' ? (
              <motion.img
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                src={currentMedia.url}
                alt={`صورة ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain cursor-zoom-in"
                style={{ transform: `scale(${zoom})` }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (zoom < 2) handleZoomIn();
                  else setZoom(1);
                }}
              />
            ) : (
              <motion.video
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                src={currentMedia?.url}
                controls
                autoPlay
                className="max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {currentIndex < media.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}

          {/* Thumbnail Strip */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
              {media.map((item, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setZoom(1);
                  }}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden transition-all ${
                    index === currentIndex
                      ? 'ring-2 ring-[hsl(var(--gold))] ring-offset-2 ring-offset-black'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`صورة مصغرة ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
