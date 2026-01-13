import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useState, useEffect } from "react";
import SimpleDashboard from "./components/layout/SimpleDashboard";
import EnhancedBrokerCRM from "./components/crm/EnhancedBrokerCRM";
import MyPlatformComplete from "./components/platform/MyPlatformComplete";

import BusinessCardProfile from "./components/business-card/BusinessCardProfile";
import BusinessCardEdit from "./components/business-card/BusinessCardEdit";
import { ReportsAnalytics } from "./components/analytics";
import { DigitalCardDashboard, CardEditor } from "./components/digital-card";
import { CalendarAppointments } from "./components/calendar";
import { TasksManagement } from "./components/tasks";
import { MapSystemDashboard } from "./components/map";
import { AdPublishingSections } from "./components/advertising";
import CustomersListPage from "./pages/CustomersListPage";
import OffersRequestsPage from "./pages/OffersRequestsPage";
import SmartOpportunitiesPage from "./pages/SmartOpportunitiesPage";
import SpatialIntelligenceTest from "./pages/SpatialIntelligenceTest";
import QuickCalculatorPage from "./pages/QuickCalculatorPage";
import RentedPropertiesReport from "./components/reports/RentedPropertiesReport";
import OfficialBusinessCardPage from "./pages/OfficialBusinessCardPage";
import NotFound from "./pages/NotFound";
import { DashboardProvider } from "./context/DashboardContext";
import { AIFloatingButton } from "./components/ai-assistant";
import PushNotificationPrompt from "./components/notifications/PushNotificationPrompt";
import CustomerDetailsPage from "./components/crm/CustomerDetailsPage";
import SlugOffersPage from "./pages/SlugOffersPage";
import NotificationSettings from "./components/settings/NotificationSettings";
import BottomNavCustomization from "./components/settings/BottomNavCustomization";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RecoverDomainPage from "./pages/RecoverDomainPage";
import DomainAdminPage from "./pages/DomainAdminPage";
import DomainRequestsListPage from "./pages/DomainRequestsListPage";
import DomainRequestDetailsPage from "./pages/DomainRequestDetailsPage";
import PublishAdPage from "./pages/PublishAdPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import SlugPlatformPage from "./pages/SlugPlatformPage";
import SlugCalendarPage from "./pages/SlugCalendarPage";
import SlugBusinessCardPage from "./pages/SlugBusinessCardPage";
import SlugOfferPage from "./pages/SlugOfferPage";
import SlugRequestPage from "./pages/SlugRequestPage";
import SlugQuotePage from "./pages/SlugQuotePage";
import ChoosePlanPage from "./pages/ChoosePlanPage";
import { AuthProvider } from "./context/AuthContext";
import { FeatureFlagsProvider } from "./context/FeatureFlagsContext";
import { EntitlementsProvider } from "./context/EntitlementsContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import BusinessCardGuard from "./components/auth/BusinessCardGuard";
import RoleGuard from "./components/auth/RoleGuard";
import { OnboardingGuard } from "./components/auth/OnboardingGuard";
import { useAuthContext } from "./context/AuthContext";
import { useEntitlementsContext } from "./context/EntitlementsContext";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

// Interface for linked customer
interface LinkedCustomer {
  id: string;
  name: string;
  phone: string;
}

