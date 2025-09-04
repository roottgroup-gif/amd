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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Home className="text-primary-foreground text-xl" />
            </div>
            <span className="text-xl font-bold text-foreground">EstateAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-100'
                  }`}
                  data-testid={`nav-${item.href.slice(1) || 'home'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Language Selector */}
          <div className="hidden md:block">
            <Select value={language} onValueChange={changeLanguage}>
              <SelectTrigger className="w-32">
                <Globe className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  <span className="flex items-center gap-2">
                    <span className="text-base">🇺🇸</span>
                    EN
                  </span>
                </SelectItem>
                <SelectItem value="ar">
                  <span className="flex items-center gap-2">
                    <span className="text-base">🇮🇶</span>
                    AR
                  </span>
                </SelectItem>
                <SelectItem value="ku">
                  <span className="flex items-center gap-2">
                    <span className="text-base">🟨🔴🟩</span>
                    KU
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="mobile-menu-trigger">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-md text-lg font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 hover:text-primary hover:bg-gray-100'
                        }`}
                        data-testid={`mobile-nav-${item.href.slice(1) || 'home'}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                  <div className="pt-4 border-t border-gray-200">
                    <Select value={language} onValueChange={changeLanguage}>
                      <SelectTrigger className="w-full">
                        <Languages className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">
                          <span className="flex items-center gap-2">
                            <span className="text-base">🇺🇸</span>
                            English
                          </span>
                        </SelectItem>
                        <SelectItem value="ar">
                          <span className="flex items-center gap-2">
                            <span className="text-base">🇮🇶</span>
                            العربية
                          </span>
                        </SelectItem>
                        <SelectItem value="ku">
                          <span className="flex items-center gap-2">
                            <span className="text-base">🟨🔴🟩</span>
                            کوردی
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
      </div>
    </nav>
  );
}
