"use client";
import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Checkbox,
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { checkvalidReferralCode } from "@/actions/accountAction";
import { archiveProduct } from "@/actions/productActions";
import { Spinner } from "@heroui/react";
import Link from "next/link";
import PRICING_CSS from "@/components/pricing/pricingStyles";
import { GROUP_DISPLAY } from "@/components/pricing/pricingConstants";
import PricingStack from "@/components/pricing/PricingStack";

export default function SubscriptionPlans({ user, readOnly = false }) {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [userRole, setUserRole] = useState(user?.role || "store");
  const [selectedPriceId, setSelectedPriceId] = useState(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const router = useRouter();
  const [terms, setTerms] = useState({
    term1: false,
  });

  const allChecked = Object.values(terms).every(Boolean);

  const handleContinue = async () => {
    if (readOnly || !allChecked) return;
    const { status, message } = await checkvalidReferralCode(
      referralCode.trim(),
    );
    if (status != 200) {
      toast.error(message);
      return;
    }
    let encryptedReferral = null;
    try {
      const res = await fetch("/api/encryptreferral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: referralCode.trim() }),
      });
      const data = await res.json();
      encryptedReferral = data.encrypted;
      setIsOpen(false);
      router.push(
        `/checkout?userId=${
          user._id
        }&priceId=${selectedPriceId}&referral=${encodeURIComponent(
          encryptedReferral,
        )}`,
      );
    } catch (err) {
      router.push("subscription-plan");
      console.error("Failed to encrypt referral:", err.message);
      return;
    }
  };

  const hasActiveSubscription =
    !readOnly && user?.subscriptionEnd && dayjs().isBefore(dayjs(user.subscriptionEnd));

  useEffect(() => {
    if (!readOnly) setUserRole(user?.role);
    fetchPlans();
  }, [hasActiveSubscription, user]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/stripe/plans");
      const data = await res.json();

      if (!Array.isArray(data)) {
        setPlans([]);
        return;
      }

      const formattedPlans = data.map((plan) => {
        const fullName = plan.nickname || plan.product.name;
        const words = fullName.split(" ");
        const rawTier = words.length > 1 ? words.slice(1).join(" ") : fullName;
        const TIER_RENAMES = { "Basic": "Basic", "Pro": "Pro" };
        const tierName = TIER_RENAMES[rawTier] || rawTier;

        return {
          id: plan.id,
          nickname: fullName,
          productName: plan.product.name,
          tierName,
          name: plan.product.name,
          price: plan.unit_amount
            ? `${(plan.unit_amount / 100).toFixed(
                2,
              )} ${plan.currency.toUpperCase()}`
            : "0 DKK",
          period: plan.recurring?.interval || (plan.priceType === "one_time" ? "once" : "month"),
          priceType: plan.priceType || "recurring",
          tagline: plan.tagline || "",
          subtitle: plan.subtitle || "",
          cardBgColor: plan.bgColor || "bg-white",
          features: plan.features || ["Basic access"],
          productLimit: plan.productLimit,
          maxUsers: plan.maxUsers,
          transactionFee: plan.transactionFee || null,
          requiresQuote: plan.requiresQuote || false,
          planType: plan.planType || "subscription",
        };
      });

      setPlans(formattedPlans);

      if (hasActiveSubscription && user?.subscriptionType) {
        const matchedPlan = formattedPlans.find(
          (p) =>
            p.name.toLowerCase() === user.subscriptionType.toLowerCase() ||
            p.nickname.toLowerCase() === user.subscriptionType.toLowerCase(),
        );
        setActivePlan(matchedPlan || null);
      } else {
        setActivePlan(null);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const handleCheckout = async (priceId) => {
    if (readOnly || !user) return;
    setSelectedPriceId(priceId);
    if (userRole === "store") setIsOpen(true);
    if (userRole !== "store") {
      router.push(`/checkout?userId=${user._id}&priceId=${priceId}`);
    }
  };

  const handleCancelSubscription = async () => {
    if (readOnly) return;
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to cancel your subscription at the end of the current period?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "No, keep me subscribed",
      reverseButtons: true,
      customClass: {
        confirmButton:
          "bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg",
        cancelButton:
          "bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-4 py-2 rounded-lg",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch("/api/stripe/subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id, action: "cancel" }),
          });
          const data = await res.json();
          if (data.success) {
            await archiveProduct(user._id);
            toast.success(
              data.message || "Subscription will cancel at period end",
            );
            router.refresh();
          } else {
            toast.error(`Error: ${data.error}`);
          }
        } catch (error) {
          console.log(error.message);
          toast.error("Error cancelling subscription");
        }
      }
    });
  };

  // Filter plans by role (readOnly defaults to "store" view)
  const filteredPlans = plans.filter(
    (plan) =>
      (userRole === "store" && plan.name !== "Brand Collect") ||
      (userRole === "brand" && plan.name === "Brand Collect"),
  );

  const paidPlans = filteredPlans.filter(
    (p) => p.price !== "0 DKK" && p.price !== "0.00 DKK",
  );

  // Group paid plans by stripping tier suffix (Basic/Pro) from product name
  const getGroupName = (name) =>
    name.replace(/\s+(Basic|Pro)$/i, "").trim();

  const groupedPlans = paidPlans.reduce((acc, plan) => {
    const key = getGroupName(plan.productName);
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {});

  // Build groups in explicit order: Ads → Webstore → Plugin
  const groupKeys = Object.keys(groupedPlans);
  const findKey = (test) => groupKeys.find((k) => test(k.toLowerCase()));
  const orderedKeys = [
    findKey((n) => n === "ads" || n === "add" || (n.includes("ad") && !n.includes("webstore") && !n.includes("plug"))),
    findKey((n) => n.includes("webstore")),
    findKey((n) => n.includes("plug")),
  ].filter(Boolean);
  groupKeys.forEach((k) => { if (!orderedKeys.includes(k)) orderedKeys.push(k); });

  const planGroups = orderedKeys.map((key) => ({
    productName: key,
    plans: groupedPlans[key].sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
  }));

  return (
    <section>
      <style>{PRICING_CSS}</style>

      {/* ── Status card ── */}
      {readOnly ? (
        <div className="pc pc--light pc-status" style={{ maxWidth: "min(960px, 95vw)", margin: "0 auto 24px", height: "auto", borderRadius: 26 }}>
          <div className="pc__left pc-status__left" style={{ width: "clamp(150px, 22%, 200px)", justifyContent: "center", gap: 10, position: "relative" }}>
            <div style={{ fontWeight: 800, fontSize: "clamp(24px, 3.2vw, 36px)", color: "#111", lineHeight: 1.1 }}>
              Preview <span style={{ fontWeight: 800, fontSize: "clamp(24px, 3.2vw, 36px)", color: "#111" }}>Plans</span>
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Sign up to subscribe to a plan.</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(18px,2.5vw,28px) clamp(16px,2.5vw,24px)", gap: 14 }}>
            <div style={{ fontWeight: 800, fontSize: "clamp(13px, 1.6vw, 18px)", color: "#111", lineHeight: 1.3 }}>
              Create an account to unlock all features
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Instagram integration", "SecondsToSee webstore synchronization", "Up to 300-1000 products per month", "Up to 2-5 users access"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#374151", fontWeight: 500, lineHeight: 1.5 }}>
                  <span style={{ color: "#9ca3af", fontSize: 14, flexShrink: 0 }}>&#8226;</span>
                  {f}
                </div>
              ))}
            </div>
            <Link
              href="/register"
              style={{
                alignSelf: "flex-start",
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "8px 22px",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Sign Up to Subscribe
            </Link>
          </div>
        </div>
      ) : hasActiveSubscription ? (
        <div className="pc pc--light pc-status" style={{ maxWidth: "min(960px, 95vw)", margin: "0 auto 24px", height: "auto", borderRadius: 26 }}>
          <div className="pc__left pc-status__left" style={{ width: "clamp(150px, 22%, 200px)", justifyContent: "center", gap: 10, position: "relative" }}>
            <div style={{
              position: "absolute", top: 12, right: 12,
              background: "#22c55e", color: "#fff",
              fontWeight: 700, fontSize: 13, lineHeight: 1,
              padding: "6px 16px", borderRadius: 999,
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              ACTIVE
            </div>
            <div style={{ fontWeight: 800, fontSize: "clamp(24px, 3.2vw, 36px)", color: "#111", lineHeight: 1.1 }}>
              {activePlan?.name
                ? (GROUP_DISPLAY[activePlan.name] || activePlan.name)
                : "Free"}{" "}
              <span style={{ fontWeight: 800, fontSize: "clamp(24px, 3.2vw, 36px)", color: "#111" }}>Plan</span>
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Your subscription is currently active.</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(18px,2.5vw,28px) clamp(16px,2.5vw,24px)", gap: 14 }}>
            {/* Date row */}
            <div style={{ display: "flex", gap: "clamp(16px, 3vw, 32px)", fontWeight: 700, fontSize: "clamp(14px, 1.5vw, 17px)" }}>
              <div>
                <span style={{ fontWeight: 700, color: "#111", fontSize: "clamp(13px, 1.3vw, 15px)" }}>Start: </span>
                <span style={{ color: "#111", fontWeight: 600 }}>{dayjs(user.subscriptionStart).format("DD MMM YYYY")}</span>
              </div>
              <div>
                <span style={{ fontWeight: 700, color: "#111", fontSize: "clamp(13px, 1.3vw, 15px)" }}>
                  {user.subscriptionType !== "free" ? "Renews On: " : "Ends On: "}
                </span>
                <span style={{ color: "#111", fontWeight: 600 }}>{dayjs(user.subscriptionEnd).format("DD MMM YYYY")}</span>
              </div>
            </div>
            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {activePlan?.features?.length > 0 ? (
                activePlan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#374151", fontWeight: 500, lineHeight: 1.5 }}>
                    <span style={{ color: "#9ca3af", fontSize: 14, flexShrink: 0 }}>&#8226;</span>
                    {f}
                  </div>
                ))
              ) : (
                (() => {
                  const planName = (activePlan?.name || "").toLowerCase();
                  const isBasic = planName.includes("basic");
                  const isPro = planName.includes("pro");
                  const isAdd = planName.includes("add");
                  const limit = isPro ? "1000" : isBasic ? "300" : "Unlimited";
                  const users = isPro ? "5" : isBasic ? "2" : "1";
                  const fallbackFeatures = [
                    `Upload up to ${limit} products per month`,
                    `Up to ${users} users access`,
                    "Instagram integration",
                    ...(!isAdd ? ["SecondsToSee webstore synchronization"] : []),
                  ];
                  return fallbackFeatures.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#374151", fontWeight: 500, lineHeight: 1.5 }}>
                      <span style={{ color: "#9ca3af", fontSize: 14, flexShrink: 0 }}>&#8226;</span>
                      {f}
                    </div>
                  ));
                })()
              )}
            </div>
            {/* Cancel / lock notice */}
            {user.subscriptionType !== "free" &&
              (() => {
                const startDate = new Date(user.subscriptionStart);
                const sixMonthsLater = new Date(startDate);
                sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
                const now = new Date();
                const canCancel = now >= sixMonthsLater;
                return canCancel ? (
                  <button style={{ alignSelf: "flex-start", background: "#ef4444", color: "#fff", border: "none", borderRadius: 999, padding: "8px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }} onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </button>
                ) : (
                  <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, marginTop: 4, background: "rgba(234,179,8,0.15)", borderRadius: 12, padding: "10px 14px", fontWeight: 500 }}>
                    <span style={{ marginRight: 4 }}>&#9203;</span>
                    <span style={{ fontWeight: 700 }}>Note:</span> Your subscription is locked for the first{" "}
                    <span style={{ fontWeight: 700 }}>6 months</span>. You&apos;ll be able to cancel it after{" "}
                    <span style={{ fontWeight: 700 }}>
                      {sixMonthsLater.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    . Until then, enjoy uninterrupted access to your plan!
                  </div>
                );
              })()}
          </div>
        </div>
      ) : userRole === "store" ? (
        <div className="pc pc--light pc-status" style={{ maxWidth: "min(960px, 95vw)", margin: "0 auto 24px", height: "auto", borderRadius: 26 }}>
          <div className="pc__left pc-status__left" style={{ width: "clamp(150px, 22%, 200px)", justifyContent: "center", gap: 10, position: "relative" }}>
            <div style={{
              position: "absolute", top: 12, right: 12,
              background: "#ef4444", color: "#fff",
              fontWeight: 700, fontSize: 13, lineHeight: 1,
              padding: "6px 16px", borderRadius: 999,
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              INACTIVE
            </div>
            <div style={{ fontWeight: 800, fontSize: "clamp(24px, 3.2vw, 36px)", color: "#111", lineHeight: 1.1 }}>
              No <span style={{ fontWeight: 800, fontSize: "clamp(24px, 3.2vw, 36px)", color: "#111" }}>Plan</span>
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Subscribe to get started.</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(18px,2.5vw,28px) clamp(16px,2.5vw,24px)", gap: 14 }}>
            <div style={{ fontWeight: 800, fontSize: "clamp(13px, 1.6vw, 18px)", color: "#111", lineHeight: 1.3 }}>
              Choose a plan below to continue
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Instagram integration", "SecondsToSee webstore synchronization", "Up to 300–1000 products per month", "Up to 2–5 users access"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#374151", fontWeight: 500, lineHeight: 1.5 }}>
                  <span style={{ color: "#9ca3af", fontSize: 14, flexShrink: 0 }}>&#8226;</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <h2 className="text-3xl md:text-6xl font-bold text-center text-gray-900 text-white mb-5">
        CHOOSE A PLAN
      </h2>

      {/* ─── MOBILE-ONLY: tier info ─── */}
      <div className="pricing-mobile-info">
        <div className="pricing-mobile-info__card">
          <div className="pricing-mobile-info__row">
            <div className="pricing-mobile-info__tier-name">BASIC</div>
            <div className="pricing-mobile-info__tier-detail">Up to 300 products per month</div>
            <div className="pricing-mobile-info__tier-detail">Up to 2 users access</div>
          </div>
          <div className="pricing-mobile-info__divider" />
          <div className="pricing-mobile-info__row">
            <div className="pricing-mobile-info__tier-name">PRO</div>
            <div className="pricing-mobile-info__tier-detail">Up to 1000 products per month</div>
            <div className="pricing-mobile-info__tier-detail">Up to 5 users access</div>
          </div>
        </div>
      </div>

      {/* Tier overview — desktop only */}
      {planGroups.length > 0 && (() => {
        const activeGroup = planGroups[activeGroupIndex] || planGroups[0];
        return (
          <div className="pricing-tier-overview">
            <div className="pricing-tier-left-spacer" />
            <div
              className="pricing-tier-cols"
              style={{ gridTemplateColumns: `repeat(${activeGroup.plans.length}, 1fr)` }}
            >
              {activeGroup.plans.map((plan) => (
                <div key={plan.id} className="pricing-tier-col">
                  <div className="pricing-tier-col__name">{plan.tierName}</div>
                  {(plan.productLimit || plan.maxUsers) && (
                    <div className="pricing-tier-col__info">
                      {plan.productLimit ? `Up to ${plan.productLimit} products per month` : ""}
                      {plan.productLimit && plan.maxUsers ? <br /> : ""}
                      {plan.maxUsers ? `Up to ${plan.maxUsers} users` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="pricing-tier-col--right">
              <div className="pricing-tier-col__name">NO SUBSCRIPTION</div>
              <div className="pricing-tier-col__info">
                FROM 10 DKK<br />PER PRODUCT
              </div>
            </div>
          </div>
        );
      })()}

      {/* Paid Plans — stacking scroll animation */}
      {planGroups.length > 0 && (
        <PricingStack
          planGroups={planGroups}
          activePlan={activePlan}
          handleCheckout={handleCheckout}
          onActiveChange={setActiveGroupIndex}
          readOnly={readOnly}
          tryMode={readOnly}
        />
      )}

      {/* Referral modal — only for authenticated users */}
      {!readOnly && (
        <Modal
          backdrop="blur"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          isDismissable={false}
          placement="center"
          size="2xl"
          className="rounded-xl mx-6 sm:mx-8"
        >
          <ModalContent>
            <ModalHeader className="flex justify-center items-center text-2xl font-semibold">
              Referral Code
            </ModalHeader>

            <ModalBody className="flex flex-col gap-4">
              {!hasReferral ? (
                <p className="text-center text-gray-600">
                  Do you have a referral code?
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Enter your referral code
                  </label>
                  <Input
                    placeholder="e.g. ABC123"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    fullWidth
                    radius="md"
                    size="lg"
                    className="w-full"
                  />

                  <div className="flex flex-col gap-2 mt-3">
                    <p className="text-lg font-medium text-gray-700 mb-1">
                      Please agree to all terms & conditions:
                    </p>
                    <Checkbox
                      color="danger"
                      isSelected={terms.term1}
                      onValueChange={(val) => setTerms({ ...terms, term1: val })}
                      classNames={{
                        wrapper: "scale-125 mr-2",
                        label: "text-black-700 text-xl",
                      }}
                    >
                      I agree to the platform&apos;s Terms and Privacy Policy.
                    </Checkbox>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="flex justify-center gap-3">
              {!hasReferral ? (
                <>
                  <Button
                    auto
                    flat
                    color="danger"
                    onPress={() => setHasReferral(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    auto
                    className="bg-pink-100 text-pink-700 hover:bg-pink-200"
                    onPress={() => {
                      setIsOpen(false);
                      router.push(
                        `/checkout?userId=${user._id}&priceId=${selectedPriceId}`,
                      );
                    }}
                  >
                    No
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    auto
                    flat
                    color="danger"
                    onPress={() => setHasReferral(false)}
                  >
                    Back
                  </Button>
                  <Button
                    auto
                    color="danger"
                    isDisabled={!allChecked}
                    onPress={handleContinue}
                  >
                    Continue
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </section>
  );
}
