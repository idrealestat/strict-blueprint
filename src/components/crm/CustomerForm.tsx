import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";

const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "الظهران",
  "الطائف", "بريدة", "خميس مشيط", "حفر الباطن", "المبرز", "الهفوف", "حائل",
  "نجران", "الجبيل", "ينبع", "القطيف", "صفوى", "العلا", "سكاكا", "عرعر",
  "تبوك", "أبها", "الباحة", "جازان", "القنفذة", "الوجه"
];

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  type: string;
  status: string;
  budget_min: number | string;
  budget_max: number | string;
  preferred_city: string;
  preferred_district: string;
  property_type: string;
  notes: string;
  source: string;
  priority: string;
  rating: number;
}

interface CustomerFormProps {
  customer?: CustomerFormData | null;
  onSave: (data: CustomerFormData) => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>(customer || {
    name: "",
    phone: "",
    email: "",
    type: "buyer",
    status: "new",
    budget_min: "",
    budget_max: "",
    preferred_city: "",
    preferred_district: "",
    property_type: "apartment",
    notes: "",
    source: "direct",
    priority: "medium",
    rating: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="border-2 border-[#D4AF37]" dir="rtl">
      <CardHeader className="bg-gradient-to-r from-[#01411C] to-[#065f41]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">
            {customer ? "تعديل عميل" : "عميل جديد"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>الاسم *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>رقم الجوال *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>نوع العميل *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="border-2 border-[#D4AF37]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">مشتري</SelectItem>
                  <SelectItem value="seller">بائع</SelectItem>
                  <SelectItem value="both">مشتري وبائع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="border-2 border-[#D4AF37]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">جديد</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="closed">مغلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="border-2 border-[#D4AF37]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحد الأدنى للميزانية</Label>
              <Input
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: Number(e.target.value) })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>الحد الأقصى للميزانية</Label>
              <Input
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: Number(e.target.value) })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>المدينة المفضلة</Label>
              <Select value={formData.preferred_city} onValueChange={(value) => setFormData({ ...formData, preferred_city: value })}>
                <SelectTrigger className="border-2 border-[#D4AF37]">
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  {SAUDI_CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحي المفضل</Label>
              <Input
                value={formData.preferred_district}
                onChange={(e) => setFormData({ ...formData, preferred_district: e.target.value })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>نوع العقار</Label>
              <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                <SelectTrigger className="border-2 border-[#D4AF37]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">شقة</SelectItem>
                  <SelectItem value="villa">فيلا</SelectItem>
                  <SelectItem value="land">أرض</SelectItem>
                  <SelectItem value="commercial">تجاري</SelectItem>
                  <SelectItem value="building">عمارة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>مصدر العميل</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger className="border-2 border-[#D4AF37]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">الموقع</SelectItem>
                  <SelectItem value="referral">إحالة</SelectItem>
                  <SelectItem value="social">وسائل التواصل</SelectItem>
                  <SelectItem value="direct">مباشر</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="border-2 border-[#D4AF37]"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" className="flex-1 bg-[#01411C] hover:bg-[#065f41]">
              <Save className="w-4 h-4 ml-2" />
              حفظ
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default CustomerForm;
