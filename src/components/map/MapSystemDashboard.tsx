/**
 * MapSystemDashboard.tsx
 * نظام الخرائط الذكي المتكامل - Smart Map System Dashboard
 * Version: 3.0.0
 */

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import LeafletMap from "./LeafletMap";
import {
  MapPin,
  Navigation,
  Layers,
  Search,
  Plus,
  ZoomIn,
  ZoomOut,
  Compass,
  Target,
  Route,
  Building2,
  Users,
  Truck,
  Warehouse,
  BarChart3,
  Settings,
  Download,
  Camera,
  Ruler,
  PenTool,
  Map,
  Globe,
  Satellite,
} from "lucide-react";

// أنواع المواقع - Location Types
const LOCATION_TYPES = [
  { id: 'customer', name: 'عميل', name_en: 'Customer', icon: '👤', color: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-800' },
  { id: 'employee', name: 'موظف', name_en: 'Employee', icon: '👨‍💼', color: '#10B981', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  { id: 'branch', name: 'فرع', name_en: 'Branch', icon: '🏢', color: '#8B5CF6', bg: 'bg-purple-100', text: 'text-purple-800' },
  { id: 'warehouse', name: 'مستودع', name_en: 'Warehouse', icon: '📦', color: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-800' },
  { id: 'delivery_point', name: 'نقطة توصيل', name_en: 'Delivery Point', icon: '🚚', color: '#EF4444', bg: 'bg-red-100', text: 'text-red-800' },
  { id: 'service_point', name: 'نقطة خدمة', name_en: 'Service Point', icon: '🔧', color: '#06B6D4', bg: 'bg-cyan-100', text: 'text-cyan-800' },
  { id: 'landmark', name: 'معلم', name_en: 'Landmark', icon: '📍', color: '#EC4899', bg: 'bg-pink-100', text: 'text-pink-800' },
  { id: 'competitor', name: 'منافس', name_en: 'Competitor', icon: '⚔️', color: '#6B7280', bg: 'bg-gray-100', text: 'text-gray-800' },
  { id: 'potential', name: 'محتمل', name_en: 'Potential', icon: '🎯', color: '#84CC16', bg: 'bg-lime-100', text: 'text-lime-800' },
] as const;

// أنواع المناطق - Area Types
const AREA_TYPES = [
  { id: 'city', name: 'مدينة', icon: '🏙️', color: '#3B82F6' },
  { id: 'district', name: 'حي', icon: '🏘️', color: '#10B981' },
  { id: 'neighborhood', name: 'حارة', icon: '🏡', color: '#8B5CF6' },
  { id: 'commercial', name: 'تجاري', icon: '🏬', color: '#F59E0B' },
  { id: 'residential', name: 'سكني', icon: '🏠', color: '#EF4444' },
  { id: 'industrial', name: 'صناعي', icon: '🏭', color: '#6B7280' },
  { id: 'tourist', name: 'سياحي', icon: '🏖️', color: '#06B6D4' },
  { id: 'mixed', name: 'مختلط', icon: '🏙️', color: '#EC4899' },
] as const;

// أنواع المسارات - Route Types
const ROUTE_TYPES = [
  { id: 'delivery', name: 'توصيل', icon: '🚚', color: '#EF4444' },
  { id: 'service', name: 'خدمة', icon: '🔧', color: '#10B981' },
  { id: 'sales', name: 'مبيعات', icon: '💰', color: '#3B82F6' },
  { id: 'inspection', name: 'تفتيش', icon: '👁️', color: '#8B5CF6' },
  { id: 'patrol', name: 'دوريات', icon: '🚔', color: '#6B7280' },
  { id: 'custom', name: 'مخصص', icon: '🎯', color: '#F59E0B' },
] as const;

// أنواع التحليلات - Analytics Types
const ANALYTICS_TYPES = [
  { id: 'heatmap', name: 'خريطة حرارية', icon: '🔥', color: '#EF4444' },
  { id: 'clustering', name: 'تجميع', icon: '🔗', color: '#3B82F6' },
  { id: 'density', name: 'كثافة', icon: '📊', color: '#10B981' },
  { id: 'movement', name: 'حركة', icon: '↗️', color: '#8B5CF6' },
  { id: 'coverage', name: 'تغطية', icon: '🗺️', color: '#F59E0B' },
  { id: 'optimization', name: 'تحسين', icon: '⚡', color: '#06B6D4' },
] as const;

// Mock data for nearby locations
const mockNearbyLocations = [
  { id: '1', name: 'أحمد محمد', type: 'customer', distance: '2.4 كم', address: 'حي النخيل، الرياض', status: 'active' },
  { id: '2', name: 'فرع الرياض الرئيسي', type: 'branch', distance: '3.1 كم', address: 'طريق الملك فهد، الرياض', status: 'open' },
  { id: '3', name: 'مندوب التوصيل #12', type: 'employee', distance: '1.8 كم', address: 'حي العليا، الرياض', status: 'moving' },
  { id: '4', name: 'مستودع الرياض', type: 'warehouse', distance: '5.2 كم', address: 'المنطقة الصناعية، الرياض', status: 'active' },
];

// Mock data for routes
const mockRoutes = [
  { id: '1', name: 'مسار توصيل الصباح', type: 'delivery', stops: 8, distance: '45 كم', status: 'active' },
  { id: '2', name: 'جولة مبيعات شرق الرياض', type: 'sales', stops: 12, distance: '32 كم', status: 'completed' },
  { id: '3', name: 'زيارات الصيانة', type: 'service', stops: 5, distance: '28 كم', status: 'pending' },
];

// Mock tracking data
const mockTrackingData = [
  { id: '1', name: 'مندوب #12', type: 'employee', speed: '45 كم/س', status: 'moving', lastUpdate: 'الآن' },
  { id: '2', name: 'شاحنة توصيل #5', type: 'vehicle', speed: '0 كم/س', status: 'stopped', lastUpdate: 'منذ 5 دقائق' },
  { id: '3', name: 'مندوب #8', type: 'employee', speed: '32 كم/س', status: 'moving', lastUpdate: 'منذ دقيقة' },
];

export default function MapSystemDashboard() {
  const [activeTab, setActiveTab] = useState('map');
  const [viewMode, setViewMode] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [zoomLevel, setZoomLevel] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLayers, setMapLayers] = useState({
    customers: true,
    employees: true,
    branches: true,
    deliveries: true,
    routes: false,
    areas: true,
  });

  // تبويبات النظام
  const tabs = [
    { id: 'map', label: 'الخريطة', icon: Map, count: null },
    { id: 'locations', label: 'المواقع', icon: MapPin, count: 245 },
    { id: 'routes', label: 'المسارات', icon: Route, count: 45 },
    { id: 'tracking', label: 'التتبع', icon: Target, count: 18 },
    { id: 'analytics', label: 'التحليلات', icon: BarChart3, count: null },
    { id: 'areas', label: 'المناطق', icon: Layers, count: 12 },
  ];

  // أدوات الخريطة
  const mapTools = [
    { id: 'measure', label: 'قياس', icon: Ruler },
    { id: 'draw', label: 'رسم', icon: PenTool },
    { id: 'marker', label: 'علامة', icon: MapPin },
    { id: 'route', label: 'مسار', icon: Route },
    { id: 'area', label: 'منطقة', icon: Layers },
    { id: 'search', label: 'بحث', icon: Search },
  ];

  const toggleLayer = (layerId: keyof typeof mapLayers) => {
    setMapLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 20));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 1, 1));

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* رأس النظام */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-3 rounded-xl">
                <Globe className="w-6 h-6" />
              </span>
              نظام الخرائط الذكي المتكامل
            </h1>
            <p className="text-gray-600 mt-2">إدارة المواقع والمسارات والتتبع الجغرافي</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="ابحث عن موقع أو عنوان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-4 py-3 w-full bg-white border border-gray-300 rounded-xl"
              />
            </div>
            
            <Button className="bg-gradient-to-r from-[#01411C] to-[#065f41] text-white rounded-xl hover:shadow-lg whitespace-nowrap">
              <Plus className="w-4 h-4 ml-2" />
              موقع جديد
            </Button>
          </div>
        </div>
        
        {/* تبويبات النظام */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-2 bg-white border-2 border-[#D4AF37] mb-4 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#01411C] data-[state=active]:to-[#065f41] data-[state=active]:text-white rounded-lg"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <Badge variant="secondary" className="text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* تبويب الخريطة */}
          <TabsContent value="map">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* الخريطة */}
              <div className="lg:col-span-3">
                <Card className="border-2 border-gray-200 overflow-hidden">
                  {/* شريط أدوات الخريطة */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                        <Button
                          variant={viewMode === 'standard' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('standard')}
                          className={viewMode === 'standard' ? 'bg-[#01411C]' : ''}
                        >
                          <Map className="w-4 h-4 ml-1" />
                          قياسي
                        </Button>
                        <Button
                          variant={viewMode === 'satellite' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('satellite')}
                          className={viewMode === 'satellite' ? 'bg-[#01411C]' : ''}
                        >
                          <Satellite className="w-4 h-4 ml-1" />
                          أقمار
                        </Button>
                        <Button
                          variant={viewMode === 'hybrid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('hybrid')}
                          className={viewMode === 'hybrid' ? 'bg-[#01411C]' : ''}
                        >
                          <Globe className="w-4 h-4 ml-1" />
                          مختلط
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
                        <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm w-8 text-center">{zoomLevel}</span>
                        <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-blue-500 text-blue-600">
                        <Target className="w-4 h-4 ml-1" />
                        موقعي
                      </Button>
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4 ml-1" />
                        لقطة
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 ml-1" />
                        تصدير
                      </Button>
                    </div>
                  </div>
                  
                  {/* منطقة الخريطة - خريطة حقيقية */}
                  <div className="relative h-[500px]">
                    <LeafletMap 
                      className="h-full"
                      showLocations={mapLayers.customers || mapLayers.employees || mapLayers.branches}
                      showRoutes={mapLayers.routes}
                      onLocationClick={(location) => {
                        toast.info(`تم اختيار: ${location.name_ar}`);
                      }}
                    />
                    
                    {/* أدوات الرسم */}
                    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 z-[1000]">
                      <div className="flex flex-col gap-1">
                        {mapTools.map((tool) => {
                          const Icon = tool.icon;
                          return (
                            <Button
                              key={tool.id}
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-100"
                              title={tool.label}
                              onClick={() => toast.info(`أداة: ${tool.label}`)}
                            >
                              <Icon className="w-5 h-5" />
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* طبقات الخريطة */}
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-56 z-[1000]">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        طبقات الخريطة
                      </h4>
                      <div className="space-y-2">
                        {[
                          { id: 'customers', label: 'العملاء', color: 'bg-blue-500' },
                          { id: 'employees', label: 'الموظفين', color: 'bg-emerald-500' },
                          { id: 'branches', label: 'الفروع', color: 'bg-purple-500' },
                          { id: 'deliveries', label: 'التوصيل', color: 'bg-red-500' },
                          { id: 'routes', label: 'المسارات', color: 'bg-amber-500' },
                          { id: 'areas', label: 'المناطق', color: 'bg-cyan-500' },
                        ].map((layer) => (
                          <div key={layer.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${layer.color}`}></div>
                              <span className="text-sm">{layer.label}</span>
                            </div>
                            <Switch
                              checked={mapLayers[layer.id as keyof typeof mapLayers]}
                              onCheckedChange={() => toggleLayer(layer.id as keyof typeof mapLayers)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* بوصلة */}
                    <div className="absolute bottom-4 right-4 bg-white rounded-full shadow-lg p-3 z-[1000]">
                      <Compass className="w-8 h-8 text-[#01411C]" />
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* القائمة الجانبية */}
              <div className="space-y-6">
                {/* المواقع القريبة */}
                <Card className="border-2 border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-[#01411C] flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      المواقع القريبة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-3">
                        {mockNearbyLocations.map((location) => {
                          const typeConfig = LOCATION_TYPES.find(t => t.id === location.type);
                          return (
                            <div 
                              key={location.id} 
                              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => toast.info(`عرض: ${location.name}`)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 ${typeConfig?.bg || 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                                    <span className="text-sm">{typeConfig?.icon}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{location.name}</h4>
                                    <div className="text-xs text-gray-500">{location.distance}</div>
                                  </div>
                                </div>
                                <Badge variant="outline" className={
                                  location.status === 'active' || location.status === 'open' 
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-blue-500 text-blue-600'
                                }>
                                  {location.status === 'active' ? 'نشط' :
                                   location.status === 'open' ? 'مفتوح' :
                                   location.status === 'moving' ? 'متحرك' : location.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600 truncate">{location.address}</div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
                
                {/* إحصائيات سريعة */}
                <Card className="border-2 border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-[#01411C] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      إحصائيات الخريطة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">المواقع المرئية</span>
                        <span className="font-bold text-blue-600">124</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">المسارات النشطة</span>
                        <span className="font-bold text-emerald-600">8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">المناطق المغطاة</span>
                        <span className="font-bold text-purple-600">45%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">الكثافة</span>
                        <Badge className="bg-amber-100 text-amber-800">عالية</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* تبويب المواقع */}
          <TabsContent value="locations">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  إدارة المواقع
                </CardTitle>
                <Button className="bg-[#01411C]">
                  <Plus className="w-4 h-4 ml-1" />
                  موقع جديد
                </Button>
              </CardHeader>
              <CardContent>
                {/* أنواع المواقع */}
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 mb-6">
                  {LOCATION_TYPES.map((type) => (
                    <div
                      key={type.id}
                      className={`p-3 rounded-lg border-2 text-center cursor-pointer hover:shadow-md transition-all ${type.bg} border-transparent hover:border-[#D4AF37]`}
                      onClick={() => toast.info(`تصفية: ${type.name}`)}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className={`text-xs font-medium ${type.text}`}>{type.name}</div>
                    </div>
                  ))}
                </div>

                {/* جدول المواقع */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الموقع</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">النوع</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">المسافة</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الحالة</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockNearbyLocations.map((location) => {
                        const typeConfig = LOCATION_TYPES.find(t => t.id === location.type);
                        return (
                          <tr key={location.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{typeConfig?.icon}</span>
                                <div>
                                  <div className="font-medium">{location.name}</div>
                                  <div className="text-xs text-gray-500">{location.address}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={`${typeConfig?.bg} ${typeConfig?.text}`}>
                                {typeConfig?.name}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm">{location.distance}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                                {location.status === 'active' ? 'نشط' : location.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">🗺️</Button>
                                <Button variant="ghost" size="sm">✏️</Button>
                                <Button variant="ghost" size="sm">🗑️</Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب المسارات */}
          <TabsContent value="routes">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  إدارة المسارات
                </CardTitle>
                <Button className="bg-[#01411C]">
                  <Plus className="w-4 h-4 ml-1" />
                  مسار جديد
                </Button>
              </CardHeader>
              <CardContent>
                {/* أنواع المسارات */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                  {ROUTE_TYPES.map((type) => (
                    <div
                      key={type.id}
                      className="p-3 rounded-lg border-2 text-center cursor-pointer hover:shadow-md transition-all bg-gray-50 hover:border-[#D4AF37]"
                      onClick={() => toast.info(`تصفية: ${type.name}`)}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs font-medium">{type.name}</div>
                    </div>
                  ))}
                </div>

                {/* قائمة المسارات */}
                <div className="space-y-3">
                  {mockRoutes.map((route) => {
                    const typeConfig = ROUTE_TYPES.find(t => t.id === route.type);
                    return (
                      <div key={route.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{typeConfig?.icon}</div>
                            <div>
                              <h4 className="font-bold">{route.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>{route.stops} نقاط</span>
                                <span>|</span>
                                <span>{route.distance}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={
                              route.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              route.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {route.status === 'active' ? 'نشط' :
                               route.status === 'completed' ? 'مكتمل' : 'معلق'}
                            </Badge>
                            <Button variant="outline" size="sm">
                              عرض على الخريطة
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب التتبع */}
          <TabsContent value="tracking">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  التتبع الحي
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">تحديث مباشر</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-emerald-600">12</div>
                      <div className="text-sm text-gray-600">متحرك الآن</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">5</div>
                      <div className="text-sm text-gray-600">متوقف</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-gray-600">1</div>
                      <div className="text-sm text-gray-600">غير متصل</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  {mockTrackingData.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.status === 'moving' ? 'bg-emerald-100' : 'bg-gray-100'
                          }`}>
                            {item.type === 'employee' ? '👨‍💼' : '🚚'}
                          </div>
                          <div>
                            <h4 className="font-bold">{item.name}</h4>
                            <div className="text-sm text-gray-600">{item.lastUpdate}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <div className="font-bold">{item.speed}</div>
                            <Badge className={
                              item.status === 'moving' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {item.status === 'moving' ? 'متحرك' : 'متوقف'}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            <Target className="w-4 h-4 ml-1" />
                            تتبع
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب التحليلات */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-[#01411C]">أنواع التحليلات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {ANALYTICS_TYPES.map((type) => (
                      <div
                        key={type.id}
                        className="p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all hover:border-[#D4AF37] text-center"
                        onClick={() => toast.info(`تحليل: ${type.name}`)}
                      >
                        <div className="text-3xl mb-2">{type.icon}</div>
                        <div className="font-medium">{type.name}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-[#01411C]">مؤشرات الأداء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>التغطية الجغرافية</span>
                        <span className="font-bold text-emerald-600">78%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>كفاءة المسارات</span>
                        <span className="font-bold text-blue-600">85%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>كثافة العملاء</span>
                        <span className="font-bold text-purple-600">62%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>تحسين التوزيع</span>
                        <span className="font-bold text-amber-600">71%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: '71%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* تبويب المناطق */}
          <TabsContent value="areas">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  إدارة المناطق
                </CardTitle>
                <Button className="bg-[#01411C]">
                  <Plus className="w-4 h-4 ml-1" />
                  منطقة جديدة
                </Button>
              </CardHeader>
              <CardContent>
                {/* أنواع المناطق */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                  {AREA_TYPES.map((type) => (
                    <div
                      key={type.id}
                      className="p-3 rounded-lg border-2 text-center cursor-pointer hover:shadow-md transition-all bg-gray-50 hover:border-[#D4AF37]"
                      onClick={() => toast.info(`تصفية: ${type.name}`)}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs font-medium">{type.name}</div>
                    </div>
                  ))}
                </div>

                {/* إحصائيات المناطق */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-sm text-gray-600">منطقة مُعرّفة</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-600">156</div>
                      <div className="text-sm text-gray-600">عميل في المناطق</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">8</div>
                      <div className="text-sm text-gray-600">فروع</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">45%</div>
                      <div className="text-sm text-gray-600">تغطية</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* زر الإضافة السريعة */}
      <Button 
        className="fixed bottom-8 left-8 w-14 h-14 rounded-full bg-gradient-to-r from-[#01411C] to-[#065f41] text-white shadow-xl hover:shadow-2xl transition-all hover:scale-110"
        onClick={() => toast.info('سيتم فتح نموذج إضافة موقع جديد')}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
