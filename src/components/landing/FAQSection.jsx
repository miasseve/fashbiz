"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "WHY USE YOU IF WE ALREADY HAVE TOOLS?",
    answer: "Most tools solve one problem. We connect everything — your POS, webstore, inventory, and team workflows — into one automated system. We also handle the gaps your current tools leave behind.",
  },
  {
    question: "IS THIS ONLY FOR SECONDHAND STORES?",
    answer: "No. We work with fashion retail, e-commerce, and any product-based business. Secondhand is our roots, but our systems work across all retail formats.",
  },
  {
    question: "WHAT DOES GUARANTEE MEAN?",
    answer: "We agree on a target upfront — for example, 60 hours saved per month. We measure it. If we don't hit it, we keep working until we do. No extra charge.",
  },
  {
    question: "HOW FAST DO WE SEE RESULTS?",
    answer: "Most clients see measurable time savings within the first two weeks of deployment. Full impact is typically visible within 30–60 days.",
  },
  {
    question: "CAN WE START SMALL?",
    answer: "Yes. We offer a standalone audit with no commitment to continue. Many clients start with one automation and expand from there.",
  },
  {
    question: "WHAT IF MY TEAM ISN'T TECHNICAL?",
    answer: "That's exactly who we build for. We handle all implementation and provide hands-on training. Your team just uses the result.",
  },
  {
    question: "WHAT DOES THE DAY RATE INCLUDE?",
    answer: "Everything: discovery, build, testing, deployment, and documentation. No hidden costs. You know the scope and price before we start.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section
      id="faq"
      className="py-[64px] sm:py-[80px] px-[16px] sm:px-[24px]"
      style={{ background: "radial-gradient(ellipse at center, #3d0a0a 0%, #1a0404 50%, #0d0101 100%)" }}
    >
      <div className="max-w-[896px] mx-auto">

        <div className="text-center mb-[40px]">
          <h2
            className="text-[40px] font-bold leading-[43px] text-white"

          >
            What changes when<br />automation works.
          </h2>
          <p className="text-[18px] pt-[12px] font-medium text-white">Common questions answered</p>
        </div>

        <div className="flex flex-col gap-[20px]">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-[30px] overflow-hidden cursor-pointer"
              onClick={() => toggle(i)}
            >
              <div className="flex items-center justify-between h-[90px] px-[32px]">
                <span className="text-[#000] font-bold text-[16px] sm:text-[18px] tracking-wide pr-4">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  <ChevronDown
                    size={32}
                    className="text-[#000] font-bold text-md transition-transform duration-300"
                    style={{ transform: openIndex === i ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </div>
              </div>

              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: openIndex === i ? "200px" : "0px" }}
              >
                <p className="text-[#555] text-md leading-normal font-semibold px-[32px] pb-[20px]">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FAQSection;
