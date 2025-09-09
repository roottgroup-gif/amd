import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { NetworkStatus } from "@/components/NetworkStatus";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useNetworkError } from "@/hooks/useNetworkError";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Lazy load page components for better performance
const Home = lazy(() => import("@/pages/home.tsx"));
const Properties = lazy(() => import("@/pages/properties.tsx"));
const PropertyDetail = lazy(() => import("@/pages/property-detail.tsx"));
const Favorites = lazy(() => import("@/pages/favorites.tsx"));
const Settings = lazy(() => import("@/pages/settings.tsx"));
const CustomerDashboard = lazy(() => import("@/pages/customer-dashboard"));
const AdminLogin = lazy(() => import("@/pages/admin-login.tsx"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const DashboardRedirect = lazy(() => import("@/pages/dashboard-redirect.tsx"));
const NotFound = lazy(() => import("@/pages/not-found.tsx"));

function Router() {
  useNetworkError(); // Hook to handle network errors globally
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
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
    </Suspense>
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
