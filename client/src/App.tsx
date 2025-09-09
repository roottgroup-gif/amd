import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { NetworkStatus } from "@/components/NetworkStatus";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useNetworkError } from "@/hooks/useNetworkError";
import Home from "@/pages/home.tsx";
import Properties from "@/pages/properties.tsx";
import PropertyDetail from "@/pages/property-detail.tsx";
import Favorites from "@/pages/favorites.tsx";
import Settings from "@/pages/settings.tsx";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminLogin from "@/pages/admin-login.tsx";
import AdminDashboard from "@/pages/admin-dashboard";
import DashboardRedirect from "@/pages/dashboard-redirect.tsx";
import NotFound from "@/pages/not-found.tsx";

function Router() {
  useNetworkError(); // Hook to handle network errors globally
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/settings" component={Settings} />
      <Route path="/dashboard" component={DashboardRedirect} />
      <Route path="/customer/dashboard" component={CustomerDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <NetworkStatus />
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
