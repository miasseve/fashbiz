"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
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

export default function SubscriptionPlans({ user }) {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [userRole, setUserRole] = useState(user?.role || "");
  const [selectedPriceId, setSelectedPriceId] = useState(null);
  const router = useRouter();
  const [terms, setTerms] = useState({
    term1: false,
  });

  const allChecked = Object.values(terms).every(Boolean);

  const handleContinue = async () => {
    if (!allChecked) return;
    //validate the refferal code
    const { status, message } = await checkvalidReferralCode(
      referralCode.trim(),
    );
    // console.log("Referral code validation:", status, message);
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
    user?.subscriptionEnd && dayjs().isBefore(dayjs(user.subscriptionEnd));

  useEffect(() => {
    setUserRole(user?.role);
    fetchPlans();
  }, [hasActiveSubscription, user]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/stripe/plans");
      const data = await res.json();

      const formattedPlans = data.map((plan) => ({
        id: plan.id,
        name: plan.product.name,
        price: plan.unit_amount
          ? `${(plan.unit_amount / 100).toFixed(
              2,
            )} ${plan.currency.toUpperCase()}`
          : "0 DKK",
        period: plan.recurring_interval || "month",
        tagline: plan.tagline || "",
        subtitle: plan.subtitle || "",
        cardBgColor: plan.bgColor || "bg-white",
        features: plan.features || ["✔ Basic access"],
      }));

      setPlans(formattedPlans);

      if (hasActiveSubscription && user?.subscriptionType) {
        const matchedPlan = formattedPlans.find(
          (p) => p.name.toLowerCase() === user.subscriptionType.toLowerCase(),
        );

        if (matchedPlan) {
          setActivePlan(matchedPlan);
        } else {
          setActivePlan(null);
        }
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

  // const activePlan = hasActiveSubscription ? user.subscriptionType : null;

  //this redirect to the stripe default checkout page
  const handleSubscribe = async (plan) => {
    try {
      if (!allChecked) return;
      if (referralCode?.trim()) {
        const { status, message } = await checkvalidReferralCode(
          referralCode.trim(),
        );

        console.log("Referral code validation:", status, message);

        if (status !== 200) {
          toast.error(message);
          return;
        }
      }

      let encryptedReferral = null;
      if (referralCode?.trim()) {
        const res = await fetch("/api/encryptreferral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: referralCode.trim() }),
        });

        const data = await res.json();
        encryptedReferral = data.encrypted;
      }
      setIsOpen(false);
      // Send plan info and user ID to your backend API route
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan.id, // Stripe Price ID
          userId: user._id, // assuming you have user._id or user.id
          referral: encryptedReferral || null,
        }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect user to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout session.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleCheckout = async (priceId) => {
    if (!user) return;
    setSelectedPriceId(priceId);
    if (userRole === "store") setIsOpen(true);
    if (userRole !== "store") {
      // \app\checkout\page.jsx
      router.push(`/checkout?userId=${user._id}&priceId=${priceId}`);
    }
  };

  const handleCancelSubscription = async () => {
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
        // setActionLoading('cancel');
        try {
          const res = await fetch("/api/stripe/subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id, action: "cancel" }),
          });
          const data = await res.json();
          if (data.success) {
            //archive all products of the user
            await archiveProduct(user._id);
            toast.success(
              data.message || "Subscription will cancel at period end",
            );
            router.refresh();
            // await fetchData();
          } else {
            toast.error(`Error: ${data.error}`);
          }
        } catch (error) {
          console.log(error.message);
          toast.error("Error cancelling subscription");
          // alert("Failed to cancel subscription");
        } finally {
          // setActionLoading(null);
        }
      }
    });
  };

  return (
    <section>
      <div className="max-w-7xl mx-auto">
        {hasActiveSubscription ? (
          <div className="max-w-xl mx-auto mb-10">
            <Card className="relative bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-10">
              <div className="absolute top-4 right-4 bg-green-500 text-white font-bold px-5 py-2 rounded-lg shadow-lg text-2xl">
                ACTIVE
              </div>
              <CardHeader className="flex flex-col items-center pt-4">
                <h3 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
                  {activePlan?.name ? (
                    <>
                      {activePlan.name.charAt(0).toUpperCase() +
                        activePlan.name.slice(1)}{" "}
                      Plan
                    </>
                  ) : (
                    "Free Plan"
                  )}
                </h3>
                <p className="text-2xl text-gray-700 dark:text-gray-300 font-semibold">
                  Your subscription is currently active
                </p>
              </CardHeader>
              <CardBody className="text-center space-y-6 pt-6">
                <div className="flex justify-around w-full text-gray-800 dark:text-gray-200 font-semibold text-xl">
                  <p>
                    <span className="font-bold">Start:</span>{" "}
                    {dayjs(user.subscriptionStart).format("DD MMM YYYY")}
                  </p>
                  <p>
                    <span className="font-bold">
                      {user.subscriptionType !== "free"
                        ? "Renews On:"
                        : "Ends On:"}
                    </span>{" "}
                    {dayjs(user.subscriptionEnd).format("DD MMM YYYY")}
                  </p>
                </div>
                {activePlan ? (
                  <ul className="text-gray-700 list-disc list-inside dark:text-gray-300 mb-6 space-y-3 text-md sm:text-xl text-left px-6">
                    {activePlan.features && activePlan.features.length > 0 ? (
                      activePlan.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))
                    ) : (
                      <li>No features available for this plan.</li>
                    )}
                  </ul>
                ) : (
                  <ul className="text-gray-700 list-disc list-inside dark:text-gray-300 mb-6 space-y-3 text-md text-left px-6">
                    <li>Full access to premium features</li>
                    <li>Priority customer support</li>
                    <li>Unlimited product uploads</li>
                    <li>Advanced analytics & reports</li>
                  </ul>
                )}

                {user.subscriptionType !== "free" &&
                  (() => {
                    const startDate = new Date(user.subscriptionStart);
                    const sixMonthsLater = new Date(startDate);
                    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
                    const now = new Date();

                    const canCancel = now >= sixMonthsLater;

                    return canCancel ? (
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded-xl shadow-xl text-xl transition-all duration-300"
                        onPress={handleCancelSubscription}
                      >
                        Cancel Subscription
                      </Button>
                    ) : (
                      <div className="text-yellow-600 font-semibold text-md sm:text-xl mt-4">
                        ⏳ <span className="font-semibold">Note:</span> Your
                        subscription is locked for the first{" "}
                        <span className="font-bold">6 months</span>. You'll be
                        able to cancel it after{" "}
                        <span className="font-bold">
                          {sixMonthsLater.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        . Until then, enjoy uninterrupted access to your plan!
                      </div>
                    );
                  })()}
              </CardBody>
            </Card>
          </div>
        ) : userRole === "store" ? (
          <div className="max-w-xl mx-auto">
            <Card className="bg-gray-200 dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white shadow-lg">
              <CardHeader className="flex flex-col items-center pt-8 pb-4">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-red-600 mb-2">
                  Subscription Required
                </h3>
                <p className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Your plan has expired or you have not subscribed yet.
                </p>
              </CardHeader>
              <CardBody className="text-center pb-8 px-6">
                <ul className="text-gray-700 list-disc list-inside dark:text-gray-300 mb-6 space-y-3 text-lg text-left px-6">
                  <li>Full access to premium features</li>
                  <li>Priority customer support</li>
                  <li>Unlimited product uploads</li>
                  <li>Advanced analytics & reports</li>
                </ul>

                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                  Please choose a plan below to continue enjoying our services.
                </p>
              </CardBody>
            </Card>
          </div>
        ) : null}
      </div>

      <h2 className="text-6xl font-bold text-center text-gray-900 text-white mb-5">
        Get a Plan
      </h2>

      {/* Main Layout with Plans and Add-on Cards */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Subscription Plans Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans
            .filter(
              (plan) =>
                (userRole === "store" && plan.name !== "Brand Collect") ||
                (userRole === "brand" && plan.name === "Brand Collect"),
            )
            .map((plan, index) => {
              const cardBgColor = plan.cardBgColor || "bg-white";
              return (
                <div key={plan.id} className="flex flex-col">
                  <p className="min-h-[30px] text-[#ebf96d] font-semibold mb-6 text-md leading-tight mt-2">
                    {plan.tagline}
                  </p>
                  <Card
                    className={`flex-1 flex flex-col rounded-xl ${cardBgColor} p-6 sm:p-8 text-purple-700 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl hover:-translate-y-2 relative overflow-visible`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 -right-3 bg-yellow-400 text-black font-bold px-4 py-2 rounded-full text-sm shadow-lg z-10 animate-pulse">
                        POPULAR
                      </div>
                    )}
                    <CardHeader className="p-0 flex-col items-start">
                      <span className="inline-block px-6 sm:px-8 py-3 rounded-full bg-[linear-gradient(270deg,_#FDFFE0_-3.38%,_#F5F300_45.33%,_#FFAB00_100%)] text-purple-700 font-bold text-md sm:text-[20px] w-fit">
                        {plan.name}
                      </span>

                      <h3 className="mt-6 sm:mt-8 text-lg sm:text-xl font-bold text-[#6711a4]">
                        {plan.subtitle}
                      </h3>
                    </CardHeader>

                    <CardBody className="p-0 flex flex-col flex-1">
                      <ul className="my-6 list-disc list-inside pl-5 space-y-2 sm:space-y-3 text-md text-purple-700">
                        {plan.features.map((item, i) => (
                          <li key={i} className="leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                      <div className="border-t-[3px] border-white mt-auto pt-6">
                        <p className="text-3xl sm:text-4xl font-bold text-purple-700">
                          {plan.price}
                        </p>
                        <Button
                          className={`w-full mt-6 px-6 py-10 rounded-xl font-bold text-[18px] transition-all duration-300 shadow-lg ${
                            activePlan && activePlan?.name === plan.name
                              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                              : plan.popular
                                ? "bg-white text-[#6711a4] hover:bg-gray-100 hover:shadow-xl"
                                : "bg-[#6711a4] text-white hover:bg-[#5a0d8a] hover:shadow-xl"
                          }`}
                          onPress={() => {
                            if (activePlan && activePlan?.name === plan.name)
                              return;
                            handleCheckout(plan.id);
                          }}
                          disabled={
                            activePlan && activePlan?.name === plan.name
                          }
                        >
                          {activePlan?.name === plan.name
                            ? "Subscribed"
                            : plan.popular
                              ? "Get Started"
                              : "Subscribe Now"}
                        </Button>
                        {userRole === "store" && (
                          <p className="mt-4 text-[1.4rem] font-semibold text-purple-600 text-center">
                            🎁 Get{" "}
                            <span className="font-bold">1 month free</span> by
                            inviting a store!
                          </p>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              );
            })}
        </div>

        {/* Add-on Cards on the Right */}
        <div className="lg:w-80 flex flex-col gap-6">
          {/* Add-on Header */}
          <div className="text-center lg:text-left">
            <h3 className="text-3xl sm:text-4xl font-bold text-[#ebf96d] mb-2">
              Add on
            </h3>
          </div>

          {/* Re-e Plug-in Card */}
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 sm:p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
            <CardBody className="p-0 flex flex-col justify-between h-full">
              <div>
                <h4 className="text-2xl sm:text-3xl font-bold text-[#ebf96d] mb-4">
                  Re-e plug-in to your site
                </h4>
                <p className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
                  3290 DKK
                </p>
              </div>
              <Button className="w-full mt-6 px-6 py-10 rounded-xl font-bold text-[18px] transition-all duration-300 shadow-lg bg-white text-teal-700 hover:bg-gray-100 hover:shadow-xl">
                Get Started
              </Button>
            </CardBody>
          </Card>

          {/* Custom Web Shop Card */}
          <Card className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6 sm:p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
            <CardBody className="p-0 flex flex-col justify-between h-full">
              <div>
                <h4 className="text-2xl sm:text-3xl font-bold text-[#ebf96d] mb-4">
                  You need your web shop?
                </h4>
                <h5 className="text-xl sm:text-2xl font-semibold text-[#ebf96d] mb-4">
                  Contact us for a quote
                </h5>
                <p className="text-md sm:text-base text-white/90 leading-relaxed">
                  We build all and connect REe and you have an automated web
                  shop
                </p>
              </div>
              <Button className="w-full mt-6 px-6 py-10 rounded-xl font-bold text-[18px] transition-all duration-300 shadow-lg bg-white text-teal-700 hover:bg-gray-100 hover:shadow-xl mb-6">
                Contact Us
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

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
                    I agree to the platform's Terms and Privacy Policy.
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
    </section>
  );
}
