import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Receipt, PiggyBank, BrainCircuit, Settings, LogOut, Moon, Sun, Globe, Download, Upload, Database, MessageSquare, Star, X, Loader2, History, Trash2, RefreshCcw, HelpCircle, ChevronRight, Smartphone } from 'lucide-react';
import { FinancialProfile, Expense } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { logAction, getAuditLogs, AuditLogEntry, clearAuditLogs } from '../services/auditService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  profile: FinancialProfile;
  setProfile: React.Dispatch<React.SetStateAction<FinancialProfile>>;
  onResetData?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab,
  isDarkMode,
  toggleTheme,
  onLogout,
  profile,
  setProfile,
  onResetData
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback State
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Audit Log State
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Help/User Guide State
  const [showHelp, setShowHelp] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (showAuditLog) {
      setAuditLogs(getAuditLogs());
    }
  }, [showAuditLog]);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      logAction('APP_INSTALL', 'User accepted the install prompt');
    } else {
      logAction('APP_INSTALL_DISMISSED', 'User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowSettings(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses Sheet', icon: Receipt },
    { id: 'planning', label: 'Tax & SIPs', icon: PiggyBank },
    { id: 'advisor', label: 'AI Advisor', icon: BrainCircuit },
  ];

  const handleLanguageChange = (code: string) => {
    setProfile(prev => ({
      ...prev,
      language: code
    }));
    logAction('SETTINGS_CHANGE', `Language changed to ${code}`);
  };

  const handleLogout = () => {
    logAction('LOGOUT', 'User logged out');
    onLogout();
  };

  const handleExport = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const rows = profile.expenses.map(e => [e.date, `"${e.name.replace(/"/g, '""')}"`, e.category, e.amount]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `smartfinance_data_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    logAction('DATA_EXPORT', 'Exported transaction history to CSV');
    setShowSettings(false);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const newExpenses: Expense[] = [];
      const startIndex = lines[0]?.toLowerCase().includes('date') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 4) {
          const date = parts[0].trim();
          const name = parts[1].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
          const category = parts[2].trim();
          const amount = parseFloat(parts[3]);

          if (!isNaN(amount) && date) {
             newExpenses.push({
               id: Date.now().toString() + Math.random().toString().slice(2),
               date,
               name,
               category: category || 'Other',
               amount
             });
          }
        }
      }

      if (newExpenses.length > 0) {
        setProfile(prev => ({
          ...prev,
          expenses: [...newExpenses, ...prev.expenses]
        }));
        logAction('DATA_IMPORT', `Imported ${newExpenses.length} records from CSV`);
        alert(`Successfully imported ${newExpenses.length} transactions.`);
      } else {
        alert("No valid transactions found in file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowSettings(false);
    };
    reader.readAsText(file);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackRating === 0) {
      alert("Please select a rating star.");
      return;
    }
    setIsSubmittingFeedback(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmittingFeedback(false);
      setShowFeedback(false);
      setFeedbackRating(0);
      setFeedbackText('');
      setHoveredStar(0);
      logAction('FEEDBACK_SENT', `User sent feedback with rating ${feedbackRating}`);
      alert("Thank you for your feedback! We appreciate your input.");
    }, 1500);
  };

  const handleClearLogs = () => {
      if(window.confirm('Are you sure you want to clear the activity history?')) {
          clearAuditLogs();
          setAuditLogs([]);
      }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-slate-800'}`}>
      {/* Sidebar */}
      <aside className={`w-full md:w-64 border-r shadow-sm z-10 flex flex-col ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 flex items-center space-x-2 border-b pt-10 md:pt-6 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>SmartSheet</span>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : isDarkMode 
                      ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
                      : 'text-slate-500 hover:bg-gray-100 hover:text-slate-900'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50/50'}`}>
          <p className="text-xs text-center text-slate-400">Powered by Gemini 2.5 Flash</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        {/* Settings Button (Top Right) */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-full shadow-lg transition-all transform hover:scale-105 ${
                isDarkMode 
                  ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600' 
                  : 'bg-white text-slate-700 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <Settings size={20} className={showSettings ? 'animate-spin-slow' : ''} />
            </button>

            {/* Dropdown Menu */}
            {showSettings && (
              <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-2xl border transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 z-50 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
              }`}>
                <div className="p-3 space-y-2">
                  <div className={`px-2 py-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Preferences</div>
                  
                  {/* Theme Toggle */}
                  <button 
                    onClick={() => { toggleTheme(); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>

                   {/* Language Selector */}
                  <div className={`px-3 py-2 rounded-lg text-sm ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Globe size={18} />
                      <span>Language</span>
                    </div>
                    <select
                      value={profile.language || 'en-US'}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className={`w-full p-2 rounded-md text-xs border outline-none ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-600 text-white focus:border-indigo-500' 
                          : 'bg-white border-gray-200 text-slate-900 focus:border-indigo-500'
                      }`}
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Install App Button (Only if prompt is available) */}
                  {deferredPrompt && (
                    <>
                      <div className={`my-1 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}></div>
                      <button 
                        onClick={handleInstallClick}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20`}
                      >
                        <span className="flex items-center gap-3">
                          <Smartphone size={18} />
                          Install App
                        </span>
                      </button>
                    </>
                  )}

                  <div className={`my-1 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}></div>
                  <div className={`px-2 py-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Data Management</div>

                  {/* Import / Export */}
                   <button 
                    onClick={handleExport}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Download size={18} />
                      Export Data (CSV)
                    </span>
                  </button>
                  
                  <button 
                    onClick={handleImportClick}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Upload size={18} />
                      Import Data (CSV)
                    </span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    accept=".csv" 
                    className="hidden" 
                  />

                  {/* Audit Log */}
                  <button 
                    onClick={() => { setShowAuditLog(true); setShowSettings(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <History size={18} />
                      Activity Log
                    </span>
                  </button>

                  {/* Reset Data */}
                  {onResetData && (
                    <button 
                      onClick={() => { setShowSettings(false); onResetData(); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-red-500 ${
                        isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-red-50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <RefreshCcw size={18} />
                        Reset App Data
                      </span>
                    </button>
                  )}


                  <div className={`my-1 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}></div>
                  <div className={`px-2 py-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Support</div>

                  {/* Help / User Guide */}
                  <button 
                    onClick={() => { setShowHelp(true); setShowSettings(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle size={18} />
                      User Guide
                    </span>
                  </button>

                  <button 
                    onClick={() => { setShowFeedback(true); setShowSettings(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <MessageSquare size={18} />
                      Send Feedback
                    </span>
                  </button>

                  <div className={`my-1 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}></div>
                  
                  <button 
                    onClick={handleLogout}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-red-500 ${
                      isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-red-50'
                    }`}
                  >
                    <span className="flex items-center gap-3 font-medium">
                      <LogOut size={18} />
                      Log Out
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto p-4 md:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>

      {/* Backdrop for settings */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setShowSettings(false)}
        ></div>
      )}

      {/* User Guide Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
             <div className={`p-6 border-b flex justify-between items-center bg-indigo-600`}>
                <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <HelpCircle /> User Guide & Help
                   </h2>
                   <p className="text-indigo-100 text-sm">How to get the most out of SmartFinance</p>
                </div>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                >
                  <X size={24} />
                </button>
             </div>

             <div className={`flex-1 overflow-y-auto p-6 space-y-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                
                {/* Section: Dashboard */}
                <section>
                   <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                     <LayoutDashboard size={20} className="text-indigo-500" /> 1. Dashboard Overview
                   </h3>
                   <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'} space-y-3`}>
                      <p className="text-sm">The Dashboard gives you a real-time snapshot of your financial health.</p>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                         <li><strong>Summary Cards:</strong> See monthly income, expenses, and net savings at a glance.</li>
                         <li><strong>Income vs Expense:</strong> A health bar visualizes if you are living within your means.</li>
                         <li><strong>Budget Goals:</strong> Set spending limits for categories (e.g., Food, Travel). If you overspend, the bar turns red and alerts you.</li>
                         <li><strong>Charts:</strong> Use the interactive pie and bar charts to analyze where your money goes. Click legend items to filter categories.</li>
                      </ul>
                   </div>
                </section>

                {/* Section: Expenses Sheet */}
                <section>
                   <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                     <Receipt size={20} className="text-indigo-500" /> 2. Expenses Sheet
                   </h3>
                   <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'} space-y-3`}>
                      <p className="text-sm">This is where you manage your data. It acts like a smart spreadsheet.</p>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                         <li><strong>Income & Settings:</strong> Update your salary and select your preferred currency here.</li>
                         <li><strong>Manage Categories:</strong> Click "Manage Categories" to add new custom categories or reorder them via drag-and-drop.</li>
                         <li><strong>Add Expense:</strong> Enter date, description, amount, and category to log a transaction. You can log expenses in different currencies!</li>
                         <li><strong>Filtering:</strong> Use the search bar or dropdowns to find specific transactions.</li>
                      </ul>
                   </div>
                </section>

                 {/* Section: Planning Tools */}
                 <section>
                   <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                     <PiggyBank size={20} className="text-indigo-500" /> 3. Tax & Planning
                   </h3>
                   <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'} space-y-3`}>
                      <p className="text-sm">Tools to help you look ahead.</p>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                         <li><strong>Financial Goals:</strong> Create saving targets (e.g., "New Car"). The app tracks your progress and tells you how much to save monthly.</li>
                         <li><strong>SIP Calculator:</strong> See how your wealth can grow over 10 years based on your current savings rate.</li>
                         <li><strong>Tax Estimator:</strong> A simplified calculator to estimate your tax liability based on income brackets.</li>
                      </ul>
                   </div>
                </section>

                 {/* Section: AI Advisor */}
                 <section>
                   <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                     <BrainCircuit size={20} className="text-indigo-500" /> 4. AI Advisor
                   </h3>
                   <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'} space-y-3`}>
                      <p className="text-sm">Get personalized financial advice powered by Gemini 2.5.</p>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                         <li>Click <strong>"Generate Report"</strong> to let the AI analyze your spending patterns.</li>
                         <li>It identifies your highest expense categories and suggests specific tax-saving instruments for your region (e.g., 401k for US, 80C for India).</li>
                         <li>It provides actionable tips to optimize your savings rate.</li>
                      </ul>
                   </div>
                </section>

                 {/* Section: Settings */}
                 <section>
                   <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                     <Settings size={20} className="text-indigo-500" /> 5. Settings & Data
                   </h3>
                   <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'} space-y-3`}>
                      <p className="text-sm">Located in the top-right corner.</p>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                         <li><strong>Theme & Language:</strong> Switch between Dark/Light mode and change the display language.</li>
                         <li><strong>Import/Export:</strong> Download your data as a CSV file for backup, or import existing CSV data.</li>
                         <li><strong>Activity Log:</strong> View a history of actions taken within the app for security.</li>
                         <li><strong>Reset Data:</strong> Clear all data and start fresh (Caution: this cannot be undone).</li>
                      </ul>
                   </div>
                </section>
             </div>

             <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50'}`}>
               <button 
                 onClick={() => setShowHelp(false)}
                 className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
               >
                 Got it!
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
              <div>
                 <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Activity Log</h3>
                 <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Stored locally on this device</p>
              </div>
              <button 
                  onClick={() => setShowAuditLog(false)}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-slate-500'}`}
                >
                  <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1 space-y-3">
               {auditLogs.length === 0 ? (
                 <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <History size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No recent activity recorded.</p>
                 </div>
               ) : (
                 auditLogs.map((log, index) => (
                   <div key={index} className={`p-3 rounded-lg text-sm border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-gray-100'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{log.action}</span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      {log.details && (
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{log.details}</p>
                      )}
                   </div>
                 ))
               )}
            </div>

            <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-50 bg-gray-50'}`}>
               <button 
                 onClick={handleClearLogs}
                 className="flex items-center justify-center w-full px-4 py-2 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
               >
                 <Trash2 size={14} className="mr-2" />
                 Clear History
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>We value your feedback</h3>
                <button 
                  onClick={() => setShowFeedback(false)}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-slate-500'}`}
                >
                  <X size={20} />
                </button>
              </div>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Help us improve your financial planning experience.
              </p>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  How was your experience?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setFeedbackRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        size={32} 
                        className={`transition-colors ${
                          star <= (hoveredStar || feedbackRating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : isDarkMode ? 'text-slate-600' : 'text-slate-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Tell us more (Optional)
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What features would you like to see? found a bug?"
                  className={`w-full p-3 rounded-lg text-sm border focus:ring-2 focus:ring-indigo-500 outline-none transition-colors h-32 resize-none ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFeedback(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                      : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};