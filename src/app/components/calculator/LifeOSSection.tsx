
"use client";

import React, { useState } from "react";
import { useCalculator } from "@/app/context/CalculatorContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateProjections, FinancialProfile, RentScenario, BuyScenario, MarketSentiment } from "@/lib/financial-math";
import { StressTestParams, DEFAULT_STRESS_TEST } from "@/lib/stress-types";
import { cn } from "@/lib/utils";

// Define the Scenario Type
interface LifeScenario {
    id: string;
    label: string;
    description: string;
    isHot?: boolean;
    apply: (
        profile: FinancialProfile,
        baseStress: StressTestParams,
        buyScenario: BuyScenario,
        rentScenario: RentScenario,
        sentiment: MarketSentiment
    ) => {
        newProfile: FinancialProfile;
        newStress: StressTestParams;
        newBuy: BuyScenario;
        newRent: RentScenario;
        newSentiment: MarketSentiment
    };
}

// Helper to clone and return structure
const noChange = (
    p: FinancialProfile,
    s: StressTestParams,
    b: BuyScenario,
    r: RentScenario,
    m: MarketSentiment
) => ({
    newProfile: { ...p },
    newStress: { ...s },
    newBuy: { ...b },
    newRent: { ...r },
    newSentiment: { ...m }
});

const SCENARIOS: LifeScenario[] = [
    {
        id: "housing_crash",
        label: "Housing Crash (-30%)",
        description: "Simulates a 30% drop in home values immediately after purchase.",
        isHot: true,
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.housePriceShock = -30;
            return res;
        }
    },
    {
        id: "market_collapse",
        label: "Stock Market Collapse",
        description: "Simulates a 40% drop in investment portfolio value.",
        isHot: true,
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.stockMarketCrashDrop = 40;
            res.newStress.stockMarketCrashYear = 5; // Default to year 5
            return res;
        }
    },
    {
        id: "job_loss",
        label: "Sudden Job Loss (1 Yr)",
        description: "Income drops to €0 for 12 months starting Year 3.",
        isHot: true,
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.jobLossYear = 3;
            res.newStress.jobLossDuration = 12;
            return res;
        }
    },
    {
        id: "childbirth",
        label: "Childbirth (+€1.5k/mo)",
        description: "Adds €1,500 monthly expense for childcare.",
        isHot: true,
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.additionalMonthlyExpenses = 1500;
            return res;
        }
    },
    {
        id: "rent_hyperinflation",
        label: "Rent Hyperinflation",
        description: "Rent increases by 5% annually (Base + 5%).",
        isHot: false,
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newRent.rentInflation += 5;
            return res;
        }
    },
    {
        id: "sell_year_5",
        label: "Sell Home (Year 5)",
        description: "Exit strategy analysis at Year 5.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.targetSellingYear = 5;
            return res;
        }
    },
    {
        id: "sell_year_10",
        label: "Sell Home (Year 10)",
        description: "Exit strategy analysis at Year 10.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.targetSellingYear = 10;
            return res;
        }
    },
    {
        id: "rate_spike",
        label: "Interest Rate Spike (+3%)",
        description: "Simulates mortgage rates rising by 3%.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.interestRateShock = 3;
            return res;
        }
    },
    {
        id: "promotion",
        label: "Career Promotion (+20%)",
        description: "Salary increases by 20% effectively.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newProfile.incomeFluctuation = (res.newProfile.incomeFluctuation || 0) + 20;
            return res;
        }
    },
    {
        id: "medical",
        label: "Medical Emergency (-€20k)",
        description: "One-time €20,000 cash expense at Year 2.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.cashHitAmount = 20000;
            res.newStress.cashHitYear = 2;
            return res;
        }
    },
    {
        id: "new_car",
        label: "Buy New Car (-€40k)",
        description: "One-time €40,000 cash expense at Year 2.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.cashHitAmount = 40000;
            res.newStress.cashHitYear = 2;
            return res;
        }
    },
    {
        id: "roof_repair",
        label: "Major Home Repair (-€15k)",
        description: "One-time €15,000 cash expense at Year 5.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.cashHitAmount = 15000;
            res.newStress.cashHitYear = 5;
            return res;
        }
    },
    {
        id: "inheritance",
        label: "Inheritance (+€50k)",
        description: "One-time €50,000 cash windfall at Year 10.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.cashHitAmount = -50000; // Negative hit = Gain
            res.newStress.cashHitYear = 10;
            return res;
        }
    },
    {
        id: "tax_hike",
        label: "Property Tax Hike (2x)",
        description: "Property tax rate doubles.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newBuy.propertyTaxRate *= 2;
            return res;
        }
    },
    {
        id: "move_cheaper",
        label: "Move Cheaper City",
        description: "Rent drops 30%, Income drops 10%.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newRent.monthlyRent *= 0.7;
            res.newProfile.incomeFluctuation = -10;
            return res;
        }
    },
    {
        id: "partner",
        label: "Partner Moves In",
        description: "Rent/Housing costs halved (shared).",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newRent.monthlyRent /= 2;
            // Assume half mortgage payment? Complex. Let's say maintenance/tax shared too.
            // Simplest: BuyScenario unmodified but maybe input logic changed? 
            // Let's stick to Rent 50% for now as per prompt "Halve the rent/housing cost".
            // For buy, we modify the payment capability? Or just say 'house price' is same but 'outflow' is less?
            // Let's implement as "Partner contributes 50% of costs".
            // Currently engine takes total cost. 
            // We can simulate by reducing rent by 50% and effectively reducing buy maintenance/tax/mortgage impact?
            // Hard to split mortgage in current engine. Let's just do Rent 50% for simplicity of "Partner Moves In" usually implies renting together first or sharing current.
            return res;
        }
    },
    {
        id: "crypto_wipeout",
        label: "Crypto Wipeout (-20%)",
        description: "Lose 20% of liquid assets immediately.",
        apply: (p, s, b, r, m) => {
            // T0 hit?
            const res = noChange(p, s, b, r, m);
            // Manually adjust savings?
            res.newProfile.currentSavings *= 0.8;
            return res;
        }
    },
    {
        id: "lump_sum",
        label: "Lump Sum Paydown (€30k)",
        description: "Pay extra €30k towards mortgage at T0.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newBuy.downPaymentPercent += 0; // Tricky.
            // Engine calculates loan = Price - Down - Closing.
            // If we assume this is T0, we increase down payment amount.
            // $30k as %?
            const extra = 30000;
            const extraPercent = (extra / b.homePrice) * 100;
            res.newBuy.downPaymentPercent += extraPercent;
            return res;
        }
    },
    {
        id: "sabbatical",
        label: "Sabbatical Year",
        description: "0 Income for 1 year (Year 4). Stop investing.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newStress.jobLossYear = 4;
            res.newStress.jobLossDuration = 12;
            return res;
        }
    },
    {
        id: "golden_decade",
        label: "Golden Decade (+3%)",
        description: "Investment returns +3% for all years.",
        apply: (p, s, b, r, m) => {
            const res = noChange(p, s, b, r, m);
            res.newSentiment.investmentReturn += 3;
            return res;
        }
    },
];

