import { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ImageUpload from '@/components/image-upload';
import ProfilePhotoUpload from '@/components/profile-photo-upload';

// Lazy load heavy components for better performance
const PropertyMap = lazy(() => import('@/components/property-map'));
const LocationSelectionMap = lazy(() => import('@/components/location-selection-map'));
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import type { PropertyWithAgent, PropertyFilters } from '@shared/schema';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type Language } from '@shared/schema';
import { 
  Heart, Search, Filter, LogOut, MapPin, DollarSign,
  Home, Eye, Bed, Bath, Maximize, Phone, Mail, Calendar,
  Star, Bookmark, MessageSquare, User, Settings, Plus,
  Building, University, Mountain, Tag, Key, Edit, Trash2,
  EyeOff, ToggleLeft, ToggleRight, BarChart3, PieChart as PieChartIcon,
  TrendingUp, Activity, Clock, Users, AlertTriangle, Globe
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// Multi-language support
const translations = {
  en: {
    // Form Labels
    propertyTitle: 'Property Title',
    propertyType: 'Property Type',
    listingType: 'Listing Type',
    price: 'Price (USD)',
    area: 'Area (sq ft)',
    address: 'Address',
    selectLanguage: 'Select Language',
    
    // Placeholders
    titlePlaceholder: 'e.g., Beautiful 3-bedroom villa',
    descriptionPlaceholder: 'Describe your property in detail...',
    pricePlaceholder: 'e.g., 150000',
    areaPlaceholder: 'e.g., 1200',
    bedroomsPlaceholder: 'e.g., 3',
    bathroomsPlaceholder: 'e.g., 2',
    addressPlaceholder: 'e.g., 123 Main Street',
    phonePlaceholder: 'e.g., +964 750 123 4567',
    
    // Property Types
    house: 'House',
    apartment: 'Apartment',
    villa: 'Villa',
    land: 'Land',
    
    // Listing Types
    sale: 'For Sale',
    rent: 'For Rent',
    
    // Additional Form Labels
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms', 
    city: 'City',
    country: 'Country',
    contactPhone: 'Contact Phone',
    propertyWave: 'Property Wave',
    amenities: 'Amenities',
    features: 'Features',
    description: 'Description',
    propertyImages: 'Property Images',
    propertyLocation: 'Select Property Location',
    propertyVisibility: 'Property Visibility',
    
    // Additional Placeholders
    contactPhonePlaceholder: 'e.g., +964 750 123 4567',
    cityPlaceholder: 'e.g., Erbil',
    countryPlaceholder: 'e.g., Iraq',
    selectWavePlaceholder: 'Select a wave for this property',
    
    // Form Text
    addNewProperty: 'Add New Property',
    updateProperty: 'Update Property',
    sharePropertyText: 'Share your property with others by adding it to our platform',
    updatePropertyText: 'Update your property details',
    selectPropertyLanguage: 'Select Property Language',
    languageDescription: 'Choose the language for your property listing. This will change the form to that language and set the property\'s display language.',
    language: 'Language',
    change: 'Change',
    
    // Location Section
    selectLocationTitle: '📍 Select Property Location',
    selectLocationDesc: 'Click on the map to pinpoint your property\'s exact location. We\'ll automatically fill in the address, city, and country fields for you!',
    smartAutoFill: 'Smart Auto-Fill Enabled',
    autoFillDesc: 'Address details will be automatically detected and filled when you click on the map',
    locationSelected: 'Location Selected',
    coordinates: 'Coordinates',
    
    // Images Section
    propertyImagesTitle: '📷 Property Images',
    propertyImagesDesc: 'Upload high-quality images of your property. The first image will be used as the main photo.',
    
    // Visibility Section
    propertyVisibilityTitle: '👁️ Property Visibility',
    propertyVisibilityDesc: 'Control whether your property appears on the public map and search results.',
    visibleOnMap: 'Visible on Map',
    hiddenFromMap: 'Hidden from Map',
    visibleDesc: 'Your property will be visible to other users on the map and in search results',
    hiddenDesc: 'Your property will be hidden from the public map and search results',
    visible: 'Visible',
    hidden: 'Hidden',
    
    // Wave Section
    waveBalance: 'Property Wave',
    remaining: 'remaining',
    unlimited: 'Unlimited',
    noWavesRemaining: 'No Waves Remaining',
    waveBalanceWarning: 'You have used all {total} of your wave assignments. You must buy balance to continue assigning properties to waves.',
    noWave: 'No Wave',
    noWavesAvailable: 'No waves available',
    waveDescription: 'Assign your property to a wave to organize it with similar properties. This helps with map viewing and property management.',
    
    // Contact Info
    contactPhoneNote: 'This phone number will be shown to interested buyers for WhatsApp and calls',
    
    // UI Text
    required: 'required',
    optional: 'optional',
    selectPropertyType: 'Select property type',
    selectListingType: 'Select listing type',
    selectLanguageFirst: 'Please select a language to continue',
  },
  ar: {
    // Form Labels
    propertyTitle: 'عنوان العقار',
    propertyType: 'نوع العقار',
    listingType: 'نوع الإعلان',
    price: 'السعر (دولار أمريكي)',
    area: 'المساحة (قدم مربع)',
    address: 'العنوان',
    selectLanguage: 'اختر اللغة',
    
    // Placeholders
    titlePlaceholder: 'مثال: فيلا جميلة من 3 غرف نوم',
    descriptionPlaceholder: 'صف عقارك بالتفصيل...',
    pricePlaceholder: 'مثال: 150000',
    areaPlaceholder: 'مثال: 1200',
    bedroomsPlaceholder: 'مثال: 3',
    bathroomsPlaceholder: 'مثال: 2',
    addressPlaceholder: 'مثال: 123 الشارع الرئيسي',
    phonePlaceholder: 'مثال: +964 750 123 4567',
    
    // Property Types
    house: 'منزل',
    apartment: 'شقة',
    villa: 'فيلا',
    land: 'أرض',
    
    // Listing Types
    sale: 'للبيع',
    rent: 'للإيجار',
    
    // Additional Form Labels
    bedrooms: 'غرف النوم',
    bathrooms: 'دورات المياه',
    city: 'المدينة',
    country: 'البلد',
    contactPhone: 'رقم الاتصال',
    propertyWave: 'موجة العقار',
    amenities: 'المرافق',
    features: 'المميزات',
    description: 'الوصف',
    propertyImages: 'صور العقار',
    propertyLocation: 'اختر موقع العقار',
    propertyVisibility: 'ظهور العقار',
    
    // Additional Placeholders
    contactPhonePlaceholder: 'مثال: +964 750 123 4567',
    cityPlaceholder: 'مثال: أربيل',
    countryPlaceholder: 'مثال: العراق',
    selectWavePlaceholder: 'اختر موجة لهذا العقار',
    
    // Form Text
    addNewProperty: 'إضافة عقار جديد',
    updateProperty: 'تحديث العقار',
    sharePropertyText: 'شارك عقارك مع الآخرين عن طريق إضافته إلى منصتنا',
    updatePropertyText: 'تحديث تفاصيل عقارك',
    selectPropertyLanguage: 'اختر لغة العقار',
    languageDescription: 'اختر لغة قائمة العقار الخاص بك. سيؤدي هذا إلى تغيير النموذج إلى تلك اللغة وتعيين لغة عرض العقار.',
    language: 'اللغة',
    change: 'تغيير',
    
    // Location Section
    selectLocationTitle: '📍 اختر موقع العقار',
    selectLocationDesc: 'انقر على الخريطة لتحديد الموقع الدقيق لعقارك. سنقوم بتعبئة العنوان والمدينة والبلد تلقائياً!',
    smartAutoFill: 'التعبئة التلقائية الذكية مفعلة',
    autoFillDesc: 'سيتم اكتشاف تفاصيل العنوان وتعبئتها تلقائياً عند النقر على الخريطة',
    locationSelected: 'تم اختيار الموقع',
    coordinates: 'الإحداثيات',
    
    // Images Section
    propertyImagesTitle: '📷 صور العقار',
    propertyImagesDesc: 'ارفع صوراً عالية الجودة لعقارك. ستُستخدم الصورة الأولى كصورة رئيسية.',
    
    // Visibility Section
    propertyVisibilityTitle: '👁️ ظهور العقار',
    propertyVisibilityDesc: 'تحكم في ظهور عقارك على الخريطة العامة ونتائج البحث.',
    visibleOnMap: 'ظاهر على الخريطة',
    hiddenFromMap: 'مخفي من الخريطة',
    visibleDesc: 'سيكون عقارك ظاهراً للمستخدمين الآخرين على الخريطة وفي نتائج البحث',
    hiddenDesc: 'سيكون عقارك مخفياً من الخريطة العامة ونتائج البحث',
    visible: 'ظاهر',
    hidden: 'مخفي',
    
    // Wave Section
    waveBalance: 'موجة العقار',
    remaining: 'متبقي',
    unlimited: 'غير محدود',
    noWavesRemaining: 'لا توجد موجات متبقية',
    waveBalanceWarning: 'لقد استخدمت جميع مهام الموجة البالغة {total}. يجب عليك شراء رصيد للمتابعة في تعيين العقارات للموجات.',
    noWave: 'بدون موجة',
    noWavesAvailable: 'لا توجد موجات متاحة',
    waveDescription: 'عين عقارك إلى موجة لتنظيمه مع عقارات مماثلة. هذا يساعد في عرض الخريطة وإدارة العقارات.',
    
    // Contact Info
    contactPhoneNote: 'سيظهر رقم الهاتف هذا للمشترين المهتمين للواتساب والمكالمات',
    
    // UI Text
    required: 'مطلوب',
    optional: 'اختياري',
    selectPropertyType: 'اختر نوع العقار',
    selectListingType: 'اختر نوع الإعلان',
    selectLanguageFirst: 'يرجى اختيار لغة للمتابعة',
  },
  ku: {
    // Form Labels
    propertyTitle: 'ناونیشانی موڵک',
    propertyType: 'جۆری موڵک',
    listingType: 'جۆری ڕیکلام',
    price: 'نرخ (دۆلاری ئەمریکی)',
    area: 'ڕووبەر (پێ چوارگۆشە)',
    bedrooms: 'ژووری نوستن',
    bathrooms: 'ژووری ئاو',
    address: 'ناونیشان',
    city: 'شار',
    country: 'وڵات',
    contactPhone: 'ژمارەی پەیوەندی',
    propertyWave: 'شەپۆلی موڵک',
    selectLanguage: 'زمان هەڵبژێرە',
    description: 'وەسف',
    
    // Placeholders
    titlePlaceholder: 'نموونە: ڤیلایەکی جوان بە 3 ژووری نوستن',
    descriptionPlaceholder: 'موڵکەکەت بە ورووژی وەسف بکە...',
    pricePlaceholder: 'نموونە: 150000',
    areaPlaceholder: 'نموونە: 1200',
    bedroomsPlaceholder: 'نموونە: 3',
    bathroomsPlaceholder: 'نموونە: 2',
    addressPlaceholder: 'نموونە: 123 شەقامی سەرەکی',
    cityPlaceholder: 'نموونە: هەولێر',
    countryPlaceholder: 'نموونە: عێراق',
    phonePlaceholder: 'نموونە: +964 750 123 4567',
    
    // Property Types
    house: 'ماڵ',
    apartment: 'شوقە',
    villa: 'ڤیلا',
    land: 'زەوی',
    
    // Listing Types
    sale: 'بۆ فرۆشتن',
    rent: 'بۆ کرێ',
    
    // Additional Form Labels
    amenities: 'گەرەکیەکان',
    features: 'تایبەتمەندیەکان',
    description: 'وەسف',
    propertyImages: 'وێنەکانی موڵک',
    propertyLocation: 'شوێنی موڵک هەڵبژێرە',
    propertyVisibility: 'دیارکردنی موڵک',
    
    // Additional Placeholders
    contactPhonePlaceholder: 'نموونە: +964 750 123 4567',
    selectWavePlaceholder: 'شەپۆلێک بۆ ئەم موڵکە هەڵبژێرە',
    
    // Form Text
    addNewProperty: 'موڵکی نوێ زیاد بکە',
    updateProperty: 'موڵک نوێ بکەرەوە',
    sharePropertyText: 'موڵکەکەت لەگەڵ کەسانی دیکە هاوبەش بکە بە زیادکردنی بۆ سەکۆمان',
    updatePropertyText: 'وردەکارییەکانی موڵکەکەت نوێ بکەرەوە',
    selectPropertyLanguage: 'زمانی موڵک هەڵبژێرە',
    languageDescription: 'زمانێک بۆ لیستی موڵکەکەت هەڵبژێرە. ئەمە فۆڕمەکە دەگۆڕێت بۆ ئەو زمانە و زمانی پیشاندانی موڵکەکە دادەنێت.',
    language: 'زمان',
    change: 'گۆڕین',
    
    // Location Section
    selectLocationTitle: '📍 شوێنی موڵک هەڵبژێرە',
    selectLocationDesc: 'لەسەر نەخشەکە کلیک بکە بۆ دیاریکردنی شوێنی وردی موڵکەکەت. ئێمە بە شێوەیەکی خۆکارانە ناونیشان و شار و وڵات پڕ دەکەینەوە!',
    smartAutoFill: 'پڕکردنەوەی زیرەکانەی خۆکارانە چالاککراوە',
    autoFillDesc: 'وردەکارییەکانی ناونیشان بە شێوەیەکی خۆکارانە دەدۆزرێنەوە و پڕ دەکرێنەوە کاتێک لەسەر نەخشەکە کلیک دەکەیت',
    locationSelected: 'شوێن هەڵبژێردرا',
    coordinates: 'هاوپەیمانیەکان',
    
    // Images Section
    propertyImagesTitle: '📷 وێنەکانی موڵک',
    propertyImagesDesc: 'وێنەی بەرزی کوالیتی بۆ موڵکەکەت بارپێچ بکە. یەکەم وێنە وەک وێنەی سەرەکی بەکار دەهێنرێت.',
    
    // Visibility Section
    propertyVisibilityTitle: '👁️ دیارکردنی موڵک',
    propertyVisibilityDesc: 'کۆنترۆڵی ئەوە بکە کە موڵکەکەت لەسەر نەخشەی گشتی و ئەنجامەکانی گەڕان دەردەکەوێت.',
    visibleOnMap: 'لەسەر نەخشە دیارە',
    hiddenFromMap: 'لە نەخشە شاراوەیە',
    visibleDesc: 'موڵکەکەت بۆ بەکارهێنەرانی دیکە لەسەر نەخشە و لە ئەنجامەکانی گەڕان دیار دەبێت',
    hiddenDesc: 'موڵکەکەت لە نەخشەی گشتی و ئەنجامەکانی گەڕان شاردراوە دەبێت',
    visible: 'دیار',
    hidden: 'شاراوە',
    
    // Wave Section
    waveBalance: 'شەپۆلی موڵک',
    remaining: 'ماوە',
    unlimited: 'سنووردار نییە',
    noWavesRemaining: 'هیچ شەپۆلێک نەماوە',
    waveBalanceWarning: 'تۆ هەموو {total} ئەرکەکانی شەپۆڵت بەکارهێناوە. دەبێت بڕی پارە بکڕیت بۆ بەردەوامبوون لە دانانی موڵکەکان بۆ شەپۆلەکان.',
    noWave: 'بێ شەپۆل',
    noWavesAvailable: 'هیچ شەپۆلێک بەردەست نییە',
    waveDescription: 'موڵکەکەت بۆ شەپۆلێک دابنێ بۆ ڕێکخستنی لەگەڵ موڵکە هاوشێوەکان. ئەمە یارمەتی پیشاندانی نەخشە و بەڕێوەبردنی موڵکەکان دەدات.',
    
    // Contact Info
    contactPhoneNote: 'ئەم ژمارە تەلەفۆنە بۆ کڕیارە ئارەزووبەکان پیشان دەدرێت بۆ واتساپ و پەیوەندیکردن',
    
    // UI Text
    required: 'پێویست',
    optional: 'ئیختیاری',
    selectPropertyType: 'جۆری موڵک هەڵبژێرە',
    selectListingType: 'جۆری ڕیکلام هەڵبژێرە',
    selectLanguageFirst: 'تکایە زمانێک هەڵبژێرە بۆ بەردەوامبوون',
  }
} as const;

// Property form schema for validation
const propertyFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['house', 'apartment', 'villa', 'land']),
  listingType: z.enum(['sale', 'rent']),
  price: z.string().min(1, 'Price is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Price must be a valid positive number'),
  currency: z.string().default('USD'),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  area: z.number().min(1, 'Area is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required').default('Iraq'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  contactPhone: z.string().optional(),
  waveId: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  language: z.enum(SUPPORTED_LANGUAGES).default('en'),
});

