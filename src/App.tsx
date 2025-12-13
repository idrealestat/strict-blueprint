import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import SimpleDashboard from "./components/layout/SimpleDashboard";
import CustomersListPage from "./pages/CustomersListPage";
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
    // TODO: Implement full navigation
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <SimpleDashboard 
                  user={mockUser} 
                  onNavigate={handleNavigate} 
                />
              } 
            />
            <Route path="/customers" element={<CustomersListPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;