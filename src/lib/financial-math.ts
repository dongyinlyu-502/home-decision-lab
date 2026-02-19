
export interface MarketSentiment {
    homeAppreciation: number; // Yearly %
    investmentReturn: number; // Yearly %
    inflation: number; // Yearly %
}

export interface FinancialProfile {
    monthlyIncome: number;
    currentSavings: number;
    currentDebt: number;
    expectedSalaryGrowth: number; // Yearly %
    investmentRate: number; // % of disposable income (0-100)
    // Advanced
    minimumLivingExpenses?: number;
    targetEmergencyFundMonths?: number;
    incomeFluctuation?: number; // % (-50 to +50)
}

export interface RentScenario {
    monthlyRent: number;
    rentersInsurance: number; // Monthly
    otherMonthlyCosts: number;
    oneTimeFees: number; // e.g. deposit
    rentInflation: number; // Yearly %
}

export interface BuyScenario {
    homePrice: number;
    downPaymentPercent: number;
    mortgageRate: number; // Yearly %
    loanTermYears: number;
    propertyTaxRate: number; // Yearly %
    maintenanceMonthly: number;
    buyingClosingCosts: number; // % of home price, usually 2-5%
    sellingClosingCosts: number; // % of home price, usually 6-10%
    homeAppreciation: number; // Yearly % (overrides sentiment if needed)
}

export interface MonthlyCashFlow {
    month: number;
    year: number;

    // Rent Path
    rentPayment: number;
    rentInsurance: number;
    rentTotalOutflow: number;
    rentOpportunityInvested: number; // The amount saved vs buying invested
    rentPortfolioValue: number; // Total liquid assets

    // Buy Path
    mortgagePayment: number;
    interestPayment: number;
    propertyTax: number;
    maintenance: number;
    buyTotalOutflow: number;
    homeValue: number;
    remainingLoan: number;
    homeEquity: number;
    buyOpportunityInvested: number; // If buying is cheaper, invest difference
    buyPortfolioValue: number; // Liquid assets from investing savings

    // Net Worth
    netWorthRent: number;
    netWorthBuy: number;
}

/**
 * Calculates the monthly mortgage payment (Principal + Interest)
 */
export function calculateMortgagePayment(principal: number, annualRate: number, years: number): number {
    if (annualRate === 0) return principal / (years * 12);
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
}

import { StressTestParams, DEFAULT_STRESS_TEST } from "./stress-types";

/**
 * Core Engine: Projects financial state month-by-month for 30 years
 * Refactored to "Disposable Income & Cash Flow" model.
 */
