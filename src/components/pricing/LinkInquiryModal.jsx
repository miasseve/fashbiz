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
  const [storeName, setStoreName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [webshopUrl, setWebshopUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setStoreName("");
    setContactEmail("");
    setWebshopUrl("");
    setMessage("");
    setLoading(false);
    setSuccess(false);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    if (!storeName.trim()) { setError("Store name is required"); return; }
    if (!contactEmail.trim()) { setError("Contact email is required"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) { setError("Please enter a valid email"); return; }
    if (!webshopUrl.trim()) { setError("Webshop URL is required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/link-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, contactEmail, webshopUrl, message }),
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
      size="2xl"
      className="rounded-xl mx-6 sm:mx-8"
    >
      <ModalContent>
        <ModalHeader className="flex justify-center items-center text-2xl font-semibold">
          {success ? "Inquiry Sent" : "Connect your webshop"}
        </ModalHeader>

        <ModalBody className="flex flex-col gap-4">
          {success ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg text-center text-default-700">
                Thank you for your request, you will receive a confirmation shortly.
              </p>
            </div>
          ) : (
            <>
              <Input
                label="Store Name"
                placeholder="Your store name"
                value={storeName}
                onValueChange={setStoreName}
                isRequired
                variant="bordered"
                fullWidth
                radius="md"
                size="lg"
              />
              <Input
                label="Contact Email"
                placeholder="your@email.com"
                type="email"
                value={contactEmail}
                onValueChange={setContactEmail}
                isRequired
                variant="bordered"
                fullWidth
                radius="md"
                size="lg"
              />
              <Input
                label="Webshop URL"
                placeholder="https://yourstore.com"
                value={webshopUrl}
                onValueChange={setWebshopUrl}
                isRequired
                variant="bordered"
                fullWidth
                radius="md"
                size="lg"
              />
              <Textarea
                label="Message / Special Request"
                placeholder="Tell us about your needs..."
                value={message}
                onValueChange={setMessage}
                variant="bordered"
                fullWidth
                radius="md"
                size="lg"
                minRows={3}
              />
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter className="flex justify-center gap-3">
          {success ? (
            <Button color="primary" size="lg" onPress={handleClose}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSubmit} isLoading={loading}>
                Send
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
