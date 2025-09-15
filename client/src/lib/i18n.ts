import { useState, useEffect } from 'react';

type Language = 'en' | 'ar' | 'kur';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
    kur: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': {
    en: 'Home',
    ar: 'الرئيسية',
    kur: 'سەرەتا'
  },
  'nav.properties': {
    en: 'Properties',
    ar: 'العقارات',
    kur: 'خانووبەرە'
  },
  'nav.agents': {
    en: 'Agents',
    ar: 'الوكلاء',
    kur: 'بریکار'
  },
  'nav.about': {
    en: 'About',
    ar: 'حول',
    kur: 'دەربارە'
  },
  'nav.signIn': {
    en: 'Sign In',
    ar: 'تسجيل الدخول',
    kur: 'چوونەژوورەوە'
  },

  // Hero Section
  'hero.title': {
    en: 'Find Your Perfect Home with AI',
    ar: 'اعثر على منزلك المثالي بالذكاء الاصطناعي',
    kur: 'ماڵی تەواوی خۆت بە AI بدۆزەرەوە'
  },
  'hero.subtitle': {
    en: 'Discover properties tailored to your needs using intelligent recommendations',
    ar: 'اكتشف العقارات المصممة خصيصًا لاحتياجاتك باستخدام التوصيات الذكية',
    kur: 'خانووبەرەکان بدۆزەرەوە کە بە پێی پێداویستییەکانت داڕێژراون'
  },
  'hero.searchPlaceholder': {
    en: "Ask AI: 'Find me a 3-bedroom house under $200k near downtown'",
    ar: "اسأل الذكاء الاصطناعي: 'ابحث لي عن منزل بـ 3 غرف نوم تحت 200 ألف دولار بالقرب من وسط المدينة'",
    kur: "لە AI بپرسە: 'ماڵێکی 3 ژووری نوستن بدۆزەرەوە کە کەمتر لە 200 هەزار دۆلار بێت'"
  },
  'hero.search': {
    en: 'Search',
    ar: 'بحث',
    kur: 'گەڕان'
  },

  // Quick Filters
  'filter.forSale': {
    en: 'For Sale',
    ar: 'للبيع',
    kur: 'بۆ فرۆشتن'
  },
  'filter.forRent': {
    en: 'For Rent',
    ar: 'للإيجار',
    kur: 'بۆ کرێ'
  },
  'filter.houses': {
    en: 'Houses',
    ar: 'منازل',
    kur: 'ماڵەکان'
  },
  'filter.apartments': {
    en: 'Apartments',
    ar: 'شقق',
    kur: 'شوقەکان'
  },
  'filter.nearMe': {
    en: 'Near Me',
    ar: 'بالقرب مني',
    kur: 'نزیکی من'
  },

  // Property Details
  'property.beds': {
    en: 'Beds',
    ar: 'غرف نوم',
    kur: 'ژووری نوستن'
  },
  'property.baths': {
    en: 'Baths',
    ar: 'حمامات',
    kur: 'حەمام'
  },
  'property.sqft': {
    en: 'sq ft',
    ar: 'قدم مربع',
    kur: 'پێی چوارگۆشە'
  },
  'property.viewDetails': {
    en: 'View Details',
    ar: 'عرض التفاصيل',
    kur: 'بینینی وردەکارییەکان'
  },

  // Contact
  'contact.callNow': {
    en: 'Call Now',
    ar: 'اتصل الآن',
    kur: 'ئێستا پەیوەندی بکە'
  },
  'contact.sendMessage': {
    en: 'Send Message',
    ar: 'إرسال رسالة',
    kur: 'نامە بنێرە'
  },
  'contact.name': {
    en: 'Your Name',
    ar: 'اسمك',
    kur: 'ناوت'
  },
  'contact.email': {
    en: 'Your Email',
    ar: 'بريدك الإلكتروني',
    kur: 'ئیمەیڵت'
  },
  'contact.message': {
    en: 'Your Message',
    ar: 'رسالتك',
    kur: 'نامەکەت'
  },

  // Common
  'common.loading': {
    en: 'Loading...',
    ar: 'جاري التحميل...',
    kur: 'بارکردن...'
  },
  'common.error': {
    en: 'An error occurred',
    ar: 'حدث خطأ',
    kur: 'هەڵەیەک ڕوویدا'
  },
  'common.noResults': {
    en: 'No results found',
    ar: 'لا توجد نتائج',
    kur: 'هیچ ئەنجامێک نەدۆزرایەوە'
  },

  // Property Detail Page
  'property.backToHome': {
    en: 'Back to Home',
    ar: 'العودة للرئيسية',
    kur: 'گەڕانەوە بۆ سەرەتا'
  },
  'property.description': {
    en: 'Description',
    ar: 'الوصف',
    kur: 'وەسف'
  },
  'property.featuresAmenities': {
    en: 'Features & Amenities',
    ar: 'المزايا والخدمات',
    kur: 'تایبەتمەندی و خزمەتگوزاریەکان'
  },
  'property.features': {
    en: 'Features',
    ar: 'المزايا',
    kur: 'تایبەتمەندییەکان'
  },
  'property.amenities': {
    en: 'Amenities',
    ar: 'الخدمات',
    kur: 'خزمەتگوزاریەکان'
  },
  'property.propertyInformation': {
    en: 'Property Information',
    ar: 'معلومات العقار',
    kur: 'زانیاری خانووبەرە'
  },
  'property.propertyType': {
    en: 'Property Type:',
    ar: 'نوع العقار:',
    kur: 'جۆری خانووبەرە:'
  },
  'property.listed': {
    en: 'Listed:',
    ar: 'تاريخ الإدراج:',
    kur: 'لیست کراوە:'
  },
  'property.status': {
    en: 'Status:',
    ar: 'الحالة:',
    kur: 'دۆخ:'
  },
  'property.bedrooms': {
    en: 'Bedrooms',
    ar: 'غرف النوم',
    kur: 'ژووری نوستن'
  },
  'property.bathrooms': {
    en: 'Bathrooms',
    ar: 'الحمامات',
    kur: 'حەمام'
  },
  'property.sqFt': {
    en: 'Sq Ft',
    ar: 'قدم مربع',
    kur: 'پێی چوارگۆشە'
  },
  'property.parking': {
    en: 'Parking',
    ar: 'موقف السيارات',
    kur: 'پارک کردن'
  },
  'property.featured': {
    en: 'Featured',
    ar: 'مميز',
    kur: 'تایبەت'
  },

  // Error states and additional labels
  'property.notFound': {
    en: 'Property Not Found',
    ar: 'العقار غير موجود',
    kur: 'خانووبەرە نەدۆزرایەوە'
  },
  'property.notFoundDescription': {
    en: "The property you're looking for doesn't exist or has been removed.",
    ar: 'العقار الذي تبحث عنه غير موجود أو تم حذفه.',
    kur: 'ئەو خانووبەرەی کە بەدوایدا دەگەڕێیت بوونی نییە یان سڕاوەتەوە.'
  },
  'property.perSqFt': {
    en: '/sq ft',
    ar: '/قدم مربع',
    kur: '/پێی چوارگۆشە'
  },
  'property.shareOnFacebook': {
    en: 'Share on Facebook',
    ar: 'مشاركة على فيسبوك',
    kur: 'هاوبەشکردن لە فەیسبووک'
  },
  'property.shareOnTwitter': {
    en: 'Share on Twitter',
    ar: 'مشاركة على تويتر',
    kur: 'هاوبەشکردن لە تویتەر'
  },
  'property.shareOnWhatsApp': {
    en: 'Share on WhatsApp',
    ar: 'مشاركة على واتساب',
    kur: 'هاوبەشکردن لە واتساپ'
  },
  'property.shareOnLinkedIn': {
    en: 'Share on LinkedIn',
    ar: 'مشاركة على لينكد إن',
    kur: 'هاوبەشکردن لە لینکدین'
  },
  'property.copyLink': {
    en: 'Copy Link',
    ar: 'نسخ الرابط',
    kur: 'کۆپیکردنی بەستەر'
  },
  'property.linkCopied': {
    en: 'Link Copied',
    ar: 'تم نسخ الرابط',
    kur: 'بەستەرەکە کۆپی کرا'
  },
  'property.linkCopiedDescription': {
    en: 'Property link has been copied to your clipboard.',
    ar: 'تم نسخ رابط العقار إلى الحافظة.',
    kur: 'بەستەری خانووبەرەکە کۆپی کراوە بۆ کلیپ بۆردەکەت.'
  },
  'property.addedToFavorites': {
    en: 'Added to Favorites',
    ar: 'تمت الإضافة إلى المفضلة',
    kur: 'زیادکرا بۆ بەرگری'
  },
  'property.addedToFavoritesDescription': {
    en: 'Property has been added to your favorites.',
    ar: 'تمت إضافة العقار إلى مفضلتك.',
    kur: 'خانووبەرەکە زیادکرا بۆ بەرگریەکانت.'
  },
  'property.removedFromFavorites': {
    en: 'Removed from Favorites',
    ar: 'تمت الإزالة من المفضلة',
    kur: 'لابرا لە بەرگری'
  },
  'property.removedFromFavoritesDescription': {
    en: 'Property has been removed from your favorites.',
    ar: 'تمت إزالة العقار من مفضلتك.',
    kur: 'خانووبەرەکە لابرا لە بەرگریەکانت.'
  },
  'property.favoriteError': {
    en: 'Error',
    ar: 'خطأ',
    kur: 'هەڵە'
  },
  'property.favoriteErrorDescription': {
    en: 'Failed to update favorites. Please try again.',
    ar: 'فشل في تحديث المفضلة. حاول مرة أخرى.',
    kur: 'سەرکەوتوو نەبوو لە نوێکردنەوەی بەرگری. دووبارە هەوڵبدەوە.'
  },

  // Property Features
  // Property Amenities (Keys from customer dashboard form)
  'property.amenities.swimmingPool': {
    en: 'Swimming Pool',
    ar: 'مسبح',
    kur: 'حەوزی مەلەکردن'
  },
  'property.amenities.garden': {
    en: 'Garden',
    ar: 'حديقة',
    kur: 'باخچە'
  },
  'property.amenities.parking': {
    en: 'Parking',
    ar: 'موقف سيارات',
    kur: 'پارک کردن'
  },
  'property.amenities.securitySystem': {
    en: 'Security System',
    ar: 'نظام الأمان',
    kur: 'سیستەمی ئاسایش'
  },
  'property.amenities.elevator': {
    en: 'Elevator',
    ar: 'مصعد',
    kur: 'ئاسانسۆر'
  },
  'property.amenities.gym': {
    en: 'Gym',
    ar: 'نادي رياضي',
    kur: 'زالی وەرزش'
  },
  'property.amenities.balcony': {
    en: 'Balcony',
    ar: 'شرفة',
    kur: 'بالاخانە'
  },
  'property.amenities.terrace': {
    en: 'Terrace',
    ar: 'تراس',
    kur: 'تاراسە'
  },

  // Property Features (Keys from customer dashboard form)
  'property.features.airConditioning': {
    en: 'Air Conditioning',
    ar: 'تكييف الهواء',
    kur: 'ڕەش‌کردنەوە'
  },
  'property.features.heating': {
    en: 'Heating',
    ar: 'تدفئة',
    kur: 'گەرمکردنەوە'
  },
  'property.features.furnished': {
    en: 'Furnished',
    ar: 'مؤثث',
    kur: 'فەرنیچەردار'
  },
  'property.features.petFriendly': {
    en: 'Pet Friendly',
    ar: 'مناسب للحيوانات الأليفة',
    kur: 'گونجاو بۆ ئاژەڵی ماڵی'
  },
  'property.features.fireplace': {
    en: 'Fireplace',
    ar: 'مدفأة',
    kur: 'بخاری'
  },
  'property.features.highCeilings': {
    en: 'High Ceilings',
    ar: 'أسقف عالية',
    kur: 'سەقفی بەرز'
  },
  'property.features.modernKitchen': {
    en: 'Modern Kitchen',
    ar: 'مطبخ عصري',
    kur: 'چێشتخانەی مۆدێرن'
  },
  'property.features.storageRoom': {
    en: 'Storage Room',
    ar: 'غرفة تخزين',
    kur: 'ژووری هەڵگرتن'
  },

  // Legacy translations for backward compatibility
  'property.amenities.gardenPatio': {
    en: 'Garden & Patio',
    ar: 'حديقة وشرفة',
    kur: 'باخچە و بالاخانە'
  },
  'property.amenities.garageParking': {
    en: 'Garage Parking',
    ar: 'موقف السيارات',
    kur: 'پارک کردنی گاراژ'
  },

  // Settings Page
  'settings.title': {
    en: 'Settings - MapEstate',
    ar: 'الإعدادات - MapEstate',
    kur: 'ڕێکخستنەکان - MapEstate'
  },
  'settings.backToHome': {
    en: 'Back to Home',
    ar: 'العودة للرئيسية',
    kur: 'گەڕانەوە بۆ سەرەتا'
  },
  'settings.languageRegion': {
    en: 'Language & Region',
    ar: 'اللغة والمنطقة',
    kur: 'زمان و ناوچە'
  },
  'settings.language': {
    en: 'Language',
    ar: 'اللغة',
    kur: 'زمان'
  },
  'settings.currency': {
    en: 'Currency',
    ar: 'العملة',
    kur: 'دراو'
  },
  'settings.dateFormat': {
    en: 'Date Format',
    ar: 'تنسيق التاريخ',
    kur: 'شێوازی بەروار'
  },
  'settings.notifications': {
    en: 'Notifications',
    ar: 'الإشعارات',
    kur: 'ئاگاداریەکان'
  },
  'settings.emailNotifications': {
    en: 'Email Notifications',
    ar: 'إشعارات البريد الإلكتروني',
    kur: 'ئاگاداری ئیمەیڵ'
  },
  'settings.emailNotificationsDesc': {
    en: 'Receive updates via email',
    ar: 'تلقي التحديثات عبر البريد الإلكتروني',
    kur: 'وەرگرتنی نوێکردنەوە بە ئیمەیڵ'
  },
  'settings.pushNotifications': {
    en: 'Push Notifications',
    ar: 'الإشعارات الفورية',
    kur: 'ئاگاداری فوری'
  },
  'settings.pushNotificationsDesc': {
    en: 'Browser notifications',
    ar: 'إشعارات المتصفح',
    kur: 'ئاگاداری وێبگەڕ'
  },
  'settings.favoriteUpdates': {
    en: 'Favorite Property Updates',
    ar: 'تحديثات العقارات المفضلة',
    kur: 'نوێکردنەوەی خانووبەرە بەرگریکراوەکان'
  },
  'settings.favoriteUpdatesDesc': {
    en: 'Notify when favorite properties change',
    ar: 'تنبيه عند تغيير العقارات المفضلة',
    kur: 'ئاگادارکردنەوە کاتێک خانووبەرە بەرگریکراوەکان دەگۆڕێن'
  },
  'settings.priceAlerts': {
    en: 'Price Drop Alerts',
    ar: 'تنبيهات انخفاض الأسعار',
    kur: 'ئاگاداری دابەزینی نرخ'
  },
  'settings.priceAlertsDesc': {
    en: 'Alert when property prices drop',
    ar: 'تنبيه عند انخفاض أسعار العقارات',
    kur: 'ئاگادارکردنەوە کاتێک نرخی خانووبەرەکان دادەبەزێت'
  },
  'settings.displayPreferences': {
    en: 'Display Preferences',
    ar: 'تفضيلات العرض',
    kur: 'ویستی نیشاندان'
  },
  'settings.mapStyle': {
    en: 'Map Style',
    ar: 'نمط الخريطة',
    kur: 'شێوازی نەخشە'
  },
  'settings.showPropertyPrices': {
    en: 'Show Property Prices',
    ar: 'إظهار أسعار العقارات',
    kur: 'نیشاندانی نرخی خانووبەرەکان'
  },
  'settings.showPropertyPricesDesc': {
    en: 'Display prices on map markers',
    ar: 'عرض الأسعار على علامات الخريطة',
    kur: 'نیشاندانی نرخەکان لەسەر نیشانەکانی نەخشە'
  },
  'settings.showDistance': {
    en: 'Show Distance',
    ar: 'إظهار المسافة',
    kur: 'نیشاندانی مەودا'
  },
  'settings.showDistanceDesc': {
    en: 'Show distance from your location',
    ar: 'إظهار المسافة من موقعك',
    kur: 'نیشاندانی مەودا لە شوێنت'
  },
  'settings.autoZoom': {
    en: 'Auto Zoom to Results',
    ar: 'تكبير تلقائي للنتائج',
    kur: 'گەورەکردنەوەی خۆکارانە بۆ ئەنجامەکان'
  },
  'settings.autoZoomDesc': {
    en: 'Automatically zoom map to show search results',
    ar: 'تكبير الخريطة تلقائياً لإظهار نتائج البحث',
    kur: 'گەورەکردنەوەی نەخشە بە شێوەی خۆکارانە بۆ نیشاندانی ئەنجامی گەڕان'
  },
  'settings.cancel': {
    en: 'Cancel',
    ar: 'إلغاء',
    kur: 'هەڵوەشاندنەوە'
  },
  'settings.saveSettings': {
    en: 'Save Settings',
    ar: 'حفظ الإعدادات',
    kur: 'پاشەکەوتکردنی ڕێکخستنەکان'
  },
  'settings.settingsSaved': {
    en: 'Settings saved successfully!',
    ar: 'تم حفظ الإعدادات بنجاح!',
    kur: 'ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران!'
  },
  'settings.mapStyleDefault': {
    en: 'Default',
    ar: 'افتراضي',
    kur: 'بنەڕەتی'
  },
  'settings.mapStyleSatellite': {
    en: 'Satellite',
    ar: 'قمر صناعي',
    kur: 'هەواربەرە'
  },
  'settings.mapStyleTerrain': {
    en: 'Terrain',
    ar: 'تضاريس',
    kur: 'دۆزران'
  },
  'settings.profileInformation': {
    en: 'Profile Information',
    ar: 'معلومات الملف الشخصي',
    kur: 'زانیاری پڕۆفایل'
  },
  'settings.displayName': {
    en: 'Display Name',
    ar: 'اسم العرض',
    kur: 'ناوی نیشاندان'
  },
  'settings.displayNamePlaceholder': {
    en: 'Your name',
    ar: 'اسمك',
    kur: 'ناوت'
  },
  'settings.email': {
    en: 'Email',
    ar: 'البريد الإلكتروني',
    kur: 'ئیمەیڵ'
  },
  'settings.emailPlaceholder': {
    en: 'your.email@example.com',
    ar: 'your.email@example.com',
    kur: 'your.email@example.com'
  },
  'settings.phone': {
    en: 'Phone Number',
    ar: 'رقم الهاتف',
    kur: 'ژمارەی تەلەفۆن'
  },
  'settings.phonePlaceholder': {
    en: '+964 xxx xxx xxxx',
    ar: '+964 xxx xxx xxxx',
    kur: '+964 xxx xxx xxxx'
  },
  'settings.settingsPreferences': {
    en: 'Settings & Preferences',
    ar: 'الإعدادات والتفضيلات',
    kur: 'ڕێکخستن و ویستەکان'
  },
  'settings.settingsDescription': {
    en: 'Customize your profile, language, notifications, and display preferences.',
    ar: 'تخصيص ملفك الشخصي واللغة والإشعارات وتفضيلات العرض.',
    kur: 'دەستکاریکردنی پڕۆفایل، زمان، ئاگاداری و ویستی نیشاندان.'
  }
};

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'ar', 'kur'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
      // Apply document direction and language on initial load
      document.documentElement.dir = (savedLanguage === 'ar' || savedLanguage === 'kur') ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLanguage;
    }
  }, []);

  const changeLanguage = (lang: Language, persist: boolean = true) => {
    setLanguage(lang);
    if (persist) {
      localStorage.setItem('language', lang);
    }
    
    // Update document direction for RTL languages
    document.documentElement.dir = (lang === 'ar' || lang === 'kur') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return {
    language,
    changeLanguage,
    t,
    isRTL: language === 'ar' || language === 'kur'
  };
}
