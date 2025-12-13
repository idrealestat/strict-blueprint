import { Home, Users, Calendar, TrendingUp, Phone, Mail, Settings, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";

const mockUser = {
  name: 'أحمد محمد',
  phone: '0512345678',
  email: 'ahmed@example.com',
  type: 'individual' as const,
  plan: 'المحترف'
};

const stats = [
  { icon: Home, label: 'إجمالي العقارات', value: '24', change: '+3', color: '#01411C' },
  { icon: Users, label: 'العملاء', value: '156', change: '+12', color: '#3B82F6' },
  { icon: Calendar, label: 'المواعيد', value: '8', change: '+2', color: '#F59E0B' },
  { icon: TrendingUp, label: 'الصفقات المكتملة', value: '42', change: '+5', color: '#10B981' },
];

const getUserTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    individual: 'فرد',
    team: 'فريق',
    office: 'مكتب',
    company: 'شركة'
  };
  return types[type] || type;
};

const Dashboard = () => {
  return (
    <MainLayout>
      {/* News Ticker */}
      <div className="bg-gradient-to-r from-wasata-green to-wasata-green-dark text-white py-2 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-wasata-gold" />
            <span className="font-bold">آخر الأخبار</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-8 animate-marquee whitespace-nowrap">
              <span className="flex items-center gap-2">
                <span className="text-wasata-gold">•</span>
                ارتفاع أسعار العقارات في الرياض بنسبة 5%
              </span>
              <span className="flex items-center gap-2">
                <span className="text-wasata-gold">•</span>
                إطلاق مشاريع جديدة في جدة
              </span>
              <span className="flex items-center gap-2">
                <span className="text-wasata-gold">•</span>
                تحديثات جديدة في نظام إيجار
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="border-2 border-wasata-gold bg-gradient-to-r from-background to-wasata-green/5 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              {/* Avatar */}
              <Avatar className="w-16 h-16 border-4 border-wasata-gold shadow-lg flex-shrink-0">
                <AvatarFallback className="bg-wasata-green text-white text-xl font-bold">
                  {mockUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 text-right">
                <h2 className="text-xl font-bold text-wasata-green mb-1">
                  {mockUser.name}
                </h2>

                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-wasata-gold text-wasata-green">
                    {getUserTypeLabel(mockUser.type)}
                  </Badge>
                  <Badge variant="outline" className="border-wasata-green">
                    {mockUser.plan}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{mockUser.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{mockUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <Button
                variant="outline"
                size="sm"
                className="border-2 border-wasata-gold"
              >
                <Settings className="w-4 h-4 ml-2" />
                تعديل
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-2 border-border hover:border-wasata-gold transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-wasata-green mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-2 border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-wasata-green mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              الإجراءات السريعة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 border-2 hover:border-wasata-gold hover:bg-wasata-green/5"
              >
                <Home className="w-6 h-6 text-wasata-green" />
                <span>إضافة عقار</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 border-2 hover:border-wasata-gold hover:bg-wasata-green/5"
              >
                <Users className="w-6 h-6 text-blue-600" />
                <span>إضافة عميل</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 border-2 hover:border-wasata-gold hover:bg-wasata-green/5"
              >
                <Calendar className="w-6 h-6 text-orange-500" />
                <span>جدولة موعد</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 border-2 hover:border-wasata-gold hover:bg-wasata-green/5"
              >
                <TrendingUp className="w-6 h-6 text-green-600" />
                <span>عرض التقارير</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
