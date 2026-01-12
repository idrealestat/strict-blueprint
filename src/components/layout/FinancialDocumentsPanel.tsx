/**
 * FinancialDocumentsPanel.tsx
 * لوحة عرض عروض الأسعار وسندات القبض
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Receipt,
  Phone,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFinancialDocuments, CustomerWithDocuments, FinancialDocument } from '@/hooks/useFinancialDocuments';

interface FinancialDocumentsPanelProps {
  type: 'quotations' | 'receipts';
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCustomer: (customerId: string, customerName: string) => void;
}

export default function FinancialDocumentsPanel({
  type,
  isOpen,
  onClose,
  onNavigateToCustomer,
}: FinancialDocumentsPanelProps) {
  const { customersWithQuotations, customersWithReceipts, isLoading } = useFinancialDocuments();
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  const customers = type === 'quotations' ? customersWithQuotations : customersWithReceipts;
  const documents = type === 'quotations' ? 'quotations' : 'receipts';
  const title = type === 'quotations' ? 'عروض الأسعار' : 'سندات القبض';
  const icon = type === 'quotations' ? FileText : Receipt;
  const IconComponent = icon;
  const color = type === 'quotations' ? '#01411C' : '#D4AF37';

  const toggleCustomer = (customerId: string) => {
    setExpandedCustomers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ar-SA');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('ar-SA') || '0';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="p-4 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className="text-white/80 text-sm">
                  {customers.length} عميل
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="h-[60vh]">
            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-[#01411C] rounded-full mx-auto mb-4" />
                  <p className="text-gray-500">جاري التحميل...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-12">
                  <IconComponent className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    لا توجد {title} محفوظة
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    ستظهر هنا {title} عند إنشائها من بطاقات العملاء
                  </p>
                </div>
              ) : (
                customers.map((customer) => {
                  const isExpanded = expandedCustomers.has(customer.id);
                  const customerDocs = customer[documents] as FinancialDocument[];
                  const totalAmount = customerDocs.reduce(
                    (sum, doc) => sum + (doc.total || 0),
                    0
                  );

                  return (
                    <motion.div
                      key={customer.id}
                      className="border-2 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                      style={{ borderColor: `${color}40` }}
                    >
                      {/* Customer Header */}
                      <div
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleCustomer(customer.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: color }}
                          >
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">
                              {customer.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span dir="ltr">{customer.phone}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className="text-white"
                            style={{ backgroundColor: color }}
                          >
                            {customerDocs.length}{' '}
                            {type === 'quotations' ? 'عرض' : 'سند'}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Documents List */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t bg-gray-50"
                          >
                            <div className="p-3 space-y-2">
                              {customerDocs.map((doc, index) => (
                                <div
                                  key={doc.id || index}
                                  className="bg-white p-3 rounded-lg border flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                      <DollarSign className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800">
                                        {formatCurrency(doc.total)} ر.س
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatDate(doc.createdAt)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Navigate Button */}
                              <Button
                                className="w-full mt-2 text-white"
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  onNavigateToCustomer(customer.id, customer.name)
                                }
                              >
                                <ExternalLink className="w-4 h-4 ml-2" />
                                فتح بطاقة {customer.name}
                              </Button>
                            </div>

                            {/* Total */}
                            <div
                              className="p-3 border-t text-center"
                              style={{ backgroundColor: `${color}10` }}
                            >
                              <span className="text-gray-600 text-sm">
                                إجمالي المبالغ:{' '}
                              </span>
                              <span
                                className="font-bold"
                                style={{ color: color }}
                              >
                                {formatCurrency(totalAmount)} ر.س
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
