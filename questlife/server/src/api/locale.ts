import { Router, Response } from 'express';
import { LocaleRequest } from '../middleware/locale.js';

const router = Router();

interface LocaleConfig {
  locale: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    currency: string;
  };
  direction: 'ltr' | 'rtl';
}

const localeConfigs: Record<string, LocaleConfig> = {
  ko: {
    locale: 'ko',
    language: 'Korean',
    dateFormat: 'yyyy년 MM월 dd일',
    timeFormat: 'HH시 mm분',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: '₩'
    },
    direction: 'ltr'
  },
  en: {
    locale: 'en',
    language: 'English',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: '$'
    },
    direction: 'ltr'
  }
};

router.get('/locale', (req: LocaleRequest, res: Response) => {
  const locale = req.locale || 'ko';
  const config = localeConfigs[locale] || localeConfigs.ko;
  res.json(config);
});

export default router;