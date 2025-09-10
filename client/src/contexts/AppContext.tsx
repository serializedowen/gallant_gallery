import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewType, Language } from '../types';
import i18n from '../services/i18n';

interface AppContextType {
  // View state
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  
  // Language state
  currentLanguage: Language;
  setCurrentLanguage: (lang: Language) => void;
  
  // Search state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Category state
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Translation function
  t: (key: string) => string;
  formatCount: (count: number, type: 'categories' | 'items' | 'images' | 'folders') => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('categories');
  const [currentLanguage, setCurrentLanguage] = useState<Language>(i18n.getCurrentLanguage());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to language changes
    const unsubscribe = i18n.subscribe((lang) => {
      setCurrentLanguage(lang);
    });

    return unsubscribe;
  }, []);

  const handleSetCurrentLanguage = (lang: Language) => {
    i18n.setLanguage(lang);
  };

  const value: AppContextType = {
    currentView,
    setCurrentView,
    currentLanguage,
    setCurrentLanguage: handleSetCurrentLanguage,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedItem,
    setSelectedItem,
    isLoading,
    setIsLoading,
    t: i18n.t.bind(i18n),
    formatCount: i18n.formatCount.bind(i18n),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