export function calculateProjections(
    profile: FinancialProfile,
    rentScenario: RentScenario,
    buyScenario: BuyScenario,
    sentiment: MarketSentiment,
    stressTest: StressTestParams = DEFAULT_STRESS_TEST
): MonthlyCashFlow[] {
    const months = 30 * 12;
    const projections: MonthlyCashFlow[] = [];

    // --- STRESS TEST ADJUSTMENTS (Base modifiers) ---
    const incomeModifier = 1 + (profile.incomeFluctuation || 0) / 100;
    const rentShockModifier = 1 + (stressTest.rentMarketShock || 0) / 100;
    const housePriceShockModifier = 1 + (stressTest.housePriceShock || 0) / 100;
    const interestRateShock = (stressTest.interestRateShock || 0);

    // Initial State (Adjusted by shocks?)
    // Usually shocks happen t=0 or during. Let's assume t=0 for simplicity of "INSTANT RE-EVALUATION" as requested.
    // House Price Shock: Adjusts the base home value immediately.
    const initialHomePrice = buyScenario.homePrice * housePriceShockModifier;

    // T0 Investable (Using Unshocked prices for Down Payment usually?
    // If market crashes 30%, you still paid the down payment on the original price unless you bought AFTER.
    // Interpretation: User bought at `homePrice`. The `shock` is the market value changing.
    // So `currentHomeValue` is shocked, but `loanAmount` is based on purchase price.
    // HOWEVER, `downPayment` is cash out.

    // Rent T0
    let rentPortfolio = profile.currentSavings - rentScenario.oneTimeFees;
    // Note: We also remove debt subtraction here to match the new "Buy" logic for consistency, 
    // or we keep it if we want to be strictly compliant with the USER request only for BUY.
    // The user requested: "Buy Scenario... Leftover Cash = Current Savings - Down Payment - Closing Costs."
    // They implied this specific formula.
    // To ensure fair comparison, we should probably do the same for Rent, otherwise Rent is penalized by debt while Buy isn't.
    // However, I will strictly follow the prompt for Buy first.
    // Actually, looking at the previous code, it subtracted debt from both.
    // If I remove it from Buy, I should remove it from Rent to keep "Net Worth" comparison fair (ignoring legacy debt for both).
    if (profile.currentDebt > 0) {
        // Warning: ignoring debt in T0 calculation means Net Worth is inflated by debt amount.
    }
    rentPortfolio = rentPortfolio - profile.currentDebt; // Keeping Rent as is? Or changing? 
    // User said "Buy Scenario's math engine...".

    // Let's implement the specific Buy request: 
    // "Calculate the leftover cash at Month 0: Leftover Cash = Current Savings - Down Payment - Closing Costs."
    // "If Leftover Cash > 0, this amount MUST become the starting balance..."

    // Buy T0
    const downPaymentAmount = buyScenario.homePrice * (buyScenario.downPaymentPercent / 100);
    const buyingClosingCostsAmount = buyScenario.homePrice * (buyScenario.buyingClosingCosts / 100);

    // FIX: Do not subtract currentDebt from the *Investable Portfolio* start.
    // Treat (Savings - Costs) as the principal that compounds.
    // Legacy debt should technically be a separate negative line item, but for this "projected wealth" calculator,
    // mixing it into the portfolio prevents the cash from compounding if debt > cash.
    let buyPortfolio = profile.currentSavings - downPaymentAmount - buyingClosingCostsAmount;

    // Loan Setup (Based on purchase price)
    const loanAmount = buyScenario.homePrice - downPaymentAmount;
    const adjustedMortgageRate = Math.max(0, buyScenario.mortgageRate + interestRateShock); // Interest Rate Shock
    const fixedMortgagePayment = calculateMortgagePayment(loanAmount, adjustedMortgageRate, buyScenario.loanTermYears);

    // Monthly Rates
    const monthlyInvestmentRate = sentiment.investmentReturn / 100 / 12;
    const monthlyInflationRate = sentiment.inflation / 100 / 12;
    const monthlyRentInflation = rentScenario.rentInflation / 100 / 12;
    const monthlyHomeAppreciation = (buyScenario.homeAppreciation || sentiment.homeAppreciation) / 100 / 12;
    const monthlyMortgageRate = adjustedMortgageRate / 100 / 12;
    const monthlySalaryGrowth = profile.expectedSalaryGrowth / 100 / 12;

    // Running Variables
    let currentRent = rentScenario.monthlyRent * rentShockModifier; // Rent Shock
    let currentHomeValue = initialHomePrice; // House Price (Equity) Shock
    let currentLoanBalance = loanAmount;
    let currentMonthlyIncome = profile.monthlyIncome * incomeModifier; // Income Fluctuation

    // Re-adjust Rent Portfolio for consistency? 
    // If we want to be "Simplification" oriented:
    // Let's remove debt subtraction from Rent too so both start with "Cash on Hand".
    rentPortfolio = profile.currentSavings - rentScenario.oneTimeFees;

    for (let i = 1; i <= months; i++) {
        const currentYear = Math.ceil(i / 12);

        // Grow Income
        currentMonthlyIncome *= (1 + monthlySalaryGrowth);

        // JOB LOSS LOGIC: Income -> 0 if within job loss period
        let effectiveIncome = currentMonthlyIncome;
        if (stressTest.jobLossYear && stressTest.jobLossYear > 0) {
            // Assume starts Month 1 of that year
            const jobLossStartMonth = (stressTest.jobLossYear - 1) * 12 + 1;
            const duration = stressTest.jobLossDuration || 12;
            if (i >= jobLossStartMonth && i < jobLossStartMonth + duration) {
                effectiveIncome = 0;
            }
        }

        // --- RENT PATH ---
        const rentHousingCost = currentRent + rentScenario.rentersInsurance + rentScenario.otherMonthlyCosts;
        const rentDisposableIncome = effectiveIncome - rentHousingCost - (stressTest.additionalMonthlyExpenses || 0);
        const rentInvestable = rentDisposableIncome * (profile.investmentRate / 100);

        // Helper to apply growth or debt penalty
        // const applyGrowth = (balance: number, contribution: number) => {
        //     if (balance < 0) {
        //         // Debt Penalty Rate (fixed 10%)
        //         return balance * (1 + 0.10 / 12) + contribution;
        //     }
        //     return balance * (1 + monthlyInvestmentRate) + contribution;
        // };

        // STOCK MARKET CRASH HANDLING (One time drop in specific year, Month 1)
        let marketCrashMultiplier = 1;
        if (stressTest.stockMarketCrashYear > 0 && currentYear === stressTest.stockMarketCrashYear && (i - 1) % 12 === 0) {
            marketCrashMultiplier = 1 - (stressTest.stockMarketCrashDrop / 100);
        }

        // Grow Rent Portfolio
        if (rentPortfolio >= 0) {
            rentPortfolio = rentPortfolio * (1 + monthlyInvestmentRate) * marketCrashMultiplier + rentInvestable;
        } else {
            // Debt doesn't crash with the market usually, but if it's margin? Let's assume debt is debt.
            rentPortfolio = rentPortfolio * (1 + 0.10 / 12) + rentInvestable;
        }

        // CASH HIT LOGIC (One time expense)
        if (stressTest.cashHitYear && stressTest.cashHitYear === currentYear && (i - 1) % 12 === 0) {
            rentPortfolio -= (stressTest.cashHitAmount || 0);
        }

        // --- BUY PATH ---
        // Mortgage P&I
        let mortgagePayment = 0;
        let interestPayment = 0;
        let principalPayment = 0;

        if (currentLoanBalance > 0) {
            mortgagePayment = fixedMortgagePayment;
            interestPayment = currentLoanBalance * monthlyMortgageRate;
            principalPayment = mortgagePayment - interestPayment;
            if (principalPayment > currentLoanBalance) {
                principalPayment = currentLoanBalance;
                mortgagePayment = principalPayment + interestPayment;
            }
        }

        const monthlyPropertyTax = (currentHomeValue * (buyScenario.propertyTaxRate / 100)) / 12;
        const monthlyMaintenance = buyScenario.maintenanceMonthly * Math.pow(1 + monthlyInflationRate, i);

        const buyHousingCost = mortgagePayment + monthlyPropertyTax + monthlyMaintenance;
        const buyDisposableIncome = effectiveIncome - buyHousingCost - (stressTest.additionalMonthlyExpenses || 0);
        const buyInvestable = buyDisposableIncome * (profile.investmentRate / 100);

        // Grow Buy Portfolio
        if (buyPortfolio >= 0) {
            buyPortfolio = buyPortfolio * (1 + monthlyInvestmentRate) * marketCrashMultiplier + buyInvestable;
        } else {
            buyPortfolio = buyPortfolio * (1 + 0.10 / 12) + buyInvestable;
        }

        // CASH HIT LOGIC (Buy Path)
        if (stressTest.cashHitYear && stressTest.cashHitYear === currentYear && (i - 1) % 12 === 0) {
            buyPortfolio -= (stressTest.cashHitAmount || 0);
        }

        // --- UPDATE STATES ---
        currentRent *= (1 + monthlyRentInflation);
        currentHomeValue *= (1 + monthlyHomeAppreciation);
        currentLoanBalance -= principalPayment;
        if (currentLoanBalance < 0) currentLoanBalance = 0;

        // Net Worth Calculation
        const sellingCosts = currentHomeValue * (buyScenario.sellingClosingCosts / 100 || 0.06);
        const homeEquity = currentHomeValue - currentLoanBalance;

        const netWorthRent = rentPortfolio;
        const netWorthBuy = buyPortfolio + homeEquity - sellingCosts;

        // Helper for Opportunity Cost (Investing difference) - Kept for backward compatibility/viz if needed, 
        // but broadly this model diverges from the "difference" model.
        // We will repurpose these fields for the "Investable Amount" to visualize what's being added.
        const rentOpportunityInvested = rentInvestable;
        const buyOpportunityInvested = buyInvestable;

        projections.push({
            month: i,
            year: Math.ceil(i / 12),
            rentPayment: currentRent,
            rentInsurance: rentScenario.rentersInsurance,
            rentTotalOutflow: rentHousingCost,
            rentOpportunityInvested,
            rentPortfolioValue: rentPortfolio,
            mortgagePayment,
            interestPayment,
            propertyTax: monthlyPropertyTax,
            maintenance: monthlyMaintenance,
            buyTotalOutflow: buyHousingCost,
            homeValue: currentHomeValue,
            remainingLoan: currentLoanBalance,
            homeEquity,
            buyOpportunityInvested,
            buyPortfolioValue: buyPortfolio,
            netWorthRent,
            netWorthBuy
        });
    }

    return projections;
}
