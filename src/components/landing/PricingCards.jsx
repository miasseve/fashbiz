"use client";

import { useState } from "react";

const plans = [
    {
        id: 1,
        title: "Auto Label & Add",
        subtitle: "Get Barcode & Instagram",
        gradient: "from-[#F9F4FF] to-[#F9F4FF]",
        border: "border-purple-100",
        tiers: [
            {
                label: "Basic",
                price: "990",
                currency: "DKK",
                users: "Up to 2 users",
                products: "Up to 300 products per month",
            },
            {
                label: "Pro",
                price: "1,990",
                currency: "DKK",
                users: "Up to 5 users",
                products: "Up to 1000 products per month",
            },
        ],
        cta: "Get started",
        ctaStyle: "outline",
    },
    {
        id: 2,
        title: "Auto Webstore",
        subtitle: "Launch Your Resell Webstore",
        gradient: "from-[#F9F4FF] to-[#F9F4FF]",
        border: "border-purple-100",
        tiers: [
            {
                label: "Basic — One-time",
                price: "4,800",
                currency: "DKK",
                users: "Up to 2 users",
                products: "Up to 300 products per month",
                note: "4% per transactions",
            },
            {
                label: "Pro — One-time",
                price: "35,000",
                currency: "DKK",
                users: "Up to 5 users",
                products: "Up to 1000 products per month",
                note: "2% per transactions",
            },
        ],
        cta: "Get started",
        ctaStyle: "outline",
    },
    {
        id: 3,
        title: "Auto Plug-In",
        subtitle: "Connect Your Existing  Store",
        gradient: "from-[#F9F4FF] to-[#F9F4FF]",
        border: "border-blue-100",
        tiers: [
            {
                label: "Basic — Per-month",
                price: "3,200",
                currency: "DKK",
                users: "Up to 2 users",
                products: "Up to 300 products per month",
            },
            {
                label: "Pro — One-time",
                price: "6,000",
                currency: "DKK",
                users: "Up to 5 users",
                products: "Up to 1000 products per month",
            },
        ],
        cta: "Get started",
        ctaStyle: "outline",
    },
    {
        id: 4,
        title: "Pay Per Product",
        subtitle: "Pay as per Add Ons",
        gradient: "from-pink-100 via-purple-100 to-pink-50",
        border: "border-pink-200",
        featured: true,
        tiers: [
            {
                label: "Per Product",
                price: "10",
                currency: "DKK",
                subLabel: "per Product",
                note: "",
                noteExtra: "No monthly fees, ever",
            },
            {
                label: "Pro",
                notAvailable: true,
            },
        ],
        cta: "Start Free Trial",
        ctaStyle: "filled",
    },
];

const individualPricing = [
    {
        title: "WEBSTORE",
        items: [
            "Pay Once",
            "4% per Transactions",
        ],
        total: "4800 DKK",
    },
    {
        title: "PLUG-IN",
        items: [
            "Pay Once",
            "Connect your existing Webstore",
        ],
        total: "3200 DKK",
    },
];

const featureRows = [
    { label: "Your Webstore", cols: [false, true, false, false] },
    { label: "Plug-In web", cols: [false, true, true, false] },
    { label: "Consigner portal", cols: [true, true, true, true] },
    { label: "Product linked to consigner profils", cols: [true, true, true, true] },
    { label: "Commission settings", cols: [true, true, true, true] },
    { label: "Auto Split payments", cols: [true, true, true, true] },
    { label: "Support", cols: [true, true, true, true] },
    { label: "Instagram integration", cols: [true, true, true, true] },
    { label: "Get Favorite free by inviting a friend", cols: [true, true, true, false] },
];

const comparisonColumns = [
    "Auto Label & Add",
    "Auto Webshop",
    "Plug-In",
    "Pay As You Go",
];

