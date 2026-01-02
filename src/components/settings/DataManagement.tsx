import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  Shield, 
  HardDrive,
  Users,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Upload,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import {
  getStorageSize,
  getStorageInfo,
  exportAllData,
  exportCategoryData,
  clearCategoryData,
  clearAllData,
  clearOldData,
  downloadDataAsFile,
  importData,
  validateStoredData,
  repairCorruptedData,
  DATA_CATEGORIES,
  type DataCategory
} from '@/utils/localDataManager';

const categoryIcons: Record<DataCategory, any> = {
  business: Database,
  customers: Users,
  appointments: Calendar,
  analytics: BarChart3,
  drafts: FileText,
  settings: Settings,
};

export function DataManagement() {
  const [storageSize, setStorageSize] = useState({ used: 0, usedFormatted: '0 B', percentage: 0 });
  const [storageInfo, setStorageInfo] = useState<ReturnType<typeof getStorageInfo> | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; corrupted: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = () => {
    setStorageSize(getStorageSize());
    setStorageInfo(getStorageInfo());
    setValidationResult(validateStoredData());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleExportAll = () => {
    const data = exportAllData();
    const filename = `wasata-backup-${new Date().toISOString().split('T')[0]}.json`;
    downloadDataAsFile(data, filename);
    toast.success('تم تصدير جميع البيانات بنجاح');
  };

  const handleExportCategory = (category: DataCategory) => {
    const data = exportCategoryData(category);
    const filename = `wasata-${category}-${new Date().toISOString().split('T')[0]}.json`;
    downloadDataAsFile(data, filename);
    toast.success(`تم تصدير ${DATA_CATEGORIES[category].nameAr}`);
  };

  const handleClearCategory = (category: DataCategory) => {
    clearCategoryData(category);
    refreshData();
    toast.success(`تم مسح ${DATA_CATEGORIES[category].nameAr}`);
  };

  const handleClearAll = () => {
    clearAllData();
    refreshData();
    toast.success('تم مسح جميع البيانات');
  };

  const handleClearOldData = () => {
    const result = clearOldData(30);
    refreshData();
    if (result.cleared > 0) {
      toast.success(`تم مسح ${result.cleared} عناصر قديمة`);
    } else {
      toast.info('لا توجد بيانات قديمة للمسح');
    }
  };

  const handleRepairData = () => {
    const result = repairCorruptedData();
    refreshData();
    if (result.repaired > 0) {
      toast.success(`تم إصلاح ${result.repaired} عناصر تالفة`);
    } else {
      toast.info('جميع البيانات سليمة');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importData(content);
      
      if (result.success) {
        refreshData();
        toast.success(`تم استيراد ${result.keysImported} عناصر بنجاح`);
      } else {
        toast.error(result.error || 'فشل في استيراد البيانات');
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
      toast.error('فشل في قراءة الملف');
      setIsLoading(false);
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 p-4" dir="rtl">
      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-800">إشعار الخصوصية</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <p>
            يتم تخزين بيانات العمل الخاصة بك محلياً على جهازك. هذه البيانات تبقى خاصة ولا يتم
            مشاركتها مع أي طرف ثالث. يمكنك تصدير بياناتك أو حذفها في أي وقت.
          </p>
        </CardContent>
      </Card>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              <CardTitle>استخدام التخزين</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
          <CardDescription>
            {storageInfo?.totalKeys || 0} عنصر مخزن
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>المستخدم: {storageSize.usedFormatted}</span>
              <span>الحد الأقصى: ~5 MB</span>
            </div>
            <Progress value={storageSize.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {storageSize.percentage.toFixed(1)}% من السعة المتاحة
            </p>
          </div>

          {/* Data Health */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {validationResult?.valid ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700">جميع البيانات سليمة</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-700">
                  {validationResult?.corrupted.length} عناصر تالفة
                </span>
                <Button variant="outline" size="sm" onClick={handleRepairData}>
                  إصلاح
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة البيانات حسب الفئة</CardTitle>
          <CardDescription>
            تصدير أو مسح بيانات فئات محددة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.entries(DATA_CATEGORIES) as [DataCategory, typeof DATA_CATEGORIES[DataCategory]][]).map(([key, category]) => {
            const Icon = categoryIcons[key];
            const categoryStats = storageInfo?.categories[key];
            
            return (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{category.nameAr}</p>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {categoryStats && categoryStats.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {formatSize(categoryStats.size)}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCategory(key)}
                    disabled={!categoryStats || categoryStats.count === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={!categoryStats || categoryStats.count === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>مسح {category.nameAr}؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف جميع البيانات في هذه الفئة نهائياً. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleClearCategory(key)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          مسح
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات البيانات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export All */}
            <Button variant="outline" onClick={handleExportAll} className="justify-start">
              <Download className="h-4 w-4 ml-2" />
              تصدير جميع البيانات
            </Button>

            {/* Import */}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isLoading}
              />
              <Button variant="outline" className="w-full justify-start" disabled={isLoading}>
                <Upload className="h-4 w-4 ml-2" />
                استيراد بيانات
              </Button>
            </div>

            {/* Clear Old Data */}
            <Button variant="outline" onClick={handleClearOldData} className="justify-start">
              <RefreshCw className="h-4 w-4 ml-2" />
              مسح البيانات القديمة (30+ يوم)
            </Button>

            {/* Clear All */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="justify-start">
                  <Trash2 className="h-4 w-4 ml-2" />
                  مسح جميع البيانات
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>مسح جميع البيانات؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف جميع البيانات المخزنة محلياً بشكل نهائي. يُنصح بتصدير نسخة احتياطية قبل المتابعة.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2">
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    مسح الكل
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* GDPR/Privacy Compliance Info */}
      <div className="text-xs text-muted-foreground space-y-2">
        <p>
          <strong>حقوقك:</strong> لديك الحق في الوصول إلى بياناتك وتصديرها وحذفها في أي وقت.
        </p>
        <p>
          <strong>التخزين المحلي:</strong> البيانات مخزنة على جهازك فقط ولا يتم إرسالها لأي خادم خارجي.
        </p>
        <p>
          <strong>مدة الاحتفاظ:</strong> البيانات تبقى حتى تقوم بحذفها يدوياً أو مسح بيانات المتصفح.
        </p>
      </div>
    </div>
  );
}

export default DataManagement;
