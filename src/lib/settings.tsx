import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SystemSettings {
  // Institution Profile
  institutionName: string;
  tagline: string;
  logoUrl: string;
  
  // Financial Configuration
  currencyCode: string;
  currencySymbol: string;
  defaultInterestRate: number;
  minLoanAmount: number;
  maxLoanAmount: number;
  defaultLoanTerm: number;
  
  // Repayment Settings
  gracePeriodDays: number;
  lateFeePercentage: number;
  paymentReminderDays: number;
  
  // System Preferences
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  language: string;
  
  // Branding
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  paymentReminders: boolean;
  overdueAlerts: boolean;
}

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: SystemSettings = {
  // Institution Profile
  institutionName: 'Inuka Africa Limited',
  tagline: 'Making Growth Possible.',
  logoUrl: '/src/assets/images/Inuka-Africa-logo.png',
  
  // Financial Configuration
  currencyCode: 'KES',
  currencySymbol: 'KES',
  defaultInterestRate: 14,
  minLoanAmount: 10000,
  maxLoanAmount: 1000000,
  defaultLoanTerm: 12,
  
  // Repayment Settings
  gracePeriodDays: 7,
  lateFeePercentage: 5,
  paymentReminderDays: 3,
  
  // System Preferences
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  timezone: 'Africa/Nairobi',
  language: 'en',
  
  // Branding
  primaryColor: '#2E7542',
  secondaryColor: '#2E7B49',
  accentColor: '#E4332C',
  
  // Notifications
  emailNotifications: true,
  smsNotifications: true,
  paymentReminders: true,
  overdueAlerts: true,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('inuka_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
    return defaultSettings;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('inuka_settings', JSON.stringify(settings));
    
    // Update CSS variables for branding
    document.documentElement.style.setProperty('--color-brand-primary', settings.primaryColor);
    document.documentElement.style.setProperty('--color-brand-secondary', settings.secondaryColor);
    document.documentElement.style.setProperty('--color-brand-red', settings.accentColor);
  }, [settings]);

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('inuka_settings');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
