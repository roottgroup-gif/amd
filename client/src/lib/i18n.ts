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
  }
};

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'ar', 'kur'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    
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
