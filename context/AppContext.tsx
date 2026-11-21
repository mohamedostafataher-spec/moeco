import React, { createContext, useContext } from 'react';
import { Language, User, CarbonActivity } from '../types';

export interface AppContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
  t: (key: string) => string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  speak: (text: string) => void;
  trackCarbon: (activityType: string, sector: string, value: number, metadata?: any) => Promise<void>;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  userCountry: string;
  setUserCountry: (c: string) => void;
  appConfig: Record<string, any>;
  ads: any[];
  isRtl: boolean;
  refreshGlobalData: () => Promise<void>;
  appStrings: any[];
  openWebView: (url: string, title: string) => void;
  isFocusMode: boolean;
  setIsFocusMode: (v: boolean) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
