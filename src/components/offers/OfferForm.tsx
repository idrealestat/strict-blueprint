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
  "الطائف", "بريدة", "خميس مشيط", "حفر الباطن", "المبرز", "الهفوف", "حائل"
];

interface OfferFormData {
  title: string;
  description: string;
  property_type: string;
  status: string;
  price: number | string;
  city: string;
  district: string;
  area: number | string;
  bedrooms: number | string;
  bathrooms: number | string;
  age: number | string;
  street_width: number | string;
  direction: string;
  features: string[];
  owner_name: string;
  owner_phone: string;
  commission_rate: number;
  priority: string;
}

interface OfferFormProps {
  offer?: OfferFormData | null;
  onSave: (data: OfferFormData) => void;
  onCancel: () => void;
}

export function OfferForm({ offer, onSave, onCancel }: OfferFormProps) {
  const [formData, setFormData] = useState<OfferFormData>(offer || {
    title: "",
    description: "",
    property_type: "apartment",
    status: "available",
    price: "",
    city: "",
    district: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    age: "",
    street_width: "",
    direction: "north",
    features: [],
    owner_name: "",
    owner_phone: "",
    commission_rate: 2.5,
    priority: "medium"
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
            {offer ? "تعديل عرض" : "عرض جديد"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>عنوان العرض *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="border-2 border-[#D4AF37]"
            />
          </div>
          <div>
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="border-2 border-[#D4AF37]"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>نوع العقار *</Label>
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
              <Label>السعر (ريال) *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>المدينة *</Label>
              <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
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
              <Label>الحي</Label>
              <Input
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>المساحة (م²)</Label>
              <Input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>عدد الغرف</Label>
              <Input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>عدد الحمامات</Label>
              <Input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>عمر العقار (سنوات)</Label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>اسم المالك</Label>
              <Input
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>جوال المالك</Label>
              <Input
                value={formData.owner_phone}
                onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>نسبة العمولة (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                className="border-2 border-[#D4AF37]"
              />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="border-2 border-[#D4AF37]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">متاح</SelectItem>
                  <SelectItem value="reserved">محجوز</SelectItem>
                  <SelectItem value="sold">مباع</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

export default OfferForm;
