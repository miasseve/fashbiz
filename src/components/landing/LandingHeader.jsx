"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ContactPanel from "./ContactPanel";

const col1 = [
  {
    title: "Automated Webstore",
    desc: "Webstore and physical store connected in 1 day",
  },
  {
    title: "Automatic Bulk Labelling",
    desc: "",
  },
  {
    title: "Solutions",
    desc: "Explain your need; We solve your inefficiency by adding an automatic tool for it.",
  },
];
const col2 = [
  { title: "Automatic Product Ad", desc: "",href:"#" },
  { title: "Automatic Market-Ready", desc: "",href:"#" },
  { title: "Prices", desc: "" ,href:"/pricing"},
  { title: "Calculate savings", desc: "",href:"#" },
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
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/reelogo.png" alt="REe" className="!h-[34px] w-auto" />
            </Link>

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
                  <div className="absolute top-full !left-[130px] -translate-x-1/2 mt-[12px] w-[860px] bg-[#111111] rounded-[20px] shadow-[0px_8px_40px_rgba(0,0,0,0.35)] p-[32px] z-50 flex gap-[40px]">
                    {/* Left image */}
                    <div className="w-[280px] h-[340px] flex-shrink-0 rounded-[16px] overflow-hidden">
                      <img
                        src="/images/pink_bag.avif"
                        alt="Fashion"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-[20px]">
                      <p className="text-white font-bold text-[20px] tracking-[0.12em] uppercase leading-[1.3]">
                        Large Volume Unique Product Handling
                      </p>

                      <div className="flex gap-[32px]">
                        {/* Col 1 */}
                        <div className="flex flex-col gap-[20px] flex-1">
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
                              <p className="text-white font-semibold text-[15px] mb-[4px] group-hover:text-purple-400 transition-colors">
                                {item.title}
                              </p>
                              {item.desc && (
                                <p className="text-gray-400 text-[12px] leading-[1.5]">
                                  {item.desc}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>

                        {/* Col 2 */}
                        <div className="flex flex-col gap-[20px] flex-1">
                          {col2.map((item) => (
                            <a
                              href={item.href}
                              key={item.title}
                              className="group block no-underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRetailOpen(false);
                              }}
                            >
                              <p className="text-white font-semibold text-[15px] group-hover:text-purple-400 transition-colors">
                                {item.title}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>

              <li className="cursor-pointer hover:text-black"><a href="/tools">Our tools</a></li>
              <li className="cursor-pointer hover:text-black"><Link href="/pricing">Pricing</Link></li>
              <li className="cursor-pointer hover:text-black">
                <a href="/#faq">FAQ</a>
              </li>
            </ul>

            {/* Desktop button */}
            <button
              onClick={() => setContactOpen(true)}
              className="hidden md:block landing-gradient-btn text-white px-[20px] py-[8px] rounded-full font-medium transition text-[16px] cursor-pointer"
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
                    <p className="text-white font-bold text-[11px] tracking-[0.12em] uppercase pb-[4px] border-b border-white/10">
                      Large Volume Unique Product Handling
                    </p>
                    {allItems.map((item) => (
                      <a
                        href="#"
                        key={item.title}
                        className="group block no-underline"
                        onClick={() => setMobileRetailOpen(false)}
                      >
                        <p className="text-white font-semibold text-[14px] mb-[2px] group-hover:text-purple-400 transition-colors">
                          {item.title}
                        </p>
                        {item.desc && (
                          <p className="text-gray-400 text-[12px] leading-[1.5]">
                            {item.desc}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </li>

              <li className="list-none cursor-pointer hover:text-black">
                <a href="/tools">Our tools</a>
              </li>
              <li className="list-none cursor-pointer hover:text-black">
                <Link href="/pricing">Pricing</Link>
              </li>
              <li className="list-none cursor-pointer hover:text-black">
                <a href="/#faq">FAQ</a>
              </li>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setContactOpen(true);
                }}
                className="landing-gradient-btn text-white px-[20px] py-[8px] rounded-full font-medium transition w-fit cursor-pointer"
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
