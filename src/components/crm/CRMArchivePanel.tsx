/**
 * CRMArchivePanel.tsx
 * لوحة الأرشيف في السلايدر الأيمن
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Archive, 
  Search, 
  RotateCcw, 
  Trash2, 
  User, 
  Phone, 
  Calendar,
  ArrowLeft,
  CheckSquare,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/context/AuthContext';
import type { CRMCustomer } from '@/hooks/useCRMCustomers';

interface CRMArchivePanelProps {
  onClose: () => void;
  onNavigateToCustomer?: (customerId: string) => void;
}

export default function CRMArchivePanel({ onClose, onNavigateToCustomer }: CRMArchivePanelProps) {
  const { user } = useAuthContext();
  const [archivedCustomers, setArchivedCustomers] = useState<CRMCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'multiple'>('single');
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // جلب العملاء المؤرشفين
  useEffect(() => {
    if (!user) return;
    fetchArchivedCustomers();
  }, [user]);

  const fetchArchivedCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_customers')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'archived')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setArchivedCustomers(data || []);
    } catch (error) {
      console.error('Error fetching archived customers:', error);
      toast.error('فشل في جلب البيانات المؤرشفة');
    } finally {
      setLoading(false);
    }
  };

  // استعادة عميل من الأرشيف
  const restoreCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('crm_customers')
        .update({ status: 'جديد' })
        .eq('id', customerId);

      if (error) throw error;

      setArchivedCustomers(prev => prev.filter(c => c.id !== customerId));
      toast.success('تم استعادة العميل إلى إدارة العملاء');
    } catch (error) {
      console.error('Error restoring customer:', error);
      toast.error('فشل في استعادة العميل');
    }
  };

  // حذف عميل نهائياً
  const permanentDeleteCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('crm_customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      setArchivedCustomers(prev => prev.filter(c => c.id !== customerId));
      toast.success('تم حذف العميل نهائياً');
    } catch (error) {
      console.error('Error permanently deleting customer:', error);
      toast.error('فشل في الحذف النهائي');
    }
  };

  // حذف متعدد
  const deleteMultipleCustomers = async () => {
    try {
      const idsToDelete = Array.from(selectedCustomers);
      const { error } = await supabase
        .from('crm_customers')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      setArchivedCustomers(prev => prev.filter(c => !selectedCustomers.has(c.id)));
      setSelectedCustomers(new Set());
      setIsSelectionMode(false);
      toast.success(`تم حذف ${idsToDelete.length} عميل نهائياً`);
    } catch (error) {
      console.error('Error deleting multiple customers:', error);
      toast.error('فشل في الحذف المتعدد');
    }
  };

  // تبديل تحديد العميل
  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomers);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  // تحديد الكل
  const selectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  // فلترة العملاء حسب البحث
  const filteredCustomers = archivedCustomers.filter(customer => 
    !searchQuery || 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteAction = (type: 'single' | 'multiple', customerId?: string) => {
    setDeleteType(type);
    setCustomerToDelete(customerId || null);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deleteType === 'multiple') {
      await deleteMultipleCustomers();
    } else if (customerToDelete) {
      await permanentDeleteCustomer(customerToDelete);
    }
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01411C]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-[#01411C] text-white">
        <div className="flex items-center gap-3">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Archive className="w-5 h-5" />
          <h2 className="text-lg font-bold">أرشيف إدارة العملاء</h2>
        </div>
        
        {archivedCustomers.length > 0 && (
          <Button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            {isSelectionMode ? (
              <>
                <X className="w-4 h-4 ml-1" />
                إلغاء
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 ml-1" />
                تحديد متعدد
              </>
            )}
          </Button>
        )}
      </div>

      {/* Search & Actions */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في الأرشيف..."
            className="pl-10 text-right"
          />
        </div>

        {isSelectionMode && selectedCustomers.size > 0 && (
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <span className="text-sm font-medium">تم تحديد {selectedCustomers.size} عميل</span>
            <div className="flex gap-2">
              <Button
                onClick={selectAll}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {selectedCustomers.size === filteredCustomers.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </Button>
              <Button
                onClick={() => handleDeleteAction('multiple')}
                variant="destructive"
                size="sm"
                className="text-xs"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                حذف المحدد
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-600 mb-2">
              {archivedCustomers.length === 0 ? 'الأرشيف فارغ' : 'لا توجد نتائج'}
            </h3>
            <p className="text-gray-500">
              {archivedCustomers.length === 0 
                ? 'لا توجد بطاقات عملاء مؤرشفة' 
                : 'لا توجد نتائج تطابق البحث'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                className={`border transition-all ${
                  selectedCustomers.has(customer.id) ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {isSelectionMode && (
                      <div
                        className="flex items-center justify-center w-5 h-5 border-2 rounded cursor-pointer mt-1"
                        onClick={() => toggleCustomerSelection(customer.id)}
                      >
                        {selectedCustomers.has(customer.id) && (
                          <CheckSquare className="w-4 h-4 text-[#01411C]" />
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{customer.name}</h4>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Archive className="w-3 h-3 ml-1" />
                          مؤرشف
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        {customer.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </p>
                        )}
                        {customer.email && (
                          <p className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {customer.email}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          أُرشف: {new Date(customer.updated_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>

                      {!isSelectionMode && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => restoreCustomer(customer.id)}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <RotateCcw className="w-4 h-4 ml-1" />
                            استعادة
                          </Button>
                          <Button
                            onClick={() => handleDeleteAction('single', customer.id)}
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف نهائي
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              تأكيد الحذف النهائي
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              <p className="mb-2">
                {deleteType === 'multiple' 
                  ? `هل أنت متأكد من حذف ${selectedCustomers.size} عميل نهائياً؟`
                  : 'هل أنت متأكد من حذف هذا العميل نهائياً؟'
                }
              </p>
              <p className="text-red-600 font-bold">
                ⚠️ لا يمكن استعادة البيانات بعد الحذف النهائي!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              نعم، احذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}