"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const FEATURES = [
    {
        num: "01 — Barcode generation",
        title: "Instant barcode\nfor every product",
        desc: "Each item gets a unique scannable barcode the moment it's added. Print or download instantly — no manual entry.",
        price: "10 DKK",
        priceSub: "/ product",
        type: "barcode",
    },
    {
        num: "02 — Instagram sync",
        title: "Products live on\nInstagram — automatic",
        desc: "New inventory appears as shoppable posts the moment it's listed. Zero extra steps for your team.",
        type: "instagram",
    },
    {
        num: "03 — Resell webstore",
        title: "Your branded\nresell webstore",
        desc: "Collections, filters, checkout — all built for consignment. Ready to go from day one.",
        price: "4,800 DKK",
        priceSub: "once",
        priceLine2: "+ 4% per transaction",
        type: "webstore",
    },
    {
        num: "04 — Consignor portal",
        title: "Each item tied to\na consignor profile",
        desc: "Commission splits automatically at checkout. No manual accounting, no disputes.",
        type: "portal",
    },
    {
        num: "05 — Digital passport",
        title: "Digital product\npassport included",
        desc: "Full product history, materials, and provenance. Ready for EU compliance requirements on every item.",
        type: "passport",
    },
    {
        num: "06 — Plugin sync",
        title: "Already have\na webstore?",
        desc: "Plug in the Resell* integration. Your existing store syncs inventory, consignors, and payouts automatically.",
        price: "3,290 DKK",
        priceSub: "once",
        priceLine2: "+ 4% per transaction",
        type: "plugin",
    },
];

const ICONS = {
    barcode: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-[22px] h-[22px]">
            <rect x="2" y="4" width="3" height="16" /><rect x="7" y="4" width="2" height="16" />
            <rect x="11" y="4" width="4" height="16" /><rect x="17" y="4" width="2" height="16" />
            <rect x="21" y="4" width="1" height="16" />
        </svg>
    ),
    instagram: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-[22px] h-[22px]">
            <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="#7c3aed" />
        </svg>
    ),
    webstore: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-[22px] h-[22px]">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
    portal: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-[22px] h-[22px]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    passport: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-[22px] h-[22px]">
            <rect x="3" y="2" width="18" height="20" rx="2" />
            <line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="17" y2="12" />
            <line x1="7" y1="16" x2="13" y2="16" />
        </svg>
    ),
    plugin: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-[22px] h-[22px]">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    ),
};

const N = FEATURES.length;
const CARD_WIDTH = 360;
const GAP = 20;
const STEP = CARD_WIDTH + GAP;

const REPS_EACH_SIDE = 3;
const TOTAL_REPS = 1 + REPS_EACH_SIDE * 2;
const OFFSET_CARDS = REPS_EACH_SIDE * N;

const TILES = Array.from({ length: TOTAL_REPS * N }, (_, i) => FEATURES[i % N]);

const mod = (n, m) => ((n % m) + m) % m;