// Inner component that uses auth hooks (must be inside AuthProvider)
const ProtectedBusinessCardEdit = ({ isNewUser }: { isNewUser: boolean }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (authLoading) return;
      
      if (!isAuthenticated || !user) {
        setUserData(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: businessCard } = await supabase
          .from('business_cards')
          .select('data')
          .eq('user_id', user.id)
          .maybeSingle();

        const cardData = businessCard?.data as Record<string, any> | null;

        setUserData({
          id: user.id,
          name: profile?.full_name || cardData?.name || cardData?.userName || user.email?.split('@')[0] || '',
          email: user.email || '',
          phone: profile?.phone || cardData?.primaryPhone || cardData?.phone || '',
          whatsapp: profile?.phone || cardData?.primaryPhone || cardData?.phone || '',
          type: (profile?.account_type as 'individual' | 'office' | 'company') || 'individual',
          companyName: profile?.company_name || cardData?.companyName || '',
          city: cardData?.location || '',
          plan: 'المحترف',
          rating: 4.5,
        });
      } catch (error) {
        console.error('[ProtectedBusinessCardEdit] Error fetching user data:', error);
        setUserData({
          id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || '',
          phone: '',
          whatsapp: '',
          type: 'individual',
          companyName: '',
          city: '',
          plan: 'مجاني',
          rating: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, isAuthenticated, authLoading]);

  // Show loading while fetching user data
  if (authLoading || isLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#01411C] to-[#065f41]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg">جاري تحميل بياناتك...</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    // التنقل للواجهة الرئيسية بطريقة موثوقة
    navigate('/app/dashboard', { replace: true });
  };

  return (
    <BusinessCardEdit 
      onBack={handleBack} 
      user={userData} 
      isNewUser={isNewUser} 
    />
  );
};

// Dashboard content component
const DashboardContent = ({ isNewUser }: { isNewUser: boolean }) => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [linkedCustomerForTask, setLinkedCustomerForTask] = useState<LinkedCustomer | null>(null);
  const [linkedCustomerForAppointment, setLinkedCustomerForAppointment] = useState<LinkedCustomer | null>(null);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<any>(null);
  
  const { user, isAuthenticated } = useAuthContext();
  const [userData, setUserData] = useState<any>(null);

  // جلب بيانات المستخدم من profiles و business_cards
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !user) {
        setUserData(null);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: businessCard } = await supabase
          .from('business_cards')
          .select('data')
          .eq('user_id', user.id)
          .maybeSingle();

        const cardData = businessCard?.data as Record<string, any> | null;

        setUserData({
          id: user.id,
          name: profile?.full_name || cardData?.name || cardData?.userName || user.email?.split('@')[0] || '',
          email: user.email || '',
          phone: profile?.phone || cardData?.primaryPhone || cardData?.phone || '',
          whatsapp: profile?.phone || cardData?.primaryPhone || cardData?.phone || '',
          type: (profile?.account_type as 'individual' | 'office' | 'company') || 'individual',
          companyName: profile?.company_name || cardData?.companyName || '',
          city: cardData?.location || '',
          plan: 'المحترف',
          rating: 4.5,
        });
      } catch (error) {
        console.error('[DashboardContent] Error fetching user data:', error);
        setUserData({
          id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || '',
          phone: '',
          whatsapp: '',
          type: 'individual',
          companyName: '',
          city: '',
          plan: 'مجاني',
          rating: 0,
        });
      }
    };

    fetchUserData();
  }, [user, isAuthenticated]);

  const handleNavigate = (page: string) => {
    console.log("Navigate to:", page);
    setCurrentPage(page);
  };

  const handleBack = () => {
    setCurrentPage("dashboard");
  };

  // Listen for task creation from CRM
  useEffect(() => {
    const handleCreateTaskFromCRM = (event: CustomEvent) => {
      const { customerId, customerName, customerPhone } = event.detail;
      setLinkedCustomerForTask({
        id: customerId,
        name: customerName,
        phone: customerPhone,
      });
      setCurrentPage("tasks");
    };

    window.addEventListener('createTaskFromCRM', handleCreateTaskFromCRM as EventListener);
    return () => {
      window.removeEventListener('createTaskFromCRM', handleCreateTaskFromCRM as EventListener);
    };
  }, []);

  // Listen for appointment creation from CRM
  useEffect(() => {
    const handleCreateAppointmentFromCRM = (event: CustomEvent) => {
      const { customerId, customerName, customerPhone } = event.detail;
      setLinkedCustomerForAppointment({
        id: customerId,
        name: customerName,
        phone: customerPhone,
      });
      setCurrentPage("calendar");
    };

    window.addEventListener('createAppointmentFromCRM', handleCreateAppointmentFromCRM as EventListener);
    return () => {
      window.removeEventListener('createAppointmentFromCRM', handleCreateAppointmentFromCRM as EventListener);
    };
  }, []);

  // Clear linked customer when leaving pages
  useEffect(() => {
    if (currentPage !== "tasks") {
      setLinkedCustomerForTask(null);
    }
    if (currentPage !== "calendar") {
      setLinkedCustomerForAppointment(null);
    }
  }, [currentPage]);

  // Listen for navigation from AI Assistant
  useEffect(() => {
    const handleNavigateFromAssistant = (event: CustomEvent) => {
      const { page } = event.detail;
      setCurrentPage(page);
    };

    window.addEventListener('navigateFromAssistant', handleNavigateFromAssistant as EventListener);
    return () => {
      window.removeEventListener('navigateFromAssistant', handleNavigateFromAssistant as EventListener);
    };
  }, []);

  // Listen for opening customer details
  useEffect(() => {
    const handleOpenCustomerDetails = async (event: CustomEvent) => {
      const { customerId, activeTab } = event.detail || {};

      // الأفضل: جلب العميل من قاعدة البيانات (بدلاً من localStorage) لضمان ظهور عروض/طلبات/مواعيد النماذج العامة
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ title: 'يرجى تسجيل الدخول', variant: 'destructive' });
          return;
        }

        const { data: dbCustomer, error } = await supabase
          .from('crm_customers')
          .select('*')
          .eq('id', customerId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[App] Failed to fetch customer:', error);
        }

        const customer = dbCustomer || {
          id: customerId,
          name: 'عميل',
          phone: '',
          email: '',
          type: 'owner',
          status: 'active',
          columnId: 'active',
          createdAt: new Date().toISOString(),
        };

        setSelectedCustomerForDetails({ ...customer, activeTab: activeTab || 'overview' });
        setCurrentPage('customer-details');
      } catch (e) {
        console.error('[App] handleOpenCustomerDetails error:', e);
      }
    };

    window.addEventListener('openCustomerDetails', handleOpenCustomerDetails as EventListener);
    return () => {
      window.removeEventListener('openCustomerDetails', handleOpenCustomerDetails as EventListener);
    };
  }, []);

  // Render based on current page
  if (currentPage === "customer-details" && selectedCustomerForDetails) {
    return (
      <>
        <CustomerDetailsPage
          customer={selectedCustomerForDetails}
          onBack={() => {
            setCurrentPage("customer-management-72");
            setSelectedCustomerForDetails(null);
          }}
          onUpdate={(updatedCustomer: any) => {
            setSelectedCustomerForDetails(updatedCustomer);
          }}
        />
        <AIFloatingButton />
      </>
    );
  }

  switch (currentPage) {
    case "customer-management-72":
      return <><EnhancedBrokerCRM onBack={handleBack} user={userData} /><AIFloatingButton /></>;
    case "dashboard-main-252":
      return <><MyPlatformComplete onBack={handleBack} onNavigate={handleNavigate} user={userData} /><AIFloatingButton /></>;
    case "business-card-profile":
      return <><BusinessCardProfile onBack={handleBack} onEditClick={() => setCurrentPage("business-card-edit")} user={userData} /><AIFloatingButton /></>;
    case "official-business-card":
      return <><OfficialBusinessCardPage onBack={handleBack} /><AIFloatingButton /></>;
    case "business-card-edit":
      return <><BusinessCardEdit onBack={handleBack} user={userData} isNewUser={isNewUser} /><AIFloatingButton /></>;
    case "reports-analytics":
      return <><ReportsAnalytics onBack={handleBack} /><AIFloatingButton /></>;
    case "digital-card":
      return <><DigitalCardDashboard onBack={handleBack} /><AIFloatingButton /></>;
    case "card-editor":
      return <><CardEditor onBack={() => setCurrentPage("digital-card")} /><AIFloatingButton /></>;
    case "calendar":
      return <><CalendarAppointments onBack={handleBack} linkedCustomer={linkedCustomerForAppointment} /><AIFloatingButton /></>;
    case "tasks":
      return <><TasksManagement onBack={() => setCurrentPage("customer-management-72")} linkedCustomer={linkedCustomerForTask} /><AIFloatingButton /></>;
    case "spatial-intelligence":
      return <><SpatialIntelligenceTest onBack={handleBack} /><AIFloatingButton /></>;
    case "quick-calculator":
      return <><QuickCalculatorPage onBack={handleBack} /><AIFloatingButton /></>;
    case "rental-report":
      return <><RentedPropertiesReport /><AIFloatingButton /></>;
    case "map-system":
      return <><MapSystemDashboard /><AIFloatingButton /></>;
    case "notification-settings":
      return <><NotificationSettings /><AIFloatingButton /></>;
    case "bottom-nav-customization":
      return <><div className="min-h-screen bg-gray-50 p-4 pb-24"><BottomNavCustomization onBack={handleBack} /></div><AIFloatingButton /></>;
    case "sales":
    case "advertising":
      return <><AdPublishingSections onBack={handleBack} /><AIFloatingButton /></>;
    case "calendar-system-complete":
      return <><CalendarAppointments onBack={handleBack} linkedCustomer={linkedCustomerForAppointment} /><AIFloatingButton /></>;
    case "analytics-dashboard":
      return <><ReportsAnalytics onBack={handleBack} /><AIFloatingButton /></>;
    case "owner":
      // Redirect to owner dashboard
      window.location.href = '/app/owner';
      return null;
    case "dashboard":
    default:
      return (
        <>
          <SimpleDashboard user={userData} onNavigate={handleNavigate} />
          <AIFloatingButton />
          <PushNotificationPrompt />
        </>
      );
  }
};

