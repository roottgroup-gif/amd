import { Switch, Route, useLocation } from "wouter";
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
import { globalChangeLanguage, useLanguage, detectLanguageFromUrl, redirectToLanguage, type Language } from "@/lib/i18n";
import { Redirect } from "@/components/Redirect";

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
  const [location, setLocation] = useLocation();
  const { language } = useLanguage();

  // Language detection and redirect effect
  useEffect(() => {
    const currentLang = detectLanguageFromUrl(location);
    
    // If no language in URL, redirect to language-prefixed version
    if (!currentLang) {
      const browserLang = (localStorage.getItem('language') as Language) ?? 
                          (navigator.language.startsWith('ar') ? 'ar' : 
                           navigator.language.startsWith('ku') ? 'kur' : 'en');
      redirectToLanguage(browserLang, location, setLocation);
      return;
    }
    
    // If URL language differs from current language, update language
    if (currentLang !== language) {
      globalChangeLanguage(currentLang as any);
    }
  }, [location, language, setLocation]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        {/* Language-prefixed routes */}
        <Route path="/:lang/" component={Home} />
        <Route path="/:lang" component={() => <Redirect to="/" />} />
        <Route path="/:lang/properties" component={Properties} />
        <Route path="/:lang/property/:id" component={PropertyDetail} />
        <Route path="/:lang/favorites" component={Favorites} />
        <Route path="/:lang/settings" component={Settings} />
        <Route path="/:lang/dashboard" component={DashboardRedirect} />
        <Route path="/:lang/customer/dashboard" component={CustomerDashboard} />
        <Route path="/:lang/admin/login" component={AdminLogin} />
        <Route path="/:lang/admin/dashboard" component={AdminDashboard} />
        <Route path="/:lang/about" component={AboutPage} />
        
        {/* Legacy routes without language prefix - redirect */}
        <Route path="/" component={() => <Redirect to="/" />} />
        <Route path="/properties" component={() => <Redirect to="/properties" />} />
        <Route path="/property/:id" component={({ params }) => <Redirect to={`/property/${params?.id}`} />} />
        <Route path="/favorites" component={() => <Redirect to="/favorites" />} />
        <Route path="/settings" component={() => <Redirect to="/settings" />} />
        <Route path="/dashboard" component={() => <Redirect to="/dashboard" />} />
        <Route path="/customer/dashboard" component={() => <Redirect to="/customer/dashboard" />} />
        <Route path="/admin/login" component={() => <Redirect to="/admin/login" />} />
        <Route path="/admin/dashboard" component={() => <Redirect to="/admin/dashboard" />} />
        <Route path="/about" component={() => <Redirect to="/about" />} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBlur, setShowBlur] = useState(false);
  const [location, setLocation] = useLocation();

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
    
    // Redirect to language-prefixed URL
    redirectToLanguage(languageCode as any, location || '/', setLocation);
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
