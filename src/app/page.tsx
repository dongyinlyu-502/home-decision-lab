"use client";

import React, { useRef, useState, useCallback } from "react";
import { CalculatorProvider } from "@/app/context/CalculatorContext";
import { InputSection } from "@/app/components/calculator/InputSection";
import { ResultsSection } from "@/app/components/calculator/ResultsSection";
import { StressTestSection } from "@/app/components/calculator/StressTestSection";
import { ShieldCheck } from "lucide-react";
import { Header } from "@/app/components/Header";
import { FooterSection } from "@/app/components/FooterSection";

export default function Home() {
  const reportRef = useRef<HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = useCallback(async () => {
    const node = reportRef.current;
    if (!node) {
      console.error("reportRef is null — cannot capture");
      return;
    }

    setIsExporting(true);

    // ── OKLCH → HEX patch ───────────────────────────────────────────────────
    // html2canvas crashes on modern CSS color functions (oklch/lab).
    // We inject a style tag into the REAL document to force browser to recompute 
    // all variables to Hex before html2canvas reads them.
    const CSS_HEX_OVERRIDES = `
      :root, .dark {
        --background: #ffffff !important;
        --foreground: #1c1c1c !important;
        --card: #ffffff !important;
        --card-foreground: #1c1c1c !important;
        --popover: #ffffff !important;
        --popover-foreground: #1c1c1c !important;
        --primary: #282828 !important;
        --primary-foreground: #f9f9f9 !important;
        --secondary: #f5f5f5 !important;
        --secondary-foreground: #282828 !important;
        --muted: #f5f5f5 !important;
        --muted-foreground: #737373 !important;
        --accent: #f5f5f5 !important;
        --accent-foreground: #282828 !important;
        --destructive: #dc2626 !important;
        --border: #e5e5e5 !important;
        --input: #e5e5e5 !important;
        --ring: #a3a3a3 !important;
        --chart-1: #e97316 !important;
        --chart-2: #14b8a6 !important;
        --chart-3: #334155 !important;
        --chart-4: #eab308 !important;
        --chart-5: #f59e0b !important;
        --sidebar: #f9f9f9 !important;
        --sidebar-foreground: #1c1c1c !important;
        --sidebar-primary: #282828 !important;
        --sidebar-primary-foreground: #f9f9f9 !important;
        --sidebar-accent: #f5f5f5 !important;
        --sidebar-accent-foreground: #282828 !important;
        --sidebar-border: #e5e5e5 !important;
        --sidebar-ring: #a3a3a3 !important;
        
        /* Tailwind color tokens */
        --color-background: #ffffff !important;
        --color-foreground: #1c1c1c !important;
        --color-card: #ffffff !important;
        --color-muted: #f5f5f5 !important;
        --color-muted-foreground: #737373 !important;
        --color-primary: #282828 !important;
        --color-primary-foreground: #f9f9f9 !important;
        --color-secondary: #f5f5f5 !important;
        --color-secondary-foreground: #282828 !important;
        --color-accent: #f5f5f5 !important;
        --color-accent-foreground: #282828 !important;
        --color-border: #e5e5e5 !important;
        --color-input: #e5e5e5 !important;
        --color-ring: #a3a3a3 !important;
        --color-destructive: #dc2626 !important;
      }
      /* Also strip backdrop-blur which html2canvas can't render */
      * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    `;

    // 1. Inject style override
    const styleId = "pdf-export-style-hack";
    let existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = CSS_HEX_OVERRIDES;
      document.head.appendChild(style);
      existingStyle = style;
    }

    // 2. Temporarily override sticky positions
    const stickyEls = node.querySelectorAll<HTMLElement>("[style*='sticky'], .sticky");
    const origStickyStyles: string[] = [];
    stickyEls.forEach((el) => {
      origStickyStyles.push(el.style.position);
      el.style.position = "relative";
    });

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        ignoreElements: (el) => el.tagName === "HEADER",
      });

      const imgData = canvas.toDataURL("image/png");
      const PDF_W = 210;
      const PDF_H = 297;
      const MARGIN = 10;
      const contentW = PDF_W - MARGIN * 2;
      const canvasAspect = canvas.height / canvas.width;
      const imgH = contentW * canvasAspect;

      let pdf: InstanceType<typeof jsPDF>;

      if (imgH <= PDF_H - MARGIN * 2) {
        pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        pdf.addImage(imgData, "PNG", MARGIN, MARGIN, contentW, imgH);
      } else {
        const pageH_mm = PDF_H - MARGIN * 2;
        const pageH_px = (pageH_mm / contentW) * canvas.width;
        const totalPages = Math.ceil(canvas.height / pageH_px);

        pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        for (let p = 0; p < totalPages; p++) {
          if (p > 0) pdf.addPage();
          const srcY = p * pageH_px;
          const sliceH = Math.min(pageH_px, canvas.height - srcY);

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceH;
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          }
          const sliceData = pageCanvas.toDataURL("image/png");
          const sliceH_mm = (sliceH / canvas.width) * contentW;
          pdf.addImage(sliceData, "PNG", MARGIN, MARGIN, contentW, sliceH_mm);
        }
      }

      pdf.save("Home_Decision_Lab_Report.pdf");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("PDF generation failed:", msg, err);
      // alert(`PDF Error: ${msg}`); // Optional
    } finally {
      setIsExporting(false);

      // Cleanup: Remove style override
      const style = document.getElementById(styleId);
      if (style) style.remove();

      // Cleanup: Restore sticky positions
      stickyEls.forEach((el, i) => {
        el.style.position = origStickyStyles[i];
      });
    }
  }, []);

  return (
    <CalculatorProvider>
      <div className="min-h-screen bg-background font-sans flex flex-col">
        <Header onExportPDF={exportToPDF} isExporting={isExporting} />

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
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-6xl mx-auto">
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
          ref={reportRef}
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
