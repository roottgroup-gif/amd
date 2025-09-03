import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n";
import { Menu, Home, Building2, Users, Info } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { language, changeLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.properties'), href: '/properties', icon: Building2 },
    { name: t('nav.agents'), href: '/agent-dashboard', icon: Users },
    { name: t('nav.about'), href: '/about', icon: Info },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === href;
    return location.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Home className="text-primary-foreground text-xl" />
            </div>
            <span className="text-xl font-bold text-foreground">EstateAI</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
