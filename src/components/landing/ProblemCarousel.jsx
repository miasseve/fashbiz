"use client";

import { useEffect, useRef } from "react";

const slides = [
  {
    id: 1,
    title: "Products not listed fast enough",
    desc: "Can't sell if they aren't online. Manual listing slows revenue.",
    img: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80",
  },
  {
    id: 2,
    title: "Stock not synced across channels",
    desc: "Double selling. Customers arriving for sold items. Manual updates lag behind.",
    img: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600&q=80",
  },
  {
    id: 3,
    title: "Hidden admin work",
    desc: "The real cost of admin is usually much higher than expected.",
    img: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80",
  },
  {
    id: 4,
    title: "Growth limited by manual processes",
    desc: "You can't scale what you can't automate.",
    img: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&q=80",
  },
  {
    id: 5,
    title: "Tools not connected",
    desc: "Retailers have tools, but they don’t work together and no one owns the outcome.",
    img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80",
  },
];

const PhoneCard = ({ slide }) => (
  <div className="flex-shrink-0 h-[639px] w-[401px] bg-gradient-to-b from-[#000000] to-[#2D0200] rounded-[22px]">
    <div className="rounded-[16px] overflow-hidden w-full h-[445px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={slide.img} alt={slide.title} className="w-full h-full object-cover" />
    </div>
    <div className="pt-[16px] pb-[12px] px-[8px] text-center">
      <h3 className="text-[22px] h-[52px] text-white font-medium leading-[22px]">{slide.title}</h3>
      <p className="text-[18px] leading-[25px] text-white">{slide.desc}</p>
    </div>
  </div>
);

const ProblemCarousel = () => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    let scrollAmount = 0;

    const autoScroll = () => {
      scrollAmount += 1;
      if (scrollAmount >= container.scrollWidth / 2) {
        scrollAmount = 0;
      }
      container.scrollLeft = scrollAmount;
    };

    const interval = setInterval(autoScroll, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="pb-[80px] overflow-hidden">
      <div ref={scrollRef} className="flex gap-[24px] px-[40px] overflow-x-hidden">
        {[...slides, ...slides].map((slide, index) => (
          <PhoneCard key={index} slide={slide} />
        ))}
      </div>
    </section>
  );
};

export default ProblemCarousel;
