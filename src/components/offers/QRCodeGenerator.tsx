// ملف: src/components/offers/QRCodeGenerator.tsx
// مولد رمز QR - حرفي من البرومبت

'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
  qrCodeUrl: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  url,
  qrCodeUrl,
}) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download QR code error:', error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">رمز QR</div>
      <div className="flex flex-col items-center gap-4 p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg">
        <div className="relative w-48 h-48">
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-full h-full object-contain"
          />
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4" />
          تحميل رمز QR
        </Button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