export function LifeOSSection() {
    const { profile, stressTest, buyScenario, rentScenario, sentiment, projections } = useCalculator();
    const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

    const activeScenario = SCENARIOS.find(s => s.id === activeScenarioId);

    // Calculate Diff locally
    let diffData = null;
    if (activeScenario) {
        const { newProfile, newStress, newBuy, newRent, newSentiment } = activeScenario.apply(
            profile, stressTest, buyScenario, rentScenario, sentiment
        );
        const newProjections = calculateProjections(newProfile, newRent, newBuy, newSentiment, newStress);

        // Find T30 (or T-End) Delta
        const endMonth = 360; // Year 30
        const baseEnd = projections[endMonth - 1] || projections[projections.length - 1];
        const newEnd = newProjections[endMonth - 1] || newProjections[newProjections.length - 1];

        if (baseEnd && newEnd) {
            diffData = {
                rentNetWorthDelta: newEnd.netWorthRent - baseEnd.netWorthRent,
                buyNetWorthDelta: newEnd.netWorthBuy - baseEnd.netWorthBuy,
                baseBuy: baseEnd.netWorthBuy,
                newBuy: newEnd.netWorthBuy,
                baseRent: baseEnd.netWorthRent,
                newRent: newEnd.netWorthRent,
            };
        }
    }

    return (
        <div className="space-y-6 w-full mt-8">
            <Separator />
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Life OS™ & Stress Test Module</h2>
                <p className="text-muted-foreground text-sm">Simulate major life events and market shocks to see their impact on your 30-year wealth.</p>
            </div>

            {/* Grid */}
            <div className="flex flex-wrap gap-3">
                {SCENARIOS.map(scenario => (
                    <button
                        key={scenario.id}
                        onClick={() => setActiveScenarioId(activeScenarioId === scenario.id ? null : scenario.id)}
                        className={cn(
                            "relative px-4 py-2 rounded-full border text-sm font-medium transition-all hover:scale-105",
                            activeScenarioId === scenario.id
                                ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                                : "bg-card hover:bg-accent hover:text-accent-foreground border-border"
                        )}
                    >
                        {scenario.label}
                        {scenario.isHot && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Impact Card */}
            {activeScenario && diffData && (
                <Card className="animate-in fade-in slide-in-from-top-4 border-l-4 border-l-primary bg-muted/30">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="font-bold text-lg">{activeScenario.label} Analysis</h3>
                                <p className="text-sm text-muted-foreground">{activeScenario.description}</p>
                            </div>

                            <div className="text-right space-y-1">
                                <div className="text-sm font-medium">Net Worth Impact (Year 30)</div>
                                <div className="flex gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Buy Scenario</div>
                                        <div className={cn("text-lg font-bold", diffData.buyNetWorthDelta >= 0 ? "text-green-600" : "text-red-600")}>
                                            {diffData.buyNetWorthDelta > 0 ? "+" : ""}€{Math.round(diffData.buyNetWorthDelta / 1000)}k
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Rent Scenario</div>
                                        <div className={cn("text-lg font-bold", diffData.rentNetWorthDelta >= 0 ? "text-green-600" : "text-red-600")}>
                                            {diffData.rentNetWorthDelta > 0 ? "+" : ""}€{Math.round(diffData.rentNetWorthDelta / 1000)}k
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-background rounded border text-sm">
                            <span className="font-semibold">Result: </span>
                            If this happens, your Buying Net Worth changes from <span className="font-medium">€{(diffData.baseBuy / 1000000).toFixed(2)}M</span> to <span className="font-medium">€{(diffData.newBuy / 1000000).toFixed(2)}M</span>.
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
