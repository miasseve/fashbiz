"use client";

import { useState } from "react";

function fmt(n) {
    return Math.round(n).toLocaleString("da-DK");
}

function fmtK(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "K" : Math.round(n).toString();
}

function SliderField({ label, min, max, step, value, display, onChange }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[16px] text-[#444] font-normal">{label}</p>
                <span className="text-[14px] font-semibold text-[#1a1a1a] min-w-[80px] text-right">
                    {display}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-[3px] rounded-full appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, #9b8ecf ${((value - min) / (max - min)) * 100}%, #d1c9e8 ${((value - min) / (max - min)) * 100}%)`,
                    accentColor: "#9b8ecf",
                }}
            />
        </div>
    );
}

function ResultItem({ title, value, sub, barPct, numColor, barColor }) {
    return (
        <div>
            <p className="text-[14px] text-[#888] mb-1">{title}</p>
            <p className="text-[32px] sm:text-[36px] font-bold leading-none tracking-tight" style={{ color: numColor }}>
                {value}
            </p>
            <p className="text-[12px] mt-1" style={{ color: numColor, opacity: 0.75 }}>{sub}</p>
            <div className="h-[3px] bg-[#e5e0f0] rounded-full mt-3 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${barPct}%`, backgroundColor: barColor }}
                />
            </div>
        </div>
    );
}

export default function CalculatorSection() {
    const [products, setProducts] = useState(100);
    const [people, setPeople] = useState(3);
    const [revenue, setRevenue] = useState(50000);
    const [wage, setWage] = useState(200);
    const [mins, setMins] = useState(20);

    const hrs = Math.round((products * mins) / 60);
    const labour = Math.round(((products * mins) / 60) * wage * people);
    const revGain = Math.round(revenue * 0.18);

    const barPct1 = Math.min(Math.round((hrs / 200) * 100), 100);
    const barPct2 = Math.min(Math.round((labour / 200000) * 100), 100);
    const barPct3 = Math.min(Math.round((revGain / 100000) * 100), 100);

    let insightHead = "Solid efficiency gains";
    let insightBody = `Reclaim ${hrs} hrs and ${fmt(labour)} DKK in labour while growing revenue by ${fmt(revGain)} DKK/month.`;

    if (hrs < 20) {
        insightHead = "Small store, real savings";
        insightBody = `Even at this scale, automating barcodes and sync saves ${hrs} hrs/month — time better spent sourcing.`;
    } else if (labour > 50000) {
        insightHead = "Labour is your biggest leak";
        insightBody = `You're spending ${fmt(labour)} DKK/month on manual listing. Automating this alone funds the platform for years.`;
    } else if (revGain > 30000) {
        insightHead = "Growth is on the table";
        insightBody = `Faster listings could unlock ${fmt(revGain)} DKK more revenue monthly. The platform pays for itself in weeks.`;
    }

    return (
        <section className="bg-[#f5f0e8] py-16 sm:py-20 px-4 sm:px-8 md:px-[6vw]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-[900px] mx-auto items-start">
                <div>
                    <p className="text-[28px] font-medium leading-[40px] bg-gradient-to-r from-[#7c3aed] to-[#EC4899] bg-clip-text text-transparent uppercase mb-3">
                        Cost calculator
                    </p>
                    <h2 className="text-[26px] sm:text-[32px] font-bold text-[#1a1a1a] leading-snug mb-2">
                        How much is manual<br />
                        work <em className="italic bg-gradient-to-r from-[#7c3aed] to-[#EC4899] bg-clip-text text-transparent pr-1 font-bold">costing you?</em>
                    </h2>
                    <p className="text-[16px] text-[#777] leading-relaxed mb-8">
                        Adjust the sliders to match your store. The real cost of manual listing is usually much higher than expected.
                    </p>

                    <div className="flex flex-col gap-6">
                        <SliderField label="Products listed per month" min={10} max={500} step={10} value={products} display={String(products)} onChange={setProducts} />
                        <SliderField label="People doing the listing" min={1} max={20} step={1} value={people} display={String(people)} onChange={setPeople} />
                        <SliderField label="Monthly revenue (DKK)" min={5000} max={500000} step={5000} value={revenue} display={fmtK(revenue) + " DKK"} onChange={setRevenue} />
                        <SliderField label="Avg. hourly wage (DKK)" min={100} max={500} step={10} value={wage} display={wage + " DKK"} onChange={setWage} />
                        <SliderField label="Minutes spent per product (manual)" min={5} max={60} step={1} value={mins} display={mins + " min"} onChange={setMins} />
                    </div>
                </div>

                <div className="md:sticky md:top-10">
                    <div className="bg-white rounded-[20px] overflow-hidden shadow-sm divide-y divide-[#f0eaf8]">
                        <div className="p-6">
                            <ResultItem
                                title="Hours saved per month"
                                value={hrs + " hrs"}
                                sub={`Across ${people} people listing ${products} products`}
                                barPct={barPct1}
                                numColor="#7c3aed"
                                barColor="#7c3aed"
                            />
                        </div>

                        <div className="p-6">
                            <ResultItem
                                title="Labour cost you're paying now"
                                value={fmt(labour) + " DKK"}
                                sub={`At ${wage} DKK/hr · ${people} staff members`}
                                barPct={barPct2}
                                numColor="#3d2fa0"
                                barColor="#3d2fa0"
                            />
                        </div>

                        <div className="p-6">
                            <ResultItem
                                title="Revenue increase potential"
                                value={"+" + fmt(revGain) + " DKK"}
                                sub="~18% uplift from faster listings & auto-sync"
                                barPct={barPct3}
                                numColor="#1a8a6a"
                                barColor="#1a8a6a"
                            />
                        </div>

                        <div className="p-6">
                            <div className="bg-[#eeeaf8] rounded-[14px] px-5 py-4">
                                <p className="text-[16px] font-semibold text-[#2d2260] mb-1">{insightHead}</p>
                                <p className="text-[14px] text-[#5a4a7a] leading-relaxed">{insightBody}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #9b8ecf;
                    cursor: pointer;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                }
                input[type=range]::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #9b8ecf;
                    cursor: pointer;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                }
                input[type=range] { -webkit-appearance: none; appearance: none; }
                input[type=range]:focus { outline: none; }
            `}</style>
        </section>
    );
}
