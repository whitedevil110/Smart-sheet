import React, { useState, useRef } from 'react';
import { Plus, DollarSign, Settings, ArrowUpDown, ArrowUp, ArrowDown, Filter, Tag, X, Target, Download, Upload, Search, Calendar, GripVertical, AlertCircle, AlertTriangle } from 'lucide-react';
import { FinancialProfile, Expense, ExpenseCategory, Income } from '../types';
import { getCurrencySymbol, CURRENCY_MAP, CURRENCY_NAMES } from '../constants';
import { logAction } from '../services/auditService';

interface ExpensesSheetProps {
  profile: FinancialProfile;
  setProfile: React.Dispatch<React.SetStateAction<FinancialProfile>>;
}

type SortKey = keyof Expense;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export const ExpensesSheet: React.FC<ExpensesSheetProps> = ({ profile, setProfile }) => {
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    name: '',
    amount: 0,
    category: profile.categories[0] || 'Other',
    date: new Date().toISOString().split('T')[0],
    currency: profile.currency
  });

  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sorting and Filtering State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLast7Days, setShowLast7Days] = useState(false);

  const currencySymbol = getCurrencySymbol(profile.currency);

  const handleIncomeChange = (field: keyof Income, value: string) => {
    const numValue = parseFloat(value) || 0;
    setProfile(prev => ({
      ...prev,
      income: {
        ...prev.income,
        [field]: numValue
      }
    }));
  };

  const handleCurrencyChange = (currency: string) => {
    setProfile(prev => ({
      ...prev,
      currency
    }));
    // Also update new expense default currency
    setNewExpense(prev => ({ ...prev, currency }));
    logAction('PROFILE_UPDATE', `Currency changed to ${currency}`);
  };

  const handleBudgetChange = (category: string, value: string) => {
    const numValue = parseFloat(value);
    setProfile(prev => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [category]: isNaN(numValue) ? 0 : numValue
      }
    }));
  };

  const addExpense = () => {
    if (!newExpense.name || !newExpense.amount) return;
    
    const expense: Expense = {
      id: Date.now().toString(),
      name: newExpense.name,
      amount: Number(newExpense.amount),
      category: newExpense.category || 'Other',
      date: newExpense.date || new Date().toISOString().split('T')[0],
      currency: newExpense.currency || profile.currency
    };

    setProfile(prev => ({
      ...prev,
      expenses: [expense, ...prev.expenses]
    }));

    setNewExpense({
      name: '',
      amount: 0,
      category: profile.categories[0] || 'Other',
      date: new Date().toISOString().split('T')[0],
      currency: profile.currency
    });
  };

  const validateCategory = (name: string) => {
    if (!name.trim()) return "Category name cannot be empty";
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) return "Only letters and numbers allowed";
    if (profile.categories.includes(name.trim())) return "Category already exists";
    return "";
  };

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewCategory(val);
    if (val) {
        const error = validateCategory(val);
        setCategoryError(error);
    } else {
        setCategoryError('');
    }
  };

  const addCategory = () => {
    const error = validateCategory(newCategory);
    if (error) {
        setCategoryError(error);
        return;
    }

    if (newCategory) {
      setProfile(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
      setCategoryError('');
      logAction('PROFILE_UPDATE', `Added category: ${newCategory}`);
    }
  };

  const removeCategory = (catToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== catToRemove)
    }));
    logAction('PROFILE_UPDATE', `Removed category: ${catToRemove}`);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    
    if (dragIndex === dropIndex) return;

    const newCategories = [...profile.categories];
    const [draggedItem] = newCategories.splice(dragIndex, 1);
    newCategories.splice(dropIndex, 0, draggedItem);

    setProfile(prev => ({ ...prev, categories: newCategories }));
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency'];
    const rows = profile.expenses.map(e => [
      e.date, 
      `"${e.name.replace(/"/g, '""')}"`, 
      e.category, 
      e.amount,
      e.currency || profile.currency
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    logAction('DATA_EXPORT', 'Exported transactions via Sheet');
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
          const currency = parts[4]?.trim() || profile.currency;

          if (!isNaN(amount) && date) {
             newExpenses.push({
               id: Date.now().toString() + Math.random().toString().slice(2),
               date,
               name,
               category: category || 'Other',
               amount,
               currency
             });
          }
        }
      }

      if (newExpenses.length > 0) {
        setProfile(prev => ({
          ...prev,
          expenses: [...newExpenses, ...prev.expenses]
        }));
        logAction('DATA_IMPORT', `Imported ${newExpenses.length} records via Sheet`);
        alert(`Successfully imported ${newExpenses.length} transactions.`);
      } else {
        alert("No valid transactions found in file.");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Filter and Sort Logic
  const processedExpenses = [...profile.expenses]
    .filter(expense => {
      const matchesCategory = filterCategory === 'ALL' || expense.category === filterCategory;
      const matchesSearch = expense.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesDate = true;
      if (showLast7Days) {
         try {
             const [year, month, day] = expense.date.split('-').map(Number);
             const expenseDate = new Date(year, month - 1, day);
             
             const today = new Date();
             today.setHours(23, 59, 59, 999);
             
             const sevenDaysAgo = new Date();
             sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
             sevenDaysAgo.setHours(0, 0, 0, 0);

             matchesDate = expenseDate >= sevenDaysAgo && expenseDate <= today;
         } catch (e) {
             matchesDate = true; // Fallback
         }
      }

      return matchesCategory && matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-slate-300 dark:text-slate-600" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-indigo-600 dark:text-indigo-400" />
      : <ArrowDown size={14} className="ml-1 text-indigo-600 dark:text-indigo-400" />;
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Data Sheet</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your income, currency, and expenses.</p>
      </header>

      {/* Income & Settings Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Income & Settings
            </h2>
            <div className="flex flex-wrap gap-2">
              <button 
                  onClick={() => { setShowBudgetManager(!showBudgetManager); setShowCategoryManager(false); }}
                  className={`text-sm font-medium flex items-center transition-colors ${showBudgetManager ? 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              >
                  <Target size={16} className="mr-1.5" />
                  {showBudgetManager ? 'Hide Limits' : 'Set Limits'}
              </button>
              <button 
                  onClick={() => { setShowCategoryManager(!showCategoryManager); setShowBudgetManager(false); }}
                  className={`text-sm font-medium flex items-center transition-colors ${showCategoryManager ? 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              >
                  <Tag size={16} className="mr-1.5" />
                  {showCategoryManager ? 'Hide Categories' : 'Manage Categories'}
              </button>
               {/* Import/Export Buttons */}
               <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1 self-center hidden md:block"></div>
               <button 
                  onClick={handleExport}
                  className="text-sm font-medium flex items-center transition-colors text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5"
                  title="Export to CSV"
              >
                  <Download size={16} className="mr-1.5" />
                  Export
              </button>
              <button 
                  onClick={handleImportClick}
                  className="text-sm font-medium flex items-center transition-colors text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5"
                  title="Import from CSV"
              >
                  <Upload size={16} className="mr-1.5" />
                  Import
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                accept=".csv" 
                className="hidden" 
              />
            </div>
        </div>

        {/* Category Manager */}
        {showCategoryManager && (
            <div className="mb-6 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Custom Categories</label>
                <div className="flex gap-2 mb-2">
                    <input 
                        type="text" 
                        value={newCategory}
                        onChange={handleCategoryInputChange}
                        placeholder="New category name (e.g., Subscriptions)"
                        className={`flex-1 px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white ${categoryError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-600'}`}
                        onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    />
                    <button 
                        onClick={addCategory}
                        disabled={!!categoryError || !newCategory}
                        className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </div>
                {categoryError && (
                    <div className="flex items-center text-xs text-red-500 mb-3">
                        <AlertCircle size={12} className="mr-1" />
                        {categoryError}
                    </div>
                )}
                
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide font-semibold">
                    Drag to reorder
                </p>

                <div className="flex flex-wrap gap-2">
                    {profile.categories.map((cat, index) => (
                        <div 
                            key={cat} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            className="inline-flex items-center pl-1.5 pr-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-sm cursor-move hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                        >
                            <GripVertical size={12} className="text-slate-400 mr-1" />
                            {cat}
                            <button 
                                onClick={() => removeCategory(cat)}
                                className="ml-1.5 text-slate-400 hover:text-red-500 p-0.5 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Budget Manager (Spending Limits) */}
        {showBudgetManager && (
          <div className="mb-6 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900 animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Target size={18} />
                  Monthly Budget Goals & Limits
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">Set limits to track in Dashboard</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {profile.categories.map(cat => {
                   // Calculate current spend for this category
                   const spent = profile.expenses
                      .filter(e => e.category === cat)
                      .reduce((sum, e) => sum + e.amount, 0);
                   const budget = profile.budgets?.[cat] || 0;
                   const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                   const isOverBudget = percentage > 100;
                   const isWarning = percentage > 80 && !isOverBudget;
                   
                   return (
                    <div key={cat} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                       <div className="flex justify-between items-start mb-1.5">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{cat}</label>
                          <span className={`text-[10px] ${isOverBudget ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                             {currencySymbol}{spent.toLocaleString()} spent
                          </span>
                       </div>
                       
                       <div className="relative mb-2">
                          <span className="absolute left-2.5 top-1.5 text-slate-400 dark:text-slate-500 text-xs">{currencySymbol}</span>
                          <input 
                            type="number"
                            value={profile.budgets?.[cat] || ''}
                            placeholder="Set Limit"
                            onChange={(e) => handleBudgetChange(cat, e.target.value)}
                            className="w-full pl-6 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
                          />
                       </div>

                       {/* Progress Bar within input area */}
                       {budget > 0 && (
                         <div className="space-y-1">
                             <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : isWarning ? 'bg-orange-400' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></div>
                             </div>
                             <div className="flex justify-between text-[10px] text-slate-400">
                                 <span>{percentage.toFixed(0)}%</span>
                                 {isOverBudget && <AlertTriangle size={10} className="text-red-500" />}
                             </div>
                         </div>
                       )}
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Currency</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                <Settings size={16} />
              </span>
              <select
                value={profile.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-900 dark:text-white"
              >
                {Object.keys(CURRENCY_MAP).map((code) => (
                  <option key={code} value={code}>
                    {code} - {CURRENCY_NAMES[code] || code} ({CURRENCY_MAP[code]})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Gross Annual Salary</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 font-bold text-sm">{currencySymbol}</span>
              <input
                type="number"
                value={profile.income.grossAnnualSalary}
                onChange={(e) => handleIncomeChange('grossAnnualSalary', e.target.value)}
                onBlur={() => logAction('PROFILE_UPDATE', 'Gross Annual Salary updated')}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Other Annual Income</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 font-bold text-sm">{currencySymbol}</span>
              <input
                type="number"
                value={profile.income.otherIncome}
                onChange={(e) => handleIncomeChange('otherIncome', e.target.value)}
                onBlur={() => logAction('PROFILE_UPDATE', 'Other Annual Income updated')}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Sheet */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Monthly Expenses Log</h2>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Total: <span className="font-bold text-slate-900 dark:text-white">{currencySymbol}{processedExpenses.reduce((a, b) => a + b.amount, 0).toLocaleString(profile.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              {showLast7Days && <span className="ml-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">(Last 7 Days)</span>}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center">
             {/* Search Bar */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-full sm:w-48 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              />
            </div>
            
            {/* Quick Filter: Last 7 Days */}
             <button
                onClick={() => setShowLast7Days(!showLast7Days)}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap w-full sm:w-auto justify-center ${
                    showLast7Days 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Calendar size={14} className="mr-1.5" />
                Last 7 Days
              </button>

            {/* Filter Dropdown */}
            <div className="flex items-center space-x-2 pl-2 border-l border-gray-200 dark:border-slate-700 w-full sm:w-auto">
              <Filter size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-2 pr-8 py-1.5 w-full sm:w-auto bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories</option>
                {profile.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add New Row */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-4 items-end transition-colors">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Description</label>
            <input
              type="text"
              placeholder="e.g. Utility Bill"
              value={newExpense.name}
              onChange={(e) => setNewExpense(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={newExpense.amount || ''}
              onChange={(e) => setNewExpense(p => ({ ...p, amount: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
           <div className="md:col-span-2">
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Currency</label>
             <select
               value={newExpense.currency || profile.currency}
               onChange={(e) => setNewExpense(p => ({ ...p, currency: e.target.value }))}
               className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
             >
               {Object.keys(CURRENCY_MAP).map((code) => (
                 <option key={code} value={code}>{code} ({CURRENCY_MAP[code]})</option>
               ))}
             </select>
          </div>
          <div className="md:col-span-2">
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Category</label>
             <select
               value={newExpense.category}
               onChange={(e) => setNewExpense(p => ({ ...p, category: e.target.value }))}
               className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
             >
               {profile.categories.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
               ))}
             </select>
          </div>
           <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Date</label>
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense(p => ({ ...p, date: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
          <div className="md:col-span-1">
            <button
              onClick={addExpense}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-gray-100 dark:border-slate-700">
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors select-none group"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date <SortIcon columnKey="date" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th 
                  className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors select-none group"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end">
                    Amount <SortIcon columnKey="amount" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {processedExpenses.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    {profile.expenses.length === 0 
                      ? "No expenses added yet. Add one above." 
                      : "No expenses found matching the selected filters."}
                  </td>
                </tr>
              )}
              {processedExpenses.map((expense) => {
                 const expCurrency = expense.currency || profile.currency;
                 const expSymbol = getCurrencySymbol(expCurrency);
                 return (
                    <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">{expense.date}</td>
                      <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium text-sm">
                        {expense.name} 
                        <span className="ml-2 inline-block px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-300">
                            {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-800 dark:text-white font-bold text-sm text-right">
                        {expSymbol}{expense.amount.toLocaleString(profile.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">{expCurrency}</span>
                      </td>
                    </tr>
                 )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
