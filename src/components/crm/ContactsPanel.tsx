/**
 * ContactsPanel.tsx
 * لوحة جهات الاتصال - الهيكل والتصميم الأساسي
 * ⚠️ تحذير: هذا الملف محمي - لا تعدله بدون إذن صريح من صاحب المشروع
 */

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Phone,
  MessageSquare,
  UserPlus,
  RefreshCw,
  Smartphone,
  Cloud,
  Mail,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: 'app' | 'google' | 'icloud' | 'device';
  avatar?: string;
}

interface ContactsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  appContacts: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string;
  }>;
  onImportContact: (contact: Contact) => void;
}

const ContactsPanel: React.FC<ContactsPanelProps> = ({
  isOpen,
  onClose,
  appContacts,
  onImportContact,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("app");
  const [isSyncing, setIsSyncing] = useState(false);

  // تحويل جهات اتصال التطبيق للصيغة الموحدة
  const formattedAppContacts: Contact[] = useMemo(() => 
    appContacts.map(c => ({
      ...c,
      source: 'app' as const,
    })), [appContacts]);

  // جهات اتصال وهمية للعرض (سيتم استبدالها بالتكامل الفعلي لاحقاً)
  const [googleContacts] = useState<Contact[]>([
    { id: 'g1', name: 'جهة اتصال Google', phone: '0555555551', source: 'google' },
  ]);
  
  const [icloudContacts] = useState<Contact[]>([
    { id: 'i1', name: 'جهة اتصال iCloud', phone: '0555555552', source: 'icloud' },
  ]);
  
  const [deviceContacts] = useState<Contact[]>([
    { id: 'd1', name: 'جهة اتصال الجهاز', phone: '0555555553', source: 'device' },
  ]);

  // دمج جميع جهات الاتصال حسب التبويب
  const getContactsByTab = () => {
    switch (activeTab) {
      case 'app': return formattedAppContacts;
      case 'google': return googleContacts;
      case 'icloud': return icloudContacts;
      case 'device': return deviceContacts;
      case 'all': return [...formattedAppContacts, ...googleContacts, ...icloudContacts, ...deviceContacts];
      default: return formattedAppContacts;
    }
  };

  // فلترة حسب البحث
  const filteredContacts = useMemo(() => {
    const contacts = getContactsByTab();
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [searchQuery, activeTab, formattedAppContacts, googleContacts, icloudContacts, deviceContacts]);

  // محاكاة المزامنة
  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
    toast.success("تم تحديث جهات الاتصال");
  };

  // الاتصال المباشر
  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // إرسال واتساب
  const handleWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/^0/, '966');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  // استيراد جهة اتصال للتطبيق
  const handleImport = (contact: Contact) => {
    onImportContact(contact);
    toast.success(`تم استيراد ${contact.name} بنجاح`);
  };

  // أيقونة المصدر
  const getSourceIcon = (source: Contact['source']) => {
    switch (source) {
      case 'app': return <Users className="w-4 h-4 text-[#01411C]" />;
      case 'google': return <Mail className="w-4 h-4 text-red-500" />;
      case 'icloud': return <Cloud className="w-4 h-4 text-blue-500" />;
      case 'device': return <Smartphone className="w-4 h-4 text-gray-500" />;
    }
  };

  // لون المصدر
  const getSourceBadge = (source: Contact['source']) => {
    switch (source) {
      case 'app': return 'bg-[#01411C]/20 text-[#01411C] border-[#01411C]/30';
      case 'google': return 'bg-red-100 text-red-700 border-red-200';
      case 'icloud': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'device': return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden" dir="rtl">
        {/* الهيدر */}
        <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] p-4 border-b-2 border-[#D4AF37]">
          <DialogHeader className="text-white">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-[#D4AF37]" />
                جهات الاتصال
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="mr-1 text-sm">مزامنة</span>
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* البحث */}
          <div className="relative mt-3">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو رقم الهاتف..."
              className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        {/* التبويبات */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-4 pt-2 bg-gray-50 border-b">
            <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-gray-200/50">
              <TabsTrigger value="all" className="text-xs py-2 data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                الكل
              </TabsTrigger>
              <TabsTrigger value="app" className="text-xs py-2 data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                التطبيق
              </TabsTrigger>
              <TabsTrigger value="device" className="text-xs py-2 data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                الجهاز
              </TabsTrigger>
              <TabsTrigger value="google" className="text-xs py-2 data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                Google
              </TabsTrigger>
              <TabsTrigger value="icloud" className="text-xs py-2 data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                iCloud
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>لا توجد جهات اتصال</p>
                  {activeTab !== 'app' && (
                    <p className="text-xs mt-2">التكامل مع {activeTab} قادم قريباً</p>
                  )}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={`${contact.source}-${contact.id}`}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-md transition-all group"
                  >
                    {/* معلومات جهة الاتصال */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#01411C] to-[#065f41] flex items-center justify-center text-white font-bold">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 truncate">{contact.name}</h4>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getSourceBadge(contact.source)}`}>
                            {getSourceIcon(contact.source)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 font-mono" dir="ltr">{contact.phone}</p>
                      </div>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {contact.source !== 'app' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleImport(contact)}
                          className="h-8 w-8 p-0 text-[#01411C] hover:bg-[#01411C]/10"
                          title="استيراد للتطبيق"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleWhatsApp(contact.phone)}
                        className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                        title="واتساب"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCall(contact.phone)}
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        title="اتصال"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Tabs>

        {/* ملاحظة التكامل */}
        <div className="p-3 bg-amber-50 border-t border-amber-200 text-center">
          <p className="text-xs text-amber-700">
            💡 التكامل مع جهات اتصال الجهاز وGoogle وiCloud سيتم تفعيله قريباً
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactsPanel;
