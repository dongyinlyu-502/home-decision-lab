
"use client";

import React, { useState } from "react";
import { useCalculator } from "@/app/context/CalculatorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { SENTIMENT_MODES } from "@/lib/constants";

export function InputSection() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            <FinancialProfileCard />
            <MarketSentimentCard />
            <RentScenarioCard />
            <BuyScenarioCard />
        </div>
    );
}

function FinancialProfileCard() {
    const { profile, updateProfile } = useCalculator();

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">1. Financial Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="monthlyIncome">Monthly Income (€)</Label>
                    <Input
                        id="monthlyIncome"
                        type="number"
                        value={profile.monthlyIncome}
                        onChange={(e) => updateProfile({ monthlyIncome: Number(e.target.value) })}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="currentSavings">Current Savings (€)</Label>
                    <Input
                        id="currentSavings"
                        type="number"
                        value={profile.currentSavings}
                        onChange={(e) => updateProfile({ currentSavings: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">Used for down payment or initial investment.</p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="currentDebt">Current Debt (€)</Label>
                    <Input
                        id="currentDebt"
                        type="number"
                        value={profile.currentDebt || 0}
                        onChange={(e) => updateProfile({ currentDebt: Number(e.target.value) })}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="expectedGrowth">Expected Salary Growth (%/year)</Label>
                    <div className="flex items-center gap-4">
                        <Slider
                            id="expectedGrowth"
                            min={0}
                            max={10}
                            step={0.5}
                            value={[profile.expectedSalaryGrowth]}
                            onValueChange={(val) => updateProfile({ expectedSalaryGrowth: val[0] })}
                            className="flex-1"
                        />
                        <span className="w-12 text-sm text-right">{profile.expectedSalaryGrowth}%</span>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="investmentRate">Monthly Investment Rate (%)</Label>
                    <div className="flex items-center gap-4">
                        <Slider
                            id="investmentRate"
                            min={0}
                            max={100}
                            step={5}
                            value={[profile.investmentRate ?? 50]}
                            onValueChange={(val) => updateProfile({ investmentRate: val[0] })}
                            className="flex-1"
                        />
                        <span className="w-12 text-sm text-right">{profile.investmentRate ?? 50}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">% of disposable income invested.</p>
                </div>
                {/* Cash Flow Check */}
                <CashFlowWarning />
            </CardContent>
        </Card>
    );
}

function CashFlowWarning() {
    const { profile, rentScenario, buyScenario } = useCalculator();
    // Estimate initial monthly costs to see if income covers it
    const monthlyIncome = profile.monthlyIncome;

    // Rent Check
    const rentCost = rentScenario.monthlyRent + rentScenario.rentersInsurance + rentScenario.otherMonthlyCosts;

    // Buy Check (approximate initial)
    const downPayment = buyScenario.homePrice * (buyScenario.downPaymentPercent / 100);
    const loanAmount = buyScenario.homePrice - downPayment;

    // Simple mortgage P&I for UI check
    const r = buyScenario.mortgageRate / 100 / 12;
    const n = buyScenario.loanTermYears * 12;
    const mortgage = r > 0 ? loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loanAmount / n;

    const tax = (buyScenario.homePrice * buyScenario.propertyTaxRate / 100) / 12;
    const maint = buyScenario.maintenanceMonthly;
    const buyCost = mortgage + tax + maint;

    const isRentNegative = monthlyIncome < rentCost;
    const isBuyNegative = monthlyIncome < buyCost;

    if (!isRentNegative && !isBuyNegative) return null;

    return (
        <div className="space-y-2 mt-2">
            {isRentNegative && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                    <strong>Warning (Rent):</strong> Monthly costs (€{Math.round(rentCost)}) exceed income.
                </div>
            )}
            {isBuyNegative && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                    <strong>Warning (Buy):</strong> Monthly costs (~€{Math.round(buyCost)}) exceed income.
                </div>
            )}
        </div>
    );
}

