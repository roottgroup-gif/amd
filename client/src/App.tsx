import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { NetworkStatus } from "@/components/NetworkStatus";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CurrencyProvider } from "@/lib/currency-context";
import { useNetworkError } from "@/hooks/useNetworkError";
import { Suspense, lazy, useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import LanguageSelectionModal from "@/components/language-selection-modal";
import { globalChangeLanguage } from "@/lib/i18n";

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
const AboutPage = lazy(() => import("@/pages/about.tsx"));
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
        <Route path="/about" component={AboutPage} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBlur, setShowBlur] = useState(false);

  useEffect(() => {
    // Check if user has already selected a language
    const hasSelectedLanguage = localStorage.getItem('language-selected');
    if (!hasSelectedLanguage) {
      setShowLanguageModal(true);
      setShowBlur(true);
    }
  }, []);

  const handleLanguageSelect = (languageCode: string) => {
    // Call the global language change function directly
    globalChangeLanguage(languageCode as any);
    localStorage.setItem('language-selected', 'true');
    setShowLanguageModal(false);
    // Keep blur for a moment after selection
    setTimeout(() => setShowBlur(false), 300);
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <AuthProvider>
            <TooltipProvider>
              <NetworkStatus />
              <Toaster />
              <LanguageSelectionModal 
                isOpen={showLanguageModal}
                showBlur={showBlur}
                onLanguageSelect={handleLanguageSelect}
              />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