// Profile form schema for validation
const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;
type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Helper functions for expiration
const calculateDaysUntilExpiration = (expiresAt: string | Date | null | undefined): number | null => {
  if (!expiresAt) return null;
  const now = new Date();
  const expiration = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const diffInMs = expiration.getTime() - now.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
};

const getExpirationStatus = (daysUntilExpiration: number | null): { 
  status: string; 
  color: string; 
  bgColor: string;
  icon: string;
  title: string;
  description: string;
} => {
  if (daysUntilExpiration === null) {
    return { 
      status: 'Active', 
      color: 'text-green-600', 
      bgColor: 'bg-green-100',
      icon: '✓',
      title: 'Account Active',
      description: 'Your account has no expiration date.'
    };
  }
  
  if (daysUntilExpiration < 0) {
    return { 
      status: 'Expired', 
      color: 'text-red-600', 
      bgColor: 'bg-red-100',
      icon: '⚠️',
      title: 'Account Expired',
      description: 'Your account has expired. Please contact support to renew.'
    };
  }
  
  if (daysUntilExpiration <= 3) {
    return { 
      status: `${daysUntilExpiration} days left`, 
      color: 'text-red-600', 
      bgColor: 'bg-red-100',
      icon: '🚨',
      title: 'Account Expiring Soon',
      description: `Your account expires in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'}. Please contact support to extend it.`
    };
  }
  
  if (daysUntilExpiration <= 7) {
    return { 
      status: `${daysUntilExpiration} days left`, 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-100',
      icon: '⚡',
      title: 'Account Expiring',
      description: `Your account expires in ${daysUntilExpiration} days. Consider contacting support to extend it.`
    };
  }
  
  return { 
    status: `${daysUntilExpiration} days left`, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    icon: '✓',
    title: 'Account Active',
    description: `Your account expires in ${daysUntilExpiration} days.`
  };
};

