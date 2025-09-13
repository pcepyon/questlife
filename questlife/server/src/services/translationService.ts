import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TranslationCache {
  [locale: string]: {
    [namespace: string]: any;
  };
}

class TranslationService {
  private cache: TranslationCache = {};
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(
      __dirname,
      '..', '..', '..', 'client', 'public', 'locales'
    );
  }

  async loadTranslations(locale: string, namespace: string): Promise<any> {
    if (this.cache[locale]?.[namespace]) {
      return this.cache[locale][namespace];
    }

    try {
      const filePath = path.join(this.baseDir, locale, `${namespace}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const translations = JSON.parse(content);

      if (!this.cache[locale]) {
        this.cache[locale] = {};
      }
      this.cache[locale][namespace] = translations;

      return translations;
    } catch (error) {
      console.error(`Failed to load translations for ${locale}/${namespace}:`, error);
      return {};
    }
  }

  translate(translations: any, key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param]?.toString() || match;
      });
    }

    return value;
  }

  clearCache(): void {
    this.cache = {};
  }
}

export const translationService = new TranslationService();