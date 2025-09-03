import { useState, useEffect } from 'react';

type Language = 'en' | 'ar' | 'ku';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
    ku: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': {
    en: 'Home',
    ar: 'الرئيسية',
    ku: 'سەرەتا'
  },
  'nav.properties': {
    en: 'Properties',
    ar: 'العقارات',
    ku: 'خانووبەرە'
  },
  'nav.agents': {
    en: 'Agents',
    ar: 'الوكلاء',
    ku: 'بریکار'
  },
  'nav.about': {
    en: 'About',
    ar: 'حول',
    ku: 'دەربارە'
  },
  'nav.signIn': {
    en: 'Sign In',
    ar: 'تسجيل الدخول',
    ku: 'چوونەژوورەوە'
  },

  // Hero Section
  'hero.title': {
    en: 'Find Your Perfect Home with AI',
    ar: 'اعثر على منزلك المثالي بالذكاء الاصطناعي',
    ku: 'ماڵی تەواوی خۆت بە AI بدۆزەرەوە'
  },
  'hero.subtitle': {
    en: 'Discover properties tailored to your needs using intelligent recommendations',
    ar: 'اكتشف العقارات المصممة خصيصًا لاحتياجاتك باستخدام التوصيات الذكية',
    ku: 'خانووبەرەکان بدۆزەرەوە کە بە پێی پێداویستییەکانت داڕێژراون'
  },
  'hero.searchPlaceholder': {
    en: "Ask AI: 'Find me a 3-bedroom house under $200k near downtown'",
    ar: "اسأل الذكاء الاصطناعي: 'ابحث لي عن منزل بـ 3 غرف نوم تحت 200 ألف دولار بالقرب من وسط المدينة'",
    ku: "لە AI بپرسە: 'ماڵێکی 3 ژووری نوستن بدۆزەرەوە کە کەمتر لە 200 هەزار دۆلار بێت'"
  },
  'hero.search': {
    en: 'Search',
    ar: 'بحث',
    ku: 'گەڕان'
  },

  // Quick Filters
  'filter.forSale': {
    en: 'For Sale',
    ar: 'للبيع',
    ku: 'بۆ فرۆشتن'
  },
  'filter.forRent': {
    en: 'For Rent',
    ar: 'للإيجار',
    ku: 'بۆ کرێ'
  },
  'filter.houses': {
    en: 'Houses',
    ar: 'منازل',
    ku: 'ماڵەکان'
  },
  'filter.apartments': {
    en: 'Apartments',
    ar: 'شقق',
    ku: 'شوقەکان'
  },
  'filter.nearMe': {
    en: 'Near Me',
    ar: 'بالقرب مني',
    ku: 'نزیکی من'
  },

  // Property Details
  'property.beds': {
    en: 'Beds',
    ar: 'غرف نوم',
    ku: 'ژووری نوستن'
  },
  'property.baths': {
    en: 'Baths',
    ar: 'حمامات',
    ku: 'حەمام'
  },
  'property.sqft': {
    en: 'sq ft',
    ar: 'قدم مربع',
    ku: 'پێی چوارگۆشە'
  },
  'property.viewDetails': {
    en: 'View Details',
    ar: 'عرض التفاصيل',
    ku: 'بینینی وردەکارییەکان'
  },

  // Contact
  'contact.callNow': {
    en: 'Call Now',
    ar: 'اتصل الآن',
    ku: 'ئێستا پەیوەندی بکە'
  },
  'contact.sendMessage': {
    en: 'Send Message',
    ar: 'إرسال رسالة',
    ku: 'نامە بنێرە'
  },
  'contact.name': {
    en: 'Your Name',
    ar: 'اسمك',
    ku: 'ناوت'
  },
  'contact.email': {
    en: 'Your Email',
    ar: 'بريدك الإلكتروني',
    ku: 'ئیمەیڵت'
  },
  'contact.message': {
    en: 'Your Message',
    ar: 'رسالتك',
    ku: 'نامەکەت'
  },

  // Common
  'common.loading': {
    en: 'Loading...',
    ar: 'جاري التحميل...',
    ku: 'بارکردن...'
  },
  'common.error': {
    en: 'An error occurred',
    ar: 'حدث خطأ',
    ku: 'هەڵەیەک ڕوویدا'
  },
  'common.noResults': {
    en: 'No results found',
    ar: 'لا توجد نتائج',
    ku: 'هیچ ئەنجامێک نەدۆزرایەوە'
  }
};

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'ar', 'ku'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    
    // Update document direction for RTL languages
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return {
    language,
    changeLanguage,
    t,
    isRTL: language === 'ar'
  };
}