// Helper function to get text direction for language
const getTextDirection = (language: Language): 'ltr' | 'rtl' => {
  return language === 'ar' || language === 'ku' ? 'rtl' : 'ltr';
};

// Helper function to get language-specific CSS classes
const getLanguageClasses = (language: Language, baseClasses: string = ''): string => {
  const direction = getTextDirection(language);
  const directionClasses = direction === 'rtl' ? 'text-right' : 'text-left';
  return `${baseClasses} ${directionClasses}`.trim();
};

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [mapFilters, setMapFilters] = useState<PropertyFilters>({ limit: 100 });
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyWithAgent | null>(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [showLanguageSelection, setShowLanguageSelection] = useState(true);

  // Property form
  const propertyForm = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'house',
      listingType: 'sale',
      price: '',
      currency: 'USD',
      bedrooms: 1,
      bathrooms: 1,
      area: 1,
      address: '',
      city: '',
      country: 'Iraq',
      latitude: undefined,
      longitude: undefined,
      images: [],
      amenities: [],
      features: [],
      contactPhone: user?.phone || '',
      waveId: '',
      status: 'active',
      language: 'en',
    },
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    },
  });

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user, profileForm]);

  // Update property form contact phone when user data changes
  useEffect(() => {
    if (user?.phone && propertyForm.getValues('contactPhone') !== user.phone) {
      propertyForm.setValue('contactPhone', user.phone);
    }
  }, [user, propertyForm]);

  // Get user's allowed languages
  const userAllowedLanguages = user?.allowedLanguages || ['en'];
  
  // Filter translations to only include allowed languages
  const availableLanguages = SUPPORTED_LANGUAGES.filter(lang => 
    userAllowedLanguages.includes(lang)
  );

  // Reset language selection when switching to add-property tab
  useEffect(() => {
    if (activeTab === 'add-property' && !editingProperty) {
      setShowLanguageSelection(true);
      setSelectedLanguage('en');
      propertyForm.setValue('language', 'en');
    }
  }, [activeTab, editingProperty, propertyForm]);

  // Update form language when language changes
  useEffect(() => {
    propertyForm.setValue('language', selectedLanguage);
  }, [selectedLanguage, propertyForm]);

  // Get current translations
  const t = translations[selectedLanguage];

  // Fetch all properties
  const { data: allProperties = [], isLoading: propertiesLoading } = useQuery<PropertyWithAgent[]>({
    queryKey: ['/api/properties', mapFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(mapFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  // Fetch user's favorites
  const { data: favorites = [] } = useQuery<PropertyWithAgent[]>({
    queryKey: ['/api/users', user?.id, 'favorites'],
    enabled: !!user?.id,
  });

  // Fetch dashboard analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/customers/${user?.id}/analytics`],
    enabled: !!user?.id,
  });

  // Fetch user's wave balance information
  const { data: waveBalance, isLoading: waveBalanceLoading } = useQuery({
    queryKey: ['/api/auth/wave-balance'],
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  // Fetch property statistics for charts
  const { data: propertyStats } = useQuery({
    queryKey: ['/api/properties', { limit: 1000 }],
    select: (data: PropertyWithAgent[]) => {
      const byType = data?.reduce((acc, prop) => {
        acc[prop.type] = (acc[prop.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const byListingType = data?.reduce((acc, prop) => {
        acc[prop.listingType] = (acc[prop.listingType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const byStatus = data?.reduce((acc, prop) => {
        acc[prop.status] = (acc[prop.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return {
        total: data?.length || 0,
        byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
        byListingType: Object.entries(byListingType).map(([name, value]) => ({ name, value })),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value }))
      };
    }
  });

  // Fetch user's own properties
  const { data: userProperties = [], isLoading: userPropertiesLoading } = useQuery<PropertyWithAgent[]>({
    queryKey: ['/api/users', user?.id, 'properties'],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/properties`);
      if (!response.ok) throw new Error('Failed to fetch user properties');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch available waves for customer
  const { data: availableWaves = [] } = useQuery({
    queryKey: ['/api/waves'],
    queryFn: async () => {
      const response = await fetch('/api/waves');
      if (!response.ok) throw new Error('Failed to fetch waves');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest('POST', '/api/favorites', {
        userId: user?.id,
        propertyId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'favorites'] });
      toast({
        title: 'Success',
        description: 'Property added to favorites',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to favorites',
        variant: 'destructive',
      });
    },
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest('DELETE', '/api/favorites', {
        userId: user?.id,
        propertyId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'favorites'] });
      toast({
        title: 'Success',
        description: 'Property removed from favorites',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove from favorites',
        variant: 'destructive',
      });
    },
  });

  // Create property mutation for customers
  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: PropertyFormValues) => {
      const response = await apiRequest('POST', '/api/properties', {
        ...propertyData,
        agentId: user?.id, // Customer becomes the owner/contact person
      });
      return await response.json();
    },
    onSuccess: () => {
      // Force fresh cache invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'properties'] });
      queryClient.refetchQueries({ queryKey: ['/api/users', user?.id, 'properties'] });
      propertyForm.reset();
      setSelectedLocation(null);
      toast({
        title: 'Success',
        description: 'Property added successfully! Check the "My Properties" tab to see it.',
      });
      setActiveTab('my-properties'); // Switch to properties view to see the new property
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add property',
        variant: 'destructive',
      });
    },
  });

  // Edit property mutation
  const editPropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PropertyFormValues }) => {
      const response = await apiRequest('PUT', `/api/properties/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'properties'] });
      setEditingProperty(null);
      propertyForm.reset();
      setSelectedLocation(null);
      toast({
        title: 'Success',
        description: 'Property updated successfully',
      });
      setActiveTab('my-properties');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property',
        variant: 'destructive',
      });
    },
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest('DELETE', `/api/properties/${propertyId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'properties'] });
      toast({
        title: 'Success',
        description: 'Property deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete property',
        variant: 'destructive',
      });
    },
  });

  // Toggle property visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ propertyId, newStatus }: { propertyId: string; newStatus: 'active' | 'inactive' }) => {
      const response = await apiRequest('PUT', `/api/properties/${propertyId}`, { status: newStatus });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'properties'] });
      toast({
        title: 'Success',
        description: variables.newStatus === 'active' 
          ? 'Property is now visible on the map' 
          : 'Property is now hidden from the map',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property visibility',
        variant: 'destructive',
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileFormValues) => {
      const response = await apiRequest('PUT', '/api/profile', profileData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditingProfile(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Logout failed',
        variant: 'destructive',
      });
    }
  };

  const handleAddToFavorites = (propertyId: string) => {
    addToFavoritesMutation.mutate(propertyId);
  };

  const handleRemoveFromFavorites = (propertyId: string) => {
    removeFromFavoritesMutation.mutate(propertyId);
  };

  const isPropertyFavorite = (propertyId: string) => {
    return favorites.some(fav => fav.id === propertyId);
  };

  const handleMapFilterChange = (filters: PropertyFilters) => {
    setMapFilters(filters);
  };

  const handlePropertyInquiry = (property: PropertyWithAgent) => {
    // Open inquiry modal or navigate to property detail
    navigate(`/property/${property.id}`);
  };

  const onSubmitProperty = (data: PropertyFormValues) => {
    // Convert data to match backend expectations (InsertProperty type)
    const submitData: any = {
      ...data,
      price: data.price, // Keep as string since backend expects decimal strings
      latitude: data.latitude ? data.latitude.toString() : undefined, // Convert to string if provided
      longitude: data.longitude ? data.longitude.toString() : undefined, // Convert to string if provided
      // Handle waveId - convert "no-wave" to null for backend
      waveId: data.waveId === "no-wave" ? null : data.waveId,
      // Ensure required fields are not empty
      country: data.country || 'Iraq',
      currency: data.currency || 'USD',
      images: data.images || [],
      amenities: data.amenities || [],
      features: data.features || [],
    };
    
    if (editingProperty) {
      editPropertyMutation.mutate({ id: editingProperty.id, data: submitData });
    } else {
      createPropertyMutation.mutate(submitData);
    }
  };

  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const handleEditProperty = (property: PropertyWithAgent) => {
    setEditingProperty(property);
    propertyForm.reset({
      title: property.title,
      description: property.description || '',
      type: property.type as 'house' | 'apartment' | 'villa' | 'land',
      listingType: property.listingType as 'sale' | 'rent',
      price: property.price.toString(),
      currency: property.currency || 'USD',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      area: property.area || 0,
      address: property.address,
      city: property.city,
      country: property.country,
      contactPhone: (property as any).contactPhone || user?.phone || '',
      amenities: property.amenities || [],
      features: property.features || [],
      images: property.images || [],
      status: property.status === 'active' ? 'active' : 'inactive',
    });
    if (property.latitude && property.longitude) {
      setSelectedLocation({
        lat: parseFloat(property.latitude),
        lng: parseFloat(property.longitude),
      });
    }
    setActiveTab('add-property');
  };

  const handleDeleteProperty = async (propertyId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

  const handleToggleVisibility = (propertyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    toggleVisibilityMutation.mutate({ propertyId, newStatus });
  };

  const handleCancelPropertyEdit = () => {
    setEditingProperty(null);
    // Reset form to completely empty values
    propertyForm.reset({
      title: '',
      description: '',
      type: 'house',
      listingType: 'sale',
      price: '',
      currency: 'USD',
      bedrooms: 1,
      bathrooms: 1,
      area: 1,
      address: '',
      city: '',
      country: 'Iraq',
      latitude: undefined,
      longitude: undefined,
      images: [],
      amenities: [],
      features: [],
      contactPhone: user?.phone || '',
      waveId: '',
      status: 'active',
    });
    setSelectedLocation(null);
    setActiveTab('my-properties'); // Navigate back to properties list
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form to current user data
    profileForm.reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    });
  };

  const handleLocationSelect = (locationData: { lat: number; lng: number; address?: string; city?: string; country?: string }) => {
    const { lat, lng, address, city, country } = locationData;
    
    setSelectedLocation({ lat, lng });
    propertyForm.setValue('latitude', lat);
    propertyForm.setValue('longitude', lng);
    
    // Auto-fill address fields from reverse geocoding
    if (address && address.trim()) {
      propertyForm.setValue('address', address.trim());
      toast({
        title: 'Address Auto-filled',
        description: `Address set to: ${address}`,
      });
    }
    
    if (city && city.trim()) {
      propertyForm.setValue('city', city.trim());
    }
    
    if (country && country.trim()) {
      propertyForm.setValue('country', country.trim());
    }
    
    // Show success message if we got location data
    if (address || city || country) {
      toast({
        title: 'Location Details Found',
        description: 'Address fields have been automatically filled from the selected location.',
      });
    } else {
      // Fallback for areas where geocoding might not work well
      if (lat > 35.0 && lat < 37.5 && lng > 43.0 && lng < 46.0) {
        if (!propertyForm.getValues('city')) {
          propertyForm.setValue('city', 'Erbil');
        }
        if (!propertyForm.getValues('country')) {
          propertyForm.setValue('country', 'Iraq');
        }
      }
    }
  };

  // Filter properties based on search
  const filteredProperties = allProperties.filter(property => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      property.title.toLowerCase().includes(searchLower) ||
      property.description?.toLowerCase().includes(searchLower) ||
      property.address.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <ProtectedRoute requiredRole={['user', 'admin']}>
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-800 dark:to-orange-900 shadow-lg border-b border-orange-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
              <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Home className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      Property Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-orange-100 hidden sm:block">Find Your Dream Home</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-2 sm:space-x-3 bg-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src={user?.avatar || ''} alt="Profile photo" />
                    <AvatarFallback className="bg-white text-orange-600 font-medium">
                      {user?.firstName?.[0]}{user?.lastName?.[0] || user?.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                    </p>
                    <p className="text-xs text-orange-100">Customer</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-orange-600 transition-all duration-200"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700">
              <TabsList className="grid w-full grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 h-auto bg-transparent gap-1 p-1 sm:p-2">
                <TabsTrigger 
                  value="overview" 
                  className="text-xs sm:text-sm py-1.5 sm:py-2 px-1 sm:px-2 md:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 min-h-[2.5rem] sm:min-h-[2.75rem]"
                  data-testid="tab-overview"
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs md:text-sm">Overview</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="browse" 
                  className="text-xs sm:text-sm py-1.5 sm:py-2 px-1 sm:px-2 md:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 min-h-[2.5rem] sm:min-h-[2.75rem]"
                >
                  <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs md:text-sm">Browse</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="map" 
                  className="text-xs sm:text-sm py-1.5 sm:py-2 px-1 sm:px-2 md:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 min-h-[2.5rem] sm:min-h-[2.75rem] col-span-1 sm:col-span-1"
                >
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs md:text-sm">Map</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="add-property" 
                  className="text-xs sm:text-sm py-1.5 sm:py-2 px-1 sm:px-2 md:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 min-h-[2.5rem] sm:min-h-[2.75rem] col-span-1 sm:col-span-1"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs md:text-sm">Add</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="my-properties" 
                  className="text-xs sm:text-sm py-1.5 sm:py-2 px-1 sm:px-2 md:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 min-h-[2.5rem] sm:min-h-[2.75rem] col-span-1 sm:col-span-1"
                >
                  <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs md:text-sm hidden xs:inline sm:hidden md:inline">My Properties</span>
                  <span className="text-[10px] sm:text-xs md:text-sm xs:hidden sm:inline md:hidden">Mine</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="favorites" 
                  className="text-xs sm:text-sm py-1.5 sm:py-2 px-1 sm:px-2 md:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 min-h-[2.5rem] sm:min-h-[2.75rem] col-span-1 sm:col-span-1"
                >
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-[8px] xs:text-[10px] sm:text-xs bg-orange-100 text-orange-700 px-1 rounded-full min-w-[1rem] h-4 flex items-center justify-center">{favorites.length}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs md:text-sm hidden xs:inline sm:hidden md:inline">Favorites</span>
                  <span className="text-[10px] sm:text-xs md:text-sm xs:hidden sm:inline md:hidden">Fav</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="profile" 
                  className="text-xs sm:text-sm py-1.5 sm:py-2 px-1 sm:px-2 md:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 min-h-[2.5rem] sm:min-h-[2.75rem] col-span-1 sm:col-span-1"
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs md:text-sm">Profile</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Account Status and Expiration Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {/* Account Status Card */}
                <Card className="md:col-span-1 xl:col-span-1 shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-800">
                    <CardTitle className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-200 flex items-center">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Account Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    {(() => {
                      const daysUntilExpiration = calculateDaysUntilExpiration(user?.expiresAt);
                      const status = getExpirationStatus(daysUntilExpiration);
                      return (
                        <div className="space-y-4">
                          <div className={`p-4 rounded-lg ${status.bgColor} border border-opacity-30`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg">{status.icon}</span>
                              <Badge variant="secondary" className={`${status.color} font-medium`}>
                                {status.status}
                              </Badge>
                            </div>
                            <h3 className={`font-semibold ${status.color} mb-1`}>{status.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{status.description}</p>
                          </div>
                          
                          {daysUntilExpiration !== null && daysUntilExpiration > 0 && (
                            <div className="relative">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Days Remaining</span>
                                <span className="font-medium">{daysUntilExpiration}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    daysUntilExpiration <= 3 ? 'bg-red-500' : 
                                    daysUntilExpiration <= 7 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (daysUntilExpiration / 30) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Property Statistics Overview */}
                <Card className="md:col-span-1 xl:col-span-2 shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-white dark:from-gray-800 dark:to-gray-800">
                    <CardTitle className="text-base sm:text-lg font-bold text-orange-800 dark:text-orange-200 flex items-center">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Property Overview
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-orange-600 dark:text-orange-300">
                      Your property portfolio statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                      <div className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-300">{userProperties.length}</div>
                        <div className="text-xs sm:text-sm text-blue-500 dark:text-blue-400">My Properties</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900 dark:to-pink-800 rounded-lg">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-pink-600 dark:text-pink-300">{favorites.length}</div>
                        <div className="text-xs sm:text-sm text-pink-500 dark:text-pink-400">Favorites</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-300">
                          {userProperties.filter(p => p.status === 'active').length}
                        </div>
                        <div className="text-xs sm:text-sm text-green-500 dark:text-green-400">Active</div>
                      </div>
                      {/* Balance Information in Overview */}
                      {!waveBalanceLoading && waveBalance && (
                        <>
                          <div className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 rounded-lg">
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                              {(waveBalance as any).hasUnlimited ? '∞' : (waveBalance as any).totalBalance || 0}
                            </div>
                            <div className="text-xs sm:text-sm text-indigo-500 dark:text-indigo-400">Total Balance</div>
                          </div>
                          <div className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg">
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-300">
                              {(waveBalance as any).currentUsage || 0}
                            </div>
                            <div className="text-xs sm:text-sm text-orange-500 dark:text-orange-400">In Use</div>
                          </div>
                          <div className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 rounded-lg">
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                              {(waveBalance as any).hasUnlimited ? '∞' : (waveBalance as any).remainingWaves || 0}
                            </div>
                            <div className="text-xs sm:text-sm text-emerald-500 dark:text-emerald-400">Remaining</div>
                          </div>
                        </>
                      )}
                      
                      <div className="text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-300">
                          {propertyStats?.total || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-purple-500 dark:text-purple-400">Total Market</div>
                      </div>
                    </div>

                    {/* Wave Balance Information */}
                    {!waveBalanceLoading && waveBalance && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                            <Activity className="h-5 w-5 mr-2" />
                            Wave Balance
                          </h3>
                          {waveBalance.hasUnlimited && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                              Unlimited
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                              {waveBalance.hasUnlimited ? '∞' : waveBalance.totalBalance}
                            </div>
                            <div className="text-sm text-blue-500 dark:text-blue-400">Total Balance</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                              {waveBalance.currentUsage}
                            </div>
                            <div className="text-sm text-orange-500 dark:text-orange-400">In Use</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                              {waveBalance.hasUnlimited ? '∞' : waveBalance.remainingWaves}
                            </div>
                            <div className="text-sm text-green-500 dark:text-green-400">Remaining</div>
                          </div>
                        </div>

                        {!waveBalance.hasUnlimited && waveBalance.totalBalance > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Wave Usage</span>
                              <span className="font-medium">{waveBalance.currentUsage} / {waveBalance.totalBalance}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  waveBalance.remainingWaves <= 0 ? 'bg-red-500' : 
                                  waveBalance.remainingWaves <= 2 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, (waveBalance.currentUsage / waveBalance.totalBalance) * 100)}%` }}
                              ></div>
                            </div>
                            {waveBalance.remainingWaves <= 0 && (
                              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                                ⚠️ Balance not available. You must buy balance to continue using wave assignments.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* Property Type Distribution Chart */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="border-b border-slate-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center">
                      <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600" />
                      Market by Property Type
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">Distribution of properties in the market</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    {propertyStats?.byType && propertyStats.byType.length > 0 ? (
                      <ChartContainer
                        config={{
                          house: { label: "House", color: "#3b82f6" },
                          apartment: { label: "Apartment", color: "#ef4444" },
                          villa: { label: "Villa", color: "#10b981" },
                          land: { label: "Land", color: "#f59e0b" }
                        }}
                        className="h-[200px] sm:h-[250px] md:h-[300px]"
                      >
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Pie
                            dataKey="value"
                            data={propertyStats.byType}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                          >
                            {propertyStats.byType.map((entry: { name: string; value: number }, index: number) => (
                              <Cell key={`cell-${index}`} fill={
                                entry.name === 'house' ? '#3b82f6' :
                                entry.name === 'apartment' ? '#ef4444' :
                                entry.name === 'villa' ? '#10b981' : '#f59e0b'
                              } />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <PieChartIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm sm:text-base">No property data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Listing Type Chart */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="border-b border-slate-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                      Sale vs Rent Distribution
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">Market distribution by listing type</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    {propertyStats?.byListingType && propertyStats.byListingType.length > 0 ? (
                      <ChartContainer
                        config={{
                          sale: { label: "For Sale", color: "#3b82f6" },
                          rent: { label: "For Rent", color: "#10b981" }
                        }}
                        className="h-[200px] sm:h-[250px] md:h-[300px]"
                      >
                        <BarChart data={propertyStats.byListingType}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm sm:text-base">No listing data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Activity and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* Recent Activity */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="border-b border-slate-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">Your latest actions and updates</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      {userProperties.slice(0, 3).map((property) => (
                        <div key={property.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <Home className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {property.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Listed as {property.listingType} • {property.status}
                            </p>
                          </div>
                          <Badge variant={property.status === 'active' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                            {property.status}
                          </Badge>
                        </div>
                      ))}
                      {userProperties.length === 0 && (
                        <div className="text-center py-4 sm:py-6 md:py-8">
                          <Home className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
                          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No properties listed yet</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 text-xs sm:text-sm"
                            onClick={() => setActiveTab('add-property')}
                          >
                            Add Your First Property
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="border-b border-slate-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">Manage your account and properties</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                      <Button 
                        variant="outline" 
                        className="h-16 sm:h-18 md:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 hover:bg-orange-50 hover:border-orange-200 transition-all duration-200"
                        onClick={() => setActiveTab('add-property')}
                        data-testid="button-add-property"
                      >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600" />
                        <span className="text-xs sm:text-sm font-medium text-center leading-tight">Add Property</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-16 sm:h-18 md:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                        onClick={() => setActiveTab('browse')}
                        data-testid="button-browse-properties"
                      >
                        <Search className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                        <span className="text-xs sm:text-sm font-medium text-center leading-tight">Browse Properties</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-16 sm:h-18 md:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 hover:bg-green-50 hover:border-green-200 transition-all duration-200"
                        onClick={() => setActiveTab('favorites')}
                        data-testid="button-view-favorites"
                      >
                        <Heart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                        <span className="text-xs sm:text-sm font-medium text-center leading-tight">View Favorites</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-16 sm:h-18 md:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 hover:bg-purple-50 hover:border-purple-200 transition-all duration-200"
                        onClick={() => setActiveTab('profile')}
                        data-testid="button-edit-profile"
                      >
                        <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
                        <span className="text-xs sm:text-sm font-medium text-center leading-tight">Edit Profile</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="browse" className="space-y-4 sm:space-y-6">
              {/* Search and Filter */}
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader className="border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-white dark:from-gray-800 dark:to-gray-800">
                  <CardTitle className="text-lg sm:text-xl text-orange-800 dark:text-orange-200 font-bold">Find Your Perfect Property</CardTitle>
                  <CardDescription className="text-orange-600 dark:text-orange-300">
                    Search through our extensive property listings
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 h-4 w-4" />
                      <Input
                        placeholder="Search properties, locations, or keywords..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500 h-12 text-base"
                        data-testid="input-search"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Select 
                        value={mapFilters.type || 'all'} 
                        onValueChange={(value) => 
                          setMapFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))
                        }
                      >
                        <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500 h-11" data-testid="select-type-filter">
                          <SelectValue placeholder="Property Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={mapFilters.listingType || 'all'} 
                        onValueChange={(value) => 
                          setMapFilters(prev => ({ ...prev, listingType: value === 'all' ? undefined : value as 'sale' | 'rent' }))
                        }
                      >
                        <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500 h-11" data-testid="select-listing-filter">
                          <SelectValue placeholder="Listing Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Listings</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                          <SelectItem value="rent">For Rent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Properties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {propertiesLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="animate-pulse shadow-lg">
                      <div className="aspect-[4/3] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded-t-lg"></div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-20"></div>
                          <div className="h-6 bg-slate-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredProperties.length === 0 ? (
                  <div className="col-span-full p-8 sm:p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                        <Home className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {searchTerm ? 'No Properties Found' : 'No Properties Available'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchTerm 
                          ? `No properties match your search for "${searchTerm}". Try adjusting your filters.`
                          : 'There are no properties available at the moment. Check back later for new listings.'
                        }
                      </p>
                      {searchTerm && (
                        <Button 
                          variant="outline" 
                          className="border-orange-200 text-orange-600 hover:bg-orange-50 transition-all duration-200"
                          onClick={() => setSearchTerm('')}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isFavorite={isPropertyFavorite(property.id)}
                      onToggleFavorite={(isFav) => 
                        isFav ? handleRemoveFromFavorites(property.id) : handleAddToFavorites(property.id)
                      }
                      onInquiry={handlePropertyInquiry}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="map" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Map</CardTitle>
                  <CardDescription>
                    Explore properties on the interactive map
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] w-full">
                    <Suspense fallback={
                      <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-muted-foreground">Loading map...</p>
                        </div>
                      </div>
                    }>
                      <PropertyMap 
                        properties={allProperties}
                        filters={mapFilters}
                        onFilterChange={handleMapFilterChange}
                        onPropertyClick={handlePropertyInquiry}
                        className="h-full w-full rounded-lg"
                      />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="add-property" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{editingProperty ? 'Update Property' : 'Add New Property'}</CardTitle>
                  <CardDescription>
                    {editingProperty ? 'Update your property details' : 'Share your property with others by adding it to our platform'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...propertyForm}>
                    <form onSubmit={propertyForm.handleSubmit(onSubmitProperty)} className="space-y-6">
                      {/* Language Selection Section */}
                      {showLanguageSelection && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Select Property Language</h3>
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                            Choose the language for your property listing. This will change the form to that language and set the property's display language.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {availableLanguages.map((lang) => (
                              <Button
                                key={lang}
                                type="button"
                                variant={selectedLanguage === lang ? 'default' : 'outline'}
                                className={`p-4 h-auto justify-start ${selectedLanguage === lang 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                                  : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                } ${getTextDirection(lang) === 'rtl' ? 'text-right' : 'text-left'}`}
                                onClick={() => {
                                  setSelectedLanguage(lang);
                                  setShowLanguageSelection(false);
                                }}
                                data-testid={`button-language-${lang}`}
                              >
                                <div className="flex flex-col items-start w-full">
                                  <span className="text-sm font-medium">
                                    {LANGUAGE_NAMES[lang]}
                                  </span>
                                  <span className="text-xs opacity-75">
                                    {lang.toUpperCase()}
                                  </span>
                                </div>
                              </Button>
                            ))}
                          </div>
                          {availableLanguages.length === 1 && (
                            <p className="text-xs text-muted-foreground mt-3">
                              Only {LANGUAGE_NAMES[availableLanguages[0]]} is available for your account.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Form Fields - Show only after language selection */}
                      {!showLanguageSelection && (
                        <>
                          {/* Language indicator and change option */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border" dir={getTextDirection(selectedLanguage)}>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {getTextDirection(selectedLanguage) === 'rtl' ? (
                                  <>بلغة: {LANGUAGE_NAMES[selectedLanguage]}</>
                                ) : (
                                  <>Language: {LANGUAGE_NAMES[selectedLanguage]}</>
                                )}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowLanguageSelection(true)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              data-testid="button-change-language"
                            >
                              {getTextDirection(selectedLanguage) === 'rtl' ? 'تغيير' : 'Change'}
                            </Button>
                          </div>

                          <div 
                            className="grid grid-cols-1 md:grid-cols-2 gap-6" 
                            dir={getTextDirection(selectedLanguage)}
                          >
                        <FormField
                          control={propertyForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={getLanguageClasses(selectedLanguage)}>
                                {t.propertyTitle} *
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t.titlePlaceholder} 
                                  {...field} 
                                  className={getLanguageClasses(selectedLanguage)}
                                  dir={getTextDirection(selectedLanguage)}
                                  data-testid="input-property-title" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={getLanguageClasses(selectedLanguage)}>
                                {t.propertyType} *
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger 
                                    data-testid="select-property-type"
                                    className={getLanguageClasses(selectedLanguage)}
                                    dir={getTextDirection(selectedLanguage)}
                                  >
                                    <SelectValue placeholder={t.selectPropertyType} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="house">
                                    <span className="flex items-center gap-2">
                                      <Home className="h-4 w-4 text-orange-600" />
                                      {t.house}
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="apartment">
                                    <span className="flex items-center gap-2">
                                      <Building className="h-4 w-4 text-orange-600" />
                                      {t.apartment}
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="villa">
                                    <span className="flex items-center gap-2">
                                      <University className="h-4 w-4 text-orange-600" />
                                      {t.villa}
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="land">
                                    <span className="flex items-center gap-2">
                                      <Mountain className="h-4 w-4 text-orange-600" />
                                      {t.land}
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="listingType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={getLanguageClasses(selectedLanguage)}>
                                {t.listingType} *
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger 
                                    data-testid="select-listing-type"
                                    className={getLanguageClasses(selectedLanguage)}
                                    dir={getTextDirection(selectedLanguage)}
                                  >
                                    <SelectValue placeholder={t.selectListingType} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="sale">
                                    <span className="flex items-center gap-2">
                                      <Tag className="h-4 w-4 text-green-600" />
                                      {t.sale}
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="rent">
                                    <span className="flex items-center gap-2">
                                      <Key className="h-4 w-4 text-orange-600" />
                                      {t.rent}
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={getLanguageClasses(selectedLanguage)}>
                                {t.price} *
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t.pricePlaceholder} 
                                  type="number" 
                                  {...field}
                                  className={getLanguageClasses(selectedLanguage)}
                                  dir={getTextDirection(selectedLanguage)}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  data-testid="input-price" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="area"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={getLanguageClasses(selectedLanguage)}>
                                {t.area} *
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t.areaPlaceholder} 
                                  type="number" 
                                  min="1"
                                  {...field}
                                  className={getLanguageClasses(selectedLanguage)}
                                  dir={getTextDirection(selectedLanguage)}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  data-testid="input-area"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="bedrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bedrooms</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 3" 
                                  type="number" 
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  data-testid="input-bedrooms"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="bathrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bathrooms</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 2" 
                                  type="number" 
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  data-testid="input-bathrooms"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={getLanguageClasses(selectedLanguage)}>
                                {t.address} *
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t.addressPlaceholder} 
                                  {...field} 
                                  className={getLanguageClasses(selectedLanguage)}
                                  dir={getTextDirection(selectedLanguage)}
                                  data-testid="input-address" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Erbil" {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Iraq" {...field} data-testid="input-country" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="e.g., +964 750 123 4567" 
                                    {...field} 
                                    className="pl-10"
                                    data-testid="input-contact-phone" 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                This phone number will be shown to interested buyers for WhatsApp and calls
                              </p>
                            </FormItem>
                          )}
                        />

                        {/* Wave Selection */}
                        <FormField
                          control={propertyForm.control}
                          name="waveId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                Property Wave
                                {waveBalance && !(waveBalance as any).hasUnlimited && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    (waveBalance as any).remainingWaves <= 0 ? 'bg-red-100 text-red-700' :
                                    (waveBalance as any).remainingWaves <= 2 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {(waveBalance as any).remainingWaves} remaining
                                  </span>
                                )}
                                {waveBalance?.hasUnlimited && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                    Unlimited
                                  </span>
                                )}
                              </FormLabel>
                              
                              {waveBalance && !(waveBalance as any).hasUnlimited && (waveBalance as any).remainingWaves <= 0 && (
                                <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-3">
                                  <div className="flex items-center gap-2 text-red-700 mb-1">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="font-medium">No Waves Remaining</span>
                                  </div>
                                  <p className="text-sm text-red-600">
                                    You have used all {(waveBalance as any).totalBalance} of your wave assignments. 
                                    You must buy balance to continue assigning properties to waves.
                                  </p>
                                </div>
                              )}
                              
                              <Select 
                                onValueChange={(value) => {
                                  // Validate wave assignment before allowing change
                                  if (value !== "no-wave" && waveBalance && !(waveBalance as any).hasUnlimited && (waveBalance as any).remainingWaves <= 0) {
                                    // Show modal when trying to assign wave without balance
                                    setShowBalanceModal(true);
                                    return;
                                  }
                                  field.onChange(value);
                                }} 
                                defaultValue={field.value}
                                disabled={waveBalance && !(waveBalance as any).hasUnlimited && (waveBalance as any).remainingWaves <= 0}
                              >
                                <FormControl>
                                  <SelectTrigger 
                                    data-testid="select-wave"
                                    className={waveBalance && !(waveBalance as any).hasUnlimited && (waveBalance as any).remainingWaves <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                  >
                                    <SelectValue placeholder={
                                      waveBalance && !(waveBalance as any).hasUnlimited && (waveBalance as any).remainingWaves <= 0 
                                        ? "No waves available" 
                                        : "Select a wave for this property"
                                    } />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="no-wave">
                                    <span className="flex items-center gap-2">
                                      <span className="text-muted-foreground">No Wave</span>
                                    </span>
                                  </SelectItem>
                                  {availableWaves.map((wave) => (
                                    <SelectItem key={wave.id} value={wave.id}>
                                      <span className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full border"
                                          style={{ backgroundColor: wave.color }}
                                        />
                                        {wave.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                Assign your property to a wave to organize it with similar properties. This helps with map viewing and property management.
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Location Selection Map */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">📍 Select Property Location</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Click on the map to pinpoint your property's exact location. We'll automatically fill in the address, city, and country fields for you!
                          </p>
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800 mb-4">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                Smart Auto-Fill Enabled
                              </span>
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              Address details will be automatically detected and filled when you click on the map
                            </p>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <LocationSelectionMap 
                            onLocationSelect={handleLocationSelect}
                            selectedLocation={selectedLocation}
                            className="h-[400px] w-full"
                          />
                        </div>
                        
                        {selectedLocation && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                Location Selected
                              </span>
                            </div>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Property Images Upload */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">📷 Property Images</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload high-quality images of your property. The first image will be used as the main photo.
                          </p>
                        </div>
                        
                        <FormField
                          control={propertyForm.control}
                          name="images"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <ImageUpload
                                  value={field.value || []}
                                  onChange={field.onChange}
                                  maxFiles={10}
                                  maxSize={5}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Amenities and Features */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={propertyForm.control}
                          name="amenities"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amenities</FormLabel>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {[
                                  'Swimming Pool', 'Garden', 'Parking', 'Security System',
                                  'Elevator', 'Gym', 'Balcony', 'Terrace'
                                ].map((amenity) => (
                                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={field.value?.includes(amenity) || false}
                                      onChange={(e) => {
                                        const current = field.value || [];
                                        if (e.target.checked) {
                                          field.onChange([...current, amenity]);
                                        } else {
                                          field.onChange(current.filter(item => item !== amenity));
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">{amenity}</span>
                                  </label>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="features"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Features</FormLabel>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {[
                                  'Air Conditioning', 'Heating', 'Furnished', 'Pet Friendly',
                                  'Fireplace', 'High Ceilings', 'Modern Kitchen', 'Storage Room'
                                ].map((feature) => (
                                  <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={field.value?.includes(feature) || false}
                                      onChange={(e) => {
                                        const current = field.value || [];
                                        if (e.target.checked) {
                                          field.onChange([...current, feature]);
                                        } else {
                                          field.onChange(current.filter(item => item !== feature));
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">{feature}</span>
                                  </label>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={propertyForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your property in detail..."
                                className="min-h-[100px]"
                                {...field}
                                data-testid="textarea-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Property Visibility Control */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">👁️ Property Visibility</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Control whether your property appears on the public map and search results.
                          </p>
                        </div>
                        
                        <FormField
                          control={propertyForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-gray-800">
                                <div className="flex-1">
                                  <FormLabel className="text-base font-medium">
                                    {field.value === 'active' ? 'Visible on Map' : 'Hidden from Map'}
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {field.value === 'active' 
                                      ? 'Your property will be visible to other users on the map and in search results'
                                      : 'Your property will be hidden from the public map and search results'
                                    }
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3 ml-4">
                                  <FormControl>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => field.onChange(field.value === 'active' ? 'inactive' : 'active')}
                                      className={`transition-all ${field.value === 'active' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                                      data-testid="button-toggle-property-visibility"
                                    >
                                      {field.value === 'active' ? (
                                        <>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Visible
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="h-4 w-4 mr-2" />
                                          Hidden
                                        </>
                                      )}
                                    </Button>
                                  </FormControl>
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                          <div className="flex justify-end space-x-4">
                            {editingProperty && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleCancelPropertyEdit}
                                data-testid="button-cancel-edit"
                              >
                                Cancel
                              </Button>
                            )}
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => propertyForm.reset()}
                              data-testid="button-reset"
                            >
                              Reset Form
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createPropertyMutation.isPending || editPropertyMutation.isPending}
                              data-testid="button-submit-property"
                            >
                              {editingProperty ? 
                                (editPropertyMutation.isPending ? 'Updating Property...' : 'Update Property') : 
                                (createPropertyMutation.isPending ? 'Adding Property...' : 'Add Property')
                              }
                            </Button>
                          </div>
                        </>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-properties" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Properties</CardTitle>
                  <CardDescription>
                    Manage the properties you've posted ({userProperties.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userPropertiesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                          <CardContent className="p-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : userProperties.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>You haven't posted any properties yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab('add-property')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Property
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userProperties.map((property) => (
                        <Card key={property.id} className="group relative">
                          <CardContent className="p-0">
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg relative overflow-hidden">
                              {property.images && property.images.length > 0 ? (
                                <img 
                                  src={property.images[0]} 
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home className="h-12 w-12 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant={property.status === 'active' ? 'default' : 'secondary'}
                                  onClick={() => handleToggleVisibility(property.id, property.status || 'inactive')}
                                  className={property.status === 'active' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}
                                  data-testid={`button-toggle-visibility-${property.id}`}
                                  title={property.status === 'active' ? 'Hide from map' : 'Show on map'}
                                >
                                  {property.status === 'active' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleEditProperty(property)}
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                  data-testid={`button-edit-${property.id}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteProperty(property.id, property.title)}
                                  data-testid={`button-delete-${property.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="absolute top-2 left-2">
                                <Badge variant={property.listingType === 'sale' ? 'default' : 'secondary'}>
                                  {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                                </Badge>
                              </div>
                              <div className="absolute bottom-2 left-2 flex space-x-1">
                                <Badge 
                                  variant={property.status === 'active' ? 'default' : 'secondary'} 
                                  className={`text-xs ${property.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                                >
                                  {property.status === 'active' ? (
                                    <><Eye className="h-3 w-3 mr-1" />Visible</>
                                  ) : (
                                    <><EyeOff className="h-3 w-3 mr-1" />Hidden</>
                                  )}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {property.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {property.description}
                              </p>
                              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {property.city}, {property.country}
                                </span>
                                <span className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {property.views || 0} views
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                                {property.bedrooms && (
                                  <span className="flex items-center">
                                    <Bed className="h-3 w-3 mr-1" />
                                    {property.bedrooms}
                                  </span>
                                )}
                                {property.bathrooms && (
                                  <span className="flex items-center">
                                    <Bath className="h-3 w-3 mr-1" />
                                    {property.bathrooms}
                                  </span>
                                )}
                                {property.area && (
                                  <span className="flex items-center">
                                    <Maximize className="h-3 w-3 mr-1" />
                                    {property.area} ft²
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-left">
                                  <p className="text-lg font-bold text-green-600">
                                    ${parseFloat(property.price).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Posted {new Date(property.createdAt || '').toLocaleDateString()}
                                  </p>
                                </div>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/property/${property.id}`)}
                                  data-testid={`button-view-${property.id}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Favorite Properties</CardTitle>
                  <CardDescription>
                    Properties you've saved for later
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favorites.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>You haven't saved any properties yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab('browse')}
                      >
                        Browse Properties
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favorites.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          isFavorite={true}
                          onToggleFavorite={() => handleRemoveFromFavorites(property.id)}
                          onInquiry={handlePropertyInquiry}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your account information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Profile Picture and Basic Info */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.avatar || ''} alt="Profile photo" />
                        <AvatarFallback className="text-lg">
                          {user?.firstName?.[0]}{user?.lastName?.[0] || user?.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <Badge variant="secondary" className="mt-1">Customer</Badge>
                      </div>
                      <div className="flex space-x-2">
                        {!isEditingProfile ? (
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditingProfile(true)}
                            data-testid="button-edit-profile"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={handleCancelEdit}
                              data-testid="button-cancel-edit"
                            >
                              Cancel
                            </Button>
                            <Button 
                              form="profile-form"
                              type="submit" 
                              disabled={updateProfileMutation.isPending}
                              data-testid="button-save-profile"
                            >
                              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Account Expiration Notice */}
                    {(() => {
                      const daysUntilExpiration = calculateDaysUntilExpiration(user?.expiresAt);
                      const { status, color, bgColor, icon, title, description } = getExpirationStatus(daysUntilExpiration);
                      
                      return (
                        <div className={`rounded-lg border p-4 ${bgColor} border-opacity-50`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">{icon}</div>
                              <div>
                                <h4 className={`font-semibold ${color}`}>{title}</h4>
                                <p className="text-sm text-gray-600">{description}</p>
                              </div>
                            </div>
                            <Badge 
                              className={`${color} ${bgColor} border-0 font-medium`}
                              data-testid="badge-user-expiration"
                            >
                              {status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Profile Form */}
                    {isEditingProfile ? (
                      <Form {...profileForm}>
                        <form 
                          id="profile-form"
                          onSubmit={profileForm.handleSubmit(onSubmitProfile)} 
                          className="space-y-6"
                        >
                          {/* Profile Photo Upload */}
                          <FormField
                            control={profileForm.control}
                            name="avatar"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <ProfilePhotoUpload
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    currentUser={user || undefined}
                                    maxSize={2}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Editable Fields */}
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your first name" 
                                      {...field} 
                                      data-testid="input-first-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your last name" 
                                      {...field} 
                                      data-testid="input-last-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your phone number" 
                                      {...field} 
                                      data-testid="input-phone"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Read-only Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Username</label>
                              <Input value={user?.username || ''} disabled />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Email</label>
                              <Input value={user?.email || ''} disabled />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Member Since</label>
                              <Input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} disabled />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Account Type</label>
                              <Input value="Customer" disabled />
                            </div>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      /* Read-only View */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">First Name</label>
                          <Input value={user?.firstName || 'Not provided'} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Last Name</label>
                          <Input value={user?.lastName || 'Not provided'} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone</label>
                          <Input value={user?.phone || 'Not provided'} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Username</label>
                          <Input value={user?.username || ''} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input value={user?.email || ''} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Member Since</label>
                          <Input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} disabled />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Loading Modal for Property Creation */}
      <Dialog open={createPropertyMutation.isPending || editPropertyMutation.isPending} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4">
              <div className="animate-spin h-12 w-12 border-4 border-orange-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {editingProperty ? 'Updating Property...' : 'Adding Property...'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {editingProperty 
                ? 'Please wait while we update your property details.'
                : 'Please wait while we add your property to our platform.'
              }
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>Processing your request</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Insufficient Balance Modal */}
      <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Balance Not Available
            </DialogTitle>
            <DialogDescription>
              You don't have balance for this premium wave!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                You have used all your wave assignments. To assign properties to premium waves, you must buy balance.
              </p>
            </div>
            {!waveBalanceLoading && waveBalance && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {(waveBalance as any).totalBalance || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Balance</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {(waveBalance as any).currentUsage || 0}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">In Use</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {(waveBalance as any).remainingWaves || 0}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">Remaining</div>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBalanceModal(false)}>
                Close
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setShowBalanceModal(false);
                  toast({
                    title: "Contact Support",
                    description: "Please contact support to purchase additional balance.",
                    variant: "default",
                  });
                }}
              >
                Buy Balance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}

// Property Card Component for Customers
function PropertyCard({ 
  property, 
  isFavorite,
  onToggleFavorite,
  onInquiry
}: { 
  property: PropertyWithAgent;
  isFavorite: boolean;
  onToggleFavorite: (isFavorite: boolean) => void;
  onInquiry: (property: PropertyWithAgent) => void;
}) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg relative overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <img 
              src={property.images[0]} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex space-x-1">
            <Button
              size="sm"
              variant={isFavorite ? "default" : "secondary"}
              onClick={() => onToggleFavorite(isFavorite)}
              className={`transition-all ${isFavorite ? 'text-white' : ''}`}
              data-testid={`button-favorite-${property.id}`}
            >
              <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
          <div className="absolute top-2 left-2">
            <Badge variant={property.listingType === 'sale' ? 'default' : 'secondary'}>
              {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
            </Badge>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
            <Badge variant="outline" className="text-xs">
              {property.type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {property.description}
          </p>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <span className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {property.city}, {property.country}
            </span>
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {property.views || 0} views
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            {property.bedrooms && (
              <span className="flex items-center">
                <Bed className="h-3 w-3 mr-1" />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center">
                <Bath className="h-3 w-3 mr-1" />
                {property.bathrooms}
              </span>
            )}
            {property.area && (
              <span className="flex items-center">
                <Maximize className="h-3 w-3 mr-1" />
                {property.area} ft²
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-lg font-bold text-green-600">
                ${parseFloat(property.price).toLocaleString()}
              </p>
              {property.agent && (
                <p className="text-xs text-muted-foreground">
                  Agent: {property.agent.firstName} {property.agent.lastName}
                </p>
              )}
            </div>
            <Button 
              size="sm"
              onClick={() => onInquiry(property)}
              data-testid={`button-inquire-${property.id}`}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Inquire
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}