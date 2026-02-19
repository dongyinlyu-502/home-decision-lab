"use client";

import React from "react";
import { CalculatorProvider } from "@/app/context/CalculatorContext";
import { InputSection } from "@/app/components/calculator/InputSection";
import { ResultsSection } from "@/app/components/calculator/ResultsSection";
import { StressTestSection } from "@/app/components/calculator/StressTestSection";
import { ShieldCheck } from "lucide-react";
import { Header } from "@/app/components/Header";
import { FooterSection } from "@/app/components/FooterSection";

export default function Home() {


  return (
    <CalculatorProvider>
      <div className="min-h-screen bg-background font-sans flex flex-col">
        <Header />

        {/* Row 1: Hero Section */}
        <div className="relative isolate overflow-hidden bg-background py-16 sm:py-20 lg:py-24 border-b border-border/40">
          <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-20" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-200 to-sky-200 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-full text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl mb-6 drop-shadow-sm">
                Home Decision Lab
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-full mx-auto">
                A structured quantitative framework for evaluating the rent-vs-buy decision. Model long-term wealth accumulation, simulate leverage and liquidity exposure, and analyze risk under different market assumptions — all through a transparent financial engine.
              </p>

              <div className="mt-8 flex items-center justify-center gap-x-6">
                <div className="inline-flex items-center gap-x-2 rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-200/60 bg-white/60 backdrop-blur-sm shadow-sm transition-colors hover:bg-white/80">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-slate-700">Privacy-First</span>
                  <span className="h-4 w-px bg-slate-200 mx-1"></span>
                  <span className="text-slate-500 font-normal">No accounts. No tracking. No stored inputs.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)] opacity-20" aria-hidden="true">
            <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-sky-200 to-emerald-200 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
          </div>
        </div>

        {/* Report capture zone — wraps all three dashboard sections */}
        <main
          className="flex-1 container max-w-[1600px] mx-auto px-4 py-8 space-y-12"
        >
          {/* Row 2: Horizontal Input Dashboard */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold tracking-tight">1. Configure Your Scenario</h2>
            </div>
            <InputSection />
          </section>

          <div className="w-full h-px bg-border/60" />

          {/* Row 3: Core Analysis (Time Travel & Charts) */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold tracking-tight">2. Wealth Projection Engine</h2>
            </div>
            <ResultsSection />
          </section>

          <div className="w-full h-px bg-border/60" />

          {/* Row 4: Financial Toolkit & Stress Lab */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold tracking-tight">3. Financial Toolkit &amp; Stress Lab</h2>
            </div>
            <StressTestSection />
          </section>
        </main>

        {/* Footer: Feedback & Support */}
        <FooterSection />
      </div>
    </CalculatorProvider>
  );
}