function CardContent({ f, isActive }) {
    return (
        <>
            <div
                className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#7c3aed] to-[#EC4899] origin-left"
                style={{
                    transform: isActive ? "scaleX(1)" : "scaleX(0)",
                    transition: "transform 0.5s ease",
                }}
            />
            <p className="text-[20px] font-medium tracking-[0.1em] text-[#888] uppercase mb-5">{f.num}</p>
            <div className="w-12 h-12 rounded-xl bg-[#ede9fe] flex items-center justify-center mb-5">
                {ICONS[f.type]}
            </div>
            <h3 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#1a1a1a] leading-[1.2] mb-2 whitespace-pre-line">
                {f.title}
            </h3>
            <p className="text-[12px] sm:text-[14px] font-sans leading-[22px] sm:leading-[20px] text-[#434343] py-[12px] sm:py-[14px]">
                {f.desc}
            </p>

            {f.type === "barcode" && (
                <div className="bg-white h-[200px] rounded-xl mb-5 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/Barcode_img.png"
                        alt="Product preview"
                        width={296}
                        height={88}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {f.type === "instagram" && (
                <div className="bg-white h-[230px] w-full rounded-xl overflow-hidden mb-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/Instagram_img.png"
                        alt="Product preview"
                        className="h-full object-cover"
                    />
                </div>
            )}

            {f.type === "webstore" && (
                <div className="bg-white h-[230px] w-full rounded-xl overflow-hidden mb-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/Webpage_img.png"
                        alt="Product preview"
                        className="h-full object-cover"
                    />
                </div>
            )}

            {f.price && (
                <div>
                    <span className="text-[28px] font-bold bg-gradient-to-r from-[#7c3aed] to-[#EC4899] bg-clip-text text-transparent tracking-tight">
                        {f.price}{" "}
                    </span>
                    <span className="text-[14px] font-medium tracking-[0.1em] text-[#888] mb-5">{f.priceSub}</span>
                    {f.priceLine2 && <p className="text-[14px] font-light text-[#888] mt-1">{f.priceLine2}</p>}
                </div>
            )}
        </>
    );
}

export default function FeaturesSlider() {
    const [pos, setPos] = useState(OFFSET_CARDS);
    const [animated, setAnimated] = useState(true);
    const [step, setStep] = useState(STEP);
    const timerRef = useRef(null);
    const isRecenteringRef = useRef(false);
    const scrollCooldownRef = useRef(false);
    const sliderRef = useRef(null);
    const cardRef = useRef(null);

    const activeDot = mod(pos, N);

    const startTimer = useCallback(() => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setPos(p => p + 1);
            setAnimated(true);
        }, 3800);
    }, []);

    useEffect(() => {
        startTimer();
        return () => clearInterval(timerRef.current);
    }, [startTimer]);

    useEffect(() => {
        const measure = () => {
            if (cardRef.current) {
                setStep(cardRef.current.offsetWidth + GAP);
            }
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    const handleTransitionEnd = useCallback(() => {
        if (isRecenteringRef.current) return;
        const logicalIndex = mod(pos, N);
        const centred = OFFSET_CARDS + logicalIndex;
        if (centred !== pos) {
            isRecenteringRef.current = true;
            setAnimated(false);
            setPos(centred);
        }
    }, [pos]);

    useEffect(() => {
        if (!animated) {
            const raf = requestAnimationFrame(() => {
                setAnimated(true);
                isRecenteringRef.current = false;
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [animated]);

    const goSlide = (logicalIndex) => {
        const current = mod(pos, N);
        let delta = mod(logicalIndex - current, N);
        if (delta > N / 2) delta -= N;
        setAnimated(true);
        setPos(p => p + delta);
        startTimer();
    };

    const goDelta = (delta) => {
        setAnimated(true);
        setPos(p => p + delta);
        startTimer();
    };

    useEffect(() => {
        const el = sliderRef.current;
        if (!el) return;
        const handleWheel = (e) => {
            if (scrollCooldownRef.current) return;
            const delta = e.deltaY || e.deltaX;
            if (Math.abs(delta) < 10) return;
            e.preventDefault();
            scrollCooldownRef.current = true;
            goDelta(delta > 0 ? 1 : -1);
            setTimeout(() => { scrollCooldownRef.current = false; }, 600);
        };
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    });

    return (
        <section className="py-16 sm:py-24 bg-white">
            <div className="px-[6vw] mb-12">
                <p className="text-[20px] font-medium leading-[40px] bg-gradient-to-r from-[#7c3aed] to-[#EC4899] bg-clip-text text-transparent uppercase mb-3">
                    What we automate
                </p>
                <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] font-bold leading-[1.1] lg:leading-[43px] text-[#252525]">
                    Everything your store<br />
                    does <em className="italic bg-gradient-to-r from-[#7c3aed] to-[#EC4899] bg-clip-text text-transparent pr-1 font-bold">manually</em> today
                </h2>
            </div>

            <div
                ref={sliderRef}
                className="overflow-hidden pb-4"
                onMouseEnter={() => clearInterval(timerRef.current)}
                onMouseLeave={startTimer}
            >
                <div
                    className="flex gap-5 pl-[6vw]"
                    style={{
                        transform: `translateX(-${pos * step}px)`,
                        transition: animated ? "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
                    }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {TILES.map((f, i) => (
                        <div
                            key={i}
                            ref={i === 0 ? cardRef : undefined}
                            onClick={() => goSlide(mod(i, N))}
                            className="flex-none w-[85vw] sm:w-[340px] md:w-[360px] rounded-[20px] p-7 sm:p-9 border border-[#1a1a1a]/10 relative overflow-hidden cursor-pointer"
                        >
                            <CardContent f={f} isActive={i === pos} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 px-[6vw] mt-8">
                <button
                    onClick={() => goDelta(-1)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a] hover:bg-[#7c3aed] hover:border-[#7c3aed] hover:text-white transition-all duration-200"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <button
                    onClick={() => goDelta(1)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a] hover:bg-[#7c3aed] hover:border-[#7c3aed] hover:text-white transition-all duration-200"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
                <div className="flex gap-2 items-center">
                    {FEATURES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goSlide(i)}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width: 6,
                                height: 6,
                                background: i === activeDot ? "#7c3aed" : "#1a1a1a1a",
                                transform: i === activeDot ? "scale(1.3)" : "scale(1)",
                            }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
