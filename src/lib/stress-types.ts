
export interface StressTestParams {
    housePriceShock: number; // %
    rentMarketShock: number; // %
    interestRateShock: number; // % (additive)
    stockMarketCrashYear: number; // 0 for none
    stockMarketCrashDrop: number; // %
    targetSellingYear: number;
    agentFee: number; // %
    earlyRepaymentPenalty: number;
    // Life OS Additions
    jobLossYear?: number; // Year where income -> 0
    jobLossDuration?: number; // Months (default 12 if year set)
    oneTimeCashHit?: number; // e.g., Medical expense, Car (Subtracted from T0 or specific year?) 
    // To keep it simple for "Life OS", let's apply to T0 Savings or Year N?
    // User requests "Year 2". Let's use specific params.
    cashHitAmount?: number;
    cashHitYear?: number;
    additionalMonthlyExpenses?: number; // For childcare
}

export const DEFAULT_STRESS_TEST: StressTestParams = {
    housePriceShock: 0,
    rentMarketShock: 0,
    interestRateShock: 0,
    stockMarketCrashYear: 0,
    stockMarketCrashDrop: 40,
    targetSellingYear: 10,
    agentFee: 3.5,
    earlyRepaymentPenalty: 0,
    jobLossYear: 0,
    jobLossDuration: 0,
    cashHitAmount: 0,
    cashHitYear: 0,
    additionalMonthlyExpenses: 0
};
