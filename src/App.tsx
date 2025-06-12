import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './hooks/useAuth';
import { ProtectedLayout } from './components/layouts/ProtectedLayout';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import ForgotPasswordPage from './pages/auth/forgot-password';
import { EmailConfirmation } from './pages/auth/EmailConfirmation';
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/email-confirmation" element={<EmailConfirmation />} />

            {/* Rotas protegidas */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Index />} />
              {/* Adicione outras rotas protegidas aqui */}
            </Route>

            {/* Rota padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
