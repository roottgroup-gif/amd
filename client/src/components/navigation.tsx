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
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Home className="text-primary-foreground text-xl" />
            </div>
            <span className="text-xl font-bold text-foreground">EstateAI</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`nav-link-${item.href}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Language & Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <Select value={language} onValueChange={changeLanguage} data-testid="language-select">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="ku">کوردی</SelectItem>
              </SelectContent>
            </Select>
            
            <Button data-testid="sign-in-button">
              {t('nav.signIn')}
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="mobile-menu-button">
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
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        data-testid={`mobile-nav-link-${item.href}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                  
                  <div className="border-t pt-4 space-y-4">
                    <Select value={language} onValueChange={changeLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="ku">کوردی</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button className="w-full" onClick={() => setIsOpen(false)}>
                      {t('nav.signIn')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
