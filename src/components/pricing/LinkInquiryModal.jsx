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
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {success ? "Inquiry Sent" : "Connect your webshop"}
        </ModalHeader>
        <ModalBody>
          {success ? (
            <div className="py-4 text-center">
              <div className="text-4xl mb-3">&#10003;</div>
              <p className="text-base">
                Thank you for your request, you will receive a confirmation shortly
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Input
                label="Store Name"
                placeholder="Your store name"
                value={storeName}
                onValueChange={setStoreName}
                isRequired
                variant="bordered"
              />
              <Input
                label="Contact Email"
                placeholder="you@example.com"
                type="email"
                value={contactEmail}
                onValueChange={setContactEmail}
                isRequired
                variant="bordered"
              />
              <Input
                label="Webshop URL"
                placeholder="https://yourstore.dk"
                value={webshopUrl}
                onValueChange={setWebshopUrl}
                isRequired
                variant="bordered"
              />
              <Textarea
                label="Message / Special Request"
                placeholder="Tell us about your needs..."
                value={message}
                onValueChange={setMessage}
                variant="bordered"
                minRows={3}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {success ? (
            <Button color="primary" onPress={handleClose}>
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
