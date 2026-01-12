import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

/**
 * RoleGuard - يتحقق من صلاحية المستخدم بناءً على الدور
 * 
 * الاستخدام:
 * <RoleGuard allowedRoles={['owner']}>
 *   <AdminPage />
 * </RoleGuard>
 * 
 * <RoleGuard allowedRoles={['admin', 'owner']}>
 *   <SettingsPage />
 * </RoleGuard>
 */
export default function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath = '/app/dashboard',
  showAccessDenied = false 
}: RoleGuardProps) {
  const { role, roleLoading, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Still loading auth or role
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background" dir="rtl">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  const hasAccess = role && allowedRoles.includes(role);

  if (!hasAccess) {
    // Option 1: Show access denied page
    if (showAccessDenied) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4" dir="rtl">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                غير مصرح بالوصول
              </h1>
              <p className="text-muted-foreground">
                ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">الأدوار المطلوبة:</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {allowedRoles.map((r) => (
                  <span 
                    key={r} 
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {r === 'owner' ? 'مالك النظام' : r === 'admin' ? 'مدير مكتب' : 'عضو فريق'}
                  </span>
                ))}
              </div>
              {role && (
                <p className="mt-3 text-xs">
                  دورك الحالي: <span className="font-medium text-foreground">
                    {role === 'owner' ? 'مالك النظام' : role === 'admin' ? 'مدير مكتب' : 'عضو فريق'}
                  </span>
                </p>
              )}
            </div>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              العودة للخلف
            </button>
          </div>
        </div>
      );
    }
    
    // Option 2: Redirect to fallback path
    return <Navigate to={fallbackPath} replace />;
  }

  // User has access - render children
  return <>{children}</>;
}
