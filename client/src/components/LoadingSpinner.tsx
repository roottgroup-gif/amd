import logoImage from "@assets/logo_1757848527935.png";
import { useTranslation } from "@/lib/i18n";

export function LoadingSpinner() {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-transparent border-t-primary border-r-primary"></div>
          <img 
            src={logoImage} 
            alt="MapEstate Logo" 
            className="absolute inset-2 h-12 w-12 object-contain"
          />
        </div>
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );
}