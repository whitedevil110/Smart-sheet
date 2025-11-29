export enum ExpenseCategory {
  HOUSING = 'Housing',
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health',
  DEBT = 'Debt',
  OTHER = 'Other',
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  currency?: string;
}

export interface Income {
  grossAnnualSalary: number;
  otherIncome: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  category: 'Emergency' | 'Travel' | 'Home' | 'Vehicle' | 'Education' | 'Gadget' | 'Investment' | 'Other';
  icon: string;
  color: string;
}

export interface FinancialProfile {
  income: Income;
  expenses: Expense[];
  currency: string;
  language: string;
  budgets: Record<string, number>;
  categories: string[];
  goals: SavingsGoal[];
}

export interface AnalysisResult {
  savingsRate: number;
  projectedAnnualSavings: number;
  sipSuggestion: string;
  taxPlanningTips: string[];
  riskAnalysis: string;
}