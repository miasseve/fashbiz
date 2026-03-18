import { ShoppingBag, RefreshCw, ShoppingCart, Code2, LayoutGrid, Users } from "lucide-react";

const expertise = [
  { icon: <ShoppingBag size={20} className="text-purple-500" />, label: "Fashion retail" },
  { icon: <RefreshCw size={20} className="text-purple-500" />, label: "Secondhand commerce" },
  { icon: <ShoppingCart size={20} className="text-purple-500" />, label: "E-commerce" },
  { icon: <Code2 size={20} className="text-purple-500" />, label: "Software engineering" },
  { icon: <LayoutGrid size={20} className="text-purple-500" />, label: "Merchandising" },
  { icon: <Users size={20} className="text-purple-500" />, label: "Retail consulting" },
];

const TeamSection = () => {
  return (
    <section className="py-[48px] sm:py-[96px] lg:py-[160px] px-[16px] sm:px-[40px] md:px-[80px]">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white p-[20px] sm:p-[32px] md:p-[40px]">

          <div className="flex flex-col md:flex-row gap-[32px] md:gap-[40px]">

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2
                  className="text-[26px] sm:text-[32px] lg:text-[40px] font-bold leading-[1.1] sm:leading-[1.1] lg:leading-[43px] text-[#252525]"

                >
                  Fashion people. Tech people.<br />
                  Retail people. One team.
                </h2>
                <p className="text-[15px] sm:text-[16px] lg:text-[18px] font-semibold leading-[22px] sm:leading-[25px] text-[#434343] pt-[12px] sm:pt-[15px]">
                  We are retail professionals and engineers who built the tools we wished existed.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-[12px] sm:gap-[16px] lg:gap-[20px] pt-[20px] sm:pt-[30px]">
                {expertise.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-[8px] sm:gap-[12px] shadow-[0px_0px_5px_rgba(0,0,0,0.1)] rounded-[20px] px-[12px] sm:px-[16px] py-[12px] h-auto min-h-[80px] sm:min-h-[95px] lg:h-[107px]"
                  >
                    <div className="w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] lg:w-[60px] lg:h-[60px] flex-shrink-0 flex items-center justify-center rounded-[15px] bg-purple-50">
                      {item.icon}
                    </div>
                    <span className="text-[13px] sm:text-[15px] lg:text-[18px] text-black font-semibold leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-[16px] sm:text-[18px] font-bold leading-[24px] text-black pt-[16px] sm:pt-[20px] pb-[8px] sm:pb-[12px]">Expertise includes:</p>
            </div>

            <div className="w-full md:w-[48%] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80"
                alt="Team meeting"
                className="w-full h-[220px] sm:h-[280px] md:h-full object-cover"
              />
            </div>
          </div>

          <div className="pt-[16px] sm:pt-[20px]">
            <div
              className="border-l-8 border-purple-500 px-[16px] sm:px-[24px] lg:px-[32px] py-[16px] sm:py-[20px] text-gray-600 italic text-[16px] sm:text-[18px] font-medium w-full text-left"
              style={{ background: "linear-gradient(to right, #f5f3ff, #ffffff)" }}
            >
              <p className="text-[17px] sm:text-[20px] lg:text-[24px] font-medium text-[#414141] w-full lg:w-[67%]">
                &quot;We&apos;ve spent years on both sides — running retail stores and building software. We know what breaks and we know how to fix it.&quot;
              </p>
              <p className="text-[15px] sm:text-[16px] lg:text-[18px] text-black leading-[18px] pt-[10px] sm:pt-[12px]">— Founding Team</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default TeamSection;
