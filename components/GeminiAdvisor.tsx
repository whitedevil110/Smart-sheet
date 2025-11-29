import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FinancialProfile } from '../types';
import { analyzeFinancialProfile } from '../services/geminiService';
import { Sparkles, RefreshCw, BookOpen, Search, ExternalLink, Briefcase } from 'lucide-react';
import { TAX_INSTRUMENTS, CURRENCY_NAMES, AFFILIATE_PARTNERS } from '../constants';

interface GeminiAdvisorProps {
  profile: FinancialProfile;
}

export const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ profile }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async () => {
    setLoading(true);
    const result = await analyzeFinancialProfile(profile);
    setAnalysis(result);
    setLoading(false);
  };

  const currencyInstruments = TAX_INSTRUMENTS[profile.currency];
  const recommendedTools = AFFILIATE_PARTNERS[profile.currency] || AFFILIATE_PARTNERS['DEFAULT'];

  // Identify high expenses for UI Preview
  const expensesByCategory: Record<string, number> = {};
  profile.expenses.forEach(e => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });
  const topCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  return (
    <div className="space-y-8">
       <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            AI Financial Advisor <Sparkles className="text-yellow-500" fill="currentColor" size={24} />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Get personalized advice powered by Gemini 2.5.</p>
        </div>
        
        <button
          onClick={handleAnalysis}
          disabled={loading}
          className={`flex items-center px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
            loading ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin mr-2" size={20} /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2" size={20} /> Generate Report
            </>
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
            {/* Intro State */}
            {!analysis && !loading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12 text-center transition-colors">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="text-indigo-600 dark:text-indigo-400" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ready to optimize your finances?</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8">
                Our AI analyzes your income, spending habits, and savings to provide actionable tips on Tax Saving, SIP allocations, and Budgeting.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Instruments Preview */}
                {currencyInstruments && currencyInstruments.length > 0 && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 flex flex-col h-full text-left">
                    <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-400">
                        <BookOpen size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                        {CURRENCY_NAMES[profile.currency]} Instruments
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {currencyInstruments.slice(0, 5).map((inst) => (
                        <span 
                            key={inst} 
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg font-medium"
                        >
                            {inst}
                        </span>
                        ))}
                    </div>
                    </div>
                )}

                {/* High Spending Preview */}
                {topCategories.length > 0 && (
                    <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30 flex flex-col h-full text-left">
                        <div className="flex items-center gap-2 mb-4 text-orange-400 dark:text-orange-400">
                        <Search size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            High Spending Detected
                        </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                        {topCategories.map(cat => (
                            <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/50 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{cat}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                </div>
            </div>
            )}

            {/* Loading State Skeleton */}
            {loading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 space-y-4 animate-pulse transition-colors">
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-100 dark:bg-slate-700/50 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 dark:bg-slate-700/50 rounded w-full"></div>
                <div className="h-4 bg-gray-100 dark:bg-slate-700/50 rounded w-5/6"></div>
                <div className="h-32 bg-gray-50 dark:bg-slate-700/30 rounded w-full mt-6"></div>
            </div>
            )}

            {/* Result State */}
            {analysis && !loading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 transition-colors">
                <div className="prose prose-indigo dark:prose-invert max-w-none">
                <ReactMarkdown 
                    components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-6 mb-3 border-b border-indigo-100 dark:border-indigo-900/50 pb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 space-y-2 text-slate-700 dark:text-slate-300" {...props} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                    p: ({node, ...props}) => <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                    }}
                >
                    {analysis}
                </ReactMarkdown>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 flex justify-end items-center gap-4">
                    <span className="text-xs text-slate-400 dark:text-slate-500">Generated by Gemini. Not professional financial advice.</span>
                </div>
            </div>
            )}
        </div>

        {/* Sidebar: Recommended Tools (Monetization Slot) */}
        <div className="lg:col-span-1">
             <div className="sticky top-6 space-y-4">
                <div className="flex items-center gap-2 mb-2 text-slate-800 dark:text-white font-bold">
                    <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <h3>Recommended for {CURRENCY_NAMES[profile.currency]}</h3>
                </div>
                
                {recommendedTools.map((tool, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                             <div className={`px-2 py-1 rounded text-[10px] font-bold text-white uppercase ${tool.color}`}>
                                 {tool.type}
                             </div>
                             <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">{tool.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{tool.description}</p>
                        <a 
                           href={tool.url}
                           onClick={(e) => {
                               e.preventDefault();
                               alert(`This would redirect to the affiliate link for ${tool.name}. (Commission earned here)`);
                           }}
                           className="block w-full py-2 text-center bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors"
                        >
                            View Offer
                        </a>
                    </div>
                ))}

                <div className="bg-indigo-600 rounded-xl p-5 text-center text-white shadow-lg mt-6">
                    <h4 className="font-bold mb-2">Need a Professional?</h4>
                    <p className="text-xs text-indigo-100 mb-4">Get matched with a certified Tax Planner in your region.</p>
                    <button 
                        onClick={() => alert("Lead Gen Form: This would capture user details to sell to financial advisors.")}
                        className="w-full py-2 bg-white text-indigo-700 font-bold text-xs rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                        Find an Advisor
                    </button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};