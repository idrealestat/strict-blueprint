import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useState, useEffect } from "react";
import SimpleDashboard from "./components/layout/SimpleDashboard";
import EnhancedBrokerCRM from "./components/crm/EnhancedBrokerCRM";
import MyPlatformComplete from "./components/platform/MyPlatformComplete";
import MyPlatformSmartPaths from "./components/platform/MyPlatformSmartPaths";
import BusinessCardProfile from "./components/business-card/BusinessCardProfile";
import BusinessCardEdit from "./components/business-card/BusinessCardEdit";
import { ReportsAnalytics } from "./components/analytics";
import { DigitalCardDashboard, CardEditor } from "./components/digital-card";
import { CalendarAppointments } from "./components/calendar";
import { TasksManagement } from "./components/tasks";
import { MapSystemDashboard } from "./components/map";
import { AdPublishingSections } from "./components/advertising";
import CustomersListPage from "./pages/CustomersListPage";
// PublicCardView removed - using SlugBusinessCardPage instead
import SpatialIntelligenceTest from "./pages/SpatialIntelligenceTest";
import QuickCalculatorPage from "./pages/QuickCalculatorPage";
import RentedPropertiesReport from "./components/reports/RentedPropertiesReport";
import NotFound from "./pages/NotFound";
import { DashboardProvider } from "./context/DashboardContext";
import { AIFloatingButton } from "./components/ai-assistant";
import CustomerDetailsPage from "./components/crm/CustomerDetailsPage";
// Legacy public forms removed - using /:slug/* pattern instead
import SlugOffersPage from "./pages/SlugOffersPage";
import NotificationSettings from "./components/settings/NotificationSettings";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RecoverDomainPage from "./pages/RecoverDomainPage";
import DomainAdminPage from "./pages/DomainAdminPage";
import DomainRequestsListPage from "./pages/DomainRequestsListPage";
import DomainRequestDetailsPage from "./pages/DomainRequestDetailsPage";
import SlugPlatformPage from "./pages/SlugPlatformPage";
import SlugCalendarPage from "./pages/SlugCalendarPage";
import SlugBusinessCardPage from "./pages/SlugBusinessCardPage";
// SlugOfferPage, SlugRequestPage, SlugQuotePage removed per route cleanup
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import BusinessCardGuard from "./components/auth/BusinessCardGuard";
import RoleGuard from "./components/auth/RoleGuard";

const queryClient = new QueryClient();

// Mock user data
const mockUser = {
  id: "1",
  name: "أحمد محمد",
  email: "ahmed@example.com",
  phone: "0512345678",
  whatsapp: "0512345678",
  type: "individual" as const,
  companyName: "شركة الوساطة العقارية",
  city: "الرياض",
  plan: "المحترف",
  rating: 4.5,
};

// Interface for linked customer
interface LinkedCustomer {
  id: string;
  name: string;
  phone: string;
}

