import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Languages, Globe } from "lucide-react";
import usFlag from "@assets/generated_images/US_flag_circular_design_55844ad0.png";
import saudiFlag from "@assets/generated_images/Saudi_flag_circular_design_3c46c604.png";
import kurdishFlag from "@assets/generated_images/Kurdish_flag_circular_design_55e28463.png";

interface LanguageSelectionModalProps {
  isOpen: boolean;
  showBlur: boolean;
  onLanguageSelect: (language: string) => void;
}

export default function LanguageSelectionModal({ 
  isOpen, 
  showBlur,
  onLanguageSelect 
}: LanguageSelectionModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

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
    setSelectedLanguage(languageCode);
  };

  const handleConfirm = () => {
    if (selectedLanguage) {
      onLanguageSelect(selectedLanguage);
    }
  };

  return (
    <>
      {/* Persistent Blur Overlay */}
      {showBlur && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md transition-all duration-300" style={{ zIndex: 9998 }} />
      )}
      
      {/* Language Selection Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        // Prevent the modal from closing automatically
        // Only allow closing through our handleConfirm function
        return false;
      }}>
        <DialogContent 
          className="sm:max-w-md" 
          data-testid="language-selection-modal"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          style={{ zIndex: 9999 }}
        >
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <Globe className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Choose Your Language
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Select your preferred language to continue
            </p>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {languages.map((language) => (
              <Card 
                key={language.code}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedLanguage === language.code
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleLanguageSelect(language.code)}
                data-testid={`language-option-${language.code}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={language.flag} 
                      alt={language.name}
                      className="w-8 h-8 object-contain rounded-full"
                    />
                    <div className="flex-1 text-left">
                      <h3 className="font-medium">{language.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {language.nativeName}
                      </p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      selectedLanguage === language.code
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedLanguage === language.code && (
                        <div className="h-full w-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col space-y-2 pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!selectedLanguage}
              className="w-full"
              data-testid="confirm-language-button"
            >
              <Languages className="mr-2 h-4 w-4" />
              Continue
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You can change this later in settings
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}