
"use client";

import React, { useMemo } from "react";
import { useCalculator } from "@/app/context/CalculatorContext";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    PieChart, Pie, Cell,
    BarChart, Bar, LabelList
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowUpRight, TrendingUp, DollarSign, Calendar } from "lucide-react";

// Simple Tabs Implementation to avoid missing dependency issues
const Tabs = ({ value, onValueChange, children, className }: any) => (
    <div className={className}>{React.Children.map(children, child => React.cloneElement(child, { value, onValueChange }))}</div>
);
const TabsList = ({ children, className }: any) => <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>{children}</div>;
const TabsTrigger = ({ value, children, onClick, activeValue }: any) => {
    // This needs proper context or prop passing. 
    // Let's just use a simpler approach in the main component instead of complex compound components.
    return null;
};

// ... Wait, proper compound components are hard to mock inline. 
// I will rewrite the Tabs content in the main render to use standard Buttons instead of these components.


export function ResultsSection() {
    const { projections, selectedMonth, setSelectedMonth, profile, buyScenario, rentScenario } = useCalculator();
    const [activeTab, setActiveTab] = React.useState<'rent' | 'buy'>('buy');

    // Find break-even month (when Buy Net Worth > Rent Net Worth)
    const breakEvenMonth = useMemo(() => {
        return projections.find(p => p.netWorthBuy > p.netWorthRent)?.month;
    }, [projections]);

    // Current data point based on slider
    const currentData = projections[Math.min(selectedMonth - 1, projections.length - 1)] || projections[projections.length - 1];

    // --- Dynamic Data Calculation ---

    // 1. T0 Capital Logic
    const downPayment = buyScenario.homePrice * (buyScenario.downPaymentPercent / 100);
    const closingCosts = buyScenario.homePrice * (buyScenario.buyingClosingCosts / 100);
    const rentFees = rentScenario.oneTimeFees; // e.g. Broker fee + Deposit

    // T0 Data Memoized
    const t0Data = React.useMemo(() => {
        if (activeTab === 'buy') {
            const totalUpfront = downPayment + closingCosts;
            const remainingSavings = Math.max(0, profile.currentSavings - totalUpfront);
            return [
                { name: 'Down Payment', value: downPayment, fill: '#4f46e5' }, // Indigo-600
                { name: 'Closing Costs', value: closingCosts, fill: '#db2777' }, // Pink-600
                { name: 'Invested Reserves', value: remainingSavings, fill: '#10b981' }, // Emerald-500
            ];
        } else {
            // Renting Path
            const investedAmount = Math.max(0, profile.currentSavings - rentFees);
            return [
                { name: 'Initial Fees', value: rentFees, fill: '#f59e0b' }, // Amber-500
                { name: 'Invested', value: investedAmount, fill: '#8b5cf6' }, // Violet-500
            ];
        }
    }, [activeTab, buyScenario, rentScenario, profile, downPayment, closingCosts, rentFees]);

    // 2. Formatting helpers (Renamed section for clarity)


    // 2. Formatting helpers (Renamed section for clarity)
    const formatCurrency = (val: number | undefined | null) => {
        if (typeof val !== 'number') return '€0';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    };

    const isRentWinner = currentData.netWorthRent > currentData.netWorthBuy;
    const isBuyWinner = currentData.netWorthBuy > currentData.netWorthRent;

    // View State
    const [viewMode, setViewMode] = React.useState<'chart' | 'table'>('chart');

    return (
        <div className="space-y-6 w-full">
            {/* Global Time Travel Slider (Full Width) */}
            <Card className="bg-muted/30 border-primary/20">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <span>Time Travel Simulation</span>
                            <span className="text-primary font-bold">Year {Math.ceil(selectedMonth / 12)}</span>
                        </div>
                        {/* View Toggle */}
                        <div className="flex bg-muted rounded-lg p-1 border">
                            <button
                                onClick={() => setViewMode('chart')}
                                className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-all", viewMode === 'chart' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                Charts
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-all", viewMode === 'table' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                Data Schedule
                            </button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Slider
                        min={1}
                        max={360}
                        step={1}
                        value={[selectedMonth]}
                        onValueChange={(val) => setSelectedMonth(val[0])}
                        className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Today (T0)</span>
                        <span>Year 5</span>
                        <span>Year 15</span>
                        <span>Year 30</span>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN (70%): Core Analysis */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Key Metrics Grid - Dynamic Winner Highlight */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MetricCard
                            label="Net Worth (Rent)"
                            value={formatCurrency(currentData.netWorthRent)}
                            subtext="Liquid Invested Assets"
                            isWinner={isRentWinner}
                        />
                        <MetricCard
                            label="Net Worth (Buy)"
                            value={formatCurrency(currentData.netWorthBuy)}
                            subtext={`Equity: ${formatCurrency(currentData.homeEquity)}`}
                            isWinner={isBuyWinner}
                        />
                    </div>

                    {/* Main Content Area (Chart OR Table) */}
                    <Card className="min-h-[500px] flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between items-center">
                                <span>{viewMode === 'chart' ? "Net Worth Projection (30 Years)" : "Detailed Financial Schedule"}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                            {viewMode === 'chart' ? (
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={projections} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis
                                                dataKey="month"
                                                tickFormatter={(val) => `Y${Math.ceil(val / 12)}`}
                                                minTickGap={30}
                                                fontSize={12}
                                            />
                                            <YAxis
                                                tickFormatter={(val) => `€${val / 1000}k`}
                                                width={60}
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                formatter={(val: any) => formatCurrency(val)}
                                                labelFormatter={(label) => `Year ${Math.ceil(label / 12)}`}
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                            />
                                            <Legend />
                                            <ReferenceLine x={selectedMonth} stroke="red" strokeDasharray="3 3" />
                                            <Line
                                                type="monotone"
                                                dataKey="netWorthRent"
                                                name="Net Worth (Rent)"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                dot={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="netWorthBuy"
                                                name="Net Worth (Buy)"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 8 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <DataScheduleTable data={projections} format={formatCurrency} />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN (30%): Capital & Cash Flow Analysis (Unchanged) */}
                <div className="lg:col-span-4 space-y-6 flex flex-col h-full">
                    {/* Scenario Toggle */}
                    <div className="grid grid-cols-2 p-1 bg-muted rounded-lg w-full shrink-0">
                        <button
                            onClick={() => setActiveTab('rent')}
                            className={cn(
                                "py-2 text-sm font-semibold rounded-md transition-all duration-200",
                                activeTab === 'rent'
                                    ? "bg-background shadow-sm text-foreground ring-1 ring-black/5"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            Renting Path
                        </button>
                        <button
                            onClick={() => setActiveTab('buy')}
                            className={cn(
                                "py-2 text-sm font-semibold rounded-md transition-all duration-200",
                                activeTab === 'buy'
                                    ? "bg-background shadow-sm text-foreground ring-1 ring-black/5"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            Buying Path
                        </button>
                    </div>

                    {/* T0 Capital Allocation */}
                    <Card className="flex-1 min-h-[400px] overflow-hidden flex flex-col">
                        <CardHeader className="pb-2 border-b bg-muted/10 shrink-0">
                            <CardTitle className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-widest">
                                Initial Capital (T0)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 relative mt-4 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <Pie
                                        data={t0Data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={5}
                                    >
                                        {t0Data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any) => formatCurrency(val)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        iconSize={10}
                                        wrapperStyle={{ fontSize: '13px', paddingTop: '10px', fontWeight: 500 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center px-4">
                                    Total Savings
                                </div>
                                <div className="text-2xl font-extrabold text-foreground mt-1 tracking-tight">
                                    {formatCurrency(profile.currentSavings)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Verdict Mini Card */}
                    <div className={cn(
                        "rounded-lg border p-5 shadow-sm transition-colors shrink-0",
                        breakEvenMonth ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" : "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                    )}>
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className={cn("h-5 w-5", breakEvenMonth ? "text-emerald-600" : "text-amber-600")} />
                            <span className={cn("font-bold text-base", breakEvenMonth ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
                                Smart Money Verdict
                            </span>
                        </div>
                        <p className={cn("text-sm font-medium leading-relaxed", breakEvenMonth ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300")}>
                            {breakEvenMonth
                                ? `Buying becomes wealthier after Year ${Math.ceil(breakEvenMonth / 12)}.`
                                : "Renting yields higher net worth for the entire 30 years."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DataScheduleTable({ data, format }: { data: any[], format: (val: number) => string }) {
    // Filter to get 1 record per year (month 12, 24, etc.) + Month 1 for Year 1
    const annualData = useMemo(() => {
        return data.filter((d) => d.month % 12 === 0 || d.month === 1 || d.month === data.length);
    }, [data]);

    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px]">Year</TableHead>
                    <TableHead>Net Worth (Buy)</TableHead>
                    <TableHead>Net Worth (Rent)</TableHead>
                    <TableHead className="text-right">Difference</TableHead>
                    <TableHead className="text-right">Home Equity</TableHead>
                    <TableHead className="text-right">Loan Balance</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {annualData.map((row) => {
                    const diff = row.netWorthBuy - row.netWorthRent;
                    return (
                        <TableRow key={row.month} className="hover:bg-muted/50">
                            <TableCell className="font-medium">Yr {Math.ceil(row.month / 12)}</TableCell>
                            <TableCell className="text-emerald-600 font-semibold">{format(row.netWorthBuy)}</TableCell>
                            <TableCell className="text-blue-600 font-semibold">{format(row.netWorthRent)}</TableCell>
                            <TableCell className={cn("text-right font-bold", diff > 0 ? "text-emerald-600" : "text-amber-600")}>
                                {diff > 0 ? "+" : ""}{format(diff)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{format(row.homeEquity)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{format(row.remainingLoan)}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function MetricCard({ label, value, subtext, status = "default", isWinner = false }: { label: string, value: string, subtext?: string, status?: "default" | "neutral", isWinner?: boolean }) {
    return (
        <Card className={cn(
            "relative transition-all duration-300",
            isWinner && "border-2 border-primary shadow-lg bg-primary/5 dark:bg-primary/10 transform scale-[1.02]"
        )}>
            {isWinner && (
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-in fade-in zoom-in duration-300">
                    WINNER 🏆
                </div>
            )}
            <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">{label}</div>
                <div className={cn("text-2xl font-bold mt-1", isWinner && "text-primary")}>{value}</div>
                {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
            </CardContent>
        </Card>
    );
}
