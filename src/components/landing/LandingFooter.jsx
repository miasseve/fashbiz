const LandingFooter = () => {
  return (
    <footer className="bg-[#0a0f0a] px-[24px] sm:px-[40px] pt-[40px] pb-[24px]">
      <div className="max-w-[1152px] mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-start gap-[32px] sm:gap-[80px] pb-[32px]">
          <div className="min-w-[160px]">
            <div className="text-white font-bold text-[36px] leading-none mb-[4px]">
              RE<span className="text-red-500">e</span>
            </div>
            <p className="text-[14px] leading-[35px] text-white">We built these tools because</p>
          </div>

          <div className="flex flex-col gap-[12px]">
            <a href="/theproblem" className="text-[16px] leading-[18px] text-white">Who we help</a>
            <a href="/tools" className="text-[16px] leading-[18px] text-white">Our tools</a>
            <a href="#" className="text-[16px] leading-[18px] text-white">Company</a>
          </div>
        </div>

        <div className="w-full h-px bg-[#414C45]" />

        <div className="pt-[20px] text-center">
          <p className="text-[#DFDFDF] text-[14px] leading-[18px]">
            &copy; 2026 REe. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
