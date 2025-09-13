import { Response, NextFunction } from 'express';
import { LocaleRequest } from './locale.js';

interface LocalizedQuest {
  id: string;
  type: string;
  title: string;
  titleKo?: string;
  description: string;
  descriptionKo?: string;
  typeKo?: string;
  xp?: number;
  xpReward?: number;
  status: string;
  [key: string]: any;
}

interface LocalizedClass {
  id: string;
  name: string;
  nameKo?: string;
  description: string;
  descriptionKo?: string;
  level: number;
  xp: number;
  attributes?: {
    strength: number;
    strengthLabel?: string;
    wisdom: number;
    wisdomLabel?: string;
    creativity: number;
    creativityLabel?: string;
  };
  [key: string]: any;
}

const questTypeTranslations: Record<string, string> = {
  'daily': '일일 퀘스트',
  'weekly': '주간 퀘스트',
  'special': '특별 퀘스트',
  'monthly': '월간 퀘스트',
  'urgent': '긴급 퀘스트'
};

export function transformQuestResponse(quest: any, locale: string): LocalizedQuest {
  const transformed: LocalizedQuest = { ...quest };
  
  if (locale === 'ko') {
    transformed.titleKo = quest.titleKo || `${quest.title} (한국어)`;
    transformed.descriptionKo = quest.descriptionKo || quest.description;
    transformed.typeKo = questTypeTranslations[quest.type] || quest.type;
    
    if (!transformed.xp && transformed.xpReward) {
      transformed.xp = transformed.xpReward;
    }
  }
  
  return transformed;
}

export function transformClassResponse(characterClass: any, locale: string): LocalizedClass {
  const transformed: LocalizedClass = { ...characterClass };
  
  if (locale === 'ko') {
    transformed.nameKo = characterClass.nameKo || `${characterClass.name} (한국어)`;
    transformed.descriptionKo = characterClass.descriptionKo || characterClass.description;
    
    if (characterClass.attributes) {
      transformed.attributes = {
        ...characterClass.attributes,
        strengthLabel: '힘',
        wisdomLabel: '지혜',
        creativityLabel: '창의력'
      };
    }
  }
  
  return transformed;
}

export function responseTransformer(req: LocaleRequest, res: Response, next: NextFunction) {
  const originalJson = res.json;
  const locale = req.locale || 'ko';
  
  res.json = function(data: any) {
    if (req.path.includes('/quests')) {
      if (Array.isArray(data)) {
        data = data.map(quest => transformQuestResponse(quest, locale));
      } else if (data && typeof data === 'object' && data.id) {
        data = transformQuestResponse(data, locale);
      }
    } else if (req.path.includes('/classes')) {
      if (Array.isArray(data)) {
        data = data.map(cls => transformClassResponse(cls, locale));
      } else if (data && typeof data === 'object' && data.id) {
        data = transformClassResponse(data, locale);
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}