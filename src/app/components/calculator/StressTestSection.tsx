
"use client";

import React, { useState, useMemo } from "react";
import { useCalculator } from "@/app/context/CalculatorContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateProjections, calculateMortgagePayment, FinancialProfile, RentScenario, BuyScenario, MarketSentiment, MonthlyCashFlow } from "@/lib/financial-math";
import { StressTestParams, DEFAULT_STRESS_TEST } from "@/lib/stress-types";
import { cn } from "@/lib/utils";

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar,
    LabelList,
    Cell,
    ReferenceLine,
} from "recharts";

// --- Tool Definition ---
interface ToolDef {
    id: string;
    label: string;
    description: string;
    isHot?: boolean;
    disabled?: boolean;
}

const TOOLS: ToolDef[] = [
    { id: "risk_assessment", label: "Comprehensive Risk Assessment", description: "360° analysis of your financial safety.", isHot: true },
    { id: "mortgage_rate_drop", label: "Mortgage Rate Drop Calculator", description: "Calculate savings from refinancing.", isHot: true },
    { id: "compound_interest", label: "Compound Interest Engine", description: "See how your money grows over time." },
    { id: "leverage_sword", label: "The Leverage Double-Edged Sword", description: "Visualize how leverage magnifies gains & losses.", isHot: true },
    { id: "sensitivity_analysis", label: "Sensitivity & Elasticity Lab", description: "Wall Street-grade quantitative shock analysis.", isHot: true },
];

