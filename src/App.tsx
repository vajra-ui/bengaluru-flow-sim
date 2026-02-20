import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";

import { TrafficProvider } from "@/hooks/useTraffic"; // ✅ ADD THIS

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/AuthLogin";

const queryClient = new QueryClient();

// Wrapper to handle login redirect
const LoginWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate("/dashboard");
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TrafficProvider> {/* ✅ ⭐ CRITICAL FIX */}
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              {/* Login page */}
              <Route path="/" element={<LoginWrapper />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<Index />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </TrafficProvider>
    </QueryClientProvider>
  );
};

export default App;