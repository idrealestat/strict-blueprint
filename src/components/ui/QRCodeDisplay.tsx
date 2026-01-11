/**
 * QRCodeDisplay.tsx
 * مكون عرض QR Code حقيقي
 */

import React from 'react';
import { useQRCode } from '@/hooks/useQRCode';
import { Loader2 } from 'lucide-react';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export default function QRCodeDisplay({ 
  data, 
  size = 80, 
  className = '',
  darkColor = '#01411C',
  lightColor = '#FFFFFF'
}: QRCodeDisplayProps) {
  const { qrDataUrl, loading, error } = useQRCode(data, {
    width: size * 2, // Higher resolution for better quality
    margin: 1,
    color: {
      dark: darkColor,
      light: lightColor,
    }
  });

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-white ${className}`}
        style={{ width: size, height: size }}
      >
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !qrDataUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 text-gray-400 text-xs ${className}`}
        style={{ width: size, height: size }}
      >
        QR
      </div>
    );
  }

  return (
    <img 
      src={qrDataUrl} 
      alt="QR Code" 
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
