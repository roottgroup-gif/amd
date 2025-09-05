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
    <nav className="bg-white dark:bg-gray-900 border-b border-border dark:border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary">EstateAI</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 ${
                      isActive(item.href)
                        ? 'text-primary bg-primary/10 dark:bg-primary/20'
                        : 'text-foreground hover:text-primary hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
            
            {/* Language Selector */}
            <Select value={language} onValueChange={changeLanguage}>
              <SelectTrigger className="w-32 bg-background dark:bg-gray-800 border-border dark:border-gray-700">
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    <Languages className="h-4 w-4" />
                    <span>{language === 'en' ? 'EN' : language === 'ar' ? 'AR' : 'KU'}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  <span className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>English</span>
                  </span>
                </SelectItem>
                <SelectItem value="ar">
                  <span className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>العربية</span>
                  </span>
                </SelectItem>
                <SelectItem value="ku">
                  <span className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>کوردی</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background dark:bg-gray-900 border-border dark:border-gray-800">
                <div className="space-y-4 py-4">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start space-x-2 ${
                            isActive(item.href)
                              ? 'text-primary bg-primary/10 dark:bg-primary/20'
                              : 'text-foreground hover:text-primary'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Button>
                      </Link>
                    );
                  })}
                  
                  <div className="pt-4 border-t border-border dark:border-gray-800">
                    <Select value={language} onValueChange={changeLanguage}>
                      <SelectTrigger className="w-full bg-background dark:bg-gray-800 border-border dark:border-gray-700">
                        <SelectValue>
                          <div className="flex items-center space-x-2">
                            <Languages className="h-4 w-4" />
                            <span>{language === 'en' ? 'English' : language === 'ar' ? 'العربية' : 'کوردی'}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="ku">کوردی</SelectItem>
                      </SelectContent>
                    </Select>
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
