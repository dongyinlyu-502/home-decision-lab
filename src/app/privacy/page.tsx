import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
    title: "Privacy Policy — Home Decision Lab",
    description: "Privacy Policy for Home Decision Lab. A privacy-first, client-side financial modeling tool that collects no personal data.",
};

const sections = [
    {
        title: "1. Overview",
        content: (
            <>
                <p>This website is designed as a privacy-first, client-side financial modeling tool.</p>
                <ul>
                    <li>We do not collect, store, process, or share any personal data.</li>
                    <li>All calculations are performed locally in your browser.</li>
                </ul>
            </>
        ),
    },
    {
        title: "2. No Personal Data Collection",
        content: (
            <>
                <p>This website:</p>
                <ul>
                    <li>Does not require account registration</li>
                    <li>Does not collect names, email addresses, or contact details</li>
                    <li>Does not collect or transmit financial input data</li>
                    <li>Does not store user scenarios or simulation results</li>
                    <li>Does not use tracking cookies</li>
                    <li>Does not use analytics tools</li>
                    <li>Does not include advertising networks</li>
                </ul>
                <p>All data entered into the tool remains entirely on your device.</p>
            </>
        ),
    },
    {
        title: "3. Client-Side Processing",
        content: (
            <p>
                All simulations, projections, and risk calculations are executed locally in your browser
                using JavaScript. No input data is transmitted to any server controlled by the website owner.
            </p>
        ),
    },
    {
        title: "4. Hosting and Technical Logs",
        content: (
            <>
                <p>
                    This website is hosted by a third-party hosting provider. Like most websites, the hosting
                    provider may automatically generate technical server logs (such as IP addresses, browser
                    type, and access timestamps) for operational security and infrastructure maintenance.
                </p>
                <p>These logs:</p>
                <ul>
                    <li>Are not accessed or processed by the website owner</li>
                    <li>Are not used for user profiling or tracking</li>
                    <li>Are managed solely under the hosting provider&apos;s own privacy policies</li>
                </ul>
                <p>For more information, please refer to the hosting provider&apos;s privacy documentation.</p>
            </>
        ),
    },
    {
        title: "5. Cookies",
        content: (
            <p>
                This website does not use cookies for tracking, analytics, advertising, or user
                identification. Any temporary technical data stored by your browser is used solely for
                basic functionality and is not used to identify users.
            </p>
        ),
    },
    {
        title: "6. External Links",
        content: (
            <p>
                This website may contain links to external websites. We are not responsible for the
                privacy practices or content of third-party websites.
            </p>
        ),
    },
    {
        title: "7. Data Security",
        content: (
            <p>
                Because no personal data is collected or stored, this website does not maintain a user
                database or retain any personally identifiable information.
            </p>
        ),
    },
    {
        title: "8. Changes to This Policy",
        content: (
            <p>
                This Privacy Policy may be updated if the functionality of the website changes. Any
                updates will be reflected on this page with a revised &ldquo;Last updated&rdquo; date.
            </p>
        ),
    },
    {
        title: "9. Contact",
        content: (
            <p>
                If you have any questions regarding this Privacy Policy, you may contact:{" "}
                <a
                    href="mailto:dongyinlyu@gmail.com"
                    className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                >
                    dongyinlyu@gmail.com
                </a>
            </p>
        ),
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans">
            <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6">

                {/* Back link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-10 group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3.5 py-1 text-xs font-semibold text-emerald-700 mb-4">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Privacy-First by Design
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-slate-400">Last updated: February 19, 2026</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 mb-10" />

                {/* Sections */}
                <div className="space-y-10">
                    {sections.map(({ title, content }) => (
                        <section key={title}>
                            <h2 className="text-lg font-semibold text-slate-800 mb-3">{title}</h2>
                            <div className="text-slate-600 leading-7 space-y-3 [&_ul]:mt-2 [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_ul]:list-disc [&_li]:text-slate-600">
                                {content}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Footer note */}
                <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        © {new Date().getFullYear()} Home Decision Lab ·{" "}
                        <Link href="/" className="hover:text-slate-600 transition-colors">
                            Home
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
