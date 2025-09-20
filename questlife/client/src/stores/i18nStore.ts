import { create } from 'zustand';
import i18n from 'i18next';

interface I18nStore {
  currentLocale: string;
  supportedLocales: string[];
  isLoading: boolean;
  
  setLocale: (locale: string) => void;
  toggleLocale: () => void;
  loadNamespace: (namespace: string) => Promise<void>;
  isNamespaceLoaded: (namespace: string) => boolean;
}

export const useI18nStore = create<I18nStore>((set, get) => ({
  currentLocale: i18n.language || 'ko',
  supportedLocales: ['ko', 'en'],
  isLoading: false,
  
  setLocale: async (locale: string) => {
    set({ isLoading: true });
    try {
      await i18n.changeLanguage(locale);
      localStorage.setItem('i18nextLng', locale);
      set({ currentLocale: locale });
    } finally {
      set({ isLoading: false });
    }
  },
  
  toggleLocale: async () => {
    const { currentLocale, supportedLocales, setLocale } = get();
    const currentIndex = supportedLocales.indexOf(currentLocale);
    const nextIndex = (currentIndex + 1) % supportedLocales.length;
    await setLocale(supportedLocales[nextIndex]);
  },
  
  loadNamespace: async (namespace: string) => {
    const { currentLocale } = get();
    if (!i18n.hasResourceBundle(currentLocale, namespace)) {
      set({ isLoading: true });
      try {
        await i18n.loadNamespaces(namespace);
      } finally {
        set({ isLoading: false });
      }
    }
  },
  
  isNamespaceLoaded: (namespace: string) => {
    const { currentLocale } = get();
    return i18n.hasResourceBundle(currentLocale, namespace);
  }
}));