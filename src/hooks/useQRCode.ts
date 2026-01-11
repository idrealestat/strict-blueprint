/**
 * useQRCode.ts
 * Hook لتوليد QR Code حقيقي لبيانات vCard
 */

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface UseQRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export function useQRCode(data: string, options?: UseQRCodeOptions) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setQrDataUrl('');
      setLoading(false);
      return;
    }

    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = await QRCode.toDataURL(data, {
          width: options?.width || 200,
          margin: options?.margin || 2,
          color: {
            dark: options?.color?.dark || '#01411C',
            light: options?.color?.light || '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
        
        setQrDataUrl(url);
      } catch (err) {
        console.error('[useQRCode] Error generating QR code:', err);
        setError('فشل في توليد الباركود');
        setQrDataUrl('');
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [data, options?.width, options?.margin, options?.color?.dark, options?.color?.light]);

  return { qrDataUrl, loading, error };
}

/**
 * Generate QR code as data URL (async function)
 */
export async function generateQRCodeDataUrl(
  data: string,
  options?: UseQRCodeOptions
): Promise<string> {
  if (!data) return '';
  
  try {
    return await QRCode.toDataURL(data, {
      width: options?.width || 200,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#01411C',
        light: options?.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('[generateQRCodeDataUrl] Error:', err);
    return '';
  }
}
