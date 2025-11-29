import { GoogleGenAI } from "@google/genai";
import { FinancialProfile } from "../types";
import { getCurrencySymbol, CURRENCY_NAMES, TAX_INSTRUMENTS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFinancialProfile = async (profile: FinancialProfile): Promise<string> => {
  const { income, expenses, currency } = profile;
  const symbol = getCurrencySymbol(currency);
  const currencyName = CURRENCY_NAMES[currency] || currency;
  
  const totalMonthlyExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyGross = (income.grossAnnualSalary / 12) + (income.otherIncome / 12);
  const netSavings = monthlyGross - totalMonthlyExpenses;
  const annualIncome = income.grossAnnualSalary + income.otherIncome;
  const savingsRate = monthlyGross > 0 ? (netSavings / monthlyGross) * 100 : 0;

  // Group expenses by category for clearer prompt context
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  const categorySummary = Object.entries(expensesByCategory)
    .map(([cat, amount]) => `- ${cat}: ${symbol}${amount.toFixed(2)}`)
    .join('\n');

  // Identify top spending categories for targeted tax advice
  const topHighExpenses = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([cat]) => cat)
    .join(' and ');

  // Dynamic tax instruments based on currency
  const suggestedInstruments = TAX_INSTRUMENTS[currency] 
    ? `Specifically evaluate the relevance of these instruments for the user: ${TAX_INSTRUMENTS[currency].join(', ')}.`
    : "Suggest relevant local tax-advantaged accounts, pension schemes, and deductions available in this region.";

  const prompt = `
    You are a senior financial advisor and tax planner.
    
    **User Profile:**
    - **Currency:** ${currencyName} (${currency})
    - **Annual Income:** ${symbol}${annualIncome.toLocaleString()}
    - **Monthly Income:** ${symbol}${monthlyGross.toFixed(2)}
    - **Monthly Expenses:** ${symbol}${totalMonthlyExpenses.toFixed(2)}
    - **Monthly Savings:** ${symbol}${netSavings.toFixed(2)} (${savingsRate.toFixed(1)}%)

    **Spending Breakdown:**
    ${categorySummary}

    **Detailed Transactions (Recent):**
    ${expenses.slice(0, 25).map(e => `- ${e.name} (${e.category}): ${symbol}${e.amount}`).join('\n')}
    ${expenses.length > 25 ? `...and ${expenses.length - 25} more transactions.` : ''}

    **Task:**
    Provide a personalized financial plan in Markdown format, specifically tailored to the tax laws and investment options associated with **${currencyName} (${currency})**.

    **Required Sections:**

    1.  **📊 Financial Health Check**
        - Assess the savings rate (Current: ${savingsRate.toFixed(1)}%).
        - Comment on the balance between fixed expenses (Housing, Debt) and discretionary spending.

    2.  **💰 Tax Saving Opportunities (Region-Specific)**
        - **Context:** The user operates in ${currencyName}. ${suggestedInstruments}
        - **Targeted Analysis:** The user's highest spending categories are **${topHighExpenses}**.
        - **Action:**
          - Investigate if there are specific tax deductions, credits, or allowances available for **${topHighExpenses}** in this region (e.g., Mortgage Interest/Rent deduction for Housing, Tuition credits for Education, Medical insurance for Health).
          - Provide actionable steps to utilize the mentioned instruments to reduce tax liability based on their income level of ${symbol}${annualIncome.toLocaleString()}.

    3.  **🚀 Investment Strategy (SIP/DCA)**
        - Recommend an asset allocation mix (Equity vs Debt) based on maintaining a long-term portfolio.
        - Suggest specific market indices or fund types available in ${currency} (e.g., Nifty 50/Sensex for INR, S&P 500 for USD, FTSE 100 for GBP).
        - Calculate a recommended monthly SIP amount based on their ${symbol}${netSavings.toFixed(2)} savings (usually 20-50% of savings).

    4.  **✂️ Optimization Tips**
        - Highlight 1-2 categories where spending seems high compared to income.
        - Suggest actionable ways to reduce these costs.

    **Tone:** Professional, insightful, and strictly personalized to the provided data and currency region.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    
    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI advisor. Please try again later.";
  }
};