import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAcademyLogin, getAcademyCoursePath } from "@/utils/academyPaths";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Play, CheckCircle, Shield, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
  duration_minutes: number;
}

const AcademyDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(getAcademyLogin());
        return;
      }

      // جلب اسم المستخدم
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserName(profile?.full_name || user.email?.split("@")[0] || "متدرب");

      // جلب الدورات
      const { data: coursesData } = await supabase
        .from("training_courses")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      setCourses((coursesData as Course[]) || []);

      // جلب التقدم
      const { data: progressData } = await supabase
        .from("user_training_progress")
        .select("course_id")
        .eq("user_id", user.id)
        .eq("completed", true);

      const completed = new Set((progressData || []).map((p: any) => p.course_id));
      setCompletedIds(completed);

      if (coursesData && coursesData.length > 0 && completed.size >= coursesData.length) {
        setAllCompleted(true);
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/academy/login");
  };

  const progressPercent = courses.length > 0 ? (completedIds.size / courses.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2942] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2942] text-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a1628]/90 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-xl font-bold">أكاديمية وسيط</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm">مرحباً، {userName}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome & Badge */}
        {allCompleted && (
          <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl p-6 mb-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
            <h2 className="text-2xl font-bold mb-2">🎉 تهانينا! لقد حصلت على شارة المحترف</h2>
            <p className="text-gray-300">أنت الآن وسيط عقاري محترف معتمد</p>
          </div>
        )}

        {/* Progress */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">تقدمك في التدريب</h3>
            <span className="text-[#D4AF37] font-bold">{completedIds.size} / {courses.length}</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-gray-400 text-sm mt-2">
            {progressPercent === 100 ? "أكملت جميع الدورات! 🎉" : `${Math.round(progressPercent)}% مكتمل`}
          </p>
        </div>

        {/* Courses */}
        <h2 className="text-2xl font-bold mb-6">الدورات المتاحة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isCompleted = completedIds.has(course.id);
            return (
              <div
                key={course.id}
                className={`bg-white/5 border rounded-2xl overflow-hidden transition hover:bg-white/10 ${
                  isCompleted ? "border-[#D4AF37]/50" : "border-white/10"
                }`}
              >
                <div className="aspect-video bg-gradient-to-br from-[#1a2942] to-[#0a1628] flex items-center justify-center relative">
                  {isCompleted ? (
                    <CheckCircle className="w-16 h-16 text-[#D4AF37]" />
                  ) : (
                    <Play className="w-16 h-16 text-white/30" />
                  )}
                  <div className="absolute top-3 left-3 bg-white/10 rounded-full px-3 py-1 text-xs">
                    {course.duration_minutes} دقيقة
                  </div>
                  {isCompleted && (
                    <div className="absolute top-3 right-3 bg-[#D4AF37] text-black rounded-full px-3 py-1 text-xs font-bold">
                      مكتمل ✓
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{course.description}</p>
                  <Link to={`/academy/course/${course.id}`}>
                    <Button
                      className={`w-full ${
                        isCompleted
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-[#D4AF37] hover:bg-[#c4a030] text-black font-bold"
                      }`}
                    >
                      {isCompleted ? "مراجعة الدورة" : "بدء الدورة"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AcademyDashboard;
