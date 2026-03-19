"use client";

import { motion } from "framer-motion";

export default function PricingHero() {
    return (
        <section className="min-h-screen bg-gradient-to-b from-[#000000] to-[#2D0200] grid grid-cols-1 md:grid-cols-2 items-center px-[8vw] relative overflow-hidden">
            {/* Floating orbs */}
            <div className="absolute w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full bg-white/[0.06] -top-[100px] md:-top-[200px] right-[50px] md:right-[200px] animate-float1 pointer-events-none" />
            <div className="absolute w-[150px] md:w-[300px] h-[150px] md:h-[300px] rounded-full bg-white/[0.08] bottom-[60px] left-[10vw] animate-float2 pointer-events-none" />

            {/* Left */}
            <motion.div
                className="z-10 pt-24 pb-8 md:py-20"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >

                <h1 className="text-[clamp(40px,7vw,90px)] font-bold text-white leading-[0.95] tracking-[-3px] mb-6">
                    Pricing
                    Plan
                </h1>

                <p className="text-[15px] md:text-[17px] font-light text-white/80 leading-[1.65] max-w-[400px] mb-8">
                    Automate every part of your resell operation — from barcode to payout.
                    Pick the plan that fits.
                </p>
            </motion.div>

            {/* Right */}
            <motion.div
                className="z-10 flex justify-center md:justify-end items-end pb-10 md:pb-0"
                initial={{ opacity: 0, x: 60, rotate: 3 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
                <div className="relative">
                    <div className="w-[280px] h-[240px] sm:w-[400px] sm:h-[350px] md:w-[640px] md:h-[550px] rounded-[28px_28px_0_0] bg-white/10 flex flex-col items-center justify-center gap-3 [clip-path:polygon(75%_0%,100%_50%,75%_100%,0%_100%,25%_50%,0%_0%)] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/REe_Img.webp"
                            alt=""
                            className="w-full h-full object-cover object-[0%_30%] scale-125"
                        />
                    </div>

                    <motion.div
                        className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-10 bg-white rounded-2xl px-4 py-3 md:px-5 md:py-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <p className="font-medium text-[12px] md:text-[14px] text-dark">Mia Sevestre</p>
                        <p className="text-[10px] md:text-[12px] text-muted">Secondhand retail solutions</p>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}
