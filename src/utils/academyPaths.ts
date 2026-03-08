/**
 * academyPaths.ts
 * يحدد المسارات الصحيحة لصفحات الأكاديمية حسب الدومين
 * training.wasataai.com → مسارات الجذر (/)
 * أي دومين آخر → مسارات /academy/
 */

export function isTrainingDomain(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.toLowerCase().startsWith('training.');
}

export function academyPath(subPath: string): string {
  const training = isTrainingDomain();
  // subPath مثل "/login", "/register", "/dashboard", "/course/123"
  if (training) {
    return subPath; // e.g. "/login"
  }
  return `/academy${subPath}`; // e.g. "/academy/login"
}

// المسارات الشائعة
export const getAcademyHome = () => academyPath('/');
export const getAcademyLogin = () => academyPath('/login');
export const getAcademyRegister = () => academyPath('/register');
export const getAcademyDashboard = () => academyPath('/dashboard');
export const getAcademyCoursePath = (id: string) => academyPath(`/course/${id}`);