const App = () => {
  const [isNewUser, setIsNewUser] = useState(false);

  // Check for new user flag
  useEffect(() => {
    if (localStorage.getItem('show_welcome_dialog') === 'true') {
      setIsNewUser(true);
    }
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <EntitlementsProvider>
            <FeatureFlagsProvider>
              <DashboardProvider>
                <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Root - صفحة تسجيل الدخول */}
                    <Route path="/" element={<AuthPage />} />
                    {/* Auth routes */}
                    <Route path="/app/login" element={<AuthPage />} />
                    <Route path="/app/register" element={<AuthPage />} />
                    <Route path="/app/recover" element={<RecoverDomainPage />} />
                    <Route path="/app/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/app/reset-password" element={<ResetPasswordPage />} />
                    
                    {/* Legacy auth routes */}
                    <Route path="/auth" element={<Navigate to="/app/login" replace />} />
                    <Route path="/login" element={<Navigate to="/app/login" replace />} />
                    
                    {/* Redirect legacy owner route */}
                    <Route path="/owner" element={<Navigate to="/app/owner" replace />} />
                    
                    {/* صفحة اختيار الباقة - إجباري بعد التسجيل */}
                    <Route path="/app/choose-plan" element={
                      <ProtectedRoute>
                        <ChoosePlanPage />
                      </ProtectedRoute>
                    } />
                    
                    {/* businesscard/edit - محمي بـ ProtectedRoute + OnboardingGuard */}
                    <Route path="/app/businesscard/edit" element={
                      <ProtectedRoute>
                        <OnboardingGuard>
                          <ProtectedBusinessCardEdit isNewUser={isNewUser} />
                        </OnboardingGuard>
                      </ProtectedRoute>
                    } />
                    
                    {/* باقي صفحات /app/* - تحتاج BusinessCardGuard + OnboardingGuard */}
                    <Route path="/app/dashboard" element={
                      <OnboardingGuard>
                        <BusinessCardGuard>
                          <DashboardContent isNewUser={isNewUser} />
                        </BusinessCardGuard>
                      </OnboardingGuard>
                    } />
                  
                  <Route path="/app/publish-ad" element={
                    <BusinessCardGuard>
                      <PublishAdPage />
                    </BusinessCardGuard>
                  } />
                  
                  <Route path="/app/settings" element={
                    <BusinessCardGuard>
                      <RoleGuard allowedRoles={['admin', 'owner']} showAccessDenied>
                        <NotificationSettings />
                      </RoleGuard>
                    </BusinessCardGuard>
                  } />
                  
                  <Route path="/app/admin" element={
                    <BusinessCardGuard>
                      <RoleGuard allowedRoles={['owner']} showAccessDenied>
                        <DomainAdminPage />
                      </RoleGuard>
                    </BusinessCardGuard>
                  } />
                  
                  <Route path="/app/owner" element={
                    <BusinessCardGuard>
                      <RoleGuard allowedRoles={['owner']} showAccessDenied>
                        <OwnerDashboard />
                      </RoleGuard>
                    </BusinessCardGuard>
                  } />
                  
                  <Route path="/app/customers" element={
                    <BusinessCardGuard>
                      <CustomersListPage />
                    </BusinessCardGuard>
                  } />
                  
                  <Route path="/app/admin/domains" element={
                    <BusinessCardGuard>
                      <RoleGuard allowedRoles={['owner']} showAccessDenied>
                        <DomainAdminPage />
                      </RoleGuard>
                    </BusinessCardGuard>
                  } />
                  
                  <Route path="/app/domain-requests" element={
                    <BusinessCardGuard>
                      <DomainRequestsListPage />
                    </BusinessCardGuard>
                  } />
                  
                  <Route path="/app/domain-requests/:requestId" element={
                    <BusinessCardGuard>
                      <DomainRequestDetailsPage />
                    </BusinessCardGuard>
                  } />
                  
                  {/* تجاوز مؤقت للاختبار - يجب إعادة الحماية لاحقاً */}
                  <Route path="/app/offers-requests" element={<OffersRequestsPage />} />
                  <Route path="/app/smart-opportunities" element={<SmartOpportunitiesPage />} />
                  
                  {/* PUBLIC ROUTES - Dynamic Slug Pattern */}
                  <Route path="/:slug" element={<SlugPlatformPage />} />
                  <Route path="/:slug/card" element={<SlugBusinessCardPage />} />
                  <Route path="/:slug/calendar" element={<SlugCalendarPage />} />
                  <Route path="/:slug/offers" element={<SlugOffersPage />} />
                  <Route path="/:slug/offer" element={<SlugOfferPage />} />
                  <Route path="/:slug/request" element={<SlugRequestPage />} />
                  <Route path="/:slug/quote" element={<SlugQuotePage />} />
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
            </DashboardProvider>
          </FeatureFlagsProvider>
          </EntitlementsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
