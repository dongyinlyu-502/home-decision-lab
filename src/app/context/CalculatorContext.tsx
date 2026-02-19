
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
    FinancialProfile,
    MarketSentiment,
    RentScenario,
    BuyScenario,
    MonthlyCashFlow,
    calculateProjections,
} from "@/lib/financial-math";
import {
    DEFAULT_PROFILE,
    DEFAULT_SENTIMENT,
    DEFAULT_RENT_SCENARIO,
    DEFAULT_BUY_SCENARIO,
} from "@/lib/constants";
import { StressTestParams, DEFAULT_STRESS_TEST } from "@/lib/stress-types";

interface CalculatorContextType {
    profile: FinancialProfile;
    sentiment: MarketSentiment;
    rentScenario: RentScenario;
    buyScenario: BuyScenario;
    stressTest: StressTestParams;
    projections: MonthlyCashFlow[];
    selectedMonth: number;
    updateProfile: (updates: Partial<FinancialProfile>) => void;
    updateSentiment: (updates: Partial<MarketSentiment>) => void;
    updateRentScenario: (updates: Partial<RentScenario>) => void;
    updateBuyScenario: (updates: Partial<BuyScenario>) => void;
    updateStressTest: (updates: Partial<StressTestParams>) => void;
    setSelectedMonth: (month: number) => void;
}

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_PROFILE);
    const [sentiment, setSentiment] = useState<MarketSentiment>(DEFAULT_SENTIMENT);
    const [rentScenario, setRentScenario] = useState<RentScenario>(DEFAULT_RENT_SCENARIO);
    const [buyScenario, setBuyScenario] = useState<BuyScenario>(DEFAULT_BUY_SCENARIO);
    const [stressTest, setStressTest] = useState<StressTestParams>(DEFAULT_STRESS_TEST);
    const [selectedMonth, setSelectedMonth] = useState<number>(360); // Default to end

    // Memoize projections calculation to avoid re-running on every render if inputs didn't change
    const projections = useMemo(() => {
        return calculateProjections(profile, rentScenario, buyScenario, sentiment, stressTest);
    }, [profile, rentScenario, buyScenario, sentiment, stressTest]);

    const updateProfile = useCallback((updates: Partial<FinancialProfile>) => setProfile(prev => ({ ...prev, ...updates })), []);
    const updateSentiment = useCallback((updates: Partial<MarketSentiment>) => setSentiment(prev => ({ ...prev, ...updates })), []);
    const updateRentScenario = useCallback((updates: Partial<RentScenario>) => setRentScenario(prev => ({ ...prev, ...updates })), []);
    const updateBuyScenario = useCallback((updates: Partial<BuyScenario>) => setBuyScenario(prev => ({ ...prev, ...updates })), []);
    const updateStressTest = useCallback((updates: Partial<StressTestParams>) => setStressTest(prev => ({ ...prev, ...updates })), []);
    const handleSetSelectedMonth = useCallback((month: number) => setSelectedMonth(month), []);

    const value = useMemo(() => ({
        profile,
        sentiment,
        rentScenario,
        buyScenario,
        stressTest,
        projections,
        selectedMonth,
        updateProfile,
        updateSentiment,
        updateRentScenario,
        updateBuyScenario,
        updateStressTest,
        setSelectedMonth: handleSetSelectedMonth,
    }), [
        profile,
        sentiment,
        rentScenario,
        buyScenario,
        stressTest,
        projections,
        selectedMonth,
        updateProfile,
        updateSentiment,
        updateRentScenario,
        updateBuyScenario,
        updateStressTest,
        handleSetSelectedMonth
    ]);

    return (
        <CalculatorContext.Provider value={value}>
            {children}
        </CalculatorContext.Provider>
    );
}

export function useCalculator() {
    const context = useContext(CalculatorContext);
    if (!context) {
        throw new Error("useCalculator must be used within a CalculatorProvider");
    }
    return context;
}
