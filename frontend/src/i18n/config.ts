import it from './locales/it.json';

export const defaultLocale = 'it';
export const supportedLocales = ['it', 'en'];

// Simple deep lookup utility
function resolvePath(obj: any, path: string): string | undefined {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
}

export function useTranslation() {
  // In Phase 1, we hardcode Italian
  const dictionary = it;

  return (key: string): string => {
    const value = resolvePath(dictionary, key);
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return value;
  };
}

export function getCurrentLocale() {
  return 'it';
}
