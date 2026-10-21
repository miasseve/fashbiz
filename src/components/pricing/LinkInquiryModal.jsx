"use client";
import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Button,
} from "@heroui/react";

export default function LinkInquiryModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [storeCompany, setStoreCompany] = useState("");
  const [webshopUrl, setWebshopUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const resetForm = () => {
    setName("");
    setEmail("");
    setStoreCompany("");
    setWebshopUrl("");
    setMessage("");
    setLoading(false);
    setSuccess(false);
    setError("");
    setTouched({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const markTouched = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const fieldInvalid = (field, value) => touched[field] && !value.trim();
  const emailFormatInvalid =
    touched.email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    setError("");
    setTouched({ name: true, email: true, storeCompany: true, webshopUrl: true });

    if (!name.trim() || !email.trim() || !storeCompany.trim() || !webshopUrl.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
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

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onClose={handleClose}
      isDismissable={false}
      placement="center"
      size="lg"
      classNames={{
        base: "rounded-xl mx-4 sm:mx-8",
        body: "px-6 sm:px-8",
        header: "px-6 sm:px-8 pt-6",
        footer: "px-6 sm:px-8 pb-6",
      }}
    >
      <ModalContent>
        {success ? (
          <>
            <ModalHeader className="flex flex-col items-center gap-1 pt-8">
              <span className="text-2xl font-bold text-gray-900">Inquiry Sent</span>
            </ModalHeader>
            <ModalBody className="flex flex-col items-center py-6 gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <svg
                  className="w-9 h-9 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base text-center text-gray-600 max-w-sm">
                Thank you for your request, you will receive a confirmation shortly.
              </p>
            </ModalBody>
            <ModalFooter className="flex flex-col items-center gap-3 pb-8">
              <Button
                className="bg-[#ca2356] text-white font-semibold rounded-full px-8"
                size="lg"
                onPress={handleClose}
              >
                Close
              </Button>
              <p className="text-xs text-gray-400">
                mia@le-stores.com &middot; 81 93 82 68 &middot; Copenhagen, Denmark
              </p>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader className="flex flex-col items-center gap-1 pt-6 pb-0">
              <span className="text-2xl font-bold text-gray-900">Connect your webshop</span>
              <span className="text-sm font-normal text-gray-500">Send us the essentials</span>
            </ModalHeader>

            <ModalBody className="flex flex-col gap-4 pt-5 pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  labelPlacement="outside"
                  placeholder="Your name"
                  value={name}
                  onValueChange={setName}
                  onBlur={() => markTouched("name")}
                  isRequired
                  isInvalid={fieldInvalid("name", name)}
                  errorMessage={fieldInvalid("name", name) ? "Name is required" : undefined}
                  variant="bordered"
                  radius="sm"
                  size="md"
                />
                <Input
                  label="Email"
                  labelPlacement="outside"
                  placeholder="your@email.com"
                  type="email"
                  value={email}
                  onValueChange={setEmail}
                  onBlur={() => markTouched("email")}
                  isRequired
                  isInvalid={fieldInvalid("email", email) || emailFormatInvalid}
                  errorMessage={
                    fieldInvalid("email", email)
                      ? "Email is required"
                      : emailFormatInvalid
                        ? "Enter a valid email"
                        : undefined
                  }
                  variant="bordered"
                  radius="sm"
                  size="md"
                />
              </div>

              <Input
                label="Store / company"
                labelPlacement="outside"
                placeholder="Your store or company name"
                value={storeCompany}
                onValueChange={setStoreCompany}
                onBlur={() => markTouched("storeCompany")}
                isRequired
                isInvalid={fieldInvalid("storeCompany", storeCompany)}
                errorMessage={fieldInvalid("storeCompany", storeCompany) ? "Store / company is required" : undefined}
                variant="bordered"
                radius="sm"
                size="md"
              />

              <Input
                label="Webshop URL"
                labelPlacement="outside"
                placeholder="https://yourstore.dk"
                type="url"
                value={webshopUrl}
                onValueChange={setWebshopUrl}
                onBlur={() => markTouched("webshopUrl")}
                isRequired
                isInvalid={fieldInvalid("webshopUrl", webshopUrl)}
                errorMessage={fieldInvalid("webshopUrl", webshopUrl) ? "Webshop URL is required" : undefined}
                variant="bordered"
                radius="sm"
                size="md"
              />

              <Textarea
                label="Request details"
                labelPlacement="outside"
                placeholder="Tell us about your needs..."
                value={message}
                onValueChange={setMessage}
                variant="bordered"
                radius="sm"
                size="md"
                minRows={3}
              />

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </ModalBody>

            <ModalFooter className="flex flex-col items-center gap-3 pt-2 pb-6">
              <Button
                className="bg-[#ca2356] text-white font-semibold rounded-full px-8"
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
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
