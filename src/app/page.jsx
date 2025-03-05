import { FaArrowRightLong } from "react-icons/fa6";
import Link from "next/link";
export default function Home() {
  return (
    <section className="min-h-screen pt-6 sm:pt-16 lg:pt-[5rem] pb-6 sm:pb-16 lg:pb-[5rem] font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-[#FFF0F0] to-[#DD8081]">
      <div className="container mx-auto flex flex-col lg:flex-row h-full gap-8 mb-10 lg:mb-[4rem]">
        {/* Left Section */}
        <div className="left-text w-full lg:w-[50%] text-[20px] sm:text-[24px] lg:text-[28px] mt-4">
          <h1 className="text-[2rem] sm:text-[2.5rem] lg:text-[3.5rem] text-white relative mb-8 lg:mb-[3rem]">
            <Link href="/">
              <img
                src="/fashlogo.svg"
                className="w-[16%] sm:w-[16%] lg:w-[16%] mb-4"
                alt="Logo"
              />
            </Link>
            <span className="text-[#0dcf00] font-bold ml-2  xl:text-[3.2rem] 2xl:text-[7.2rem]">
              SECONDHAND STORES
            </span>
          </h1>
          <h5 className="text-white relative mb-10 sm:mb-[5rem] leading-6 sm:leading-8 lg:leading-[2rem]  text-[1.5rem]  2xl:text-[2.5rem]  2xl:leading-[30px] font-bold">
            AI Automated listing of new products & Smart POS for resale and
            secondhand stores
          </h5>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full justify-start lg:justify-between items-start lg:items-end">
            <h2 className="text-[1.5rem] sm:text-[2rem] lg:text-[2.5rem] 2xl:text-[6rem] text-white lg:w-[75%] leading-[2rem] sm:leading-[3rem] lg:leading-[6rem]">
              Ready to grow your business effortlessly?
            </h2>
            <Link
              href="/login"
              className="bg-white w-full sm:w-48 py-2 px-5 rounded-lg hover:bg-[#53f84b] transition duration-300 text-[1rem] sm:text-[1.5rem] text-center py-4"
            >
              LOGIN
            </Link>
          </div>
        </div>
        {/* Right Section */}
        <div className="right-img w-full lg:w-[50%] mt-4 lg:mt-0">
          <img
            src="/consion.jpg"
            className="w-full h-auto object-cover"
            alt="Mobile preview"
          />
        </div>
      </div>

      {/* Buttons Section */}
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-center sm:justify-between gap-4 sm:gap-6">
          <button className="border border-neutral-200 w-full sm:w-[33.333%] text-[#edf0f2] py-6 text-[1rem] sm:text-[1.5rem] 2xl:text-[2rem] lg:text-[1.5rem] hover:bg-[#0dcf00] transition duration-300">
            Let's revolutionize resale fashion
          </button>
          <button className="border border-neutral-200 w-full sm:w-[33.333%] text-white py-6 text-[1rem] sm:text-[1.25rem] lg:text-[1.3rem] font-bold">
            CONTACT <span className="ml-6 sm:ml-[60px]">ABOUT</span>
          </button>
          <button className="border border-neutral-200 w-full sm:w-[33.333%] text-white py-6 flex items-center gap-4 justify-center text-[1rem] sm:text-[1.25rem] lg:text-[1.3rem] font-bold hover:bg-[#0dcf00] transition duration-300">
            <FaArrowRightLong size={24} /> MEMBERSHIP
          </button>
        </div>
      </div>
    </section>
  );
}