function MarketSentimentCard() {
    const { sentiment, updateSentiment, updateBuyScenario } = useCalculator();
    const [mode, setMode] = useState<"pessimistic" | "neutral" | "optimistic" | "custom">("neutral");
    const [invStyle, setInvStyle] = useState<"conservative" | "balanced" | "aggressive">("balanced");

    const applyPreset = (newMode: "pessimistic" | "neutral" | "optimistic", newInvStyle: "conservative" | "balanced" | "aggressive") => {
        const sentimentData = SENTIMENT_MODES[newMode];
        const invReturn = sentimentData.investmentReturn[newInvStyle];

        updateSentiment({
            homeAppreciation: sentimentData.homeAppreciation,
            investmentReturn: invReturn,
        });
        // Also update buy scenario appreciation default
        updateBuyScenario({ homeAppreciation: sentimentData.homeAppreciation });
    };

    const handleModeChange = (val: string) => {
        const m = val as any;
        setMode(m);
        if (m !== "custom") {
            applyPreset(m, invStyle);
        }
    };

    const handleInvStyleChange = (val: string) => {
        const s = val as any;
        setInvStyle(s);
        if (mode !== "custom") {
            applyPreset(mode, s);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">2. Market Sentiment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Market Outlook</Label>
                        <Select value={mode} onValueChange={handleModeChange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pessimistic">Pessimistic</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="optimistic">Optimistic</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Investment Style</Label>
                        <Select value={invStyle} onValueChange={handleInvStyleChange} disabled={mode === "custom"}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="conservative">Conservative</SelectItem>
                                <SelectItem value="balanced">Balanced</SelectItem>
                                <SelectItem value="aggressive">Aggressive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Display current rates (read-only if not custom, or editable if custom?) 
                    PRD says "seamless transition to Custom Mode for manual overrides".
                    So if user edits these sliders, mode becomes Custom.
                */}
                <div className="pt-2 space-y-4">
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <Label>Home Appreciation</Label>
                            <span className="text-sm text-muted-foreground">{sentiment.homeAppreciation}%</span>
                        </div>
                        <Slider
                            min={-5}
                            max={15}
                            step={0.5}
                            value={[sentiment.homeAppreciation]}
                            onValueChange={(val) => {
                                setMode("custom");
                                updateSentiment({ homeAppreciation: val[0] });
                                updateBuyScenario({ homeAppreciation: val[0] });
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <Label>Investment Return</Label>
                            <span className="text-sm text-muted-foreground">{sentiment.investmentReturn}%</span>
                        </div>
                        <Slider
                            min={0}
                            max={25}
                            step={0.5}
                            value={[sentiment.investmentReturn]}
                            onValueChange={(val) => {
                                setMode("custom");
                                updateSentiment({ investmentReturn: val[0] });
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <Label>Inflation</Label>
                            <span className="text-sm text-muted-foreground">{sentiment.inflation}%</span>
                        </div>
                        <Slider
                            min={0}
                            max={10}
                            step={0.1}
                            value={[sentiment.inflation]}
                            onValueChange={(val) => {
                                setMode("custom");
                                updateSentiment({ inflation: val[0] });
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RentScenarioCard() {
    const { rentScenario, updateRentScenario } = useCalculator();

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">3. Rent Scenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Monthly Rent (€)</Label>
                        <div className="flex items-center gap-4">
                            <Slider
                                min={500}
                                max={10000}
                                step={50}
                                value={[rentScenario.monthlyRent]}
                                onValueChange={(val) => updateRentScenario({ monthlyRent: val[0] })}
                                className="flex-1"
                            />
                            <Input
                                type="number"
                                value={rentScenario.monthlyRent}
                                onChange={(e) => updateRentScenario({ monthlyRent: Number(e.target.value) })}
                                className="w-24"
                            />
                        </div>
                    </div>
                </div>

                <Accordion type="single" collapsible>
                    <AccordionItem value="advanced-rent">
                        <AccordionTrigger>Advanced Settings</AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-2">
                            <div className="grid gap-2">
                                <Label>Renters Insurance (€/mo)</Label>
                                <Input
                                    type="number"
                                    value={rentScenario.rentersInsurance}
                                    onChange={(e) => updateRentScenario({ rentersInsurance: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Other Monthly Costs (€)</Label>
                                <Input
                                    type="number"
                                    value={rentScenario.otherMonthlyCosts}
                                    onChange={(e) => updateRentScenario({ otherMonthlyCosts: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>One-time Fees (Broker/Deposit) (€)</Label>
                                <Input
                                    type="number"
                                    value={rentScenario.oneTimeFees}
                                    onChange={(e) => updateRentScenario({ oneTimeFees: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Rent Inflation (%/year)</Label>
                                <div className="flex items-center gap-2">
                                    <Slider
                                        min={0} max={10} step={0.1}
                                        value={[rentScenario.rentInflation]}
                                        onValueChange={(val) => updateRentScenario({ rentInflation: val[0] })}
                                        className="flex-1"
                                    />
                                    <span className="text-sm w-10 text-right">{rentScenario.rentInflation}%</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}

function BuyScenarioCard() {
    const { buyScenario, updateBuyScenario } = useCalculator();

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">4. Buy Scenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Home Price (€)</Label>
                        <div className="flex items-center gap-4">
                            <Slider
                                min={100000}
                                max={5000000}
                                step={5000}
                                value={[buyScenario.homePrice]}
                                onValueChange={(val) => updateBuyScenario({ homePrice: val[0] })}
                                className="flex-1"
                            />
                            <Input
                                type="number"
                                value={buyScenario.homePrice}
                                onChange={(e) => updateBuyScenario({ homePrice: Number(e.target.value) })}
                                className="w-28"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Down Payment (%)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={buyScenario.downPaymentPercent}
                                onChange={(e) => updateBuyScenario({ downPaymentPercent: Number(e.target.value) })}
                                className="w-20"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                €{(buyScenario.homePrice * buyScenario.downPaymentPercent / 100).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Mortgage Rate (%)</Label>
                        <Input
                            type="number"
                            step={0.125}
                            value={buyScenario.mortgageRate}
                            onChange={(e) => updateBuyScenario({ mortgageRate: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <Accordion type="single" collapsible>
                    <AccordionItem value="advanced-buy">
                        <AccordionTrigger>Advanced Settings</AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-2">
                            <div className="grid gap-2">
                                <Label>Loan Term (Years)</Label>
                                <Select
                                    value={String(buyScenario.loanTermYears)}
                                    onValueChange={(val) => updateBuyScenario({ loanTermYears: Number(val) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 Years</SelectItem>
                                        <SelectItem value="30">30 Years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Property Tax (%/year)</Label>
                                <Input
                                    type="number"
                                    step={0.1}
                                    value={buyScenario.propertyTaxRate}
                                    onChange={(e) => updateBuyScenario({ propertyTaxRate: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Monthly Maintenance (€)</Label>
                                <Input
                                    type="number"
                                    value={buyScenario.maintenanceMonthly}
                                    onChange={(e) => updateBuyScenario({ maintenanceMonthly: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Buying Closing Costs (%)</Label>
                                <Input
                                    type="number"
                                    value={buyScenario.buyingClosingCosts}
                                    onChange={(e) => updateBuyScenario({ buyingClosingCosts: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Selling Closing Costs (%)</Label>
                                <Input
                                    type="number"
                                    value={buyScenario.sellingClosingCosts}
                                    onChange={(e) => updateBuyScenario({ sellingClosingCosts: Number(e.target.value) })}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <StartupFundsWarning />
            </CardContent>
        </Card>
    );
}

function StartupFundsWarning() {
    const { profile, buyScenario } = useCalculator();
    const downPayment = buyScenario.homePrice * (buyScenario.downPaymentPercent / 100);
    const closingCosts = buyScenario.homePrice * (buyScenario.buyingClosingCosts / 100);
    const requiredCash = downPayment + closingCosts;
    const isInsufficient = profile.currentSavings < requiredCash;

    if (!isInsufficient) return null;

    return (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 mt-2">
            <strong>Insufficient Savings:</strong> You need €{(requiredCash).toLocaleString()} for down payment & closing costs, but only have €{profile.currentSavings.toLocaleString()}.
        </div>
    );
}
