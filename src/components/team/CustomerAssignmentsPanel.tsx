/**
 * CustomerAssignmentsPanel.tsx
 * تبويب "العملاء" داخل لوحة إدارة الفريق
 * - يعرض كل عملاء CRM للمسؤول
 * - يسمح بتعيين كل عميل لعضو من الفريق عبر قائمة منسدلة
 * - يقرأ من useCRMCustomers (الأصلي بدون تعديل) ومن useCustomerAssignments
 */

import { useMemo, useState } from 'react';
import { Search, UserPlus, X as XIcon, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCRMCustomers } from '@/hooks/useCRMCustomers';
import { useCustomerAssignments } from '@/hooks/useCustomerAssignments';
import { useTeamManagement, type OrganizationMember } from '@/hooks/useTeamManagement';

const UNASSIGNED = '__unassigned__';

export default function CustomerAssignmentsPanel() {
  const { customers, loading: customersLoading } = useCRMCustomers();
  const { members, isLoading: membersLoading } = useTeamManagement();
  const {
    assignments,
    loading: assignmentsLoading,
    assignCustomer,
    unassignCustomer,
    getAssignmentFor,
  } = useCustomerAssignments();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');

  const activeMembers = useMemo<OrganizationMember[]>(
    () => members.filter((m) => m.status === 'active' && m.member_user_id),
    [members]
  );

  const memberById = useMemo(() => {
    const map = new Map<string, OrganizationMember>();
    activeMembers.forEach((m) => {
      if (m.member_user_id) map.set(m.member_user_id, m);
    });
    return map;
  }, [activeMembers]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return customers.filter((c) => {
      const assignment = getAssignmentFor(c.id);
      if (filter === 'assigned' && !assignment) return false;
      if (filter === 'unassigned' && assignment) return false;
      if (!s) return true;
      return (
        (c.name || '').toLowerCase().includes(s) ||
        (c.phone || '').toLowerCase().includes(s) ||
        (c.email || '').toLowerCase().includes(s)
      );
    });
  }, [customers, search, filter, getAssignmentFor]);

  const loading = customersLoading || membersLoading || assignmentsLoading;

  const handleAssignChange = async (customerId: string, value: string) => {
    if (value === UNASSIGNED) {
      await unassignCustomer(customerId);
    } else {
      await assignCustomer(customerId, value);
    }
  };

  return (
    <div className="space-y-3" dir="rtl">
      {/* شريط البحث + الفلتر */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ابحث عن عميل بالاسم أو الجوال..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 font-cairo"
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[#01411C] hover:bg-[#012d14]' : ''}
          >
            الكل
          </Button>
          <Button
            size="sm"
            variant={filter === 'unassigned' ? 'default' : 'outline'}
            onClick={() => setFilter('unassigned')}
            className={filter === 'unassigned' ? 'bg-[#D4AF37] hover:bg-[#b8962f] text-black' : ''}
          >
            غير معينين
          </Button>
          <Button
            size="sm"
            variant={filter === 'assigned' ? 'default' : 'outline'}
            onClick={() => setFilter('assigned')}
            className={filter === 'assigned' ? 'bg-[#01411C] hover:bg-[#012d14]' : ''}
          >
            معينون
          </Button>
        </div>
      </div>

      {/* ملخص */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Card className="bg-gradient-to-br from-[#01411C]/5 to-transparent">
          <CardContent className="p-3">
            <p className="text-xl font-bold text-[#01411C]">{customers.length}</p>
            <p className="text-xs text-gray-600">إجمالي العملاء</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-transparent">
          <CardContent className="p-3">
            <p className="text-xl font-bold text-[#D4AF37]">{assignments.length}</p>
            <p className="text-xs text-gray-600">معينون</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-100 to-transparent">
          <CardContent className="p-3">
            <p className="text-xl font-bold text-gray-700">
              {customers.length - assignments.length}
            </p>
            <p className="text-xs text-gray-600">غير معينين</p>
          </CardContent>
        </Card>
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : activeMembers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-bold">لا يوجد أعضاء فريق نشطون</p>
            <p className="text-sm text-gray-400 mt-1">
              أضف زملاء أولاً من تبويب "الزملاء" حتى تستطيع تعيين العملاء لهم
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <UserPlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">لا توجد نتائج مطابقة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((customer) => {
            const assignment = getAssignmentFor(customer.id);
            const assignedMember = assignment
              ? memberById.get(assignment.assigned_to_user_id)
              : null;

            return (
              <Card key={customer.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 truncate">
                          {customer.name}
                        </span>
                        {assignedMember ? (
                          <Badge className="bg-[#01411C]/10 text-[#01411C] border-[#01411C]/30 text-xs">
                            مسند إلى: {assignedMember.member_name || 'عضو'}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                            غير مسند
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {customer.phone && <span>{customer.phone}</span>}
                        {customer.status && <span>· {customer.status}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Select
                        value={assignment?.assigned_to_user_id || UNASSIGNED}
                        onValueChange={(v) => handleAssignChange(customer.id, v)}
                      >
                        <SelectTrigger className="w-[160px] h-9 text-xs font-cairo">
                          <SelectValue placeholder="اختر وسيطاً" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value={UNASSIGNED}>— غير مسند —</SelectItem>
                          {activeMembers.map((m) => (
                            <SelectItem
                              key={m.member_user_id!}
                              value={m.member_user_id!}
                            >
                              {m.member_name || m.member_email || 'عضو'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {assignment && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-red-500 hover:bg-red-50"
                          onClick={() => unassignCustomer(customer.id)}
                          title="إلغاء التعيين"
                        >
                          <XIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}