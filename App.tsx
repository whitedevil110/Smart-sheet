import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { ExpensesSheet } from './components/ExpensesSheet';
import { PlanningTools } from './components/PlanningTools';
import { GeminiAdvisor } from './components/GeminiAdvisor';
import { FinancialProfile } from './types';
import { DEFAULT_INCOME, MOCK_EXPENSES, EXPENSE_CATEGORIES } from './constants';

const STORAGE_KEY_PROFILE = 'smartfinance_profile_v1';
const STORAGE_KEY_THEME = 'smartfinance_theme';
const STORAGE_KEY_AUTH = 'smartfinance_auth';

const App: React.FC = () => {
  // Initialize state from LocalStorage if available
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_AUTH);
    return stored === 'true';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    return stored === 'true';
  });
  
  const [profile, setProfile] = useState<FinancialProfile>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migration: Ensure new fields exist for older data
        if (!parsed.goals) parsed.goals = [];
        if (!parsed.budgets) parsed.budgets = {};
        return parsed;
      } catch (e) {
        console.error("Failed to parse stored profile", e);
      }
    }
    return {
      income: DEFAULT_INCOME,
      expenses: MOCK_EXPENSES,
      currency: 'USD',
      language: 'en-US',
      budgets: {},
      categories: EXPENSE_CATEGORIES,
      goals: []
    };
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTH, String(isAuthenticated));
  }, [isAuthenticated]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard'); // Reset tab on logout
  };
  
  const handleLogin = () => setIsAuthenticated(true);

  // Function passed to Layout to reset data
  const handleResetData = () => {
    if (window.confirm("Are you sure? This will delete all your expenses and settings. This cannot be undone.")) {
      const defaultProfile: FinancialProfile = {
        income: DEFAULT_INCOME,
        expenses: MOCK_EXPENSES,
        currency: 'USD',
        language: 'en-US',
        budgets: {},
        categories: EXPENSE_CATEGORIES,
        goals: []
      };
      setProfile(defaultProfile);
      // We don't reset auth or theme preference usually, but we could.
      alert("App data has been reset to defaults.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard profile={profile} setProfile={setProfile} />;
      case 'expenses':
        return <ExpensesSheet profile={profile} setProfile={setProfile} />;
      case 'planning':
        return <PlanningTools profile={profile} setProfile={setProfile} />;
      case 'advisor':
        return <GeminiAdvisor profile={profile} />;
      default:
        return <Dashboard profile={profile} setProfile={setProfile} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      onLogout={handleLogout}
      profile={profile}
      setProfile={setProfile}
      onResetData={handleResetData}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;