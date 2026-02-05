/**
 * BlacklistPage.tsx
 * صفحة القائمة السوداء
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ban, Plus, Trash2, Search, FileJson, FileSpreadsheet, Upload } from "lucide-react";
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

interface BlacklistEntry {
  id: string;
  company_name: string;
  company_name_en: string | null;
  domain: string | null;
  domain_root: string | null;
  city: string | null;
  category: string | null;
  source: string | null;
  is_active: boolean | null;
  confidence_level: number | null;
  created_at: string;
}

const BlacklistPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [blacklistSearch, setBlacklistSearch] = useState("");
  const [newBlacklistEntry, setNewBlacklistEntry] = useState({ company_name: "", domain: "", city: "", category: "" });
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: blacklistData } = await supabase
        .from('domain_blacklist')
        .select('*')
        .order('created_at', { ascending: false });
      
      setBlacklist(blacklistData || []);
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
      let entries: Partial<BlacklistEntry>[] = [];
      
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
              } else if (h === 'confidence_level') {
                entry[h] = Number(values[idx]) || null;
              } else {
                entry[h] = values[idx];
              }
            }
          });
          if (entry.company_name) entries.push(entry);
        }
      }

      if (entries.length === 0) {
        toast.error('لم يتم العثور على بيانات صالحة');
        return;
      }

      const cleanedEntries = entries
        .filter(e => e.company_name)
        .map(({ id, created_at, ...rest }) => ({
          company_name: rest.company_name as string,
          company_name_en: rest.company_name_en || null,
          domain: rest.domain || null,
          domain_root: rest.domain_root || null,
          city: rest.city || null,
          category: rest.category || null,
          source: rest.source || null,
          confidence_level: rest.confidence_level || null,
          is_active: rest.is_active ?? true,
        }));

      if (cleanedEntries.length === 0) {
        toast.error('لم يتم العثور على سجلات صالحة');
        return;
      }

      const { error } = await supabase.from('domain_blacklist').insert(cleanedEntries);
      if (error) throw error;

      toast.success(`تم استيراد ${cleanedEntries.length} سجل بنجاح`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الاستيراد');
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddEntry = async () => {
    if (!newBlacklistEntry.company_name.trim()) {
      toast.error('يرجى إدخال اسم الشركة');
      return;
    }
    try {
      const { error } = await supabase.from('domain_blacklist').insert({
        company_name: newBlacklistEntry.company_name,
        domain: newBlacklistEntry.domain || null,
        city: newBlacklistEntry.city || null,
        category: newBlacklistEntry.category || null,
        is_active: true,
      });
      if (error) throw error;
      toast.success('تمت الإضافة بنجاح');
      setNewBlacklistEntry({ company_name: "", domain: "", city: "", category: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    }
  };

  const filteredBlacklist = blacklist.filter(b => 
    b.company_name.toLowerCase().includes(blacklistSearch.toLowerCase()) ||
    (b.domain?.toLowerCase().includes(blacklistSearch.toLowerCase()))
  );

  return (
    <OwnerDashboardLayout
      title="القائمة السوداء"
      icon={<Ban className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchData}
      isLoading={isLoading}
    >
      <Card>
        <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              القائمة السوداء للنطاقات
            </CardTitle>
            <CardDescription>الشركات والمكاتب المحظورة ({blacklist.length} سجل)</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToJSON(blacklist, 'domain_blacklist')}
              disabled={blacklist.length === 0}
            >
              <FileJson className="w-4 h-4 ml-1" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(blacklist, 'domain_blacklist', ['company_name', 'company_name_en', 'domain', 'domain_root', 'city', 'category', 'source', 'is_active', 'confidence_level'])}
              disabled={blacklist.length === 0}
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
          {/* Add new entry */}
          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
            <Input
              placeholder="اسم الشركة..."
              value={newBlacklistEntry.company_name}
              onChange={(e) => setNewBlacklistEntry(prev => ({ ...prev, company_name: e.target.value }))}
              className="flex-1 min-w-[150px]"
            />
            <Input
              placeholder="النطاق (اختياري)..."
              value={newBlacklistEntry.domain}
              onChange={(e) => setNewBlacklistEntry(prev => ({ ...prev, domain: e.target.value }))}
              className="w-[150px]"
            />
            <Input
              placeholder="المدينة..."
              value={newBlacklistEntry.city}
              onChange={(e) => setNewBlacklistEntry(prev => ({ ...prev, city: e.target.value }))}
              className="w-[120px]"
            />
            <Select value={newBlacklistEntry.category} onValueChange={(v) => setNewBlacklistEntry(prev => ({ ...prev, category: v }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real_estate">عقارات</SelectItem>
                <SelectItem value="banking">بنوك</SelectItem>
                <SelectItem value="government">حكومي</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddEntry} className="bg-[#01411C] hover:bg-[#065f41]">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث في القائمة السوداء..."
              value={blacklistSearch}
              onChange={(e) => setBlacklistSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {filteredBlacklist.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <p className="font-medium">{entry.company_name}</p>
                  <div className="flex gap-2 text-xs text-gray-500">
                    {entry.domain && <span className="font-mono">{entry.domain}</span>}
                    {entry.city && <span>• {entry.city}</span>}
                    {entry.category && <Badge variant="outline" className="text-xs">{entry.category}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={entry.is_active ?? true}
                    onCheckedChange={async (v) => {
                      const { error } = await supabase.from('domain_blacklist').update({ is_active: v }).eq('id', entry.id);
                      if (!error) {
                        setBlacklist(prev => prev.map(b => b.id === entry.id ? { ...b, is_active: v } : b));
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={async () => {
                      const { error } = await supabase.from('domain_blacklist').delete().eq('id', entry.id);
                      if (!error) {
                        setBlacklist(prev => prev.filter(b => b.id !== entry.id));
                        toast.success('تم الحذف');
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </OwnerDashboardLayout>
  );
};

export default BlacklistPage;
