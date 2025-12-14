import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useState, useEffect } from "react";
import SimpleDashboard from "./components/layout/SimpleDashboard";
import EnhancedBrokerCRM from "./components/crm/EnhancedBrokerCRM";
import MyPlatform from "./components/platform/MyPlatform";
import MyPlatformSmartPaths from "./components/platform/MyPlatformSmartPaths";
import BusinessCardProfile from "./components/business-card/BusinessCardProfile";
import BusinessCardEdit from "./components/business-card/BusinessCardEdit";
import { ReportsAnalytics } from "./components/analytics";
import { DigitalCardDashboard, CardEditor } from "./components/digital-card";
import { CalendarAppointments } from "./components/calendar";
import { TasksManagement } from "./components/tasks";
import CustomersListPage from "./pages/CustomersListPage";
import PublicCardView from "./pages/PublicCardView";
import SpatialIntelligenceTest from "./pages/SpatialIntelligenceTest";
import NotFound from "./pages/NotFound";
import { DashboardProvider } from "./context/DashboardContext";

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
      const CustomerDetailsPage = require("./components/crm/CustomerDetailsPage").default;
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
        return <MyPlatform onBack={handleBack} onNavigate={handleNavigate} user={mockUser} />;
      case "my-platform-smart":
        return <MyPlatformSmartPaths onBack={handleBack} user={mockUser} />;
      case "business-card-profile":
        return <BusinessCardProfile onBack={handleBack} onEditClick={() => setCurrentPage("business-card-edit")} user={mockUser} />;
      case "business-card-edit":
        return <BusinessCardEdit onBack={() => setCurrentPage("business-card-profile")} user={mockUser} />;
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
      case "dashboard":
      default:
        return <SimpleDashboard user={mockUser} onNavigate={handleNavigate} />;
    }
  };

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <DashboardProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={renderPage()} />
                <Route path="/customers" element={<CustomersListPage />} />
                <Route path="/cards/:slug" element={<PublicCardView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DashboardProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;