export function StressTestSection() {
    // Default open to risk_assessment
    const [activeToolId, setActiveToolId] = useState<string | null>("risk_assessment");

    return (
        <div className="space-y-6 w-full mt-8">
            <Separator />
            {/* Removed Header as per request */}

            {/* App Store Grid */}
            <div className="flex flex-wrap gap-3">
                {TOOLS.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => setActiveToolId(activeToolId === tool.id ? null : tool.id)}
                        disabled={tool.disabled}
                        className={cn(
                            "relative px-4 py-2 rounded-full border text-sm font-medium transition-all hover:scale-105",
                            activeToolId === tool.id
                                ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                                : "bg-card hover:bg-accent hover:text-accent-foreground border-border",
                            tool.disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {tool.label}
                        {tool.isHot && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Active Tool Panel Area */}
            {activeToolId === "risk_assessment" && <RiskAssessmentPanel />}
            {activeToolId === "mortgage_rate_drop" && <MortgageRateDropPanel />}
            {activeToolId === "compound_interest" && <CompoundInterestPanel />}
            {activeToolId === "leverage_sword" && <LeverageSwordPanel />}
            {activeToolId === "sensitivity_analysis" && <ElasticityLabPanel />}
        </div>
    );
}

// --- 0. Risk Assessment Panel (Quantitative Refactor) ---
function RiskAssessmentPanel() {
    const { profile, buyScenario, rentScenario, projections, sentiment } = useCalculator();

    // 1. Time Horizon Selector (Default Year 0)
    const [selectedYear, setSelectedYear] = useState<number>(0);
    const [analyzePath, setAnalyzePath] = useState<"buy" | "rent">("buy");

    // Inputs for fine-tuning
    const monthlyDebt = 0; // Hardcoded to 0 as per user request
    const [livingExpenses, setLivingExpenses] = useState<number>(1500);

    // --- QUANTITATIVE MATH ENGINE ---

    // Helper: Calculate Metrics for a specific year index
    const calculateMetrics = (yearIndex: number) => {
        const targetMonthIndex = Math.max(0, (yearIndex * 12) - 1);
        const data = projections[targetMonthIndex] || projections[0];
        const projectedIncome = profile.monthlyIncome * Math.pow(1 + profile.expectedSalaryGrowth / 100, yearIndex);

        // 1. Cash Flow (DTI)
        let housingCost = 0;
        if (analyzePath === "buy") {
            housingCost = data.mortgagePayment + data.propertyTax + data.maintenance;
        } else {
            housingCost = data.rentTotalOutflow;
        }
        const dti = ((housingCost + monthlyDebt) / projectedIncome) * 100;

        // 2. Liquidity (Runway)
        const totalExp = housingCost + monthlyDebt + livingExpenses;
        const liquidAssets = analyzePath === "buy" ? data.buyPortfolioValue : data.rentPortfolioValue;
        const runway = liquidAssets / totalExp;

        // 3. Leverage (LTV)
        // 3. Leverage (Balance Sheet)
        // Formula: Total Debt / Total Assets
        let ltv = 0;
        // liquidAssets reused from Liquidity calculation above
        const totalAssets = (analyzePath === "buy" ? data.homeValue : 0) + liquidAssets;
        const totalDebt = (analyzePath === "buy" ? data.remainingLoan : 0) + profile.currentDebt;

        if (totalAssets > 0) {
            ltv = (totalDebt / totalAssets) * 100;
        }

        // 4. Market (P/I)
        let pi = 0;
        if (analyzePath === "buy") {
            pi = data.homeValue / (projectedIncome * 12);
        }

        // 5. Shock (Stressed DTI)
        // Scenario A: Income -20%
        const stressedIncome = projectedIncome * 0.8;
        const dtiIncomeShock = ((housingCost + monthlyDebt) / stressedIncome) * 100;

        // Scenario B: Rate +2% (Buy only)
        let dtiRateShock = 0;
        if (analyzePath === "buy") {
            // Recalc mortgage payment approx?
            // Existing fixed mortgage doesn't change payment usually. 
            // But let's assume "Refinance Risk" or "Floating Rate" simulation as per prompt "Interest Rate spiked".
            // We'll approximate payment increase. 
            // Standard rule: 1% rate increase ~ 10-15% payment increase. 2% ~ 25%.
            const stressedHousing = (data.mortgagePayment * 1.25) + data.propertyTax + data.maintenance;
            dtiRateShock = ((stressedHousing + monthlyDebt) / projectedIncome) * 100;
        }
        const shockMetric = Math.max(dtiIncomeShock, dtiRateShock);

        // 6. Holding Cost (Burn Rate)
        // Unrecoverable / Gross Income
        let unrecoverable = 0;
        if (analyzePath === "buy") {
            unrecoverable = data.propertyTax + data.maintenance + data.interestPayment;
        } else {
            unrecoverable = data.rentTotalOutflow;
        }
        const burnRate = (unrecoverable / projectedIncome) * 100;

        return { dti, runway, ltv, pi, shockMetric, burnRate };
    };

    // Calculate for Current Selection, Year 0, Year 5, Year 10
    const current = calculateMetrics(selectedYear);
    const y0 = calculateMetrics(0);
    const y5 = calculateMetrics(5);
    const y10 = calculateMetrics(10);

    // Scoring & threshold logic (Low Risk = 100, Med = 70, High = 30)
    const getScore = (val: number, low: number, high: number, isHigherBetter = false) => {
        if (isHigherBetter) {
            if (val > low) return 100; // >12
            if (val >= high) return 70; // 6-12
            return 30; // <6
        } else {
            if (val < low) return 100;
            if (val <= high) return 70;
            return 30;
        }
    };

    const scores = {
        cashFlow: getScore(current.dti, 30, 40),
        liquidity: getScore(current.runway, 12, 6, true),
        leverage: getScore(current.ltv, 40, 60),
        market: analyzePath === "rent" ? 100 : getScore(current.pi, 5, 8),
        shock: getScore(current.shockMetric, 40, 50),
        holding: getScore(current.burnRate, 15, 25)
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) / 6;

    // Radar Data
    const radarData = [
        { subject: 'Cash Flow', A: scores.cashFlow, fullMark: 100 },
        { subject: 'Liquidity', A: scores.liquidity, fullMark: 100 },
        { subject: 'Leverage', A: scores.leverage, fullMark: 100 },
        { subject: 'Market Val', A: scores.market, fullMark: 100 },
        { subject: 'Shock Res', A: scores.shock, fullMark: 100 },
        { subject: 'Efficiency', A: scores.holding, fullMark: 100 },
    ];

    // Badge Logic
    let riskLevel = "Critical";
    let badgeColor = "bg-red-500 hover:bg-red-600";
    if (totalScore >= 80) { riskLevel = "Secure"; badgeColor = "bg-green-500 hover:bg-green-600"; }
    else if (totalScore >= 60) { riskLevel = "Stable"; badgeColor = "bg-yellow-500 hover:bg-yellow-600"; }


    return (
        <Card className="animate-in fade-in slide-in-from-top-4 border-l-4 border-l-cyan-500 bg-muted/30">
            <CardContent className="pt-6">
                {/* Header */}
                <div className="flex flex-col xl:flex-row gap-6 mb-8 justify-between items-start">
                    <div>
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            Projected Risk Assessment
                            <Badge className={badgeColor}>{riskLevel}</Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quantitative risk analysis based on <strong>Year {selectedYear}</strong> projections.
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap gap-4 items-center bg-background p-2 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-muted-foreground">Mode</span>
                            <div className="flex bg-muted rounded p-1">
                                <button onClick={() => setAnalyzePath("buy")} className={cn("px-3 py-1 text-xs rounded font-medium transition-all", analyzePath === "buy" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>Buy</button>
                                <button onClick={() => setAnalyzePath("rent")} className={cn("px-3 py-1 text-xs rounded font-medium transition-all", analyzePath === "rent" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>Rent</button>
                            </div>
                        </div>
                        <div className="h-4 w-px bg-border hidden sm:block"></div>

                        {/* Time Horizon Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-muted-foreground">Horizon</span>
                            <div className="flex bg-muted rounded p-1">
                                {[0, 3, 5, 10].map(yr => (
                                    <button
                                        key={yr}
                                        onClick={() => setSelectedYear(yr)}
                                        className={cn("px-3 py-1 text-xs rounded font-medium transition-all min-w-[50px]", selectedYear === yr ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        {yr === 0 ? "Now" : `Yr ${yr}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Radar Chart */}
                    <div className="bg-background rounded-xl border p-4 flex flex-col items-center justify-center relative min-h-[320px] shadow-sm">
                        <h4 className="absolute top-4 left-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">Risk Radar</h4>
                        <div className="w-full h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Score" dataKey="A" stroke="#0ea5e9" strokeWidth={2} fill="#0ea5e9" fillOpacity={0.3} />
                                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 w-full text-[10px] font-medium text-muted-foreground mt-2 border-t pt-3">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Low Risk (100)</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Med Risk (70)</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> High Risk (30)</div>
                        </div>
                    </div>

                    {/* Right: Quantitative Cards Grid */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <RiskCard
                            title="Cash Flow Sustainability"
                            metric={`${current.dti.toFixed(1)}%`}
                            formula="Housing + Debt / Income"
                            safe="<30%" danger=">40%"
                            score={scores.cashFlow}
                            projections={[
                                { label: "Now", val: y0.dti, score: getScore(y0.dti, 30, 40) },
                                { label: "Yr 5", val: y5.dti, score: getScore(y5.dti, 30, 40) },
                                { label: "Yr 10", val: y10.dti, score: getScore(y10.dti, 30, 40) }
                            ]}
                        />
                        <RiskCard
                            title="Liquidity Buffer"
                            metric={`${current.runway.toFixed(1)} mo`}
                            formula="Liquid Assets / Mo. Exp"
                            safe=">12m" danger="<6m"
                            score={scores.liquidity}
                            projections={[
                                { label: "Now", val: y0.runway, score: getScore(y0.runway, 12, 6, true) },
                                { label: "Yr 5", val: y5.runway, score: getScore(y5.runway, 12, 6, true) },
                                { label: "Yr 10", val: y10.runway, score: getScore(y10.runway, 12, 6, true) }
                            ]}
                        />
                        <RiskCard
                            title="Leverage (Balance Sheet)"
                            metric={`${current.ltv.toFixed(1)}%`}
                            formula="Total Debt / Total Wealth"
                            safe="<40%" danger=">60%"
                            score={scores.leverage}
                            isPercent
                            projections={[
                                { label: "Now", val: y0.ltv, score: getScore(y0.ltv, 40, 60) },
                                { label: "Yr 5", val: y5.ltv, score: getScore(y5.ltv, 40, 60) },
                                { label: "Yr 10", val: y10.ltv, score: getScore(y10.ltv, 40, 60) }
                            ]}
                        />
                        <RiskCard
                            title="Market Valuation"
                            metric={analyzePath === "rent" ? "N/A" : `${current.pi.toFixed(1)}x`}
                            formula="Price / Gross Income"
                            safe="<5x" danger=">8x"
                            score={scores.market}
                            projections={analyzePath === "rent" ? [] : [
                                { label: "Now", val: y0.pi, score: getScore(y0.pi, 5, 8) },
                                { label: "Yr 5", val: y5.pi, score: getScore(y5.pi, 5, 8) },
                                { label: "Yr 10", val: y10.pi, score: getScore(y10.pi, 5, 8) }
                            ]}
                        />
                        <RiskCard
                            title="Shock Absorption (Stress DTI)"
                            metric={`${current.shockMetric.toFixed(1)}%`}
                            formula="Stress: Income -20% or Rate +2%"
                            safe="<40%" danger=">50%"
                            score={scores.shock}
                            projections={[
                                { label: "Now", val: y0.shockMetric, score: getScore(y0.shockMetric, 40, 50) },
                                { label: "Yr 5", val: y5.shockMetric, score: getScore(y5.shockMetric, 40, 50) },
                                { label: "Yr 10", val: y10.shockMetric, score: getScore(y10.shockMetric, 40, 50) }
                            ]}
                        />
                        <RiskCard
                            title="Holding Efficiency (Burn)"
                            metric={`${current.burnRate.toFixed(1)}%`}
                            formula="Unrecoverable / Income"
                            safe="<15%" danger=">25%"
                            score={scores.holding}
                            projections={[
                                { label: "Now", val: y0.burnRate, score: getScore(y0.burnRate, 15, 25) },
                                { label: "Yr 5", val: y5.burnRate, score: getScore(y5.burnRate, 15, 25) },
                                { label: "Yr 10", val: y10.burnRate, score: getScore(y10.burnRate, 15, 25) }
                            ]}
                        />

                        {/* Tuner Inputs */}
                        <div className="col-span-1 sm:col-span-2 mt-2 p-3 bg-muted/30 rounded-lg border border-dashed flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Calibration</span>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs whitespace-nowrap text-muted-foreground mr-1">Est. Living Exp (€/mo)</Label>
                                    <Input type="number" className="h-6 w-32 text-xs bg-background" value={livingExpenses} onChange={e => setLivingExpenses(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground italic hidden sm:block">
                                *Projections assume conservative 1.5% income growth
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Projection Type
interface ProjectionPoint {
    label: string;
    val: number;
    score: number;
}

function RiskCard({ title, metric, formula, safe, danger, score, projections, isPercent }: {
    title: string,
    metric: string,
    formula: string,
    safe: string,
    danger: string,
    score: number,
    projections: ProjectionPoint[],
    isPercent?: boolean
}) {
    let badgeText = "High Risk";
    let badgeColor = "bg-red-100 text-red-700 border-red-200";
    if (score >= 100) { badgeText = "Low Risk"; badgeColor = "bg-green-100 text-green-700 border-green-200"; }
    else if (score >= 70) { badgeText = "Med Risk"; badgeColor = "bg-yellow-100 text-yellow-700 border-yellow-200"; }
    else if (metric === "N/A" || metric === "0%") { badgeText = "Low Risk"; badgeColor = "bg-green-100 text-green-700 border-green-200"; } // Handle N/A cleanly

    return (
        <div className="p-3 rounded-lg border bg-card shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-tight">{title}</span>
                <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-bold border-0", badgeColor)}>{badgeText}</Badge>
            </div>

            {/* Main Metric */}
            <div className="mb-1">
                <div className="text-2xl font-bold tracking-tight text-foreground">{metric}</div>
            </div>

            {/* Formula & Thresholds */}
            <div className="text-[10px] text-muted-foreground border-b pb-2 mb-2 flex justify-between">
                <span className="opacity-70 truncate max-w-[120px]" title={formula}>{formula}</span>
                <div className="flex gap-2 font-mono">
                    <span className="text-green-600/80">{safe}</span>
                    <span className="text-red-500/80">{danger}</span>
                </div>
            </div>

            {/* Time Projection Footer */}
            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
                {projections.length > 0 ? (
                    projections.map((p, i) => (
                        <div key={i} className="flex items-center gap-1">
                            {i > 0 && <span className="text-muted-foreground/40">➔</span>}
                            <span className={cn(
                                p.score >= 100 ? "text-green-600" : p.score >= 70 ? "text-yellow-600" : "text-red-600"
                            )}>
                                {isPercent ? `${p.val.toFixed(0)}%` : p.val.toFixed(1)}
                            </span>
                        </div>
                    ))
                ) : (
                    <span className="text-muted-foreground/50 italic">Not applicable for Renting</span>
                )}
            </div>
        </div>
    );
}

// --- 1. Mortgage Rate Drop Calculator Panel ---
function MortgageRateDropPanel() {
    const { buyScenario, projections, selectedMonth } = useCalculator();

    // Auto-fill from current state
    const currentData = projections[Math.min(selectedMonth - 1, projections.length - 1)] || projections[0];
    const initialPrincipal = currentData.remainingLoan > 0 ? currentData.remainingLoan : buyScenario.homePrice - (buyScenario.homePrice * buyScenario.downPaymentPercent / 100);
    const initialTerm = Math.max(1, buyScenario.loanTermYears - Math.floor(selectedMonth / 12));

    // Local State
    const [principal, setPrincipal] = useState<number>(Math.round(initialPrincipal));
    const [termYears, setTermYears] = useState<number>(initialTerm);
    const [currentRate, setCurrentRate] = useState<number>(buyScenario.mortgageRate);
    const [newRate, setNewRate] = useState<number>(buyScenario.mortgageRate - 1.0); // Default to 1% lower

    // Calculations
    const calculateLoan = (r: number) => {
        const monthlyRate = r / 100 / 12;
        const n = termYears * 12;
        const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
        const totalCost = payment * n;
        const totalInterest = totalCost - principal;
        return { payment, totalInterest };
    };

    const currentLoan = calculateLoan(currentRate);
    const newLoan = calculateLoan(newRate);

    const monthlySavings = currentLoan.payment - newLoan.payment;
    const totalSemvings = currentLoan.totalInterest - newLoan.totalInterest;

    return (
        <Card className="animate-in fade-in slide-in-from-top-4 border-l-4 border-l-primary bg-muted/30">
            <CardContent className="pt-6">
                <div className="grid md:grid-cols-12 gap-8">
                    {/* Left Column: Inputs */}
                    <div className="md:col-span-5 space-y-6">
                        <div>
                            <h3 className="font-bold text-lg">Mortgage Rate Drop Calculator</h3>
                            <p className="text-sm text-muted-foreground">See how much you could save with a lower interest rate.</p>
                        </div>

                        <div className="bg-background p-4 rounded-lg border space-y-4 shadow-sm">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Remaining Principal</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">€</span>
                                    <Input
                                        type="number"
                                        className="pl-6 font-bold"
                                        value={principal}
                                        onChange={(e) => setPrincipal(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Remaining Term (Years)</Label>
                                    <Input type="number" value={termYears} onChange={(e) => setTermYears(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Current Rate (%)</Label>
                                    <Input type="number" step="0.1" value={currentRate} onChange={(e) => setCurrentRate(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-emerald-600">New Interest Rate (%)</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        className="border-emerald-200 focus-visible:ring-emerald-500 bg-emerald-50/30 font-bold text-lg"
                                        value={newRate}
                                        onChange={(e) => setNewRate(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Results */}
                    <div className="md:col-span-7 flex flex-col justify-center space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Current Loan Card */}
                            <div className="p-4 rounded-lg border bg-background/50 text-center">
                                <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Current Loan</div>
                                <div className="text-2xl font-bold tracking-tight mb-1">
                                    €{Math.round(currentLoan.payment).toLocaleString()}
                                    <span className="text-xs font-normal text-muted-foreground">/mo</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Total Interest: €{Math.round(currentLoan.totalInterest).toLocaleString()}
                                </div>
                            </div>

                            {/* New Loan Card */}
                            <div className="p-4 rounded-lg border-2 border-emerald-500 bg-emerald-50/10 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-bl">New Deal</div>
                                <div className="text-xs font-bold text-emerald-700 uppercase mb-2">New Loan</div>
                                <div className="text-2xl font-bold tracking-tight mb-1 text-emerald-700">
                                    €{Math.round(newLoan.payment).toLocaleString()}
                                    <span className="text-xs font-normal text-emerald-600/70">/mo</span>
                                </div>
                                <div className="text-xs text-emerald-600/80">
                                    Total Interest: €{Math.round(newLoan.totalInterest).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Summary Savings */}
                        <div className="bg-emerald-100/50 border border-emerald-200 rounded-lg p-6 text-center animate-in zoom-in-95 duration-300">
                            <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4">Projected Savings</h4>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                                        €{Math.max(0, Math.round(monthlySavings)).toLocaleString()}
                                    </div>
                                    <div className="text-xs font-medium text-emerald-700 uppercase mt-1">Monthly Savings</div>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-0 top-2 bottom-2 w-px bg-emerald-200"></div>
                                    <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                                        €{Math.max(0, Math.round(totalSemvings)).toLocaleString()}
                                    </div>
                                    <div className="text-xs font-medium text-emerald-700 uppercase mt-1">Total Interest Saved</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// --- 2. Compound Interest Panel ---
function CompoundInterestPanel() {
    // State
    const [initialPrincipal, setInitialPrincipal] = useState<number>(10000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
    const [annualRate, setAnnualRate] = useState<number>(8.0);
    const [years, setYears] = useState<number>(20);

    // Math Engine
    const data = useMemo(() => {
        const result = [];
        const r = annualRate / 100;
        const n = 12; // Monthly compounding

        for (let t = 0; t <= years; t++) {
            // Total Contributions
            const contribution = initialPrincipal + (monthlyContribution * 12 * t);

            // Total Balance (Future Value)
            // FV = P*(1+r/n)^(nt) + PMT*(((1+r/n)^(nt)-1)/(r/n))
            let balance = 0;
            if (annualRate === 0) {
                balance = contribution;
            } else {
                const compoundFactor = Math.pow(1 + r / n, n * t);
                const pComponent = initialPrincipal * compoundFactor;
                const pmtComponent = monthlyContribution * ((compoundFactor - 1) / (r / n));
                balance = pComponent + pmtComponent;
            }

            result.push({
                year: t,
                contributions: Math.round(contribution),
                balance: Math.round(balance),
                interest: Math.round(balance - contribution)
            });
        }
        return result;
    }, [initialPrincipal, monthlyContribution, annualRate, years]);

    // Summary Metrics (End)
    const endState = data[data.length - 1];

    return (
        <Card className="animate-in fade-in slide-in-from-top-4 border-l-4 border-l-emerald-500 bg-muted/30">
            <CardContent className="pt-6 space-y-6">
                <div>
                    <h3 className="font-bold text-lg">The Power of Compound Interest</h3>
                    <p className="text-sm text-muted-foreground">See how your money grows over time with monthly compounding.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left Column: Inputs (Span 4) */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="bg-background p-4 rounded-lg border space-y-6 shadow-sm">
                            {/* Principal */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Initial Principal</Label>
                                    <span className="text-xs font-bold">€{initialPrincipal.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Slider
                                        min={0} max={100000} step={100}
                                        value={[initialPrincipal]}
                                        onValueChange={(v) => setInitialPrincipal(v[0])}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        className="w-32 h-8 text-xs text-right"
                                        value={initialPrincipal}
                                        onChange={(e) => setInitialPrincipal(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Monthly Contribution */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Monthly Contribution</Label>
                                    <span className="text-xs font-bold">€{monthlyContribution.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Slider
                                        min={0} max={5000} step={50}
                                        value={[monthlyContribution]}
                                        onValueChange={(v) => setMonthlyContribution(v[0])}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        className="w-32 h-8 text-xs text-right"
                                        value={monthlyContribution}
                                        onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Annual Rate */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Annual Return Rate (%)</Label>
                                    <span className="text-xs font-bold">{annualRate}%</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Slider
                                        min={0} max={20} step={0.1}
                                        value={[annualRate]}
                                        onValueChange={(v) => setAnnualRate(v[0])}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        className="w-32 h-8 text-xs text-right"
                                        value={annualRate}
                                        step={0.1}
                                        onChange={(e) => setAnnualRate(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Time Horizon */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Investment Horizon (Years)</Label>
                                    <span className="text-xs font-bold">{years} Years</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Slider
                                        min={1} max={50} step={1}
                                        value={[years]}
                                        onValueChange={(v) => setYears(v[0])}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        className="w-32 h-8 text-xs text-right"
                                        value={years}
                                        onChange={(e) => setYears(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Summary Card */}
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                            <div className="text-xs text-emerald-800 uppercase font-bold mb-1">Total Project Value</div>
                            <div className="text-2xl font-bold text-emerald-700">€{endState.balance.toLocaleString()}</div>
                            <div className="text-xs text-emerald-600 mt-1">
                                Interest Earned: <span className="font-bold">€{endState.interest.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visualization (Span 8) */}
                    <div className="md:col-span-8 bg-background p-4 rounded-lg border shadow-sm">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="year"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        tickFormatter={(val) => `Yr ${val}`}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        tickFormatter={(val) => `€${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                                        width={60}
                                    />
                                    <Tooltip
                                        formatter={(val: number | undefined) => [`€${(val || 0).toLocaleString()}`, '']}
                                        labelFormatter={(label) => `Year ${label}`}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="contributions"
                                        stackId="1"
                                        stroke="#94a3b8"
                                        fill="#cbd5e1"
                                        name="Total Contributions"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="interest"
                                        stackId="1"
                                        stroke="#10b981"
                                        fill="url(#colorBalance)"
                                        name="Compound Interest"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// --- 3. Leverage Sword Panel ---
function LeverageSwordPanel() {
    const { buyScenario } = useCalculator();

    // State
    const [homePrice, setHomePrice] = useState<number>(buyScenario.homePrice || 500000);
    const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
    const [priceChangePercent, setPriceChangePercent] = useState<number>(10);

    // Math Engine
    const initialDownPayment = homePrice * (downPaymentPercent / 100);
    const loanAmount = homePrice - initialDownPayment;
    const newHomeValue = homePrice * (1 + (priceChangePercent / 100));
    const currentEquity = newHomeValue - loanAmount;
    const roi = ((currentEquity - initialDownPayment) / initialDownPayment) * 100;
    const leverageRatio = homePrice / initialDownPayment;

    // Visualization Helpers for Progress Bars
    // We need a scale. Let's use max(Initial, Current) as 100% width.
    const maxVal = Math.max(initialDownPayment, Math.abs(currentEquity));
    const initialWidth = (initialDownPayment / maxVal) * 100;
    const equityWidth = (Math.abs(currentEquity) / maxVal) * 100;

    return (
        <Card className="animate-in fade-in slide-in-from-top-4 border-l-4 border-l-amber-500 bg-muted/30">
            <CardContent className="pt-6 space-y-6">
                <div>
                    <h3 className="font-bold text-lg">The Leverage Double-Edged Sword</h3>
                    <p className="text-sm text-muted-foreground">Visualize how leverage magnifies gains & losses.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Inputs */}
                    <div className="space-y-6">
                        {/* Warning Box */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                            <h4 className="font-bold mb-1 flex items-center gap-2">
                                <span className="text-lg">⚠️</span> The Dual Effect of Leverage
                            </h4>
                            <p className="opacity-90 leading-relaxed">
                                Mortgages allow you to control a large asset with a small down payment.
                                Gains are multiplied, but a price drop can quickly wipe out your equity or leave you in debt.
                            </p>
                        </div>

                        <div className="bg-background p-4 rounded-lg border space-y-6 shadow-sm">
                            {/* Home Price */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Home Price (€)</Label>
                                    <span className="text-xs font-bold">€{homePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Slider
                                        min={0} max={5000000} step={10000}
                                        value={[homePrice]}
                                        onValueChange={(v) => setHomePrice(v[0])}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        className="w-32 h-8 text-xs text-right"
                                        value={homePrice}
                                        onChange={(e) => setHomePrice(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Down Payment */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Down Payment (%)</Label>
                                    <span className="text-xs font-bold">{downPaymentPercent}%</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Slider
                                        min={5} max={100} step={1}
                                        value={[downPaymentPercent]}
                                        onValueChange={(v) => setDownPaymentPercent(v[0])}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        className="w-32 h-8 text-xs text-right"
                                        value={downPaymentPercent}
                                        onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Price Change */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Assumed Price Change (%)</Label>
                                    <span className={cn("text-xs font-bold", priceChangePercent >= 0 ? "text-green-600" : "text-red-600")}>
                                        {priceChangePercent > 0 ? "+" : ""}{priceChangePercent}%
                                    </span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Slider
                                        min={-50} max={50} step={1}
                                        value={[priceChangePercent]}
                                        onValueChange={(v) => setPriceChangePercent(v[0])}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        className="w-32 h-8 text-xs text-right"
                                        value={priceChangePercent}
                                        onChange={(e) => setPriceChangePercent(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: ROI Visualization */}
                    <div className="flex flex-col space-y-6">
                        <div className="bg-background p-6 rounded-lg border shadow-sm flex-1 flex flex-col justify-center text-center">
                            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Return on Investment (ROI)</h4>

                            {/* Big ROI Display */}
                            <div className={cn("text-6xl font-black tracking-tighter mb-6 transition-colors duration-300", roi >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {roi > 0 ? "+" : ""}{roi.toFixed(1)}%
                            </div>

                            {/* Visual Bars */}
                            <div className="space-y-4 mb-8 max-w-sm mx-auto w-full">
                                {/* Initial Down Payment Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase">
                                        <span>Initial Investment</span>
                                        <span>€{Math.round(initialDownPayment).toLocaleString()}</span>
                                    </div>
                                    <div className="h-4 bg-muted/50 rounded-full overflow-hidden w-full relative">
                                        <div
                                            className="h-full bg-slate-400/50 rounded-full absolute left-0 top-0 transition-all duration-500 ease-out"
                                            style={{ width: `${initialWidth}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Current Equity Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase">
                                        <span>Current Equity</span>
                                        <span className={currentEquity < 0 ? "text-red-500 font-bold" : ""}>€{Math.round(currentEquity).toLocaleString()}</span>
                                    </div>
                                    <div className="h-4 bg-muted/50 rounded-full overflow-hidden w-full relative">
                                        <div
                                            className={cn("h-full rounded-full absolute left-0 top-0 transition-all duration-500 ease-out", currentEquity >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                                            style={{ width: `${equityWidth}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Data Grid 2x2 */}
                            <div className="grid grid-cols-2 gap-4 border-t pt-6 text-left">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-muted-foreground font-bold">Initial Investment</div>
                                    <div className="text-lg font-bold">€{Math.round(initialDownPayment).toLocaleString()}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-muted-foreground font-bold">Current Equity</div>
                                    <div className={cn("text-lg font-bold", currentEquity < 0 ? "text-rose-600" : "")}>
                                        €{Math.round(currentEquity).toLocaleString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-muted-foreground font-bold">Leverage Ratio</div>
                                    <div className="text-lg font-bold">{leverageRatio.toFixed(1)}x</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-muted-foreground font-bold">New Home Value</div>
                                    <div className="text-lg font-bold">€{Math.round(newHomeValue).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Helpers ---

// Hook to run isolated projection
function useLocalProjection(localStress: StressTestParams) {
    const { profile, rentScenario, buyScenario, sentiment, projections: baseProjections } = useCalculator();

    const newProjections = useMemo(() => {
        return calculateProjections(profile, rentScenario, buyScenario, sentiment, localStress);
    }, [profile, rentScenario, buyScenario, sentiment, localStress]);

    const endMonth = 360;
    const baseEnd = baseProjections[endMonth - 1] || baseProjections[baseProjections.length - 1];
    const newEnd = newProjections[endMonth - 1] || newProjections[newProjections.length - 1];

    const diffData = {
        rentNetWorthDelta: newEnd ? (newEnd.netWorthRent - baseEnd.netWorthRent) : 0,
        buyNetWorthDelta: newEnd ? (newEnd.netWorthBuy - baseEnd.netWorthBuy) : 0,
        baseBuy: baseEnd.netWorthBuy,
        newBuy: newEnd ? newEnd.netWorthBuy : 0,
        baseRent: baseEnd.netWorthRent,
        newRent: newEnd ? newEnd.netWorthRent : 0,
    };

    return { diffData, newProjections };
}

function ImpactAnalysisCard({ diffData, mini }: { diffData: any, mini?: boolean }) {
    if (!diffData) return null;
    return (
        <div className="bg-background p-4 rounded-lg shadow-sm border">
            <h4 className="font-semibold text-sm mb-3">Long-term Net Worth Impact (Year 30)</h4>
            <div className="flex gap-8">
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
            {!mini && (
                <div className="mt-3 text-xs text-muted-foreground">
                    vs. Baseline: Buy €{(diffData.baseBuy / 1000000).toFixed(2)}M / Rent €{(diffData.baseRent / 1000000).toFixed(2)}M
                </div>
            )}
        </div>
    );
}

// --- 5. Sensitivity & Elasticity Lab ---

type PathRiskFlag = { type: 'liquidity' | 'dti'; year: number };

interface ShockScenario {
    id: string;
    name: string;
    badge: string;
    stressedBuyNW: number;
    stressedRentNW: number;
    deltaBuyAbs: number;
    deltaBuyPct: number;
    deltaRentAbs: number;
    deltaRentPct: number;
    newSpread: number;
    deltaSpread: number;
    flipped: boolean;
    elasticity: number;
    buyRisk: PathRiskFlag[];
    rentRisk: PathRiskFlag[];
}

type ShockVariable = 'investmentReturn' | 'homeAppreciation' | 'rentInflation' | 'salaryGrowth' | 'mortgageRate' | 'inflation';
type ShockDuration = 'permanent' | 'temporary';

/**
 * Time-bound shock simulation engine.
 * Runs the full 360-month loop with dynamic per-month rate evaluation.
 * If duration === 'temporary', the shock applies only in months 1-60,
 * then reverts exactly to the base rate from month 61 onward.
 */
function simulateWithCustomShock(
    profile: FinancialProfile,
    rentScenario: RentScenario,
    buyScenario: BuyScenario,
    sentiment: MarketSentiment,
    stressTest: StressTestParams,
    variable: ShockVariable,
    magnitude: number, // e.g. -1.5 means -1.5%
    duration: ShockDuration
): MonthlyCashFlow[] {
    const months = 360;
    const projections: MonthlyCashFlow[] = [];

    // Pre-compute shockeded values
    const shocked = (base: number, m: number) =>
        duration === 'permanent' ? base + magnitude : m <= 60 ? base + magnitude : base;

    // Mortgage rate: fixed at t=0 based on month-1 rate. For rate shock, use shocked rate.
    const effectiveMortgageRate = variable === 'mortgageRate'
        ? (duration === 'permanent' ? buyScenario.mortgageRate + magnitude : buyScenario.mortgageRate + magnitude) // always uses month-1 rate for amortization
        : buyScenario.mortgageRate;
    // NOTE: For temporary mortgage rate shock, the mortgage payment is fixed at the shocked rate for simplicity
    // since real mortgages are fixed-rate. The reversion affects the "opportunity" computation.

    const downPaymentAmount = buyScenario.homePrice * (buyScenario.downPaymentPercent / 100);
    const buyingClosingCostsAmount = buyScenario.homePrice * (buyScenario.buyingClosingCosts / 100);
    const loanAmount = buyScenario.homePrice - downPaymentAmount;
    const fixedMortgagePayment = calculateMortgagePayment(loanAmount, effectiveMortgageRate, buyScenario.loanTermYears);

    let rentPortfolio = profile.currentSavings - rentScenario.oneTimeFees;
    let buyPortfolio = profile.currentSavings - downPaymentAmount - buyingClosingCostsAmount;
    let currentLoanBalance = loanAmount;
    let currentHomeValue = buyScenario.homePrice;
    let currentRent = rentScenario.monthlyRent;
    let currentMonthlyIncome = profile.monthlyIncome;

    for (let i = 1; i <= months; i++) {
        // Dynamic rates — apply shock based on month and duration
        const effectiveInvReturn = variable === 'investmentReturn' ? shocked(sentiment.investmentReturn, i) : sentiment.investmentReturn;
        const effectiveHomeAppr = variable === 'homeAppreciation' ? shocked(sentiment.homeAppreciation, i) : sentiment.homeAppreciation;
        const effectiveRentInfl = variable === 'rentInflation' ? shocked(rentScenario.rentInflation, i) : rentScenario.rentInflation;
        const effectiveSalaryGrowth = variable === 'salaryGrowth' ? shocked(profile.expectedSalaryGrowth, i) : profile.expectedSalaryGrowth;
        const effectiveInflation = variable === 'inflation' ? shocked(sentiment.inflation, i) : sentiment.inflation;

        // Monthly compounding rates
        const monthlyInvRate = effectiveInvReturn / 100 / 12;
        const monthlyHomeApprRate = effectiveHomeAppr / 100 / 12;
        const monthlyRentInflRate = effectiveRentInfl / 100 / 12;
        const monthlySalaryRate = effectiveSalaryGrowth / 100 / 12;
        const monthlyInflRate = effectiveInflation / 100 / 12;

        // Grow income
        currentMonthlyIncome *= (1 + monthlySalaryRate);

        // Mortgage calcs
        let mortgagePayment = 0;
        let interestPayment = 0;
        let principalPayment = 0;
        if (currentLoanBalance > 0) {
            mortgagePayment = fixedMortgagePayment;
            interestPayment = currentLoanBalance * (effectiveMortgageRate / 100 / 12);
            principalPayment = mortgagePayment - interestPayment;
            if (principalPayment > currentLoanBalance) {
                principalPayment = currentLoanBalance;
                mortgagePayment = principalPayment + interestPayment;
            }
        }

        const monthlyPropertyTax = (currentHomeValue * (buyScenario.propertyTaxRate / 100)) / 12;
        const monthlyMaintenance = buyScenario.maintenanceMonthly * Math.pow(1 + monthlyInflRate, i);

        // Rent path
        const rentHousingCost = currentRent + rentScenario.rentersInsurance + rentScenario.otherMonthlyCosts;
        const rentDisposable = currentMonthlyIncome - rentHousingCost;
        const rentInvestable = rentDisposable * (profile.investmentRate / 100);
        rentPortfolio = rentPortfolio >= 0
            ? rentPortfolio * (1 + monthlyInvRate) + rentInvestable
            : rentPortfolio * (1 + 0.10 / 12) + rentInvestable;

        // Buy path
        const buyHousingCost = mortgagePayment + monthlyPropertyTax + monthlyMaintenance;
        const buyDisposable = currentMonthlyIncome - buyHousingCost;
        const buyInvestable = buyDisposable * (profile.investmentRate / 100);
        buyPortfolio = buyPortfolio >= 0
            ? buyPortfolio * (1 + monthlyInvRate) + buyInvestable
            : buyPortfolio * (1 + 0.10 / 12) + buyInvestable;

        // Update state
        currentRent *= (1 + monthlyRentInflRate);
        currentHomeValue *= (1 + monthlyHomeApprRate);
        currentLoanBalance -= principalPayment;
        if (currentLoanBalance < 0) currentLoanBalance = 0;

        const sellingCosts = currentHomeValue * (buyScenario.sellingClosingCosts / 100 || 0.06);
        const homeEquity = currentHomeValue - currentLoanBalance;
        const netWorthRent = rentPortfolio;
        const netWorthBuy = buyPortfolio + homeEquity - sellingCosts;

        projections.push({
            month: i, year: Math.ceil(i / 12),
            rentPayment: currentRent, rentInsurance: rentScenario.rentersInsurance, rentTotalOutflow: rentHousingCost,
            rentOpportunityInvested: rentInvestable, rentPortfolioValue: rentPortfolio,
            mortgagePayment, interestPayment, propertyTax: monthlyPropertyTax, maintenance: monthlyMaintenance,
            buyTotalOutflow: buyHousingCost, homeValue: currentHomeValue, remainingLoan: currentLoanBalance,
            homeEquity, buyOpportunityInvested: buyInvestable, buyPortfolioValue: buyPortfolio,
            netWorthRent, netWorthBuy,
        });
    }
    return projections;
}

// Shared formatter helpers (module-level)
const fmtE = (v: number, showSign = true) => {
    const rounded = Math.round(v);
    const sign = showSign ? (rounded >= 0 ? '+' : '-') : '';
    return `${sign}€${Math.abs(rounded).toLocaleString()}`;
};
const fmtPctE = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

function ElasticityLabPanel() {
    const { profile, buyScenario, rentScenario, sentiment, stressTest } = useCalculator();

    // Base case
    const baseProj = useMemo(() =>
        calculateProjections(profile, rentScenario, buyScenario, sentiment, stressTest),
        [profile, rentScenario, buyScenario, sentiment, stressTest]);

    const baseLast = baseProj[359] ?? baseProj[baseProj.length - 1];
    const baseBuyNW = baseLast?.netWorthBuy ?? 0;
    const baseRentNW = baseLast?.netWorthRent ?? 0;
    const baseSpread = baseBuyNW - baseRentNW;
    const baseWinner = baseSpread >= 0 ? 'buy' : 'rent';

    // --- TAB 2: Custom Scenario Lab State ---
    const [customVar, setCustomVar] = useState<ShockVariable>('investmentReturn');
    const [customMag, setCustomMag] = useState<number>(0);
    const [customDuration, setCustomDuration] = useState<ShockDuration>('permanent');

    // --- TAB 1: Standardized ±1% Shocks ---
    const shockDefs = useMemo(() => [
        { id: 'return_shock', name: 'Investment Return', badge: 'Inv. Return −1%', run: () => calculateProjections(profile, rentScenario, buyScenario, { ...sentiment, investmentReturn: sentiment.investmentReturn - 1 }, stressTest) },
        { id: 'appr_shock', name: 'Home Appreciation', badge: 'Home Appr. −1%', run: () => calculateProjections(profile, rentScenario, { ...buyScenario, homeAppreciation: (buyScenario.homeAppreciation ?? sentiment.homeAppreciation) - 1 }, { ...sentiment, homeAppreciation: sentiment.homeAppreciation - 1 }, stressTest) },
        { id: 'rent_infl_shock', name: 'Rent Inflation', badge: 'Rent Infl. +1%', run: () => calculateProjections(profile, { ...rentScenario, rentInflation: rentScenario.rentInflation + 1 }, buyScenario, sentiment, stressTest) },
        { id: 'salary_shock', name: 'Salary Growth', badge: 'Salary Growth −1%', run: () => calculateProjections({ ...profile, expectedSalaryGrowth: profile.expectedSalaryGrowth - 1 }, rentScenario, buyScenario, sentiment, stressTest) },
        { id: 'rate_shock', name: 'Mortgage Rate', badge: 'Mortgage Rate +1%', run: () => calculateProjections(profile, rentScenario, { ...buyScenario, mortgageRate: buyScenario.mortgageRate + 1 }, sentiment, stressTest) },
        { id: 'infl_shock', name: 'General Inflation', badge: 'Inflation +1%', run: () => calculateProjections(profile, rentScenario, buyScenario, { ...sentiment, inflation: sentiment.inflation + 1 }, stressTest) },
    ], [profile, rentScenario, buyScenario, sentiment, stressTest]);

    const scenarios: ShockScenario[] = useMemo(() => {
        return shockDefs.map(def => {
            const proj = def.run();
            const last = proj[359] ?? proj[proj.length - 1];
            const sBuy = last?.netWorthBuy ?? 0;
            const sRent = last?.netWorthRent ?? 0;
            const dBuyAbs = sBuy - baseBuyNW;
            const dRentAbs = sRent - baseRentNW;
            const dBuyPct = baseBuyNW !== 0 ? (dBuyAbs / Math.abs(baseBuyNW)) * 100 : 0;
            const dRentPct = baseRentNW !== 0 ? (dRentAbs / Math.abs(baseRentNW)) * 100 : 0;
            const newSpread = sBuy - sRent;
            const dSpread = newSpread - baseSpread;
            const newWinner = newSpread >= 0 ? 'buy' : 'rent';
            const flipped = newWinner !== baseWinner;
            const elasticity = Math.max(Math.abs(dBuyPct), Math.abs(dRentPct));
            const buyFlags = proj.map((m, idx) => {
                const yr = Math.ceil((idx + 1) / 12);
                const ratio = profile.monthlyIncome > 0 ? m.buyTotalOutflow / profile.monthlyIncome : 0;
                if (ratio > 0.5) return { type: 'dti' as const, year: yr };
                return null;
            }).filter(Boolean).filter((v, i, arr) => arr.findIndex(x => x?.year === v?.year) === i).slice(0, 2) as PathRiskFlag[];
            const rentFlags = proj.map((m, idx) => {
                const yr = Math.ceil((idx + 1) / 12);
                if (m.rentPortfolioValue < 0) return { type: 'liquidity' as const, year: yr };
                return null;
            }).filter(Boolean).filter((v, i, arr) => arr.findIndex(x => x?.year === v?.year) === i).slice(0, 2) as PathRiskFlag[];
            return { id: def.id, name: def.name, badge: def.badge, stressedBuyNW: sBuy, stressedRentNW: sRent, deltaBuyAbs: dBuyAbs, deltaBuyPct: dBuyPct, deltaRentAbs: dRentAbs, deltaRentPct: dRentPct, newSpread, deltaSpread: dSpread, flipped, elasticity, buyRisk: buyFlags, rentRisk: rentFlags };
        });
    }, [shockDefs, baseBuyNW, baseRentNW, baseSpread, baseWinner, profile.monthlyIncome]);

    const tornadoData = useMemo(() =>
        [...scenarios].sort((a, b) => Math.abs(b.deltaSpread) - Math.abs(a.deltaSpread))
            .map(s => ({ name: s.name, deltaSpread: Math.round(s.deltaSpread) })),
        [scenarios]);

    // --- TAB 2: Custom Simulation ---
    const customResult = useMemo(() => {
        if (customMag === 0) return null;
        const proj = simulateWithCustomShock(profile, rentScenario, buyScenario, sentiment, stressTest, customVar, customMag, customDuration);
        const last = proj[359] ?? proj[proj.length - 1];
        const cBuy = last?.netWorthBuy ?? 0;
        const cRent = last?.netWorthRent ?? 0;
        const newSpread = cBuy - cRent;
        const dSpread = newSpread - baseSpread;
        const newWinner = newSpread >= 0 ? 'buy' : 'rent';
        return {
            customBuyNW: cBuy,
            customRentNW: cRent,
            newSpread,
            deltaSpread: dSpread,
            deltaBuyAbs: cBuy - baseBuyNW,
            deltaRentAbs: cRent - baseRentNW,
            flipped: newWinner !== baseWinner,
            newWinner,
        };
    }, [profile, rentScenario, buyScenario, sentiment, stressTest, customVar, customMag, customDuration, baseBuyNW, baseRentNW, baseSpread, baseWinner]);

    const VAR_LABELS: Record<ShockVariable, string> = {
        investmentReturn: 'Investment Return',
        homeAppreciation: 'Home Appreciation',
        rentInflation: 'Rent Inflation',
        salaryGrowth: 'Salary Growth',
        mortgageRate: 'Mortgage Rate',
        inflation: 'General Inflation',
    };

    return (
        <Card className="animate-in fade-in slide-in-from-top-4 border-l-4 border-l-indigo-500 bg-muted/20">
            <CardContent className="pt-6 space-y-6">
                {/* Panel Header */}
                <div>
                    <h3 className="font-extrabold text-2xl tracking-tight">Sensitivity &amp; Elasticity Analysis</h3>
                    <p className="text-muted-foreground mt-1 text-sm">Quantify how a uniform 1% shock reshapes your long-term wealth, decision spread, and path risk.</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border">Base Buy NW: <b className="text-slate-700">{fmtE(baseBuyNW, false)}</b></span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border">Base Rent NW: <b className="text-slate-700">{fmtE(baseRentNW, false)}</b></span>
                        <span className={cn("px-2 py-0.5 rounded-full border font-semibold", baseSpread >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200')}>
                            Spread: {fmtE(baseSpread)} — {baseWinner === 'buy' ? 'Buying Wins' : 'Renting Wins'}
                        </span>
                    </div>
                </div>

                {/* Dual-Mode Tabs */}
                <Tabs defaultValue="standardized" className="w-full">
                    <TabsList className="mb-4 bg-slate-100 p-1 h-auto">
                        <TabsTrigger value="standardized" className="text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold">
                            📊 Standardized (±1%)
                        </TabsTrigger>
                        <TabsTrigger value="custom" className="text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold">
                            🧪 Custom Scenario Lab
                        </TabsTrigger>
                    </TabsList>

                    {/* ---- TAB 1: Standardized ---- */}
                    <TabsContent value="standardized" className="space-y-6">
                        {/* Tornado Chart */}
                        <div className="bg-background rounded-xl border shadow-sm p-6 space-y-4">
                            <div>
                                <h4 className="font-bold text-base">Impact on Buy vs. Rent Spread (Tornado Chart)</h4>
                                <p className="text-xs text-muted-foreground">Δ Spread = Stressed Spread − Base Spread. Negative = Renting becomes more attractive.</p>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={tornadoData} layout="vertical" margin={{ top: 5, right: 60, left: 150, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} width={145} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any) => [`${fmtE(Number(value ?? 0))} \u0394 Spread`, 'Impact']}
                                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    />
                                    <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
                                    <Bar dataKey="deltaSpread" radius={[0, 4, 4, 0]}>
                                        {tornadoData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.deltaSpread >= 0 ? '#10b981' : '#f43f5e'} />
                                        ))}
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        <LabelList dataKey="deltaSpread" position="right" formatter={(v: any) => fmtE(Number(v ?? 0))} style={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 3x2 Shock Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {scenarios.map(s => (
                                <div key={s.id} className="bg-background rounded-xl border shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow flex flex-col">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h5 className="font-bold text-sm text-slate-900">{s.name}</h5>
                                            <Badge variant="outline" className="mt-1 text-xs font-normal text-slate-400">{s.badge}</Badge>
                                        </div>
                                        {s.flipped && (
                                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                ⚡ Decision Flipped!
                                            </span>
                                        )}
                                    </div>
                                    <Separator />
                                    <div className="space-y-1.5 text-xs font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Buy Δ</span>
                                            <span className={cn("font-bold", s.deltaBuyAbs < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                                                {fmtE(s.deltaBuyAbs)} <span className="font-normal text-slate-400">({fmtPctE(s.deltaBuyPct)})</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Rent Δ</span>
                                            <span className={cn("font-bold", s.deltaRentAbs < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                                                {fmtE(s.deltaRentAbs)} <span className="font-normal text-slate-400">({fmtPctE(s.deltaRentPct)})</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg px-3 py-2 space-y-1 text-xs">
                                        <div className="flex justify-between text-slate-500">
                                            <span>New Spread</span>
                                            <span className={cn("font-bold", s.newSpread >= 0 ? 'text-emerald-700' : 'text-rose-700')}>{fmtE(s.newSpread, false)} ({s.newSpread >= 0 ? 'Buy' : 'Rent'} leads)</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Δ Spread</span>
                                            <span className={cn("font-semibold", s.deltaSpread < 0 ? 'text-rose-600' : 'text-emerald-600')}>{fmtE(s.deltaSpread)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Elasticity</span>
                                            <span className="font-bold text-indigo-600">{s.elasticity.toFixed(2)}x</span>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-1 space-y-1">
                                        {s.buyRisk.length === 0 && s.rentRisk.length === 0 ? (
                                            <p className="text-[11px] text-emerald-600 font-medium">✅ Path remains solvent</p>
                                        ) : (
                                            <>
                                                {s.buyRisk.map((f, i) => (
                                                    <p key={i} className="text-[11px] text-rose-600">⚠️ Buy DTI &gt;50% in Year {f.year}</p>
                                                ))}
                                                {s.rentRisk.map((f, i) => (
                                                    <p key={i} className="text-[11px] text-rose-600">⚠️ Rent liquidity depletion in Year {f.year}</p>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* ---- TAB 2: Custom Scenario Lab ---- */}
                    <TabsContent value="custom">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Control Panel */}
                            <div className="space-y-6 bg-background rounded-xl border shadow-sm p-6">
                                <div>
                                    <h4 className="font-bold text-base">Control Panel</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Tweak one variable at a time. Results update instantly.</p>
                                </div>

                                {/* Variable Selector */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Target Variable</Label>
                                    <Select value={customVar} onValueChange={(v) => setCustomVar(v as ShockVariable)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="investmentReturn">Investment Return</SelectItem>
                                            <SelectItem value="homeAppreciation">Home Appreciation</SelectItem>
                                            <SelectItem value="rentInflation">Rent Inflation</SelectItem>
                                            <SelectItem value="salaryGrowth">Salary Growth</SelectItem>
                                            <SelectItem value="mortgageRate">Mortgage Rate</SelectItem>
                                            <SelectItem value="inflation">General Inflation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Magnitude Slider */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-sm font-semibold text-slate-700">Shock Magnitude</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={-5}
                                                max={5}
                                                step={0.1}
                                                value={customMag}
                                                onChange={e => setCustomMag(Number(e.target.value))}
                                                className="w-20 text-center text-sm font-mono"
                                            />
                                            <span className="text-sm text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                    <Slider
                                        min={-5}
                                        max={5}
                                        step={0.1}
                                        value={[customMag]}
                                        onValueChange={([v]) => setCustomMag(v)}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-[11px] text-slate-400">
                                        <span>−5%</span>
                                        <span className="font-medium text-slate-600">{customMag >= 0 ? '+' : ''}{customMag.toFixed(1)}%</span>
                                        <span>+5%</span>
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Shock Duration</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['permanent', 'temporary'] as ShockDuration[]).map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setCustomDuration(d)}
                                                className={cn(
                                                    "rounded-lg border px-4 py-3 text-sm font-medium text-left transition-all",
                                                    customDuration === d
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                                                )}
                                            >
                                                {d === 'permanent' ? (
                                                    <><div className="font-semibold">Permanent</div><div className={cn("text-[11px] mt-0.5", customDuration === d ? 'text-indigo-200' : 'text-slate-400')}>All 30 years</div></>
                                                ) : (
                                                    <><div className="font-semibold">Temporary</div><div className={cn("text-[11px] mt-0.5", customDuration === d ? 'text-indigo-200' : 'text-slate-400')}>First 5 years only</div></>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Decision Impact Board */}
                            <div className="space-y-4">
                                {customMag === 0 ? (
                                    <div className="h-full bg-background rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[300px]">
                                        <span className="text-4xl">🎚️</span>
                                        <p className="font-semibold text-slate-600">Adjust the magnitude slider to run your custom simulation</p>
                                        <p className="text-sm text-slate-400">Change a variable above, set a shock, and the result will appear here instantly.</p>
                                    </div>
                                ) : customResult && (
                                    <div className="space-y-4">
                                        {/* Flip Badge */}
                                        {customResult.flipped && (
                                            <div className="flex items-center gap-3 rounded-lg border-2 border-red-400 bg-red-50 px-4 py-3">
                                                <span className="text-2xl">🔄</span>
                                                <div>
                                                    <p className="font-extrabold text-red-700 text-sm">DECISION REVERSED</p>
                                                    <p className="text-xs text-red-600">Under this shock, <b>{customResult.newWinner === 'buy' ? 'Buying' : 'Renting'}</b> now wins over 30 years.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Context Label */}
                                        <p className="text-xs text-slate-500 font-medium">
                                            Scenario: <b className="text-slate-700">{VAR_LABELS[customVar]}</b>
                                            {' '}{customMag >= 0 ? '+' : ''}{customMag.toFixed(1)}%
                                            {' '}({customDuration === 'permanent' ? 'Permanent, all 30 years' : 'Temporary, reverts after Year 5'})
                                        </p>

                                        {/* NW Cards */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-background rounded-xl border shadow-sm p-4 space-y-1">
                                                <p className="text-xs text-slate-400 font-medium">Custom Buy NW</p>
                                                <p className="text-xl font-extrabold text-slate-900">{fmtE(customResult.customBuyNW, false)}</p>
                                                <p className={cn("text-sm font-semibold", customResult.deltaBuyAbs < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                                                    {fmtE(customResult.deltaBuyAbs)} vs base
                                                </p>
                                            </div>
                                            <div className="bg-background rounded-xl border shadow-sm p-4 space-y-1">
                                                <p className="text-xs text-slate-400 font-medium">Custom Rent NW</p>
                                                <p className="text-xl font-extrabold text-slate-900">{fmtE(customResult.customRentNW, false)}</p>
                                                <p className={cn("text-sm font-semibold", customResult.deltaRentAbs < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                                                    {fmtE(customResult.deltaRentAbs)} vs base
                                                </p>
                                            </div>
                                        </div>

                                        {/* Spread Summary */}
                                        <div className="bg-slate-50 rounded-xl border p-5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500">New Spread (Buy − Rent)</span>
                                                <span className={cn("text-lg font-extrabold", customResult.newSpread >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                                                    {fmtE(customResult.newSpread, false)}
                                                </span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500">Δ Spread vs Base</span>
                                                <span className={cn("text-base font-bold", customResult.deltaSpread < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                                                    {fmtE(customResult.deltaSpread)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500">Scenario Winner</span>
                                                <span className={cn("px-3 py-1 rounded-full text-sm font-bold border", customResult.newWinner === 'buy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200')}>
                                                    {customResult.newWinner === 'buy' ? '🏠 Buying Wins' : '🏢 Renting Wins'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
