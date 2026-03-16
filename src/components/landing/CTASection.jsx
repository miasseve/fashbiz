import { Phone, Mail } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-[40px] sm:py-[56px] px-[16px] sm:px-[24px] md:px-[40px] lg:px-[64px] xl:px-[24px]">
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-white px-[20px] sm:px-[32px] md:px-[40px] lg:px-[48px] py-[32px] sm:py-[40px] md:py-[48px]">
          <div className="flex flex-col md:flex-row md:items-stretch gap-[32px] md:gap-0">
            {/* Left */}
            <div className="flex-1 flex flex-col justify-between md:pr-[40px] py-[24px] sm:py-[40px] md:py-[64px] lg:py-[80px]">
              <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] font-normal text-black leading-[1.1] sm:leading-[1.15] lg:leading-[42px] pb-[32px] sm:pb-[40px] lg:pb-[61px]">
                Stop doing manually what a machine can do better. Start growing.
              </h2>
              <div className="flex items-center gap-[12px] sm:gap-[16px] flex-wrap">
                <button className="bg-[#D90600] py-[12px] px-[28px] sm:px-[35px] rounded-[35px] text-white leading-[18px] font-medium cursor-pointer text-[14px] sm:text-[16px]">
                  Book a free audit →
                </button>
                <button className="bg-[#E6E6E6] py-[12px] px-[28px] sm:px-[35px] rounded-[35px] text-[#414141] leading-[18px] font-medium cursor-pointer text-[14px] sm:text-[16px]">
                  Try tool free
                </button>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden md:block w-px bg-[#7B7B7B] self-stretch" />
            <div className="block md:hidden h-px bg-[#7B7B7B] w-full" />

            {/* Right */}
            <div className="flex-1 flex flex-col justify-between md:pl-[40px] gap-[24px] py-[24px] sm:py-[40px] md:py-[64px] lg:py-[80px]">
              <div className="flex gap-[12px] sm:gap-[16px]">
                <div className="h-[100px] w-[95px] sm:h-[120px] sm:w-[110px] lg:h-[137px] lg:w-[131px] flex-shrink-0 rounded-[20px] overflow-hidden">
                  <img
                    src="/mia_sev.png"
                    alt="mia sev"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 sm:w-[70%]">
                  <p className="text-[17px] sm:text-[20px] lg:text-[25px] leading-[1.4] sm:leading-[1.4] lg:leading-[35px] italic text-[#414141]">
                    &quot;We built these tools because we needed them ourselves.
                    Now we&apos;re sharing them with retailers who want to grow
                    without burning out.&quot;
                  </p>
                  <p className="text-[17px] sm:text-[20px] lg:text-[25px] leading-[1.4] lg:leading-[35px] font-bold text-[#414141]">
                    — Founding Team
                  </p>

                  <div className="pt-[24px] sm:pt-[30px] lg:pt-[37px] flex flex-col gap-[8px]">
                    <div className="flex items-center gap-[10px] leading-[18px] text-[#414141] text-[14px] sm:text-[16px]">
                      <Phone
                        size={15}
                        className="text-[#414141] flex-shrink-0"
                      />
                      <span>+000 000 0000</span>
                    </div>
                    <div className="flex items-center gap-[10px] text-[#414141] text-[13px] sm:text-[14px]">
                      <Mail
                        size={15}
                        className="text-[#414141] flex-shrink-0"
                      />
                      <span>hello@ree.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
