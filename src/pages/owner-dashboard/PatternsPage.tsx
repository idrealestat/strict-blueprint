/**
 * PatternsPage.tsx
 * صفحة الأنماط المحظورة
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileWarning, Plus, Trash2, Search, FileJson, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import OwnerDashboardLayout from "./OwnerDashboardLayout";

interface ForbiddenPattern {
  id: string;
  pattern: string;
  pattern_type: string | null;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
}

const PatternsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [patterns, setPatterns] = useState<ForbiddenPattern[]>([]);
  const [newPattern, setNewPattern] = useState({ pattern: "", pattern_type: "contains", description: "" });
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: patternsData } = await supabase
        .from('forbidden_patterns')
        .select('*')
        .order('created_at', { ascending: false });
      
      setPatterns(patternsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportToJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات بنجاح (JSON)');
  };

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvRows = [headers.join(',')];
    data.forEach(item => {
      const values = headers.map(h => {
        const val = item[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return String(val);
      });
      csvRows.push(values.join(','));
    });
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات بنجاح (CSV)');
  };

  const handleImport = async (file: File) => {
    setImportLoading(true);
    try {
      const text = await file.text();
      let entries: Partial<ForbiddenPattern>[] = [];
      
      if (file.name.endsWith('.json')) {
        entries = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].match(/(".*?"|[^,]+)/g)?.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
          const entry: any = {};
          headers.forEach((h, idx) => {
            if (values[idx] !== undefined && values[idx] !== '') {
              if (h === 'is_active') {
                entry[h] = values[idx].toLowerCase() === 'true';
              } else {
                entry[h] = values[idx];
              }
            }
          });
          if (entry.pattern) entries.push(entry);
        }
      }

      if (entries.length === 0) {
        toast.error('لم يتم العثور على بيانات صالحة');
        return;
      }

      const cleanedEntries = entries
        .filter(e => e.pattern)
        .map(({ id, created_at, ...rest }) => ({
          pattern: rest.pattern as string,
          pattern_type: rest.pattern_type || 'contains',
          description: rest.description || null,
          is_active: rest.is_active ?? true,
        }));

      if (cleanedEntries.length === 0) {
        toast.error('لم يتم العثور على أنماط صالحة');
        return;
      }

      const { error } = await supabase.from('forbidden_patterns').insert(cleanedEntries);
      if (error) throw error;

      toast.success(`تم استيراد ${cleanedEntries.length} نمط بنجاح`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الاستيراد');
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddPattern = async () => {
    if (!newPattern.pattern.trim()) {
      toast.error('يرجى إدخال النمط');
      return;
    }
    try {
      const { error } = await supabase.from('forbidden_patterns').insert({
        pattern: newPattern.pattern.trim(),
        pattern_type: newPattern.pattern_type,
        description: newPattern.description || null,
        is_active: true,
      });
      if (error) throw error;
      toast.success('تمت الإضافة بنجاح');
      setNewPattern({ pattern: "", pattern_type: "contains", description: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    }
  };

  const getPatternTypeBadge = (type: string | null) => {
    switch (type) {
      case 'exact': return <Badge variant="outline" className="bg-red-50 text-red-700">مطابقة تامة</Badge>;
      case 'contains': return <Badge variant="outline" className="bg-amber-50 text-amber-700">يحتوي</Badge>;
      case 'startswith': return <Badge variant="outline" className="bg-blue-50 text-blue-700">يبدأ بـ</Badge>;
      case 'endswith': return <Badge variant="outline" className="bg-purple-50 text-purple-700">ينتهي بـ</Badge>;
      case 'regex': return <Badge variant="outline" className="bg-gray-50 text-gray-700">Regex</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <OwnerDashboardLayout
      title="الأنماط المحظورة"
      icon={<FileWarning className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchData}
      isLoading={isLoading}
    >
      <Card>
        <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-amber-600" />
              الأنماط المحظورة
            </CardTitle>
            <CardDescription>أنماط النصوص الممنوعة ({patterns.length} نمط)</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToJSON(patterns, 'forbidden_patterns')}
              disabled={patterns.length === 0}
            >
              <FileJson className="w-4 h-4 ml-1" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(patterns, 'forbidden_patterns', ['pattern', 'pattern_type', 'description', 'is_active'])}
              disabled={patterns.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4 ml-1" />
              CSV
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
            >
              <Upload className="w-4 h-4 ml-1" />
              استيراد
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new pattern */}
          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
            <Input
              placeholder="النمط..."
              value={newPattern.pattern}
              onChange={(e) => setNewPattern(prev => ({ ...prev, pattern: e.target.value }))}
              className="flex-1 min-w-[150px] font-mono"
            />
            <Select value={newPattern.pattern_type} onValueChange={(v) => setNewPattern(prev => ({ ...prev, pattern_type: v }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="نوع النمط" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contains">يحتوي</SelectItem>
                <SelectItem value="exact">مطابقة تامة</SelectItem>
                <SelectItem value="startswith">يبدأ بـ</SelectItem>
                <SelectItem value="endswith">ينتهي بـ</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="وصف (اختياري)..."
              value={newPattern.description}
              onChange={(e) => setNewPattern(prev => ({ ...prev, description: e.target.value }))}
              className="w-[200px]"
            />
            <Button onClick={handleAddPattern} className="bg-[#01411C] hover:bg-[#065f41]">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {patterns.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                لا توجد أنماط محظورة
              </div>
            ) : (
              patterns.map(pattern => (
                <div key={pattern.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{pattern.pattern}</code>
                      {getPatternTypeBadge(pattern.pattern_type)}
                    </div>
                    {pattern.description && <p className="text-xs text-gray-500 mt-1">{pattern.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pattern.is_active ?? true}
                      onCheckedChange={async (v) => {
                        const { error } = await supabase.from('forbidden_patterns').update({ is_active: v }).eq('id', pattern.id);
                        if (!error) {
                          setPatterns(prev => prev.map(p => p.id === pattern.id ? { ...p, is_active: v } : p));
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={async () => {
                        const { error } = await supabase.from('forbidden_patterns').delete().eq('id', pattern.id);
                        if (!error) {
                          setPatterns(prev => prev.filter(p => p.id !== pattern.id));
                          toast.success('تم الحذف');
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </OwnerDashboardLayout>
  );
};

export default PatternsPage;
