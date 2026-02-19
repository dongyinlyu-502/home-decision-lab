
"use client";

import React, { useState, useEffect } from 'react';
import { useCalculator } from '@/app/context/CalculatorContext';
import { Button } from '@/components/ui/button';
import { Linkedin, Save } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function Header() {
    const {
        profile,
        buyScenario,
        rentScenario,
        updateProfile,
        updateBuyScenario,
        updateRentScenario,
    } = useCalculator();

    const [currentTime, setCurrentTime] = useState<string>("");
    const [mounted, setMounted] = useState(false);
    const [presetValue, setPresetValue] = useState("");

    // Live Time
    useEffect(() => {
        setMounted(true);
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Load Setup on Mount
    useEffect(() => {
        const savedData = localStorage.getItem('wealth_compass_setup');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.profile) updateProfile(parsed.profile);
                if (parsed.buyScenario) updateBuyScenario(parsed.buyScenario);
                if (parsed.rentScenario) updateRentScenario(parsed.rentScenario);
                console.log("Loaded setup from LocalStorage");
            } catch (e) {
                console.error("Failed to load setup", e);
            }
        }
    }, [updateProfile, updateBuyScenario, updateRentScenario]);

    const handleSave = () => {
        const dataToSave = {
            profile,
            buyScenario,
            rentScenario,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('wealth_compass_setup', JSON.stringify(dataToSave));
        alert("Setup Saved! Your configuration will be loaded automatically next time.");
    };

    const applyPreset = (type: string) => {
        switch (type) {
            case 'junior':
                updateProfile({ monthlyIncome: 3500, currentSavings: 10000, expectedSalaryGrowth: 8, currentDebt: 0 });
                break;
            case 'mid':
                updateProfile({ monthlyIncome: 6000, currentSavings: 80000, expectedSalaryGrowth: 4, currentDebt: 0 });
                break;
            case 'senior':
                updateProfile({ monthlyIncome: 12000, currentSavings: 300000, expectedSalaryGrowth: 2, currentDebt: 0 });
                break;
        }
        setPresetValue(type);
    };

    if (!mounted) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container max-w-[1600px] mx-auto flex h-14 items-center justify-between px-4">
                {/* Left: Live Time */}
                <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                    <span className="tabular-nums font-mono text-foreground">{currentTime}</span>
                    <span className="hidden md:inline text-xs opacity-50">Local Time</span>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2 md:gap-3 ml-auto">

                    {/* Quick Personas */}
                    <div className="hidden md:block w-[180px]">
                        <Select value={presetValue} onValueChange={applyPreset}>
                            <SelectTrigger className="h-8">
                                <SelectValue placeholder="Quick Personas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="junior">Junior (New Grad)</SelectItem>
                                <SelectItem value="mid">Mid-Level (Pro)</SelectItem>
                                <SelectItem value="senior">Senior (Executive)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Save Setup */}
                    <Button variant="ghost" size="sm" onClick={handleSave} className="gap-2" title="Save Setup to Browser">
                        <Save className="h-4 w-4" />
                        <span className="hidden sm:inline">Save Setup</span>
                    </Button>



                    {/* LinkedIn */}
                    <Button variant="default" size="sm" asChild className="gap-2 bg-[#0077b5] hover:bg-[#006399] text-white">
                        <a href="https://www.linkedin.com/in/dongyin-lyu-dongyin/" target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4" />
                            <span className="hidden sm:inline">Connect</span>
                        </a>
                    </Button>
                </div>
            </div>
        </header>
    );
}
