import React, { useState, useEffect } from 'react';
import { FinancialProfile, SavingsGoal } from '../types';
import { getCurrencySymbol } from '../constants';
import { TrendingUp, ShieldAlert, Target, Calculator, RefreshCw, Plus, Trash2, Edit2, Check, X, Calendar, Plane, Home, Car, GraduationCap, Smartphone, Shield, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { logAction } from '../services/auditService';

interface PlanningToolsProps {
  profile: FinancialProfile;
  setProfile?: React.Dispatch<React.SetStateAction<FinancialProfile>>;
}

const GOAL_CATEGORIES = [
  { id: 'Emergency', label: 'Emergency Fund', icon: Shield, color: 'bg-red-500' },
  { id: 'Travel', label: 'Travel', icon: Plane, color: 'bg-blue-500' },
  { id: 'Home', label: 'Housing', icon: Home, color: 'bg-indigo-500' },
  { id: 'Vehicle', label: 'Car/Vehicle', icon: Car, color: 'bg-orange-500' },
  { id: 'Education', label: 'Education', icon: GraduationCap, color: 'bg-green-500' },
  { id: 'Gadget', label: 'Tech/Gadgets', icon: Smartphone, color: 'bg-purple-500' },
  { id: 'Investment', label: 'Investment', icon: TrendingUp, color: 'bg-teal-500' },
  { id: 'Other', label: 'Other', icon: Star, color: 'bg-gray-500' },
];

export const PlanningTools: React.FC<PlanningToolsProps> = ({ profile, setProfile }) => {
  const currencySymbol = getCurrencySymbol(profile.currency);

  // SIP Calculations based on Profile Real Data
  const monthlyGross = (profile.income.grossAnnualSalary / 12) + (profile.income.otherIncome / 12);
  const totalMonthlyExpenses = profile.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlySavings = Math.max(0, monthlyGross - totalMonthlyExpenses);
  
  const sipAmount = monthlySavings * 0.5; 
  const annualRate = 0.12;
  const monthlyRate = annualRate / 12;
  const years = 10;
  const months = years * 12;
  
  const futureValue = sipAmount * (Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate) / monthlyRate;
  const investedAmount = sipAmount * months;
  const wealthGain = futureValue - investedAmount;

  const projectionData = [
    { name: 'Invested', amount: Math.round(investedAmount) },
    { name: 'Wealth Gain', amount: Math.round(wealthGain) },
    { name: 'Total Value', amount: Math.round(futureValue) },
  ];

  // Tax Estimator State - Interactive Simulation
  const [taxInput, setTaxInput] = useState({
    salary: profile.income.grossAnnualSalary,
    other: profile.income.otherIncome
  });

  // Goals State
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<SavingsGoal>>({
    name: '',
    targetAmount: 0,
    savedAmount: 0,
    deadline: '',
    category: 'Other'
  });

  // Sync state if profile updates externally
  useEffect(() => {
    setTaxInput({
      salary: profile.income.grossAnnualSalary,
      other: profile.income.otherIncome
    });
  }, [profile.income]);

  // Tax Calculation Logic (Simplified Progressive Brackets)
  const simulatedAnnualIncome = (taxInput.salary || 0) + (taxInput.other || 0);
  let tax = 0;
  let remainingIncome = simulatedAnnualIncome;
  
  // Generic progressive tax logic for estimation
  if (remainingIncome > 80000) {
      tax += (remainingIncome - 80000) * 0.30;
      remainingIncome = 80000;
  }
  if (remainingIncome > 40000) {
      tax += (remainingIncome - 40000) * 0.20;
      remainingIncome = 40000;
  }
  if (remainingIncome > 10000) {
      tax += (remainingIncome - 10000) * 0.10;
  }

  const netAnnual = simulatedAnnualIncome - tax;
  const effectiveRate = simulatedAnnualIncome > 0 ? ((tax / simulatedAnnualIncome) * 100) : 0;

  // Goals Logic
  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !setProfile) return;

    const categoryDef = GOAL_CATEGORIES.find(c => c.id === newGoal.category) || GOAL_CATEGORIES[7];

    const goal: SavingsGoal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: Number(newGoal.targetAmount),
      savedAmount: Number(newGoal.savedAmount) || 0,
      deadline: newGoal.deadline || '',
      category: newGoal.category as any,
      icon: newGoal.category || 'Other',
      color: categoryDef.color
    };

    setProfile(prev => ({
      ...prev,
      goals: [...(prev.goals || []), goal]
    }));
    
    logAction('GOAL_ADDED', `Added goal: ${goal.name}`);
    setIsAddingGoal(false);
    setNewGoal({ name: '', targetAmount: 0, savedAmount: 0, deadline: '', category: 'Other' });
  };

  const handleDeleteGoal = (id: string) => {
    if(!setProfile) return;
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
    logAction('GOAL_DELETED', `Deleted goal ID: ${id}`);
  };

  const handleUpdateGoalProgress = (id: string, amount: number) => {
    if(!setProfile) return;
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, savedAmount: amount } : g)
    }));
  };

  const calculateMonthlyNeed = (target: number, saved: number, deadline: string) => {
    if (!deadline) return 0;
    const today = new Date();
    const end = new Date(deadline);
    const months = (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth());
    if (months <= 0) return 0;
    const remaining = Math.max(0, target - saved);
    return remaining / months;
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Planning & Projections</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Automated calculations for wealth building and tax planning.</p>
      </header>

      {/* Goals Section */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
           <div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <Target className="text-indigo-600 dark:text-indigo-400" /> Financial Goals
             </h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your progress towards specific targets.</p>
           </div>
           <button 
             onClick={() => setIsAddingGoal(true)}
             className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
           >
             <Plus size={16} /> Add Goal
           </button>
        </div>

        {isAddingGoal && (
          <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/50 animate-in slide-in-from-top-2">
             <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 uppercase mb-4">New Goal Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
               <div className="lg:col-span-2">
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Goal Name</label>
                 <input 
                   type="text" 
                   value={newGoal.name}
                   onChange={e => setNewGoal(p => ({...p, name: e.target.value}))}
                   placeholder="e.g. Europe Trip"
                   className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Target ({currencySymbol})</label>
                 <input 
                   type="number" 
                   value={newGoal.targetAmount || ''}
                   onChange={e => setNewGoal(p => ({...p, targetAmount: parseFloat(e.target.value)}))}
                   placeholder="5000"
                   className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Saved ({currencySymbol})</label>
                 <input 
                   type="number" 
                   value={newGoal.savedAmount || ''}
                   onChange={e => setNewGoal(p => ({...p, savedAmount: parseFloat(e.target.value)}))}
                   placeholder="1000"
                   className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Deadline (Opt)</label>
                 <input 
                   type="date" 
                   value={newGoal.deadline}
                   onChange={e => setNewGoal(p => ({...p, deadline: e.target.value}))}
                   className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
               </div>
             </div>
             
             <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = newGoal.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setNewGoal(p => ({...p, category: cat.id as any}))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected 
                            ? `bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105` 
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        <Icon size={14} /> {cat.label}
                      </button>
                    );
                  })}
                </div>
             </div>

             <div className="flex justify-end gap-2 mt-4">
               <button 
                 onClick={() => setIsAddingGoal(false)}
                 className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleAddGoal}
                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm shadow-sm"
               >
                 Save Goal
               </button>
             </div>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(!profile.goals || profile.goals.length === 0) && !isAddingGoal && (
             <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Target size={48} className="mx-auto mb-3 opacity-50" />
                <p>No savings goals yet. Click "Add Goal" to start planning!</p>
             </div>
          )}

          {profile.goals?.map(goal => {
            const categoryDef = GOAL_CATEGORIES.find(c => c.id === goal.category) || GOAL_CATEGORIES[7];
            const Icon = categoryDef.icon;
            const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const monthlyNeed = calculateMonthlyNeed(goal.targetAmount, goal.savedAmount, goal.deadline);

            return (
              <div key={goal.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                <button 
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-lg ${categoryDef.color} text-white shadow-sm`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{goal.name}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{categoryDef.label}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                      {currencySymbol}{goal.savedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      of {currencySymbol}{goal.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${categoryDef.color} transition-all duration-500`} 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                     <span className={progress >= 100 ? 'text-green-600 font-bold' : 'text-slate-500'}>
                       {progress.toFixed(0)}% Completed
                     </span>
                     {goal.deadline && (
                        <span className="flex items-center text-slate-400">
                           <Calendar size={12} className="mr-1" />
                           {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                     )}
                  </div>

                  {monthlyNeed > 0 && progress < 100 && (
                     <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Save <span className="font-bold text-indigo-600 dark:text-indigo-400">{currencySymbol}{monthlyNeed.toFixed(0)}/mo</span> to reach by deadline.
                        </p>
                     </div>
                  )}

                  <div className="pt-2">
                     <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Quick Add</label>
                     <div className="flex gap-2">
                        <button 
                           onClick={() => handleUpdateGoalProgress(goal.id, goal.savedAmount + 100)}
                           className="flex-1 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          +{currencySymbol}100
                        </button>
                        <button 
                           onClick={() => handleUpdateGoalProgress(goal.id, goal.savedAmount + 500)}
                           className="flex-1 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          +{currencySymbol}500
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SIP Calculator Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/20">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300">
                <TrendingUp size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Smart SIP Suggestion</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Based on your monthly savings of <strong>{currencySymbol}{monthlySavings.toFixed(0)}</strong>, 
              we recommend a SIP of:
            </p>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-center mb-8">
                <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{currencySymbol}{sipAmount.toFixed(0)}</span>
                <span className="text-slate-400 dark:text-slate-500 text-sm block mt-1">per month</span>
              </div>

              <div className="mb-6">
                 <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 text-center">10-Year Projection (12% Return)</h3>
                 <ResponsiveContainer width="100%" height={200}>
                   <BarChart data={projectionData}>
                      <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: 'transparent'}} 
                        formatter={(val: number) => `${currencySymbol}${val.toLocaleString()}`}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      />
                      <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]}>
                        {
                          projectionData.map((entry, index) => (
                            <cell key={`cell-${index}`} fill={index === 2 ? '#10b981' : '#818cf8'} />
                          ))
                        }
                      </Bar>
                   </BarChart>
                 </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-sm text-green-800 dark:text-green-300 flex items-start gap-2 mt-4">
              <Target size={18} className="mt-0.5 shrink-0" />
              <p>Potential Wealth: <strong>{currencySymbol}{futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> by investing just 50% of your current monthly savings.</p>
            </div>
          </div>
        </div>

        {/* Tax Estimator Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors flex flex-col">
           <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200">
                <Calculator size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tax Liability Estimator</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Simulate tax impact based on generic progressive brackets.
            </p>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {/* Simulation Inputs */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Gross Annual Salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 font-bold text-sm">{currencySymbol}</span>
                  <input
                    type="number"
                    value={taxInput.salary}
                    onChange={(e) => setTaxInput(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Other Income</label>
                <div className="relative">
                   <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 font-bold text-sm">{currencySymbol}</span>
                  <input
                    type="number"
                    value={taxInput.other}
                    onChange={(e) => setTaxInput(prev => ({ ...prev, other: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Total Annual Income</span>
                  <span className="font-bold text-slate-900 dark:text-white">{currencySymbol}{simulatedAnnualIncome.toLocaleString()}</span>
                </div>
                
                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-2"></div>
                
                <div className="flex justify-between items-center">
                   <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Estimated Tax</span>
                   <span className="font-bold text-red-500 dark:text-red-400">{currencySymbol}{tax.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>

                <div className="flex justify-between items-center">
                   <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Effective Rate</span>
                   <span className="font-bold text-orange-500 dark:text-orange-400">{effectiveRate.toFixed(1)}%</span>
                </div>
                
                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-2"></div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-base font-bold text-slate-700 dark:text-slate-200">Net Annual Income</span>
                  <span className="text-xl font-extrabold text-green-600 dark:text-green-400">{currencySymbol}{netAnnual.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <p>Calculated using simplified progressive brackets (10-30%). Use the <strong>AI Advisor</strong> for specific deduction strategies.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};