"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ContactPanel from "./ContactPanel";

const col1 = [
  {
    title: "Marketplace",
    desc: "Simply dummy text of the printing and typesetting",
  },
  {
    title: "Boutiques",
    desc: "Simply dummy text of the printing and typesetting",
  },
  {
    title: "Enterprise",
    desc: "Simply dummy text of the printing and typesetting",
  },
];
const col2 = [
  {
    title: "Calculator",
    desc: "Simply dummy text of the printing and typesetting",
  },
  {
    title: "Pricing",
    desc: "Simply dummy text of the printing and typesetting",
  },
];
const allItems = [...col1, ...col2];

const LandingHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [retailOpen, setRetailOpen] = useState(false);
  const [mobileRetailOpen, setMobileRetailOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const dropdownRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 0) {
        setVisible(true);
      } else if (currentY < lastScrollY.current) {
        setVisible(true);
      } else {
        setVisible(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setRetailOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className={`bg-white fixed top-0 left-0 right-0 z-[997] shadow-[0px_1px_8px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-in-out ${visible ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="landing-container">
          <nav className="w-full px-[32px] py-[12px] flex items-center justify-between">
            {/* Logo */}
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/reelogo.png" alt="REe" className="!h-[34px] w-auto" />
            </div>

            {/* Desktop nav */}
            <ul className="hidden md:flex items-center gap-[40px] text-gray-800 font-medium text-[16px]">
              <li className="cursor-pointer hover:text-black">
                <Link href="/try/add-product">Secondhand retail</Link>
              </li>

              {/* All retail desktop dropdown */}
              <li
                ref={dropdownRef}
                className="list-none cursor-pointer hover:text-black flex items-center gap-[4px] relative"
                onClick={() => setRetailOpen(!retailOpen)}
              >
                All retail
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-[16px] h-[16px] transition-transform duration-200 ${retailOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                {retailOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-[12px] w-[860px] bg-[#111111] rounded-[20px] shadow-[0px_8px_40px_rgba(0,0,0,0.35)] p-[32px] z-50 flex gap-[40px]">
                    {/* Left white card placeholder */}
                    <div className="w-[260px] flex-shrink-0 bg-white rounded-[24px] h-[300px] overflow-hidden">
                      <img
                        src="/leestore_img.png"
                        alt="Lee Store"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Two columns */}
                    <div className="flex gap-[48px] flex-1">
                      <div className="flex flex-col gap-[28px] flex-1">
                        {col1.map((item) => (
                          <a
                            href="#"
                            key={item.title}
                            className="group block no-underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRetailOpen(false);
                            }}
                          >
                            <p className="text-white font-semibold text-[16px] mb-[6px] group-hover:text-red-400 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-gray-400 text-[13px] leading-[1.5]">
                              {item.desc}
                            </p>
                          </a>
                        ))}
                      </div>
                      <div className="flex flex-col gap-[28px] flex-1">
                        {col2.map((item) => (
                          <a
                            href="#"
                            key={item.title}
                            className="group block no-underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRetailOpen(false);
                            }}
                          >
                            <p className="text-white font-semibold text-[16px] mb-[6px] group-hover:text-red-400 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-gray-400 text-[13px] leading-[1.5]">
                              {item.desc}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </li>

              <li className="cursor-pointer hover:text-black"><a href="/tools">Our tools</a></li>
              <li className="cursor-pointer hover:text-black">Pricing</li>
              <li className="cursor-pointer hover:text-black">
                <a href="/#faq">FAQ</a>
              </li>
            </ul>

            {/* Desktop button */}
            <button
              onClick={() => setContactOpen(true)}
              className="hidden md:block bg-red-500 text-white px-[20px] py-[8px] rounded-full font-medium hover:bg-red-600 transition text-[16px] cursor-pointer"
            >
              Contact Us
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex flex-col justify-center items-center gap-[5px] w-[32px] h-[32px] cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span
                className={`block h-[2px] w-[24px] bg-gray-800 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
              />
              <span
                className={`block h-[2px] w-[24px] bg-gray-800 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-[2px] w-[24px] bg-gray-800 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
              />
            </button>
          </nav>

          {/* Mobile dropdown menu */}
          {menuOpen && (
            <div className="md:hidden px-[32px] pb-[20px] flex flex-col gap-[16px] text-gray-800 font-medium text-[16px]">
              <li className="list-none cursor-pointer hover:text-black">
                <Link href="/try/add-product">Secondhand retail</Link>
              </li>

              {/* All retail mobile dropdown */}
              <li className="list-none cursor-pointer hover:text-black">
                <div
                  className="flex items-center gap-[4px]"
                  onClick={() => setMobileRetailOpen(!mobileRetailOpen)}
                >
                  All retail
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-[16px] h-[16px] transition-transform duration-200 ${mobileRetailOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${mobileRetailOpen ? "max-h-[400px] opacity-100 mt-[12px]" : "max-h-0 opacity-0"}`}
                >
                  <div className="bg-[#1a1a1a] rounded-[12px] p-[16px] flex flex-col gap-[16px]">
                    {allItems.map((item) => (
                      <a
                        href="#"
                        key={item.title}
                        className="group block no-underline"
                        onClick={() => setMobileRetailOpen(false)}
                      >
                        <p className="text-white font-semibold text-[14px] mb-[2px] group-hover:text-red-400 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-gray-400 text-[12px] leading-[1.5]">
                          {item.desc}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              </li>

              <li className="list-none cursor-pointer hover:text-black">
                <a href="/tools">Our tools</a>
              </li>
              <li className="list-none cursor-pointer hover:text-black">
                Pricing
              </li>
              <li className="list-none cursor-pointer hover:text-black">
                <a href="/#faq">FAQ</a>
              </li>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setContactOpen(true);
                }}
                className="bg-red-500 text-white px-[20px] py-[8px] rounded-full font-medium hover:bg-red-600 transition w-fit cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          )}
        </div>
      </header>

      <ContactPanel
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
};

export default LandingHeader;
