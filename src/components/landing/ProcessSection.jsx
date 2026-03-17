import { Search, Lightbulb, Rocket, BadgeCheck } from "lucide-react";

const steps = [
  {
    step: "Step 1",
    title: "Audit",
    desc: "We map manual work and lost time. We show the cost in time and money.",
    deliverable: "Automation opportunity map.",
    icon: <Search size={25} className="text-red-400" />,
  },
  {
    step: "Step 2",
    title: "Recommend",
    desc: "We design the right automation setup. Ready tools when possible. Custom builds if needed.",
    deliverable: "Custom roadmap.",
    icon: <Lightbulb size={25} className="text-red-400" />,
  },
  {
    step: "Step 3",
    title: "Build & Deploy",
    desc: "We implement everything.",
    deliverable: "Live automations.",
    icon: <Rocket size={25} className="text-red-400" />,
  },
  {
    step: "Step 4",
    title: "Guarantee",
    desc: "We train your team and measure results. If we promise 60 hours saved — we verify it.",
    deliverable: "Performance report + support.",
    icon: <BadgeCheck size={25} className="text-red-400" />,
  },
];

export default function ProcessSection() {
  return (
    <section className="bg-white py-[48px] sm:py-[64px] md:py-[96px] px-[16px] sm:px-[24px] lg:mx-[64px] lg:my-[80px]">
      <div className="w-full max-w-[95%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[77%] mx-auto text-center">
        <h2 className="text-[26px] sm:text-[32px] md:text-[40px] font-bold leading-[32px] sm:leading-[38px] md:leading-[43px] text-[#252525]">
          We come in. We find it. We fix it.
        </h2>

        <p className="text-[15px] sm:text-[16px] md:text-[18px] font-medium mt-[12px] leading-[24px] sm:leading-[27px] md:leading-[30px] text-[#434343]">
          Four steps. One team. Your operations transformed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] sm:gap-[20px] mt-[40px] sm:mt-[48px]">
          {steps.map((item, index) => (
            <div
              key={index}
              className="bg-white flex flex-col w-full rounded-[20px] p-[24px] text-left transition-all duration-300 ease-out shadow-[0px_0px_5px_rgba(0,0,0,0.1)] hover:-translate-y-2 hover:shadow-[0px_8px_24px_rgba(255,79,75,0.3)] active:-translate-y-2 active:shadow-[0px_8px_24px_rgba(255,79,75,0.3)]"
            >
              <div>
                <div className="w-[60px] h-[60px] flex items-center justify-center rounded-[15px] bg-red-50 mb-[16px]">
                  {item.icon}
                </div>
                <p className="text-[#FF4641] text-[16px] font-medium">
                  {item.step}
                </p>
                <h3 className="text-[18px] mt-[8px]">{item.title}</h3>
              </div>
              <div className="mt-[23px]">
                <p className="text-[16px] leading-[18px] text-[#252525] h-[70px] overflow-hidden">
                  {item.desc}
                </p>
                <div className="border-t border-[#D9D9D9] mt-[16px] pt-[16px] text-[14px]">
                  <span className="font-semibold">Deliverable:</span>{" "}
                  <span className="text-[#434343]">{item.deliverable}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[40px] sm:mt-[48px] w-full">
          <div
            className="border-l-8 border-red-500 px-[20px] sm:px-[32px] py-[16px] sm:py-[20px] text-gray-600 italic text-[16px] sm:text-[18px] font-medium w-full text-left"
            style={{
              background: "linear-gradient(to right, #fff1f2, #ffffff)",
            }}
          >
            &quot;If we don&apos;t hit the agreed target — we return until we
            do.&quot;
          </div>
        </div>

        <button className="mt-[24px] sm:mt-[32px] bg-red-500 hover:bg-red-600 cursor-pointer text-white px-[24px] sm:px-[32px] py-[12px] rounded-full font-medium transition">
          Start with an audit →
        </button>
      </div>
    </section>
  );
}
