import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Globe, 
  Bell, 
  Monitor, 
  Save,
  Eye,
  MapPin,
  Heart,
  Mail
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  console.log('SettingsModal rendered with isOpen:', isOpen);
  const { language, changeLanguage, t } = useTranslation();
  const [userSettings, setUserSettings] = useState({
    // Profile Settings
    displayName: "",
    email: "",
    phone: "",
    
    // Language & Region (will sync with global language)
    language: language,
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    favoriteUpdates: true,
    priceAlerts: false,
    
    // Display Preferences
    mapStyle: "default",
    showPropertyPrices: true,
    showDistance: true,
    autoZoom: true,
    
    // Privacy
    showProfile: true,
    shareLocation: false
  });

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log("Saving settings:", userSettings);
    onClose();
  };

  const updateSetting = (key: string, value: any) => {
    if (key === 'language') {
      // Update global language state when language is changed
      changeLanguage(value as 'en' | 'ar' | 'kur');
    } else {
      setUserSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl" 
        data-testid="settings-modal"
        style={{ zIndex: 10002 }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('settings.settingsPreferences')}
          </DialogTitle>
          <DialogDescription>
            {t('settings.settingsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                {t('settings.profileInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t('settings.displayName')}</Label>
                  <Input
                    id="displayName"
                    value={userSettings.displayName}
                    onChange={(e) => updateSetting('displayName', e.target.value)}
                    placeholder={t('settings.displayNamePlaceholder')}
                    data-testid="display-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    placeholder={t('settings.emailPlaceholder')}
                    data-testid="email-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('settings.phone')}</Label>
                <Input
                  id="phone"
                  value={userSettings.phone}
                  onChange={(e) => updateSetting('phone', e.target.value)}
                  placeholder={t('settings.phonePlaceholder')}
                  data-testid="phone-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-4 w-4" />
                {t('settings.languageRegion')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('settings.language')}</Label>
                  <Select value={userSettings.language} onValueChange={(value) => updateSetting('language', value)}>
                    <SelectTrigger data-testid="language-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                      <SelectItem value="ku">کوردی (Kurdish)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.currency')}</Label>
                  <Select value={userSettings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                    <SelectTrigger data-testid="currency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="IQD">IQD (د.ع)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.dateFormat')}</Label>
                  <Select value={userSettings.dateFormat} onValueChange={(value) => updateSetting('dateFormat', value)}>
                    <SelectTrigger data-testid="date-format-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-4 w-4" />
                {t('settings.notifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('settings.emailNotifications')}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={userSettings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  data-testid="email-notifications-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {t('settings.pushNotifications')}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('settings.pushNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={userSettings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  data-testid="push-notifications-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    {t('settings.favoriteUpdates')}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('settings.favoriteUpdatesDesc')}</p>
                </div>
                <Switch
                  checked={userSettings.favoriteUpdates}
                  onCheckedChange={(checked) => updateSetting('favoriteUpdates', checked)}
                  data-testid="favorite-updates-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.priceAlerts')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.priceAlertsDesc')}</p>
                </div>
                <Switch
                  checked={userSettings.priceAlerts}
                  onCheckedChange={(checked) => updateSetting('priceAlerts', checked)}
                  data-testid="price-alerts-switch"
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-4 w-4" />
                {t('settings.displayPreferences')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.mapStyle')}</Label>
                <Select value={userSettings.mapStyle} onValueChange={(value) => updateSetting('mapStyle', value)}>
                  <SelectTrigger data-testid="map-style-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{t('settings.mapStyleDefault')}</SelectItem>
                    <SelectItem value="satellite">{t('settings.mapStyleSatellite')}</SelectItem>
                    <SelectItem value="terrain">{t('settings.mapStyleTerrain')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {t('settings.showPropertyPrices')}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('settings.showPropertyPricesDesc')}</p>
                </div>
                <Switch
                  checked={userSettings.showPropertyPrices}
                  onCheckedChange={(checked) => updateSetting('showPropertyPrices', checked)}
                  data-testid="show-prices-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('settings.showDistance')}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('settings.showDistanceDesc')}</p>
                </div>
                <Switch
                  checked={userSettings.showDistance}
                  onCheckedChange={(checked) => updateSetting('showDistance', checked)}
                  data-testid="show-distance-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.autoZoom')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.autoZoomDesc')}</p>
                </div>
                <Switch
                  checked={userSettings.autoZoom}
                  onCheckedChange={(checked) => updateSetting('autoZoom', checked)}
                  data-testid="auto-zoom-switch"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} data-testid="cancel-settings">
              {t('settings.cancel')}
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2" data-testid="save-settings">
              <Save className="h-4 w-4" />
              {t('settings.saveSettings')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}