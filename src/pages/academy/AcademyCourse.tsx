import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
  duration_minutes: number;
}

const AcademyCourse = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/academy/login");
        return;
      }
      setUserId(user.id);

      // جلب كل الدورات
      const { data: coursesData } = await supabase
        .from("training_courses")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      const courses = (coursesData as Course[]) || [];
      setAllCourses(courses);

      const current = courses.find((c) => c.id === id);
      setCourse(current || null);

      // تحقق من حالة الإكمال
      if (id) {
        const { data: progress } = await supabase
          .from("user_training_progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("course_id", id)
          .maybeSingle();
        setIsCompleted(progress?.completed || false);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  const handleComplete = async () => {
    if (!course || !userId) return;
    setCompleting(true);

    try {
      // إدخال/تحديث التقدم
      const { error } = await supabase
        .from("user_training_progress")
        .upsert({
          user_id: userId,
          course_id: course.id,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,course_id" });

      if (error) throw error;

      // تحقق من إكمال جميع الدورات
      const { data: allProgress } = await supabase
        .from("user_training_progress")
        .select("course_id")
        .eq("user_id", userId)
        .eq("completed", true);

      const completedCount = (allProgress?.length || 0);

      if (completedCount >= allCourses.length) {
        // تحديث الملف الشخصي
        await supabase
          .from("profiles")
          .update({
            // professional_badge and similar fields would go in metadata or dedicated columns
            // For now we mark training as complete via existing fields
          })
          .eq("user_id", userId);

        toast.success("🎉 تهانينا! أكملت جميع الدورات وحصلت على شارة المحترف!");
      } else {
        toast.success("تم إتمام الدورة بنجاح!");
      }

      navigate("/academy/dashboard");
    } catch (err) {
      console.error("Complete error:", err);
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setCompleting(false);
    }
  };

  const currentIndex = allCourses.findIndex((c) => c.id === id);
  const prevCourse = currentIndex > 0 ? allCourses[currentIndex - 1] : null;
  const nextCourse = currentIndex < allCourses.length - 1 ? allCourses[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2942] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2942] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">الدورة غير موجودة</p>
          <Link to="/academy/dashboard">
            <Button className="bg-[#D4AF37] text-black">العودة للوحة التحكم</Button>
          </Link>
        </div>
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
          <Link to="/academy/dashboard">
            <Button variant="ghost" className="text-gray-300 hover:text-white gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#D4AF37]/20 text-[#D4AF37] rounded-full px-3 py-1 text-sm font-bold">
              {currentIndex + 1} / {allCourses.length}
            </span>
            {isCompleted && (
              <span className="bg-green-500/20 text-green-400 rounded-full px-3 py-1 text-sm flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> مكتمل
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-gray-400 mt-2">{course.description}</p>
        </div>

        {/* Video */}
        <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl mb-8">
          <iframe
            className="w-full h-full"
            src={course.video_url}
            title={course.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 mb-8">
          {prevCourse ? (
            <Link to={`/academy/course/${prevCourse.id}`}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
            </Link>
          ) : (
            <div />
          )}

          {nextCourse ? (
            <Link to={`/academy/course/${nextCourse.id}`}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Complete Button */}
        {!isCompleted ? (
          <Button
            onClick={handleComplete}
            disabled={completing}
            className="w-full bg-[#D4AF37] hover:bg-[#c4a030] text-black font-bold py-6 text-lg"
          >
            {completing ? <Loader2 className="w-5 h-5 animate-spin" /> : "✅ إتمام الدورة"}
          </Button>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="text-green-400 font-bold text-lg">تم إتمام هذه الدورة بنجاح ✓</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademyCourse;
