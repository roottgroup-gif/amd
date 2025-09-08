import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { NetworkStatus } from "@/components/NetworkStatus";
import Home from "@/pages/home.tsx";
import Properties from "@/pages/properties.tsx";
import PropertyDetail from "@/pages/property-detail.tsx";
import Favorites from "@/pages/favorites.tsx";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminLogin from "@/pages/admin-login.tsx";
import AdminDashboard from "@/pages/admin-dashboard";
import DashboardRedirect from "@/pages/dashboard-redirect.tsx";
import NotFound from "@/pages/not-found.tsx";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/favorites" component={Favorites} />
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <NetworkStatus />
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
