import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  Star,
  Tag,
  CheckCircle,
  Clock,
  Activity,
  FileText,
  Upload,
  Download,
  Trash2,
  Edit,
  MessageSquare,
  Video,
  Image as ImageIcon,
  File,
  Send,
  AlertCircle,
  TrendingUp,
  Target,
  Award,
  Briefcase,
  Heart,
  Home,
  Car,
  Plane,
  GripVertical,
  Save,
  Navigation,
  Eye,
  Globe,
  ExternalLink,
  Megaphone,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// واجهة العميل
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  location?: string;
  type?: string;
  interestLevel?: string;
  dealsCount?: number;
  dealValue?: number;
  hasUnreadPublishedAd?: boolean;
}

// 15 سلايد - 8 موجودة + 7 من التوثيق
const DEFAULT_SLIDES = [
  { 
    id: 'info', 
    title: 'معلومات عامة', 
    icon: User, 
    color: 'from-blue-500 to-cyan-400',
    bgColor: 'bg-gradient-to-br from-blue-500 to-cyan-400'
  },
  { 
    id: 'activities', 
    title: 'الأنشطة', 
    icon: Activity, 
    color: 'from-green-500 to-emerald-400',
    bgColor: 'bg-gradient-to-br from-green-500 to-emerald-400'
  },
  { 
    id: 'deals', 
    title: 'الصفقات', 
    icon: DollarSign, 
    color: 'from-purple-500 to-pink-400',
    bgColor: 'bg-gradient-to-br from-purple-500 to-pink-400'
  },
  { 
    id: 'properties', 
    title: 'العقارات', 
    icon: Home, 
    color: 'from-amber-500 to-yellow-400',
    bgColor: 'bg-gradient-to-br from-amber-500 to-yellow-400'
  },
  { 
    id: 'documents', 
    title: 'المستندات', 
    icon: FileText, 
    color: 'from-rose-500 to-red-400',
    bgColor: 'bg-gradient-to-br from-rose-500 to-red-400'
  },
  { 
    id: 'notes', 
    title: 'الملاحظات', 
    icon: MessageSquare, 
    color: 'from-indigo-500 to-blue-400',
    bgColor: 'bg-gradient-to-br from-indigo-500 to-blue-400'
  },
  { 
    id: 'tasks', 
    title: 'المهام', 
    icon: CheckCircle, 
    color: 'from-teal-500 to-green-400',
    bgColor: 'bg-gradient-to-br from-teal-500 to-green-400'
  },
  { 
    id: 'media', 
    title: 'الوسائط', 
    icon: ImageIcon, 
    color: 'from-orange-500 to-amber-400',
    bgColor: 'bg-gradient-to-br from-orange-500 to-amber-400'
  },
  // السلايدات الإضافية من التوثيق
  { 
    id: 'published-ads', 
    title: 'إعلان منشور', 
    icon: Send, 
    color: 'from-cyan-500 to-blue-400',
    bgColor: 'bg-gradient-to-br from-cyan-500 to-blue-400'
  },
  { 
    id: 'financing', 
    title: 'طلب حسبة التمويل', 
    icon: DollarSign, 
    color: 'from-emerald-500 to-green-400',
    bgColor: 'bg-gradient-to-br from-emerald-500 to-green-400'
  },
  { 
    id: 'property-offer', 
    title: 'عرض العقار', 
    icon: Home, 
    color: 'from-violet-500 to-purple-400',
    bgColor: 'bg-gradient-to-br from-violet-500 to-purple-400'
  },
  { 
    id: 'property-request', 
    title: 'طلب العقار', 
    icon: FileText, 
    color: 'from-pink-500 to-rose-400',
    bgColor: 'bg-gradient-to-br from-pink-500 to-rose-400'
  },
  { 
    id: 'received-offers', 
    title: 'العروض المستقبلة', 
    icon: TrendingUp, 
    color: 'from-lime-500 to-green-400',
    bgColor: 'bg-gradient-to-br from-lime-500 to-green-400'
  },
  { 
    id: 'received-requests', 
    title: 'الطلبات المستقبلة', 
    icon: Target, 
    color: 'from-fuchsia-500 to-pink-400',
    bgColor: 'bg-gradient-to-br from-fuchsia-500 to-pink-400'
  },
  { 
    id: 'additional-info', 
    title: 'معلومات إضافية', 
    icon: Award, 
    color: 'from-slate-500 to-gray-400',
    bgColor: 'bg-gradient-to-br from-slate-500 to-gray-400'
  }
];

