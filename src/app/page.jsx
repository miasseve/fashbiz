import { FaArrowRightLong } from "react-icons/fa6";
import Link from "next/link";

export const metadata = {
  title: 'Home',
}

export default function Home() {
  return (
    <section className="bg-fash-gradient min-h-screen pt-6 sm:pt-13 lg:pt-[5rem] pb-6 sm:pb-13 lg:pb-[0] font-[family-name:var(--font-geist-sans)]">
      <div className="container mx-auto flex flex-col lg:flex-row h-full gap-8 lg:mb-[0]">
        {/* Left Section */}
        <div className="left-text w-full lg:w-[50%] text-[20px] sm:text-[24px] lg:text-[28px] mt-4">
          <h1 className="text-[2rem] sm:text-[2.5rem] lg:text-[3.5rem] text-white relative mb-8 lg:mb-[3rem]">
            <Link href="/">
              <img
                src="/fashlogo.svg"
                className="w-[70%] sm:w-[16%] lg:w-[37%] mb-4"
                alt="Logo"
              />
            </Link>
            <span className="text-white font-bold ml-2 text-[45px] leading-[42px] sm:leading-[45px]">
              SECONDHAND STORES
            </span>
          </h1>
          <h5 className="text-white relative mb-10 sm:mb-[3rem] font-medium text-[22px] leading-[31px]">
            AI Automated listing of new products & Smart POS for resale and
            secondhand stores
          </h5>
          <div className="gap-6 lg:gap-8 w-full justify-start lg:justify-between items-start lg:items-end">
            <h2 className="font-bold leading-[36px] text-white text-white mb-[32px]">
              Ready to grow your business effortlessly?
            </h2>
            <Link 
              href="/login"
              className="login-btn w-full sm:w-48"
            >
              LOGIN
            </Link> 
          </div>
        </div>
        {/* Right Section */}
        <div className="right-img w-full lg:w-[50%] mt-4 lg:mt-0">
          <img
            src="/consion.jpg"
            className="bg-white p-[30px] border border-[#f72b2b] rounded-[14px] shadow-[0_0_4px_rgba(255,255,2,0.5)]"
            alt="Mobile preview"
          />
        </div>
      </div>

      {/* Buttons Section */}
      {/* <div className="container mx-auto">
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
      </div> */}
    </section>
  );
}
