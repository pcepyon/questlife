import { Request, Response, NextFunction } from 'express';

export interface LocaleRequest extends Request {
  locale?: string;
  acceptedLanguages?: string[];
}

export const localeMiddleware = (req: LocaleRequest, res: Response, next: NextFunction) => {
  const acceptLanguage = req.headers['accept-language'] || 'ko';
  const queryLocale = req.query.locale as string;
  const headerLocale = req.headers['x-locale'] as string;
  
  const supportedLocales = ['ko', 'en'];
  
  let locale = 'ko';
  
  if (queryLocale && supportedLocales.includes(queryLocale)) {
    locale = queryLocale;
  } else if (headerLocale && supportedLocales.includes(headerLocale)) {
    locale = headerLocale;
  } else {
    const acceptedLanguages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase())
      .filter(lang => supportedLocales.includes(lang.substring(0, 2)));
    
    if (acceptedLanguages.length > 0) {
      locale = acceptedLanguages[0].substring(0, 2);
    }
    
    req.acceptedLanguages = acceptedLanguages;
  }
  
  req.locale = locale;
  
  res.setHeader('Content-Language', locale);
  res.setHeader('X-Locale', locale);
  
  next();
};

export default localeMiddleware;