// السلايد الثاني - الأنشطة
const ActivitiesSlide = ({ customer }: { customer: Customer }) => {
  const activities = [
    { type: 'call', title: 'مكالمة هاتفية', time: 'منذ ساعة', status: 'completed', color: 'green' },
    { type: 'meeting', title: 'اجتماع', time: 'منذ 3 ساعات', status: 'completed', color: 'blue' },
    { type: 'email', title: 'بريد إلكتروني', time: 'أمس', status: 'sent', color: 'purple' },
    { type: 'note', title: 'إضافة ملاحظة', time: 'منذ يومين', status: 'added', color: 'amber' }
  ];
  
  return (
    <div className="space-y-4 p-6">
      {activities.map((activity, index) => (
        <div key={index} className={`bg-${activity.color}-50 border border-${activity.color}-200 rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className={`w-5 h-5 text-${activity.color}-600`} />
              <div>
                <h4 className="font-bold text-gray-800">{activity.title}</h4>
                <p className="text-sm text-gray-600">{activity.time}</p>
              </div>
            </div>
            <span className={`px-3 py-1 bg-${activity.color}-600 text-white text-xs rounded-full`}>
              {activity.status}
            </span>
          </div>
        </div>
      ))}
      <button className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        إضافة نشاط جديد
      </button>
    </div>
  );
};

// السلايد الثالث - الصفقات
const DealsSlide = ({ customer }: { customer: Customer }) => {
  const deals = [
    { title: 'شقة في الرياض', value: 450000, status: 'active', progress: 75 },
    { title: 'فيلا في جدة', value: 850000, status: 'pending', progress: 30 }
  ];
  
  return (
    <div className="space-y-4 p-6">
      {deals.map((deal, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">{deal.title}</h4>
            <span className="text-2xl font-bold text-green-600">${deal.value.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${deal.progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-600">{deal.progress}% مكتمل</p>
        </div>
      ))}
    </div>
  );
};

// السلايد الرابع - العقارات
const PropertiesSlide = ({ customer }: { customer: Customer }) => {
  const properties = [
    { name: 'شقة 3 غرف', location: 'الرياض، حي النرجس', price: 450000, type: 'للبيع' },
    { name: 'فيلا 5 غرف', location: 'جدة، حي الروضة', price: 850000, type: 'للبيع' }
  ];
  
  return (
    <div className="space-y-4 p-6">
      {properties.map((property, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-gray-800">{property.name}</h4>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">{property.type}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4" />
            {property.location}
          </div>
          <div className="text-2xl font-bold text-blue-600">${property.price.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
};

// السلايد الخامس - المستندات
const DocumentsSlide = ({ customer }: { customer: Customer }) => {
  const documents = [
    { name: 'الهوية الوطنية.pdf', size: '2.3 MB', date: '2024-01-15', type: 'pdf' },
    { name: 'عقد البيع.docx', size: '1.1 MB', date: '2024-01-20', type: 'doc' },
    { name: 'صورة العقار.jpg', size: '4.5 MB', date: '2024-01-25', type: 'image' }
  ];
  
  return (
    <div className="space-y-3 p-6">
      {documents.map((doc, index) => (
        <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="w-8 h-8 text-blue-600" />
            <div>
              <h4 className="font-medium text-gray-800">{doc.name}</h4>
              <p className="text-xs text-gray-500">{doc.size} • {doc.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}
      <button className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
        <Upload className="w-5 h-5" />
        رفع مستند جديد
      </button>
    </div>
  );
};

// السلايد السادس - الملاحظات
const NotesSlide = ({ customer }: { customer: Customer }) => {
  const [notes, setNotes] = useState([
    { id: 1, text: 'عميل جاد ومهتم بالشراء', date: '2024-01-20', priority: 'high' },
    { id: 2, text: 'يفضل الدفع نقداً', date: '2024-01-18', priority: 'medium' },
    { id: 3, text: 'متابعة بعد أسبوع', date: '2024-01-15', priority: 'low' }
  ]);
  const [newNote, setNewNote] = useState('');
  
  return (
    <div className="space-y-4 p-6">
      {notes.map((note) => (
        <div key={note.id} className={`${note.priority === 'high' ? 'bg-red-50 border-red-200' : note.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-800 mb-2">{note.text}</p>
              <p className="text-xs text-gray-500">{note.date}</p>
            </div>
            <button 
              onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <textarea
        rows={3}
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="إضافة ملاحظة جديدة..."
        className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-gray-200"
      ></textarea>
      <button 
        onClick={() => {
          if (newNote.trim()) {
            setNotes([...notes, {
              id: Date.now(),
              text: newNote,
              date: new Date().toLocaleDateString('ar-SA'),
              priority: 'medium'
            }]);
            setNewNote('');
          }
        }}
        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
      >
        حفظ الملاحظة
      </button>
    </div>
  );
};

// السلايد السابع - المهام
const TasksSlide = ({ customer }: { customer: Customer }) => {
  const tasks = [
    { title: 'الاتصال بالعميل', done: true, priority: 'high', dueDate: 'اليوم' },
    { title: 'إرسال العرض', done: false, priority: 'high', dueDate: 'غداً' },
    { title: 'متابعة الرد', done: false, priority: 'medium', dueDate: 'بعد يومين' },
    { title: 'تحديث البيانات', done: false, priority: 'low', dueDate: 'الأسبوع القادم' }
  ];
  
  return (
    <div className="space-y-3 p-6">
      {tasks.map((task, index) => (
        <div key={index} className={`bg-white rounded-xl p-4 shadow-sm border-2 ${task.done ? 'border-green-200' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={task.done}
              className="w-5 h-5 rounded"
              readOnly
            />
            <div className="flex-1">
              <h4 className={`font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {task.title}
              </h4>
              <p className="text-xs text-gray-500">{task.dueDate}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              task.priority === 'high' ? 'bg-red-100 text-red-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {task.priority === 'high' ? 'عاجل' : task.priority === 'medium' ? 'متوسط' : 'عادي'}
            </span>
          </div>
        </div>
      ))}
      <button className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        إضافة مهمة جديدة
      </button>
    </div>
  );
};

// السلايد الثامن - الوسائط
const MediaSlide = ({ customer }: { customer: Customer }) => {
  const [media, setMedia] = useState([
    { id: 1, url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400', type: 'image' },
    { id: 2, url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400', type: 'image' },
    { id: 3, url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400', type: 'image' },
    { id: 4, url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', type: 'image' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {media.map((item) => (
          <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden">
            <img src={item.url} alt={`Media ${item.id}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                onClick={() => window.open(item.url, '_blank')}
                className="p-2 bg-white rounded-lg"
              >
                <Eye className="w-4 h-4 text-gray-800" />
              </button>
              <button 
                onClick={() => setMedia(media.filter(m => m.id !== item.id))}
                className="p-2 bg-white rounded-lg"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            files.forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => {
                setMedia(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  url: reader.result as string,
                  type: file.type.startsWith('video') ? 'video' : 'image'
                }]);
              };
              reader.readAsDataURL(file);
            });
          }}
          className="hidden"
        />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">اسحب الملفات هنا أو انقر للتصفح</p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          رفع ملفات
        </button>
      </div>
    </div>
  );
};

// السلايد التاسع - إعلان منشور
const PublishedAdsSlide = ({ customer }: { customer: Customer }) => {
  return (
    <div className="space-y-4 p-6">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-cyan-200">
        <div className="flex items-center gap-3 mb-4">
          <Send className="w-8 h-8 text-cyan-600" />
          <div>
            <h3 className="text-xl font-bold text-cyan-900">الإعلانات المنشورة</h3>
            <p className="text-sm text-cyan-700">إعلانات العميل المنشورة</p>
          </div>
        </div>
      </div>

      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">لا توجد إعلانات منشورة حالياً</p>
        <button className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium flex items-center gap-2 mx-auto">
          <Plus className="w-5 h-5" />
          نشر إعلان جديد
        </button>
      </div>
    </div>
  );
};

// السلايد العاشر - طلب حسبة التمويل
const FinancingRequestSlide = ({ customer }: { customer: Customer }) => {
  return (
    <div className="space-y-4 p-6">
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-8 h-8 text-emerald-600" />
          <div>
            <h3 className="text-xl font-bold text-emerald-900">حاسبة التمويل</h3>
            <p className="text-sm text-emerald-700">احسب قيمة التمويل والأقساط</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">قيمة العقار</label>
            <input type="number" placeholder="مثال: 500000" className="w-full p-3 bg-gray-50 rounded-lg outline-none border-2 border-gray-200" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">الدفعة المقدمة (%)</label>
            <input type="number" placeholder="مثال: 20" className="w-full p-3 bg-gray-50 rounded-lg outline-none border-2 border-gray-200" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">مدة التمويل (سنوات)</label>
            <input type="number" placeholder="مثال: 20" className="w-full p-3 bg-gray-50 rounded-lg outline-none border-2 border-gray-200" />
          </div>
          <button className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
            احسب التمويل
          </button>
        </div>
      </div>
    </div>
  );
};

// السلايد الحادي عشر - عرض العقار
const PropertyOfferSlide = ({ customer }: { customer: Customer }) => {
  return (
    <div className="space-y-4 p-6">
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200">
        <div className="flex items-center gap-3 mb-4">
          <Home className="w-8 h-8 text-violet-600" />
          <div>
            <h3 className="text-xl font-bold text-violet-900">عرض العقار</h3>
            <p className="text-sm text-violet-700">عروض العقارات المتاحة</p>
          </div>
        </div>
      </div>

      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">لا توجد عروض عقارية حالياً</p>
        <button className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium flex items-center gap-2 mx-auto">
          <Plus className="w-5 h-5" />
          إضافة عرض جديد
        </button>
      </div>
    </div>
  );
};

// السلايد الثاني عشر - طلب العقار
const PropertyRequestSlide = ({ customer }: { customer: Customer }) => {
  return (
    <div className="space-y-4 p-6">
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border-2 border-pink-200">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-pink-600" />
          <div>
            <h3 className="text-xl font-bold text-pink-900">طلب العقار</h3>
            <p className="text-sm text-pink-700">طلبات العميل العقارية</p>
          </div>
        </div>
      </div>

      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">لا توجد طلبات عقارية حالياً</p>
        <button className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium flex items-center gap-2 mx-auto">
          <Plus className="w-5 h-5" />
          إضافة طلب جديد
        </button>
      </div>
    </div>
  );
};

// السلايد الثالث عشر - العروض المستقبلة
const ReceivedOffersSlide = ({ customer }: { customer: Customer }) => {
  return (
    <div className="space-y-4 p-6">
      <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-xl p-6 border-2 border-lime-200">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-8 h-8 text-lime-600" />
          <div>
            <h3 className="text-xl font-bold text-lime-900">العروض المستقبلة</h3>
            <p className="text-sm text-lime-700">عروض واردة من العملاء</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
          <div className="text-sm text-green-700 mb-1">عروض جديدة</div>
          <div className="text-3xl font-bold text-green-900">0</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="text-sm text-blue-700 mb-1">عروض قيد المراجعة</div>
          <div className="text-3xl font-bold text-blue-900">0</div>
        </div>
      </div>

      <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">لا توجد عروض مستقبلة حالياً</p>
      </div>
    </div>
  );
};

// السلايد الرابع عشر - الطلبات المستقبلة
const ReceivedRequestsSlide = ({ customer }: { customer: Customer }) => {
  return (
    <div className="space-y-4 p-6">
      <div className="bg-gradient-to-r from-fuchsia-50 to-pink-50 rounded-xl p-6 border-2 border-fuchsia-200">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-8 h-8 text-fuchsia-600" />
          <div>
            <h3 className="text-xl font-bold text-fuchsia-900">الطلبات المستقبلة</h3>
            <p className="text-sm text-fuchsia-700">طلبات واردة من العملاء</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="text-sm text-purple-700 mb-1">طلبات جديدة</div>
          <div className="text-3xl font-bold text-purple-900">0</div>
        </div>
        <div className="bg-pink-50 rounded-xl p-4 border-2 border-pink-200">
          <div className="text-sm text-pink-700 mb-1">طلبات قيد المعالجة</div>
          <div className="text-3xl font-bold text-pink-900">0</div>
        </div>
      </div>

      <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">لا توجد طلبات مستقبلة حالياً</p>
      </div>
    </div>
  );
};

// السلايد الخامس عشر - معلومات إضافية
const AdditionalInfoSlide = ({ customer }: { customer: Customer }) => {
  return (
    <div className="space-y-4 p-6">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border-2 border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-8 h-8 text-slate-600" />
          <div>
            <h3 className="text-xl font-bold text-slate-900">معلومات إضافية</h3>
            <p className="text-sm text-slate-700">بيانات وملاحظات إضافية</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-4">معلومات تكميلية</h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">الحالة الاجتماعية</label>
            <select className="w-full p-3 bg-gray-50 rounded-lg outline-none border-2 border-gray-200">
              <option>أعزب</option>
              <option>متزوج</option>
              <option>مطلق</option>
              <option>أرمل</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">المؤهل العلمي</label>
            <input type="text" placeholder="مثال: بكالوريوس" className="w-full p-3 bg-gray-50 rounded-lg outline-none border-2 border-gray-200" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">الدخل الشهري</label>
            <input type="number" placeholder="مثال: 15000" className="w-full p-3 bg-gray-50 rounded-lg outline-none border-2 border-gray-200" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">ملاحظات إضافية</label>
            <textarea rows={4} placeholder="أي معلومات إضافية..." className="w-full p-3 bg-gray-50 rounded-lg outline-none resize-none border-2 border-gray-200"></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

// السلايد الأول - معلومات عامة (10 أقسام)
const InfoSlide = ({ customer }: { customer: Customer }) => {
  const [phoneEnabled, setPhoneEnabled] = useState(true);
  const [alternatePhones, setAlternatePhones] = useState(['']);
  const [websites, setWebsites] = useState(['']);
  const [activityFilter, setActivityFilter] = useState('all');
  const [showMap, setShowMap] = useState(false);
  const [locationData, setLocationData] = useState({
    city: customer.location || '',
    district: '',
    street: '',
    building: '',
    additionalNumber: '',
    postalCode: ''
  });
  const [customerData, setCustomerData] = useState({
    phone: customer.phone || '',
    whatsapp: '',
    email: customer.email || '',
    companyEmail: '',
    jobTitle: '',
    company: '',
    dealsCount: customer.dealsCount || 0,
    budget: customer.dealValue || 0,
    clientType: customer.type || 'buyer',
    interestLevel: customer.interestLevel || 'medium',
    notes: ''
  });

  return (
    <div className="space-y-6 p-6">
      {/* الطلبات والعروض المستقبلة */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="text-sm text-blue-700 mb-1">الطلبات المستقبلة</div>
          <div className="text-3xl font-bold text-blue-900">0</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
          <div className="text-sm text-green-700 mb-1">العروض المستقبلة</div>
          <div className="text-3xl font-bold text-green-900">0</div>
        </div>
      </div>

      {/* أزرار سريعة */}
      <div className="grid grid-cols-2 gap-3">
        <button className="py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
          📋 طلب العقار
        </button>
        <button className="py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
          🏠 عرض العقار
        </button>
        <button className="py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
          💰 طلب حسبة التمويل
        </button>
        <button className="py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
          📢 إعلان منشور
        </button>
      </div>
      
      {/* 1. معلومات الاتصال - مع Toggle وأرقام بديلة */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600" />
            معلومات الاتصال
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-600">تفعيل الهاتف</span>
            <div className={`relative w-12 h-6 rounded-full transition-colors ${phoneEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <input
                type="checkbox"
                checked={phoneEnabled}
                onChange={() => setPhoneEnabled(!phoneEnabled)}
                className="sr-only"
              />
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${phoneEnabled ? 'right-1' : 'left-1'}`}></div>
            </div>
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">رقم الجوال</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={customerData.phone}
                onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                className="bg-transparent flex-1 outline-none"
                placeholder="05xxxxxxxx"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">واتساب</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <input
                type="tel"
                value={customerData.whatsapp}
                onChange={(e) => setCustomerData({...customerData, whatsapp: e.target.value})}
                className="bg-transparent flex-1 outline-none"
                placeholder="05xxxxxxxx"
              />
            </div>
          </div>
        </div>

        {/* أرقام بديلة */}
        <div className="mt-4">
          <label className="text-sm text-gray-600 mb-2 block">أرقام بديلة</label>
          {alternatePhones.map((phone, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const newPhones = [...alternatePhones];
                    newPhones[index] = e.target.value;
                    setAlternatePhones(newPhones);
                  }}
                  placeholder="رقم بديل"
                  className="bg-transparent flex-1 outline-none"
                />
              </div>
              <button
                onClick={() => setAlternatePhones(alternatePhones.filter((_, i) => i !== index))}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setAlternatePhones([...alternatePhones, ''])}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            إضافة رقم
          </button>
        </div>
      </div>

      {/* 2. البريد الإلكتروني والعمل */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-red-600" />
          البريد الإلكتروني والعمل
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">البريد الشخصي</label>
            <input 
              type="email" 
              value={customerData.email}
              onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
              placeholder="example@email.com" 
              className="w-full p-3 bg-gray-50 rounded-lg outline-none" 
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">بريد العمل</label>
            <input 
              type="email" 
              value={customerData.companyEmail}
              onChange={(e) => setCustomerData({...customerData, companyEmail: e.target.value})}
              placeholder="work@company.com" 
              className="w-full p-3 bg-gray-50 rounded-lg outline-none" 
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">المسمى الوظيفي</label>
            <input 
              type="text" 
              value={customerData.jobTitle}
              onChange={(e) => setCustomerData({...customerData, jobTitle: e.target.value})}
              placeholder="مدير مبيعات" 
              className="w-full p-3 bg-gray-50 rounded-lg outline-none" 
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">الشركة</label>
            <input 
              type="text" 
              value={customerData.company}
              onChange={(e) => setCustomerData({...customerData, company: e.target.value})}
              placeholder="شركة العقارات الذكية" 
              className="w-full p-3 bg-gray-50 rounded-lg outline-none" 
            />
          </div>
        </div>
        
        {/* مواقع إلكترونية متعددة */}
        <div className="mt-4">
          <label className="text-sm text-gray-600 mb-2 block">المواقع الإلكترونية</label>
          {websites.map((website, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Building className="w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => {
                    const newWebsites = [...websites];
                    newWebsites[index] = e.target.value;
                    setWebsites(newWebsites);
                  }}
                  placeholder="https://example.com"
                  className="bg-transparent flex-1 outline-none"
                />
              </div>
              <button
                onClick={() => setWebsites(websites.filter((_, i) => i !== index))}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setWebsites([...websites, ''])}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            إضافة موقع
          </button>
        </div>
      </div>
      
      {/* 3. الإحصائيات والصفقات */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-blue-600" />
          📊 الصفقات والميزانية
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">عدد الصفقات</label>
            <input 
              type="number" 
              value={customerData.dealsCount}
              onChange={(e) => setCustomerData({...customerData, dealsCount: parseInt(e.target.value) || 0})}
              placeholder="0" 
              min="0"
              className="w-full p-3 bg-gray-50 rounded-lg outline-none border-2 border-gray-200 focus:border-blue-500" 
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">الميزانية ($)</label>
            <input 
              type="number" 
              value={customerData.budget}
              onChange={(e) => setCustomerData({...customerData, budget: parseFloat(e.target.value) || 0})}
              placeholder="0" 
              min="0"
              className="w-full p-3 bg-gray-50 rounded-lg outline-none border-2 border-gray-200 focus:border-green-500" 
            />
          </div>
        </div>
      </div>

      {/* 4. التصنيف والاهتمام - 7 أنواع + 6 درجات */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-green-600" />
          🏷️ التصنيف ومستوى الاهتمام
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">نوع العميل</label>
            <select 
              value={customerData.clientType}
              onChange={(e) => setCustomerData({...customerData, clientType: e.target.value})}
              className="w-full p-3 bg-white rounded-lg outline-none border-2 border-gray-200"
            >
              <option value="buyer">● مشتري</option>
              <option value="seller">● بائع</option>
              <option value="tenant">● مستأجر</option>
              <option value="landlord">● مؤجر</option>
              <option value="investor">● مستثمر</option>
              <option value="vip">● VIP</option>
              <option value="custom">● مخصص</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">درجة الاهتمام</label>
            <select 
              value={customerData.interestLevel}
              onChange={(e) => setCustomerData({...customerData, interestLevel: e.target.value})}
              className="w-full p-3 bg-white rounded-lg outline-none border-2 border-gray-200"
            >
              <option value="hottest">● ساخن جداً</option>
              <option value="hot">● ساخن</option>
              <option value="warm">● دافئ</option>
              <option value="medium">● متوسط</option>
              <option value="cold">● بارد</option>
              <option value="followUp">● متابعة لاحقة</option>
              <option value="notInterested">● غير مهتم</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 5. الموقع الجغرافي */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-red-600" />
          📍 الموقع الجغرافي
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">المدينة</label>
            <input 
              type="text" 
              value={locationData.city}
              onChange={(e) => setLocationData({...locationData, city: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-gray-200 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">الحي / المنطقة</label>
            <input 
              type="text" 
              value={locationData.district}
              onChange={(e) => setLocationData({...locationData, district: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-gray-200 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">الشارع</label>
            <input 
              type="text" 
              value={locationData.street}
              onChange={(e) => setLocationData({...locationData, street: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-gray-200 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">رقم المبنى</label>
            <input 
              type="text" 
              value={locationData.building}
              onChange={(e) => setLocationData({...locationData, building: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-gray-200 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">الرقم الإضافي</label>
            <input 
              type="text" 
              value={locationData.additionalNumber}
              onChange={(e) => setLocationData({...locationData, additionalNumber: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-gray-200 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">الرمز البريدي</label>
            <input 
              type="text" 
              value={locationData.postalCode}
              onChange={(e) => setLocationData({...locationData, postalCode: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-gray-200 focus:border-blue-500" 
            />
          </div>
        </div>
      </div>
      
      {/* 6. الملاحظات */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-amber-600" />
          ملاحظات عامة
        </h3>
        <textarea 
          rows={4} 
          value={customerData.notes}
          onChange={(e) => setCustomerData({...customerData, notes: e.target.value})}
          placeholder="أضف ملاحظاتك هنا..."
          className="w-full p-3 bg-gray-50 rounded-lg outline-none resize-none border-2 border-gray-200 focus:border-amber-500"
        ></textarea>
      </div>
      
      {/* 7. سجل النشاط التلقائي */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            📊 سجل النشاط التلقائي
          </h3>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
            تصدير
          </button>
        </div>

        {/* فلاتر النشاط */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'categories', 'tasks', 'appointments', 'documents', 'edits', 'messages', 'calls'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setActivityFilter(filter)}
              className={`px-3 py-1 rounded-lg text-sm ${activityFilter === filter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {filter === 'all' ? '📋 الكل' :
               filter === 'categories' ? '🏷️ تصنيفات' :
               filter === 'tasks' ? '✅ مهام' :
               filter === 'appointments' ? '📅 مواعيد' :
               filter === 'documents' ? '📎 مستندات' :
               filter === 'edits' ? '✏️ تعديلات' :
               filter === 'messages' ? '💬 رسائل' : '📞 مكالمات'}
            </button>
          ))}
        </div>

        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">لا يوجد نشاط مسجل بعد.</p>
        </div>
      </div>
    </div>
  );
};

interface CustomSlide {
  id: string;
  title: string;
  icon: typeof Star;
  color: string;
  bgColor: string;
}

interface CustomerDetailsWithSlidesProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  isFullPage?: boolean;
  onRepublish?: () => void;
}

// المكون الرئيسي - CustomerDetailsWithSlides
export default function CustomerDetailsWithSlides({ 
  customer, 
  isOpen, 
  onClose, 
  isFullPage = false, 
  onRepublish 
}: CustomerDetailsWithSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [customSlides, setCustomSlides] = useState<CustomSlide[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const allSlides = [...DEFAULT_SLIDES, ...customSlides];
  const CurrentIcon = allSlides[currentSlide].icon;

  useEffect(() => {
    if (currentSlide === 8) {
      const allCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customerIndex = allCustomers.findIndex((c: Customer) => c.id === customer.id);
      if (customerIndex !== -1) {
        allCustomers[customerIndex].hasUnreadPublishedAd = false;
        localStorage.setItem('customers', JSON.stringify(allCustomers));
      }
    }
  }, [currentSlide, customer.id]);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % allSlides.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allSlides.length) % allSlides.length);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Image uploaded:', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (!isOpen || !customer) return null;
  
  return (
    <div className={isFullPage ? "min-h-screen bg-gray-50" : "fixed inset-0 z-[99999] flex items-center justify-center"} dir="rtl">
      {/* Overlay - فقط للـ modal */}
      {!isFullPage && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
      )}
      
      {/* Modal أو صفحة كاملة */}
      <div className={isFullPage 
        ? "w-full min-h-screen bg-white flex flex-col" 
        : "relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      }>
        {/* الهيدر الملون */}
        <div className={`${allSlides[currentSlide].bgColor} text-white p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* الصورة - قابلة للرفع */}
              <div className="relative group">
                <img 
                  src={customer.avatar || 'https://via.placeholder.com/80'} 
                  alt={customer.name}
                  className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg object-cover"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Upload className="w-6 h-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* الاسم + الهاتف */}
              <div>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <div className="flex items-center gap-2 text-white/80 mt-1">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
              </div>
            </div>

            {/* زر العودة/إغلاق + زر إضافة سلايد */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomSlides([...customSlides, {
                  id: `custom-${Date.now()}`,
                  title: 'سلايد مخصص',
                  icon: Star,
                  color: 'from-gray-500 to-gray-400',
                  bgColor: 'bg-gradient-to-br from-gray-500 to-gray-400'
                }])}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Badges التصنيفات */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full">🟣 معتدل</span>
            <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full">🟠 مهتم</span>
            <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full">🔴 شغوف</span>
            <span className="px-3 py-1 bg-gray-800 text-white text-xs rounded-full">⚫ غير مهتم</span>
            <span className="px-3 py-1 bg-gray-600 text-white text-xs rounded-full">⚫ أخرى</span>
            <span className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full">🟣 تمويل</span>
            <span className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-full">🟡 مستأجر</span>
            <span className="px-3 py-1 bg-orange-600 text-white text-xs rounded-full">🟠 مؤجر</span>
            <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">🟢 مشتري</span>
            <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full">🔵 بائع</span>
            <span className="px-3 py-1 bg-amber-700 text-white text-xs rounded-full">🟤 محدود</span>
          </div>
        </div>
        
        {/* مؤشرات السلايدات مع الدائرة الحمراء */}
        <div className="bg-gray-100 px-6 py-3 flex items-center gap-3 overflow-x-auto">
          {allSlides.map((slide, index) => {
            const SlideIcon = slide.icon;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  index === currentSlide
                    ? 'bg-white shadow-md scale-105'
                    : 'hover:bg-white/50'
                }`}
              >
                {/* الدائرة الحمراء - إشعار إعلان منشور */}
                {index === 8 && customer.hasUnreadPublishedAd && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-lg animate-pulse z-10"></div>
                )}
                
                <SlideIcon className={`w-4 h-4 ${index === currentSlide ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`text-sm font-medium whitespace-nowrap ${index === currentSlide ? 'text-blue-600' : 'text-gray-600'}`}>
                  {slide.title}
                </span>
                
                {/* أزرار الإجراءات للسلايدات المخصصة */}
                {slide.id.startsWith('custom-') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomSlides(customSlides.filter(s => s.id !== slide.id));
                    }}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
        
        {/* المحتوى */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {currentSlide === 0 && <InfoSlide customer={customer} />}
              {currentSlide === 1 && <ActivitiesSlide customer={customer} />}
              {currentSlide === 2 && <DealsSlide customer={customer} />}
              {currentSlide === 3 && <PropertiesSlide customer={customer} />}
              {currentSlide === 4 && <DocumentsSlide customer={customer} />}
              {currentSlide === 5 && <NotesSlide customer={customer} />}
              {currentSlide === 6 && <TasksSlide customer={customer} />}
              {currentSlide === 7 && <MediaSlide customer={customer} />}
              {currentSlide === 8 && <PublishedAdsSlide customer={customer} />}
              {currentSlide === 9 && <FinancingRequestSlide customer={customer} />}
              {currentSlide === 10 && <PropertyOfferSlide customer={customer} />}
              {currentSlide === 11 && <PropertyRequestSlide customer={customer} />}
              {currentSlide === 12 && <ReceivedOffersSlide customer={customer} />}
              {currentSlide === 13 && <ReceivedRequestsSlide customer={customer} />}
              {currentSlide === 14 && <AdditionalInfoSlide customer={customer} />}
              {currentSlide >= 15 && (
                <div className="p-6">
                  <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                    <Star className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">سلايد مخصص</h3>
                    <p className="text-gray-600">يمكنك إضافة محتوى مخصص هنا</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* أزرار التنقل */}
        <div className="absolute top-1/2 left-4 right-4 flex items-center justify-between pointer-events-none">
          <button
            onClick={prevSlide}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors pointer-events-auto"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors pointer-events-auto"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
        </div>
        
        {/* الفوتر */}
        <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-t border-gray-200 relative z-50">
          {/* مؤشرات صغيرة */}
          <div className="flex items-center gap-2">
            {allSlides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
                }`}
              ></div>
            ))}
          </div>
          
          {/* أزرار (إغلاق + حفظ) */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-medium transition-colors"
            >
              إغلاق
            </button>
            <button 
              onClick={() => {
                console.log('Saving customer data:', {
                  customerId: customer.id
                });
                alert('تم حفظ التغييرات بنجاح! ✓');
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
