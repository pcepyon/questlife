import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';

export const formatDate = (date: Date | string, formatStr: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

export const formatDateRelative = (date: Date | string, baseDate: Date = new Date()): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const days = Math.floor((baseDate.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  return formatKoreanDate(dateObj);
};

export const formatDateDistance = (date: Date | string, baseDate: Date = new Date()): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const minutes = Math.floor((baseDate.getTime() - dateObj.getTime()) / (1000 * 60));
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
};

export const formatKoreanDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy년 MM월 dd일');
};

export const formatKoreanDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy년 MM월 dd일 HH시 mm분');
};

export const formatKoreanShortDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MM/dd');
};