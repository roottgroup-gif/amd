import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n";
import { Menu, Home, Building2, Users, Info, Globe, Languages } from "lucide-react";

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
    </nav>
  );
}
