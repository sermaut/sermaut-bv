import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import Contractors from "./pages/Contractors";
import Reports from "./pages/Reports";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import PendingApproval from "./pages/PendingApproval";
import Suspended from "./pages/Suspended";
import AuditLogs from "./pages/AuditLogs";
import { useUserRole } from "@/hooks/useUserRole";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, accountStatus } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (accountStatus === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  if (accountStatus === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }

  if (accountStatus === 'rejected') {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/pending" element={<PendingApproval />} />
              <Route path="/suspended" element={<Suspended />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="requests" element={<Requests />} />
                <Route path="contractors" element={<Contractors />} />
                <Route path="reports" element={<Reports />} />
                <Route path="contact" element={<Contact />} />
                <Route 
                  path="admin" 
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="audit-logs" 
                  element={
                    <AdminRoute>
                      <AuditLogs />
                    </AdminRoute>
                  } 
                />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
