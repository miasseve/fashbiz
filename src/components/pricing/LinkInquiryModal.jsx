"use client";
import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#ca2356]/40 focus:border-[#ca2356] transition-colors placeholder:text-gray-400";
const inputErrorClass =
  "w-full border border-red-400 rounded-lg px-4 py-3 text-gray-800 text-base bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors placeholder:text-gray-400";

export default function LinkInquiryModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [storeCompany, setStoreCompany] = useState("");
  const [webshopUrl, setWebshopUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [didSubmit, setDidSubmit] = useState(false);

  const handleClose = () => {
    setName("");
    setEmail("");
    setStoreCompany("");
    setWebshopUrl("");
    setMessage("");
    setLoading(false);
    setSuccess(false);
    setError("");
    setDidSubmit(false);
    onClose();
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    setDidSubmit(true);
    setError("");

    if (!name.trim() || !email.trim() || !storeCompany.trim() || !webshopUrl.trim()) {
      return;
    }
    if (!emailValid) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/link-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactEmail: email.trim(),
          storeName: storeCompany.trim(),
          webshopUrl: webshopUrl.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onClose={handleClose}
        placement="center"
        size="lg"
        classNames={{ base: "rounded-2xl" }}
      >
        <ModalContent className="py-10">
          <ModalBody className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-50">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Inquiry sent</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Thank you for your request. You will receive a confirmation shortly.
              </p>
            </div>
            <Button
              className="bg-[#ca2356] text-white font-medium rounded-full px-10 mt-2"
              size="lg"
              onPress={handleClose}
            >
              Close
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onClose={handleClose}
      isDismissable
      placement="center"
      size="3xl"
      scrollBehavior="inside"
      classNames={{ base: "rounded-2xl" }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col items-center gap-1 pb-0 pt-10">
          <h2 className="text-3xl font-bold text-gray-900">Connect your webshop</h2>
          <p className="text-base font-normal text-gray-400 mt-1">Send us the essentials</p>
        </ModalHeader>

        <ModalBody className="px-10 sm:px-14 pt-8 pb-4">
          <div className="flex flex-col gap-6">
            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-[#ca2356]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={didSubmit && !name.trim() ? inputErrorClass : inputClass}
                />
                {didSubmit && !name.trim() && (
                  <p className="text-xs text-red-500 mt-1">Name is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-[#ca2356]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={didSubmit && (!email.trim() || !emailValid) ? inputErrorClass : inputClass}
                />
                {didSubmit && !email.trim() && (
                  <p className="text-xs text-red-500 mt-1">Email is required</p>
                )}
                {didSubmit && email.trim() && !emailValid && (
                  <p className="text-xs text-red-500 mt-1">Enter a valid email</p>
                )}
              </div>
            </div>

            {/* Row 2: Store / company */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Store / company <span className="text-[#ca2356]">*</span>
              </label>
              <input
                type="text"
                placeholder="Your store or company name"
                value={storeCompany}
                onChange={(e) => setStoreCompany(e.target.value)}
                className={didSubmit && !storeCompany.trim() ? inputErrorClass : inputClass}
              />
              {didSubmit && !storeCompany.trim() && (
                <p className="text-xs text-red-500 mt-1">Store / company is required</p>
              )}
            </div>

            {/* Row 3: Webshop URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Webshop URL <span className="text-[#ca2356]">*</span>
              </label>
              <input
                type="url"
                placeholder="https://yourstore.dk"
                value={webshopUrl}
                onChange={(e) => setWebshopUrl(e.target.value)}
                className={didSubmit && !webshopUrl.trim() ? inputErrorClass : inputClass}
              />
              {didSubmit && !webshopUrl.trim() && (
                <p className="text-xs text-red-500 mt-1">Webshop URL is required</p>
              )}
            </div>

            {/* Row 4: Request details */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Request details
              </label>
              <textarea
                placeholder="Tell us about your needs..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="flex flex-col items-center gap-4 px-10 sm:px-14 pt-4 pb-10">
          <Button
            className="bg-[#ca2356] text-white font-semibold rounded-full px-14 text-base"
            size="lg"
            onPress={handleSubmit}
            isLoading={loading}
          >
            {loading ? "Sending..." : "Send"}
          </Button>
          <p className="text-xs text-gray-400">
            mia@le-stores.com &middot; 81 93 82 68 &middot; Copenhagen, Denmark
          </p>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
