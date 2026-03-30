import { useEffect, useState, useRef } from "react";
import { VARIANTS, GROUP_DISPLAY, CARD_H, NUDGE, getScrollParent } from "./pricingConstants";
import PricingCard from "./PricingCard";
import PricingCardRight from "./PricingCardRight";

export default function PricingStack({ planGroups, activePlan, handleCheckout, onActiveChange, readOnly, tryMode }) {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const count = planGroups.length;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const scrollParent = getScrollParent(el);

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const stickyTop = 71;
      const scrollable = el.offsetHeight - (scrollParent === window ? window.innerHeight : scrollParent.clientHeight);
      const scrolled = Math.max(0, -(rect.top - stickyTop));
      const p = Math.min(1, scrolled / Math.max(scrollable, 1));
      setProgress(p);
    };

    const target = scrollParent === window ? window : scrollParent;
    target.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => target.removeEventListener("scroll", onScroll);
  }, []);

  const phases = Math.max(count - 1, 1);
  const phaseSize = 1 / phases;

  const getCardStyle = (index) => {
    if (count === 1) {
      return { transform: "translateY(0) scale(1)", opacity: 1, zIndex: 10 };
    }

    const zIndex = (index + 1) * 10;
    let y = 0;
    let scale = 1;
    let opacity = 1;

    if (index === 0) {
      const p = Math.min(1, progress / phaseSize);
      y = -NUDGE * p;
      scale = 1 - 0.04 * p;
    } else {
      const riseStart = (index - 1) * phaseSize;
      const riseP = Math.max(0, Math.min(1, (progress - riseStart) / phaseSize));
      const startY = CARD_H + 40;
      y = startY * (1 - riseP);
      scale = 1;
      opacity = riseP > 0 ? 1 : 0;

      if (index < count - 1) {
        const nudgeStart = index * phaseSize;
        const nudgeP = Math.max(0, Math.min(1, (progress - nudgeStart) / phaseSize));
        y += -NUDGE * nudgeP;
        scale = 1 - 0.04 * nudgeP;
      }
    }

    return { transform: `translateY(${y}px) scale(${scale})`, opacity, zIndex };
  };

  const activeDot =
    count <= 1
      ? 0
      : Math.min(count - 1, Math.floor(progress * phases + 0.5));

  useEffect(() => {
    if (onActiveChange) onActiveChange(activeDot);
  }, [activeDot, onActiveChange]);

  return (
    <section ref={sectionRef} className="pricing-section">
      <div className="pricing-sticky">
        <div className="pricing-row">
          {/* ─── LEFT: main cards ─── */}
          <div className="pricing-stack">
            {planGroups.map((group, i) => (
              <div
                key={group.productName}
                className="pricing-card-wrapper"
                style={getCardStyle(i)}
              >
                <PricingCard
                  group={group}
                  variant={VARIANTS[i % VARIANTS.length]}
                  activePlan={activePlan}
                  handleCheckout={handleCheckout}
                  readOnly={readOnly}
                />
              </div>
            ))}
          </div>

          {/* ─── MOBILE-ONLY: no-subscription above right cards ─── */}
          <div className="pricing-mobile-nosub">
            <div className="pricing-mobile-info__nosub-title">NO SUBSCRIPTION</div>
            <div className="pricing-mobile-info__nosub-card">
              FROM 10 DKK<br />PER PRODUCT
            </div>
          </div>

          {/* ─── RIGHT: compact cards ─── */}
          <div className="pricing-stack-right">
            {planGroups.map((group, i) => (
              <div
                key={`${group.productName}-right`}
                className="pricing-card-wrapper"
                style={getCardStyle(i)}
              >
                <PricingCardRight
                  group={group}
                  variant={VARIANTS[i % VARIANTS.length]}
                  tryMode={tryMode}
                />
              </div>
            ))}
          </div>
        </div>

        {count > 1 && (
          <>
            <div className="pricing-dots">
              {planGroups.map((g, i) => (
                <div
                  key={g.productName}
                  className="pricing-dot"
                  style={{
                    width: i === activeDot ? 28 : 8,
                    background:
                      i === activeDot ? "#111" : "rgba(0,0,0,0.18)",
                  }}
                />
              ))}
            </div>
            <div className="pricing-label">
              {GROUP_DISPLAY[planGroups[activeDot]?.productName] || planGroups[activeDot]?.productName}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
