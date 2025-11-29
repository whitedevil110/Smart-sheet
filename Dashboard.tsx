import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Sector, ReferenceLine, Brush, AreaChart, Area, LineChart, Line, CartesianGrid } from 'recharts';
import { FinancialProfile } from '../types';
import { getCurrencySymbol, convertCurrency } from '../constants';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Target, PenLine, Eye, EyeOff, AlertTriangle, CheckCircle, Shield, Activity, Info } from 'lucide-react';

interface DashboardProps {
  profile: FinancialProfile;
  setProfile: React.Dispatch<React.SetStateAction<FinancialProfile>>;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, setProfile }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  const currencySymbol = getCurrencySymbol(profile.currency);

  // Currency Normalization Logic
  // Convert all expenses to the profile's selected currency for accurate summation
  const totalMonthlyExpenses = profile.expenses.reduce((acc, curr) => {
    const amountInBase = convertCurrency(curr.amount, curr.currency || profile.currency, profile.currency);
    return acc + amountInBase;
  }, 0);

  const monthlyGross = (profile.income.grossAnnualSalary / 12) + (profile.income.otherIncome / 12);
  const monthlySavings = monthlyGross - totalMonthlyExpenses;
  const savingsRate = monthlyGross > 0 ? (monthlySavings / monthlyGross) * 100 : 0;

  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toLocaleString(profile.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const toggleCategory = (name: string) => {
    const newHidden = new Set(hiddenCategories);
    if (newHidden.has(name)) {
      newHidden.delete(name);
    } else {
      newHidden.add(name);
    }
    setHiddenCategories(newHidden);
    setActiveIndex(0); 
  };

  const usedCategories = new Set(profile.expenses.map(e => e.category));
  const allCategories = Array.from(new Set([...profile.categories, ...Array.from(usedCategories)]));

  const allChartData = allCategories.map(cat => ({
    name: cat,
    value: profile.expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + convertCurrency(e.amount, e.currency || profile.currency, profile.currency), 0)
  }))
  .filter(item => item.value > 0)
  .sort((a, b) => b.value - a.value);

  const visibleChartData = allChartData.filter(item => !hiddenCategories.has(item.name));

  const averageExpense = visibleChartData.length > 0 
    ? visibleChartData.reduce((a, b) => a + b.value, 0) / visibleChartData.length 
    : 0;

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#94a3b8', '#0ea5e9', '#d946ef', '#f43f5e', '#84cc16'];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

    return (
      <g>
        <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#64748b" className="text-xs font-medium uppercase tracking-wide dark:fill-slate-400">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={16} textAnchor="middle" fill="#1e293b" className="text-lg font-bold dark:fill-white">
          {currencySymbol}{value.toLocaleString(profile.language, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 10}
          outerRadius={outerRadius + 12}
          fill={fill}
        />
      </g>
    );
  };

  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 select-none px-4">
        {allChartData.map((entry, index) => {
          const isHidden = hiddenCategories.has(entry.name);
          const color = COLORS[index % COLORS.length]; 
          
          return (
            <div
              key={`legend-${index}`}
              onClick={() => toggleCategory(entry.name)}
              onMouseEnter={() => {
                if (!isHidden) {
                  const visibleIndex = visibleChartData.findIndex(d => d.name === entry.name);
                  if (visibleIndex !== -1) setActiveIndex(visibleIndex);
                }
              }}
              className={`flex items-center cursor-pointer transition-all duration-200 group ${
                isHidden ? 'opacity-40 grayscale' : 'opacity-100'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-2 shadow-sm" 
                style={{ backgroundColor: color }}
              />
              <span className={`text-xs font-medium ${isHidden ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                {entry.name}
              </span>
              {isHidden && <EyeOff size={10} className="ml-1.5 text-slate-400" />}
            </div>
          );
        })}
      </div>
    );
  };

  // Financial Health Calculation
  const expenseRatio = monthlyGross > 0 ? (totalMonthlyExpenses / monthlyGross) * 100 : 0;
  
  let healthStatus = { color: '', bg: '', label: '', message: '', icon: CheckCircle };
  
  if (expenseRatio > 100) {
    healthStatus = { 
        color: 'text-red-600 dark:text-red-400', 
        bg: 'bg-red-50 dark:bg-red-900/20',
        label: 'Critical', 
        message: 'Your expenses exceed your income. Immediate action required to cut costs.',
        icon: AlertTriangle
    };
  } else if (expenseRatio > 85) {
    healthStatus = { 
        color: 'text-orange-600 dark:text-orange-400', 
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        label: 'Vulnerable', 
        message: 'You are living paycheck to paycheck. Try to increase your savings buffer.',
        icon: AlertCircle
    };
  } else if (expenseRatio > 60) {
    healthStatus = { 
        color: 'text-blue-600 dark:text-blue-400', 
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        label: 'Healthy', 
        message: 'Your finances are balanced. Consider optimizing for investments.',
        icon: Shield
    };
  } else {
    healthStatus = { 
        color: 'text-green-600 dark:text-green-400', 
        bg: 'bg-green-50 dark:bg-green-900/20',
        label: 'Excellent', 
        message: 'You are a high saver! Excellent potential for wealth building.',
        icon: Wallet
    };
  }
  const HealthIcon = healthStatus.icon;

  // Prepare 6-month trend keys
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return {
        key: `${year}-${month}`,
        label: d.toLocaleString(profile.language === 'en-US' ? 'en-US' : 'en-US', { month: 'short' })
    };
  });

  // Calculate Multi-Currency trends
  const usedCurrencies = Array.from(new Set(profile.expenses.map(e => e.currency || profile.currency))) as string[];
  
  const trendChartData = last6Months.map(m => {
      const dataPoint: any = { name: m.label };
      usedCurrencies.forEach(curr => {
          dataPoint[curr] = profile.expenses
              .filter(e => e.date.startsWith(m.key) && (e.currency || profile.currency) === curr)
              .reduce((sum, e) => sum + e.amount, 0);
      });
      return dataPoint;
  });

  return (
    <div className="space-y-6">
      <header className="mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Overview</h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time tracking of your wealth.</p>
        </div>
        <div className="hidden md:flex items-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
           <Info size={12} className="mr-1" />
           Displaying totals in {profile.currency}
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col transition-colors">
          <span className="text-slate-400 dark:text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Monthly Income</span>
          <div className="flex items-center space-x-3 mt-auto">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <TrendingUp size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(monthlyGross)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col transition-colors">
          <span className="text-slate-400 dark:text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Total Expenses</span>
          <div className="flex items-center space-x-3 mt-auto">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
              <TrendingDown size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalMonthlyExpenses)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col transition-colors">
          <span className="text-slate-400 dark:text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Net Savings</span>
          <div className="flex items-center space-x-3 mt-auto">
            <div className={`p-2 rounded-lg ${monthlySavings >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
              <Wallet size={24} />
            </div>
            <span className={`text-2xl font-bold ${monthlySavings >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              {monthlySavings < 0 ? '-' : ''}{formatCurrency(Math.abs(monthlySavings))}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col transition-colors">
          <span className="text-slate-400 dark:text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Savings Rate</span>
          <div className="flex items-center space-x-3 mt-auto">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <AlertCircle size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{savingsRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Income Ratio Analysis Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${healthStatus.bg} ${healthStatus.color}`}>
                    <HealthIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Income vs Expense Ratio</h3>
                    <p className={`text-sm font-semibold ${healthStatus.color}`}>{healthStatus.label} Financial Health</p>
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed pl-1">
                  {healthStatus.message}
              </p>
            </div>
            
            <div className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-3 text-slate-500 dark:text-slate-400">
                  <span>Expenses ({expenseRatio.toFixed(0)}%)</span>
                  <span>Income Capacity</span>
              </div>
              
              <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${expenseRatio > 100 ? 'bg-red-500' : expenseRatio > 85 ? 'bg-orange-500' : expenseRatio > 60 ? 'bg-blue-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min(expenseRatio, 100)}%` }}
                  ></div>
                   {expenseRatio > 100 && (
                       <div className="h-full bg-red-700 w-full animate-pulse stripes-opacity-20"></div>
                   )}
              </div>

              <div className="flex justify-between text-xs mt-3 text-slate-400 dark:text-slate-500 font-mono">
                  <span>{formatCurrency(totalMonthlyExpenses)} spent</span>
                  <span>{formatCurrency(monthlyGross)} earned</span>
              </div>
            </div>
        </div>
      </div>

      {/* Budget Goals Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center space-x-2 mb-6">
          <Target className="text-indigo-600 dark:text-indigo-400" size={24} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Monthly Budget Goals</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {profile.categories.map(category => {
            // Calculate spent using currency conversion
            const spent = profile.expenses
              .filter(e => e.category === category)
              .reduce((sum, e) => sum + convertCurrency(e.amount, e.currency || profile.currency, profile.currency), 0);
            
            const budget = profile.budgets?.[category] || 0;
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;
            const isOverBudget = percentage > 100;
            
            // Trend Calculation for Sparkline
            const trendData = last6Months.map(m => ({
                name: m.label,
                value: profile.expenses
                    .filter(e => e.category === category && e.date.startsWith(m.key))
                    .reduce((sum, e) => sum + convertCurrency(e.amount, e.currency || profile.currency, profile.currency), 0)
            }));
            
            const totalTrendValue = trendData.reduce((acc, curr) => acc + curr.value, 0);
            const avgTrend = totalTrendValue / 6;
            const lastMonthVal = trendData[5].value;
            const isTrendingUp = lastMonthVal > avgTrend;
            const trendColor = totalTrendValue === 0 ? '#94a3b8' : isTrendingUp ? '#ef4444' : '#10b981';
            const trendFill = totalTrendValue === 0 ? '#f1f5f9' : isTrendingUp ? '#fee2e2' : '#d1fae5';

            let progressColor = 'bg-green-500';
            let textColor = 'text-green-600 dark:text-green-400';
            
            if (isOverBudget) {
              progressColor = 'bg-red-500 animate-pulse';
              textColor = 'text-red-600 dark:text-red-400';
            } else if (percentage > 80) {
              progressColor = 'bg-yellow-500';
              textColor = 'text-yellow-600 dark:text-yellow-400';
            } else if (budget === 0) {
              progressColor = 'bg-slate-200 dark:bg-slate-600';
              textColor = 'text-slate-500 dark:text-slate-400';
            }

            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                        {category}
                        {isOverBudget && <AlertTriangle size={14} className="ml-2 text-red-500 animate-bounce" />}
                    </span>
                    {/* Sparkline Indicator */}
                    <div className="ml-3 h-6 w-16 hidden sm:block">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={trendColor} 
                                    fill={trendFill} 
                                    strokeWidth={1.5}
                                    fillOpacity={0.4}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold ${textColor}`}>
                      {formatCurrency(spent)} <span className="text-slate-400 dark:text-slate-600 font-normal">/</span>
                    </span>
                    <div className="relative w-24">
                      <input 
                        type="number"
                        placeholder="Limit"
                        className="w-full text-right text-xs p-1 border border-slate-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        value={budget || ''}
                        onChange={(e) => handleBudgetChange(category, e.target.value)}
                      />
                      {budget === 0 && (
                        <PenLine size={10} className="absolute left-1 top-1.5 text-slate-300 dark:text-slate-500 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${progressColor} transition-all duration-500`} 
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>{percentage.toFixed(0)}% used</span>
                  <span className={isOverBudget ? 'font-bold text-red-500 dark:text-red-400' : ''}>
                    {isOverBudget ? `Over by ${formatCurrency(spent - budget)}` : 'Remaining: ' + formatCurrency(Math.max(0, budget - spent))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[500px] flex flex-col transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Expense Breakdown</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Interactive view of your spending distribution.</p>
            </div>
            {hiddenCategories.size > 0 && (
              <button 
                onClick={() => setHiddenCategories(new Set())}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded"
              >
                <Eye size={12} className="mr-1" /> Show All
              </button>
            )}
          </div>
          
          <div className="flex-1 relative">
            {visibleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={visibleChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    stroke="none"
                  >
                    {visibleChartData.map((entry, index) => {
                      const originalIndex = allChartData.findIndex(item => item.name === entry.name);
                      return <Cell key={`cell-${index}`} fill={COLORS[originalIndex % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    content={renderLegend} 
                    verticalAlign="bottom" 
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-4">
                 <EyeOff size={48} className="text-slate-300 dark:text-slate-600" />
                 <p>All categories hidden or no data available.</p>
                 <Legend content={renderLegend} verticalAlign="bottom" />
               </div>
            )}
          </div>
        </div>

        {/* Category Comparison Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[500px] flex flex-col transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Category Analysis</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Spending vs Average (Drag slider to zoom).</p>
          
          <div className="flex-1">
            {visibleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={visibleChartData} barSize={40} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={60}
                    tick={(props) => {
                       const { x, y, payload } = props;
                       return (
                         <g transform={`translate(${x},${y})`}>
                           <text x={0} y={0} dy={16} textAnchor="end" fill="#94a3b8" fontSize={10} transform="rotate(-35)">{payload.value}</text>
                         </g>
                       );
                    }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${currencySymbol}${val}`}
                  />
                  <Tooltip 
                     cursor={{fill: '#f1f5f9'}}
                     formatter={(value: number) => formatCurrency(value)}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]} onMouseEnter={onPieEnter}>
                    {visibleChartData.map((entry, index) => {
                       const originalIndex = allChartData.findIndex(item => item.name === entry.name);
                       return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === activeIndex ? COLORS[originalIndex % COLORS.length] : `${COLORS[originalIndex % COLORS.length]}90`} 
                          stroke={index === activeIndex ? '#fff' : 'none'}
                          strokeWidth={2}
                        />
                       );
                    })}
                  </Bar>
                  <ReferenceLine 
                    y={averageExpense} 
                    stroke="#f59e0b" 
                    strokeDasharray="3 3" 
                    label={{ position: 'top', value: 'Avg', fill: '#f59e0b', fontSize: 12, fontWeight: 600 }} 
                  />
                  <Brush 
                    dataKey="name" 
                    height={30} 
                    stroke="#6366f1"
                    fill="#e0e7ff"
                    tickFormatter={() => ''}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                No data to display.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Currency Spending Trend */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center space-x-2 mb-6">
           <Activity className="text-indigo-600 dark:text-indigo-400" size={24} />
           <h3 className="text-lg font-bold text-slate-800 dark:text-white">Multi-Currency Spending Trends</h3>
        </div>
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#64748b' }}
                        formatter={(val: number, name: string) => [`${getCurrencySymbol(name)}${val.toLocaleString(profile.language, { minimumFractionDigits: 2 })}`, name]}
                    />
                    <Legend />
                    {usedCurrencies.map((curr, index) => (
                        <Line 
                            key={curr}
                            type="monotone" 
                            dataKey={curr} 
                            name={curr}
                            stroke={COLORS[index % COLORS.length]} 
                            strokeWidth={3} 
                            dot={{r: 4, fill: COLORS[index % COLORS.length], strokeWidth: 2, stroke: '#fff'}} 
                            activeDot={{r: 6, strokeWidth: 0}}
                            animationDuration={1500}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};