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
          className="w-[95vw] max-w-[400px] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl border-0 shadow-2xl" 
          data-testid="language-selection-modal"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          style={{ zIndex: 9999 }}
        >
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-sweep"></div>
              <Globe className="h-6 w-6 sm:h-8 sm:w-8 relative z-10" />
            </div>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold">
              Choose Your Language
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Select your preferred language to continue
            </p>
          </DialogHeader>

          <div className="space-y-2 sm:space-y-3 py-4 sm:py-6">
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
                <CardContent className="p-3 sm:p-4 md:p-5">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <img 
                      src={language.flag} 
                      alt={language.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-medium text-sm sm:text-base md:text-lg truncate">{language.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {language.nativeName}
                      </p>
                    </div>
                    <div className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 rounded-full border-2 flex-shrink-0 ${
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

          <div className="flex flex-col space-y-2 sm:space-y-3 pt-4 sm:pt-6">
            <Button
              onClick={handleConfirm}
              disabled={!selectedLanguage}
              className="w-full h-10 sm:h-12 text-sm sm:text-base"
              data-testid="confirm-language-button"
            >
              <Languages className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Continue
            </Button>
            <p className="text-xs sm:text-sm text-center text-muted-foreground px-2">
              You can change this later in settings
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}