import { ExpenseCategory } from "./types";

export const CURRENCY_MAP: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
  SGD: 'S$',
  CHF: 'Fr',
  HKD: 'HK$',
  NZD: 'NZ$',
  SEK: 'kr',
  KRW: '₩',
  MXN: '$',
  BRL: 'R$',
  RUB: '₽',
  ZAR: 'R',
  TRY: '₺',
  AED: 'dh',
  SAR: 'SR'
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CNY: 'Chinese Yuan',
  SGD: 'Singapore Dollar',
  CHF: 'Swiss Franc',
  HKD: 'Hong Kong Dollar',
  NZD: 'New Zealand Dollar',
  SEK: 'Swedish Krona',
  KRW: 'South Korean Won',
  MXN: 'Mexican Peso',
  BRL: 'Brazilian Real',
  RUB: 'Russian Ruble',
  ZAR: 'South African Rand',
  TRY: 'Turkish Lira',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal'
};

// Approximate Exchange Rates to USD (Base) for normalization
export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  INR: 0.012,
  JPY: 0.0067,
  CAD: 0.74,
  AUD: 0.66,
  CNY: 0.14,
  SGD: 0.74,
  CHF: 1.13,
  HKD: 0.13,
  NZD: 0.61,
  SEK: 0.096,
  KRW: 0.00075,
  MXN: 0.059,
  BRL: 0.20,
  RUB: 0.011,
  ZAR: 0.053,
  TRY: 0.031,
  AED: 0.27,
  SAR: 0.27
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = EXCHANGE_RATES_TO_USD[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES_TO_USD[toCurrency] || 1;
  
  // Convert to USD then to Target
  const inUSD = amount * fromRate;
  return inUSD / toRate;
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
];

export const TAX_INSTRUMENTS: Record<string, string[]> = {
  USD: ['401(k) / 403(b)', 'Roth IRA / Traditional IRA', 'HSA (Health Savings Account)', '529 Plans', 'Student Loan Interest Deduction'],
  INR: ['Section 80C (PPF, ELSS, EPF)', 'Section 80D (Health Insurance)', 'NPS (National Pension System)', 'HRA (House Rent Allowance)', 'LTA (Leave Travel Allowance)'],
  GBP: ['ISA (Individual Savings Account)', 'SIPP (Self-Invested Personal Pension)', 'Workplace Pension', 'Marriage Allowance'],
  CAD: ['RRSP (Registered Retirement Savings Plan)', 'TFSA (Tax-Free Savings Account)', 'FHSA (First Home Savings Account)', 'Canada Child Benefit'],
  AUD: ['Superannuation (Concessional Contributions)', 'Franking Credits', 'Negative Gearing'],
  SGD: ['CPF Top-ups', 'SRS (Supplementary Retirement Scheme)'],
  EUR: ['Private Pension Plans', 'Life Insurance Wrappers', 'Sustainable Investment Tax Credits'],
};

// Mock Affiliate Partners Data
export const AFFILIATE_PARTNERS: Record<string, Array<{ name: string; description: string; type: 'Invest' | 'Tax' | 'Bank'; url: string; color: string }>> = {
  USD: [
    { name: 'Robinhood', description: 'Commission-free stock trading & IRAs.', type: 'Invest', url: '#', color: 'bg-green-600' },
    { name: 'TurboTax', description: 'File your US taxes with confidence.', type: 'Tax', url: '#', color: 'bg-blue-600' },
    { name: 'Coinbase', description: 'Buy, sell, and store cryptocurrency.', type: 'Bank', url: '#', color: 'bg-indigo-600' },
  ],
  INR: [
    { name: 'Zerodha', description: 'India\'s #1 discount broker for stocks & SIPs.', type: 'Invest', url: '#', color: 'bg-blue-600' },
    { name: 'ClearTax', description: 'Easiest way to e-file IT returns in India.', type: 'Tax', url: '#', color: 'bg-orange-600' },
    { name: 'CRED', description: 'Pay credit card bills and earn rewards.', type: 'Bank', url: '#', color: 'bg-black' },
  ],
  GBP: [
    { name: 'Vanguard UK', description: 'Low-cost index funds and ISAs.', type: 'Invest', url: '#', color: 'bg-red-700' },
    { name: 'TaxScouts', description: 'Certified accountants to sort your tax.', type: 'Tax', url: '#', color: 'bg-teal-600' },
    { name: 'Monzo', description: 'The bank that lives on your smartphone.', type: 'Bank', url: '#', color: 'bg-orange-500' },
  ],
  // Fallback for other currencies
  DEFAULT: [
    { name: 'Interactive Brokers', description: 'Global trading access to 150 markets.', type: 'Invest', url: '#', color: 'bg-red-600' },
    { name: 'Wise', description: 'International money transfers at low cost.', type: 'Bank', url: '#', color: 'bg-lime-500' },
  ]
};

export const getCurrencySymbol = (code: string) => CURRENCY_MAP[code] || '$';

export const DEFAULT_INCOME = {
  grossAnnualSalary: 60000,
  otherIncome: 0,
};

export const EXPENSE_CATEGORIES = Object.values(ExpenseCategory);

export const MOCK_EXPENSES = [
  { id: '1', name: 'Rent', amount: 1500, category: ExpenseCategory.HOUSING, date: '2023-10-01', currency: 'USD' },
  { id: '2', name: 'Groceries', amount: 400, category: ExpenseCategory.FOOD, date: '2023-10-05', currency: 'USD' },
  { id: '3', name: 'Car Loan', amount: 350, category: ExpenseCategory.DEBT, date: '2023-10-10', currency: 'USD' },
  { id: '4', name: 'Netflix', amount: 15, category: ExpenseCategory.ENTERTAINMENT, date: '2023-10-15', currency: 'USD' },
];