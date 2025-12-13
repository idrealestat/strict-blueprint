import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useState } from "react";
import SimpleDashboard from "./components/layout/SimpleDashboard";
import EnhancedBrokerCRM from "./components/crm/EnhancedBrokerCRM";
import MyPlatform from "./components/platform/MyPlatform";
import BusinessCardProfile from "./components/business-card/BusinessCardProfile";
import BusinessCardEdit from "./components/business-card/BusinessCardEdit";
import { ReportsAnalytics } from "./components/analytics";
import { DigitalCardDashboard } from "./components/digital-card";
import CustomersListPage from "./pages/CustomersListPage";
import PublicCardView from "./pages/PublicCardView";
import NotFound from "./pages/NotFound";

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

const App = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleNavigate = (page: string) => {
    console.log("Navigate to:", page);
    setCurrentPage(page);
  };

  const handleBack = () => {
    setCurrentPage("dashboard");
  };

  // Render based on current page
  const renderPage = () => {
    switch (currentPage) {
      case "customer-management-72":
        return <EnhancedBrokerCRM onBack={handleBack} user={mockUser} />;
      case "dashboard-main-252":
        return <MyPlatform onBack={handleBack} onNavigate={handleNavigate} user={mockUser} />;
      case "business-card-profile":
        return <BusinessCardProfile onBack={handleBack} onEditClick={() => setCurrentPage("business-card-edit")} user={mockUser} />;
      case "business-card-edit":
        return <BusinessCardEdit onBack={() => setCurrentPage("business-card-profile")} user={mockUser} />;
      case "reports-analytics":
        return <ReportsAnalytics onBack={handleBack} />;
      case "digital-card":
        return <DigitalCardDashboard onBack={handleBack} />;
      case "dashboard":
      default:
        return <SimpleDashboard user={mockUser} onNavigate={handleNavigate} />;
    }
  };

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;