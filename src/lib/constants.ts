
import { FinancialProfile, MarketSentiment, RentScenario, BuyScenario } from "@/lib/financial-math";

export const DEFAULT_PROFILE: FinancialProfile = {
    monthlyIncome: 4500, // Euro
    currentSavings: 60000, // Euro
    currentDebt: 0,
    expectedSalaryGrowth: 3,
    investmentRate: 50, // % of disposable income
};

export const DEFAULT_SENTIMENT: MarketSentiment = {
    homeAppreciation: 3,
    investmentReturn: 7,
    inflation: 2.5,
};

export const SENTIMENT_MODES = {
    pessimistic: {
        homeAppreciation: 0,
        investmentReturn: { conservative: 2, balanced: 0, aggressive: 15 }
    },
    neutral: {
        homeAppreciation: 2,
        investmentReturn: { conservative: 3, balanced: 4, aggressive: 5 }
    },
    optimistic: {
        homeAppreciation: 6,
        investmentReturn: { conservative: 5, balanced: 8, aggressive: 20 }
    }
};

export const DEFAULT_RENT_SCENARIO: RentScenario = {
    monthlyRent: 1600, // Euro
    rentersInsurance: 15,
    otherMonthlyCosts: 0,
    oneTimeFees: 3200, // 2 months deposit
    rentInflation: 2.5,
};

export const DEFAULT_BUY_SCENARIO: BuyScenario = {
    homePrice: 200000, // Euro (implies 200k loan with 10% down)
    downPaymentPercent: 10,
    mortgageRate: 3.5, // 3.5%
    loanTermYears: 25, // 25 years
    propertyTaxRate: 0.5, // Lower in EU generally? or keep similar? 0.5% seems reasonable for EU avg.
    maintenanceMonthly: 300,
    buyingClosingCosts: 8, // Higher in EU (Notary, Tax) often 7-10%
    sellingClosingCosts: 4, // Agent fees lower? Or keeping moderate.
    homeAppreciation: 0, // Will be overridden by sentiment usually
};