const PlanIcon = ({ id }) => {
    const icons = {
        1: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-6 h-6">
                <rect x="2" y="4" width="3" height="16" /><rect x="7" y="4" width="2" height="16" />
                <rect x="11" y="4" width="4" height="16" /><rect x="17" y="4" width="2" height="16" />
                <rect x="21" y="4" width="1" height="16" />
            </svg>
        ),
        2: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-6 h-6">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        ),
        3: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-6 h-6">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        ),
        4: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-6 h-6">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
        ),
    };
    return icons[id] || null;
};

const CheckIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "inline-block" }}
    >
        <path
            d="M3 8.5L6.5 12L13 5"
            stroke="#1a1a1a"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default function PricingCards() {
    const [activeTab, setActiveTab] = useState("plan");

    return (
        <section
            className="min-h-screen py-20 px-4"
            style={{ backgroundColor: "#f9f3ee" }}
        >

            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-[34px] sm:text-[46px] font-bold text-[#1a1a1a] mb-4 leading-tight tracking-tight">Choose Your Plan</h1>
                {/* <p className="text-[#434343] text-[16px] sm:text-[17px] leading-relaxed">
                    All plans include 2 weeks free for onboarding.
                    <br />
                    No billing until you&apos;re ready.
                </p> */}
            </div>

            {/* Toggle */}
            <div className="flex justify-center mb-12">
                <div className="bg-white rounded-full p-1.5 flex shadow-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab("plan")}
                        className={`px-10 py-3 rounded-full text-[16px] font-semibold transition-all duration-200 ${activeTab === "plan"
                                ? "bg-gradient-to-r from-purple-300 to-pink-200 text-gray-800 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Plan Card
                    </button>
                    <button
                        onClick={() => setActiveTab("comparison")}
                        className={`px-10 py-3 rounded-full text-[16px] font-semibold transition-all duration-200 ${activeTab === "comparison"
                                ? "bg-gradient-to-r from-purple-300 to-pink-200 text-gray-800 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Feature Comparison
                    </button>
                </div>
            </div>

            {/* PLAN CARDS TAB */}
            {activeTab === "plan" && (
                <>
                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 px-4 sm:px-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`rounded-3xl border ${plan.border} w-full flex flex-col relative overflow-hidden ${plan.featured ? "shadow-md" : "shadow-sm"
                                    }`}
                            >
                                {/* TOP SECTION */}
                                <div
                                    className={`bg-gradient-to-br ${plan.gradient} px-6 pt-6 pb-5 flex flex-col items-center`}
                                >
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-[0px_0px_20px_rgba(0,0,0,0.05)] mb-5 flex items-center justify-center">
                                        <PlanIcon id={plan.id} />
                                    </div>
                                    <h3 className="text-[22px] font-bold text-[#000]">
                                        {plan.title}
                                    </h3>
                                    <p className="text-[15px] text-gray-500 text-center pt-2 pb-4">
                                        {plan.subtitle}
                                    </p>
                                    <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-[#7c3aed] to-[#EC4899]" />
                                </div>

                                {/* BOTTOM SECTION */}
                                <div className="bg-white px-6 pt-6 pb-6 flex flex-col flex-1">
                                    <div className="flex-1 space-y-6">
                                        {plan.tiers.map((tier, i) => (
                                            <div key={i}>
                                                {i > 0 && (
                                                    <div className="border-t border-dashed border-gray-200 mb-5" />
                                                )}
                                                <p
                                                    className="text-[16px] text-center py-3 font-medium"
                                                    style={{ color: "#9b7fe8" }}
                                                >
                                                    {tier.label}
                                                </p>

                                                {tier.notAvailable ? (
                                                    <p className="text-[16px] text-gray-400 mt-2 text-center">
                                                        — not available
                                                    </p>
                                                ) : (
                                                    <>
                                                        <div className="flex items-baseline gap-1 mb-1 justify-center">
                                                            <span className="text-[36px] font-bold text-gray-900">
                                                                {tier.price}
                                                            </span>
                                                            <span className="text-[14px] font-semibold text-gray-500 uppercase">
                                                                {tier.currency}
                                                            </span>
                                                        </div>
                                                        {tier.subLabel && (
                                                            <p className="text-[14px] text-gray-500 -mt-1 mb-1 text-center">
                                                                {tier.subLabel}
                                                            </p>
                                                        )}
                                                        {tier.note && (
                                                            <p
                                                                className="text-[14px] font-medium text-center"
                                                                style={{ color: "#9b7fe8" }}
                                                            >
                                                                {tier.note}
                                                            </p>
                                                        )}
                                                        {tier.noteExtra && (
                                                            <p
                                                                className="text-[14px] font-medium text-center"
                                                                style={{ color: "#9b7fe8" }}
                                                            >
                                                                {tier.noteExtra}
                                                            </p>
                                                        )}
                                                        {tier.users && (
                                                            <p className="text-[14px] text-gray-500 mt-1 text-center">
                                                                {tier.users}
                                                            </p>
                                                        )}
                                                        {tier.products && (
                                                            <p
                                                                className="text-[14px] font-medium mt-0.5 text-center"
                                                                style={{ color: "#9b7fe8" }}
                                                            >
                                                                {tier.products}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <div className="mt-8">
                                        {plan.ctaStyle === "filled" ? (
                                            <button
                                                className="w-full py-3.5 rounded-2xl text-white text-[16px] font-semibold transition-opacity hover:opacity-90"
                                                style={{
                                                    background:
                                                        "linear-gradient(135deg, #c084fc, #f472b6)",
                                                }}
                                            >
                                                {plan.cta}
                                            </button>
                                        ) : (
                                            <button
                                                className="w-full py-3.5 rounded-2xl border bg-white text-gray-800 text-[16px] font-semibold hover:bg-gray-50 transition-colors"
                                                style={{ borderColor: "#c4b5fd" }}
                                            >
                                                {plan.cta}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Individual Pricing */}
                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-8">
                        {individualPricing.map((block, i) => (
                            <div
                                key={i}
                                className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8"
                            >
                                <h4 className="text-[20px] font-bold text-gray-900 mb-3">
                                    {block.title}
                                </h4>
                                {block.items.map((item, j) => (
                                    <p key={j} className="text-[16px] text-gray-500 mb-1">
                                        {item}
                                    </p>
                                ))}
                                <p className="text-[28px] font-bold text-gray-900 mt-3">
                                    {block.total}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* FEATURE COMPARISON TAB */}
            {activeTab === "comparison" && (
                <div className="max-w-[1400px] mx-auto overflow-x-auto px-4 sm:px-8">
                    <div
                        className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm min-w-[600px]"
                        style={{ backgroundColor: "#ffffff" }}
                    >
                        <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08))" }}>
                                    <th className="text-left py-6 pl-8 pr-4" style={{ width: "36%" }} />
                                    {comparisonColumns.map((col, idx) => (
                                        <th
                                            key={col}
                                            className={`py-6 px-4 text-center text-[17px] font-bold text-[#1a1a1a] ${idx === comparisonColumns.length - 1 ? "pr-8" : ""
                                                }`}
                                            style={{ width: "16%" }}
                                        >
                                            <span className="bg-gradient-to-r from-[#7c3aed] to-[#EC4899] bg-clip-text text-transparent">
                                                {col}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {featureRows.map((row) => (
                                    <tr key={row.label} style={{ borderTop: "1px solid #f0ebe5" }}>
                                        <td
                                            className="py-5 pl-8 pr-4 text-[16px] text-[#1a1a1a]"
                                            style={{ fontWeight: 500 }}
                                        >
                                            {row.label}
                                        </td>
                                        {row.cols.map((hasFeature, colIdx) => (
                                            <td
                                                key={colIdx}
                                                className={`py-5 px-4 text-center ${colIdx === row.cols.length - 1 ? "pr-8" : ""
                                                    }`}
                                            >
                                                {hasFeature ? <CheckIcon /> : null}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}
