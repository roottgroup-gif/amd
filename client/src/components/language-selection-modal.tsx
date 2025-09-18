import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe } from "lucide-react";
import usFlag from "@assets/generated_images/US_flag_circular_design_55844ad0.png";
import saudiFlag from "@assets/generated_images/Saudi_flag_circular_design_3c46c604.png";
import kurdishFlag from "@assets/generated_images/Kurdish_flag_circular_design_55e28463.png";

interface LanguageSelectionProps {
  isOpen: boolean;
  onLanguageSelect: (language: string) => void;
}

export default function LanguageSelection({ 
  isOpen,
  onLanguageSelect 
}: LanguageSelectionProps) {
  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: usFlag
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: saudiFlag
    },
    {
      code: 'kur',
      name: 'Kurdish',
      nativeName: 'کوردی',
      flag: kurdishFlag
    }
  ];

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageSelect(languageCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background dark:bg-gray-900 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <Globe className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground dark:text-white mb-2">
            Choose Your Language
          </h1>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Select your preferred language to continue
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {languages.map((language) => (
            <Card 
              key={language.code}
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 border border-border dark:border-gray-700"
              onClick={() => handleLanguageSelect(language.code)}
              data-testid={`language-option-${language.code}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={language.flag} 
                    alt={language.name}
                    className="w-10 h-10 object-contain rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-base text-foreground dark:text-white">{language.name}</h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      {language.nativeName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground dark:text-gray-400">
          You can change this later in settings
        </p>
      </div>
    </div>
  );
}