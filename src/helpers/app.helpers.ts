import { fallbackLanguage } from './util';

export const userLang = (user) => user && user.lang ? user.lang : fallbackLanguage;