'use client';

import { Eye, QrCode, MousePointer, Users, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Stats {
  totalCards: number;
  totalViews: number;
  totalScans: number;
  totalClicks: number;
  totalSaves: number;
  viewsChange: number;
  scansChange: number;
  clicksChange: number;
}

interface Props {
  stats: Stats;
  className?: string;
}

export function CardStatsOverview({ stats, className }: Props) {
  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${className}`}>
      {/* Total Cards */}
      <Card className="p-4 border-t-4 border-t-[#01411C]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">إجمالي البطاقات</p>
            <p className="text-2xl font-bold">{stats.totalCards}</p>
          </div>
          <div className="p-3 rounded-full bg-[#01411C]/10">
            <CreditCard className="h-6 w-6 text-[#01411C]" />
          </div>
        </div>
      </Card>

      {/* Views */}
      <Card className="p-4 border-t-4 border-t-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">المشاهدات</p>
            <p className="text-2xl font-bold">{stats.totalViews.toLocaleString('ar-SA')}</p>
            <div className={`flex items-center gap-1 text-xs ${getChangeColor(stats.viewsChange)}`}>
              {getChangeIcon(stats.viewsChange)}
              <span>{Math.abs(stats.viewsChange)}%</span>
            </div>
          </div>
          <div className="p-3 rounded-full bg-blue-100">
            <Eye className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </Card>

      {/* Scans */}
      <Card className="p-4 border-t-4 border-t-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">مسحات QR</p>
            <p className="text-2xl font-bold">{stats.totalScans.toLocaleString('ar-SA')}</p>
            <div className={`flex items-center gap-1 text-xs ${getChangeColor(stats.scansChange)}`}>
              {getChangeIcon(stats.scansChange)}
              <span>{Math.abs(stats.scansChange)}%</span>
            </div>
          </div>
          <div className="p-3 rounded-full bg-purple-100">
            <QrCode className="h-6 w-6 text-purple-500" />
          </div>
        </div>
      </Card>

      {/* Clicks */}
      <Card className="p-4 border-t-4 border-t-[#D4AF37]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">النقرات</p>
            <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString('ar-SA')}</p>
            <div className={`flex items-center gap-1 text-xs ${getChangeColor(stats.clicksChange)}`}>
              {getChangeIcon(stats.clicksChange)}
              <span>{Math.abs(stats.clicksChange)}%</span>
            </div>
          </div>
          <div className="p-3 rounded-full bg-amber-100">
            <MousePointer className="h-6 w-6 text-[#D4AF37]" />
          </div>
        </div>
      </Card>

      {/* Saves */}
      <Card className="p-4 border-t-4 border-t-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">حفظ جهة الاتصال</p>
            <p className="text-2xl font-bold">{stats.totalSaves.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-muted-foreground">
              {((stats.totalSaves / stats.totalViews) * 100).toFixed(1)}% تحويل
            </p>
          </div>
          <div className="p-3 rounded-full bg-green-100">
            <Users className="h-6 w-6 text-green-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}
