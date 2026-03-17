"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const RevealCard = ({ children, index, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const PhoneMockup = ({ className = "" }) => (
  <div
    className={`relative rounded-[16px] overflow-hidden bg-gray-800 ${className}`}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80"
      alt="App preview"
      className="w-full h-full object-cover opacity-80"
    />
  </div>
);

const ToolsSection = () => {
  return (
    <section id="tools" className="bg-[#111111] min-h-screen py-[64px] sm:py-[80px] px-[16px] sm:px-[24px]">
      <div className="max-w-[1040px] mx-auto">
        <div className="text-center mb-[48px]">
          <h2 className="text-white text-[30px] sm:text-[36px] md:text-[42px] font-bold leading-tight mb-[16px]">
            Ready to deploy. Proven in the field.
          </h2>
          <p className="text-[18px] text-white leading-[24px]">
            Tools can be standalone or part of our consulting service.
            <br className="hidden sm:block" />
            Choose what works best for you.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          {/* Left Column */}
          <div className="flex flex-col gap-[16px]">
            <RevealCard index={0} className="bg-white p-[20px] rounded-[16px] overflow-hidden h-[220px] sm:w-full sm:h-[323px]">
              <PhoneMockup className="h-full w-full" />
            </RevealCard>

            <RevealCard index={1} className="bg-white rounded-[16px] p-[20px] flex flex-col gap-[16px] sm:h-[473px]">
              <div className="flex gap-[16px] items-start">
                <div className="flex-1 pl-[20px]">
                  <h3 className="pt-[10px] text-[21px] leading-[22px] font-medium text-[#000]">
                    Automatic Tagging, Barcode & Digital Passport
                  </h3>
                  <p className="text-[18px] font-normal leading-[25px] pt-[14px] text-[#414141]">
                    Add a product in 1 minute. AI writes description, generates
                    barcode, prints label.
                  </p>
                </div>
              </div>
              <PhoneMockup className="h-[160px] sm:h-full w-full" />
            </RevealCard>

            <RevealCard index={2} className="bg-white rounded-[16px] p-[20px]">
              <div className="flex-1 pl-[20px]">
                <h3 className="pt-[10px] text-[21px] leading-[22px] font-medium text-[#000]">
                  Custom Development (On Request)
                </h3>
                <p className="text-[18px] font-normal leading-[25px] pt-[14px] text-[#414141]">
                  Custom automations built for your workflow. Fixed scope, fixed
                  price.
                </p>
                <button className="text-[20px] text-[#151515] font-bold py-[8px]">
                  Learn More
                </button>
              </div>
            </RevealCard>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-[16px]">
            <RevealCard index={1} className="bg-white rounded-[16px] p-[20px] flex flex-col gap-[16px] sm:h-[473px]">
              <div className="flex gap-[16px] items-start">
                <div className="flex-1 pl-[20px]">
                  <h3 className="pt-[10px] text-[21px] leading-[22px] font-medium text-[#000]">
                    Automatic Webstore Sync
                  </h3>
                  <p className="text-[18px] font-normal leading-[25px] pt-[14px] text-[#414141]">
                    Real-time sync between physical store and webstore. Prevents
                    double-selling.
                  </p>
                  <button className="text-[20px] text-[#151515] font-bold py-[8px]">
                    Learn More
                  </button>
                </div>
              </div>
              <PhoneMockup className="h-[160px] sm:h-full w-full" />
            </RevealCard>

            <RevealCard index={2} className="bg-white rounded-[16px] p-[20px]">
              <div className="flex-1 pl-[20px]">
                <h3 className="pt-[10px] text-[21px] leading-[22px] font-medium text-[#000]">
                  Plugins & Integrations
                </h3>
                <p className="text-[18px] font-normal leading-[25px] pt-[14px] text-[#414141]">
                  Connect POS, ERP, CRM, marketplaces. If connector doesn&apos;t
                  exist — we build it.
                </p>
                <button className="text-[20px] text-[#151515] font-bold py-[8px]">
                  Learn More
                </button>
              </div>
            </RevealCard>

            <RevealCard index={3} className="bg-white p-[20px] rounded-[16px] overflow-hidden h-[220px] sm:w-full sm:h-[323px]">
              <PhoneMockup className="h-full w-full" />
            </RevealCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
