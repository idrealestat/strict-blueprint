/**
 * PAGE 1: Customer Management - Customers List Page
 * UI Only + Mock Data
 * 
 * Components:
 * - Search bar
 * - Status filter dropdown
 * - Priority filter dropdown
 * - Add customer button (placeholder)
 * - Customers table with columns:
 *   - Name, Phone, Status, Priority, Property Type, Budget, Last Contact, Actions
 * - Pagination
 * 
 * Bilingual: Arabic + English support (RTL for Arabic)
 * Responsive: Mobile First + Desktop
 */

import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Phone, 
  MessageCircle, 
  Eye, 
  Edit,
  Users,
  ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  mockCustomers,
  getStatusColor,
  getPriorityColor,
  formatDate,
  type Customer,
  type CustomerStatus,
  type CustomerPriority,
} from '@/data/mockCustomers';

const ITEMS_PER_PAGE = 5;

export default function CustomersListPage() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter((customer) => {
      // Search filter
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.location.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;

      // Priority filter
      const matchesPriority = filterPriority === 'all' || customer.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, filterStatus, filterPriority]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Handlers (placeholders - UI only)
  const handleViewCustomer = (customer: Customer) => {
    // TODO: Implement view customer modal/page
    console.log('View customer:', customer.id);
  };

  const handleEditCustomer = (customer: Customer) => {
    // TODO: Implement edit customer modal/page
    console.log('Edit customer:', customer.id);
  };

  const handleCallCustomer = (phone: string) => {
    // TODO: Implement call functionality
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsAppCustomer = (whatsapp: string) => {
    // TODO: Implement WhatsApp functionality
    window.open(`https://wa.me/966${whatsapp.slice(1)}`, '_blank');
  };

  const handleAddCustomer = () => {
    // TODO: Implement add customer modal
    console.log('Add new customer');
  };

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      {/* Header */}
      <header className="gradient-header border-b-4 border-secondary px-4 py-4 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground md:text-2xl">
                إدارة العملاء
              </h1>
              <p className="text-sm text-primary-foreground/80">
                Customer Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground">
            <span className="hidden text-lg font-semibold md:inline">
              وساطه AI Wasata
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:px-6">
        <Card className="border-2 border-border shadow-lg">
          <CardHeader className="border-b border-border bg-card pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Users className="h-5 w-5 text-primary" />
                قائمة العملاء
                <Badge variant="secondary" className="mr-2">
                  {filteredCustomers.length}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Filters Row */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Search */}
                <div className="relative max-w-md flex-1">
                  <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن عميل..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pr-10 text-right"
                  />
                </div>

                {/* Filter Dropdowns & Add Button */}
                <div className="flex flex-wrap gap-2">
                  {/* Status Filter */}
                  <Select 
                    value={filterStatus} 
                    onValueChange={(value) => {
                      setFilterStatus(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-32 bg-background">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="جديد">جديد</SelectItem>
                      <SelectItem value="متابعة">متابعة</SelectItem>
                      <SelectItem value="مهتم">مهتم</SelectItem>
                      <SelectItem value="تم البيع">تم البيع</SelectItem>
                      <SelectItem value="ملغي">ملغي</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Priority Filter */}
                  <Select 
                    value={filterPriority} 
                    onValueChange={(value) => {
                      setFilterPriority(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-32 bg-background">
                      <SelectValue placeholder="الأولوية" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="عادي">عادي</SelectItem>
                      <SelectItem value="متوسط">متوسط</SelectItem>
                      <SelectItem value="عالي">عالي</SelectItem>
                      <SelectItem value="عاجل">عاجل</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Add Customer Button */}
                  <Button
                    onClick={handleAddCustomer}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة عميل
                  </Button>
                </div>
              </div>

              {/* Table - Desktop */}
              <div className="hidden overflow-hidden rounded-xl border-2 border-border md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b-2 border-border bg-muted">
                      <TableRow>
                        <TableHead className="text-right font-semibold text-foreground">
                          الاسم
                        </TableHead>
                        <TableHead className="text-right font-semibold text-foreground">
                          الهاتف
                        </TableHead>
                        <TableHead className="text-right font-semibold text-foreground">
                          الحالة
                        </TableHead>
                        <TableHead className="text-right font-semibold text-foreground">
                          الأولوية
                        </TableHead>
                        <TableHead className="text-right font-semibold text-foreground">
                          نوع العقار
                        </TableHead>
                        <TableHead className="text-right font-semibold text-foreground">
                          الميزانية
                        </TableHead>
                        <TableHead className="text-right font-semibold text-foreground">
                          آخر تواصل
                        </TableHead>
                        <TableHead className="text-center font-semibold text-foreground">
                          الإجراءات
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border">
                      {paginatedCustomers.map((customer) => (
                        <TableRow
                          key={customer.id}
                          className="transition-colors hover:bg-muted/50"
                        >
                          {/* Name */}
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-secondary">
                                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                                  {customer.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">
                                  {customer.name}
                                </p>
                                {customer.email && (
                                  <p className="text-xs text-muted-foreground">
                                    {customer.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Phone */}
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{customer.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-success">
                                <MessageCircle className="h-4 w-4" />
                                <span>{customer.whatsapp}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-4">
                            <Badge className={getStatusColor(customer.status)}>
                              {customer.status}
                            </Badge>
                          </TableCell>

                          {/* Priority */}
                          <TableCell className="py-4">
                            <Badge
                              variant="outline"
                              className={getPriorityColor(customer.priority)}
                            >
                              {customer.priority}
                            </Badge>
                          </TableCell>

                          {/* Property Type */}
                          <TableCell className="py-4">
                            <span className="text-sm text-foreground">
                              {customer.propertyType}
                            </span>
                          </TableCell>

                          {/* Budget */}
                          <TableCell className="py-4">
                            <span className="text-sm font-medium text-primary">
                              {customer.budget}
                            </span>
                          </TableCell>

                          {/* Last Contact */}
                          <TableCell className="py-4">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(customer.lastContact)}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewCustomer(customer)}
                                title="عرض"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditCustomer(customer)}
                                title="تعديل"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCallCustomer(customer.phone)}
                                title="اتصال"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleWhatsAppCustomer(customer.whatsapp)}
                                title="واتساب"
                              >
                                <MessageCircle className="h-4 w-4 text-success" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Cards - Mobile */}
              <div className="space-y-4 md:hidden">
                {paginatedCustomers.map((customer) => (
                  <Card key={customer.id} className="border-2 border-border">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-secondary">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {customer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-foreground">
                              {customer.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {customer.propertyType} • {customer.budget}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(customer.priority)}
                          >
                            {customer.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mb-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                        <p className="text-muted-foreground">
                          {customer.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          آخر تواصل: {formatDate(customer.lastContact)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="ml-1 h-4 w-4" />
                          عرض
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallCustomer(customer.phone)}
                        >
                          <Phone className="ml-1 h-4 w-4" />
                          اتصال
                        </Button>
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90"
                          onClick={() => handleWhatsAppCustomer(customer.whatsapp)}
                        >
                          <MessageCircle className="ml-1 h-4 w-4" />
                          واتساب
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredCustomers.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    لا يوجد عملاء
                  </h3>
                  <p className="text-muted-foreground">
                    لم يتم العثور على أي عملاء مطابقين لمعايير البحث
                  </p>
                </div>
              )}

              {/* Pagination */}
              {filteredCustomers.length > 0 && (
                <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 md:flex-row">
                  <p className="text-sm text-muted-foreground">
                    عرض {startIndex + 1} إلى{' '}
                    {Math.min(endIndex, filteredCustomers.length)} من{' '}
                    {filteredCustomers.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ArrowLeft className="ml-1 h-4 w-4" />
                      السابق
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={
                              currentPage === page
                                ? 'bg-primary text-primary-foreground'
                                : ''
                            }
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      التالي
                      <ArrowLeft className="mr-1 h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}