const App = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [linkedCustomerForTask, setLinkedCustomerForTask] = useState<LinkedCustomer | null>(null);
  const [linkedCustomerForAppointment, setLinkedCustomerForAppointment] = useState<LinkedCustomer | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Check for new user flag
  useEffect(() => {
    if (localStorage.getItem('show_welcome_dialog') === 'true') {
      setIsNewUser(true);
    }
  }, []);

  const handleNavigate = (page: string) => {
    console.log("Navigate to:", page);
    setCurrentPage(page);
  };

  const handleBack = () => {
    setCurrentPage("dashboard");
  };

  // State for customer details page
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<any>(null);

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

  // Clear linked customer when leaving tasks page
  useEffect(() => {
    if (currentPage !== "tasks") {
      setLinkedCustomerForTask(null);
    }
    if (currentPage !== "calendar") {
      setLinkedCustomerForAppointment(null);
    }
  }, [currentPage]);

  // Clear linked customer when leaving tasks page
  useEffect(() => {
    if (currentPage !== "tasks") {
      setLinkedCustomerForTask(null);
    }
  }, [currentPage]);

  // Render based on current page
  const renderPage = () => {
    // صفحة تفاصيل العميل الكاملة
    if (currentPage === "customer-details" && selectedCustomerForDetails) {
      return (
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
      );
    }

    switch (currentPage) {
      case "customer-management-72":
        return <EnhancedBrokerCRM onBack={handleBack} user={mockUser} />;
      case "dashboard-main-252":
        return <MyPlatformComplete onBack={handleBack} onNavigate={handleNavigate} user={mockUser} />;
      case "my-platform-smart":
        return <MyPlatformSmartPaths onBack={handleBack} user={mockUser} />;
      case "business-card-profile":
        return <BusinessCardProfile onBack={handleBack} onEditClick={() => setCurrentPage("business-card-edit")} user={mockUser} />;
      case "business-card-edit":
        return <BusinessCardEdit onBack={() => setCurrentPage("business-card-profile")} user={mockUser} isNewUser={isNewUser} />;
      case "reports-analytics":
        return <ReportsAnalytics onBack={handleBack} />;
      case "digital-card":
        return <DigitalCardDashboard onBack={handleBack} />;
      case "card-editor":
        return <CardEditor onBack={() => setCurrentPage("digital-card")} />;
      case "calendar":
        return (
          <CalendarAppointments 
            onBack={handleBack} 
            linkedCustomer={linkedCustomerForAppointment}
          />
        );
      case "tasks":
        return (
          <TasksManagement 
            onBack={() => setCurrentPage("customer-management-72")} 
            linkedCustomer={linkedCustomerForTask}
          />
        );
      case "spatial-intelligence":
        return <SpatialIntelligenceTest onBack={handleBack} />;
      case "quick-calculator":
        return <QuickCalculatorPage onBack={handleBack} />;
      case "rental-report":
        return <RentedPropertiesReport />;
      case "map-system":
        return <MapSystemDashboard />;
      case "notification-settings":
        return <NotificationSettings />;
      case "sales":
      case "advertising":
        return <AdPublishingSections onBack={handleBack} />;
      case "calendar-system-complete":
        return (
          <CalendarAppointments 
            onBack={handleBack} 
            linkedCustomer={linkedCustomerForAppointment}
          />
        );
      case "dashboard":
      default:
        return <SimpleDashboard user={mockUser} onNavigate={handleNavigate} />;
    }
  };

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

  // Listen for opening customer details from anywhere (CRM/Offers/AI)
  useEffect(() => {
    const handleOpenCustomerDetails = (event: CustomEvent) => {
      const { customerId, activeTab } = event.detail || {};

      const customers = (() => {
        try {
          return JSON.parse(localStorage.getItem('crm_customers') || '[]');
        } catch {
          return [];
        }
      })();

      const found = customers.find((c: any) => c.id === customerId);

      // fallback بسيط لو لم يوجد (حتى لا تتعطل الشاشة)
      const customer = found || {
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
    };

    window.addEventListener('openCustomerDetails', handleOpenCustomerDetails as EventListener);
    return () => {
      window.removeEventListener('openCustomerDetails', handleOpenCustomerDetails as EventListener);
    };
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DashboardProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <Routes>
                  {/* Root - صفحة عامة بدون Redirect */}
                  <Route path="/" element={<AuthPage />} />
                  {/* Auth routes - /app/login, /app/register, /app/recover */}
                  <Route path="/app/login" element={<AuthPage />} />
                  <Route path="/app/register" element={<AuthPage />} />
                  <Route path="/app/recover" element={<RecoverDomainPage />} />
                  <Route path="/app/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/app/reset-password" element={<ResetPasswordPage />} />
                  
                  {/* Legacy auth routes - redirect to new ones */}
                  <Route path="/auth" element={<Navigate to="/app/login" replace />} />
                  <Route path="/login" element={<Navigate to="/app/login" replace />} />
                  
                  {/* Protected app routes - all under /app/* */}
                  
                  {/* businesscard/edit - محمي فقط بـ ProtectedRoute (لا يحتاج slug) */}
                  <Route path="/app/businesscard/edit" element={
                    <ProtectedRoute>
                      <BusinessCardEdit 
                        onBack={() => window.location.href = '/app/dashboard'} 
                        user={mockUser} 
                        isNewUser={isNewUser} 
                      />
                    </ProtectedRoute>
                  } />
                  
                  {/* باقي صفحات /app/* - تحتاج BusinessCardGuard (slug مطلوب) */}
                  <Route path="/app/dashboard" element={
                    <BusinessCardGuard>
                      {renderPage()}
                      <AIFloatingButton />
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
                  
                  {/* ============================================
                      PUBLIC ROUTES - Dynamic Slug Pattern ONLY
                      wasataai.com/{slug}/* - MUST BE LAST
                      ============================================ */}
                  <Route path="/:slug" element={<SlugPlatformPage />} />
                  <Route path="/:slug/card" element={<SlugBusinessCardPage />} />
                  <Route path="/:slug/calendar" element={<SlugCalendarPage />} />
                  <Route path="/:slug/offers" element={<SlugOffersPage />} />
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </DashboardProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
