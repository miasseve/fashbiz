"use client";

import React, { useState } from "react";
import Link from "next/link";

const ContactSupportPage = () => {
  const [formData, setFormData] = useState({ name: "", storename: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/contact-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.status === 200) {
        setStatus({ type: "success", message: result.message });
        setFormData({ name: "", storename: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setStatus({ type: "error", message: result.error });
      }
    } catch {
      setStatus({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-fash-gradient py-12 px-4">
      <div className="max-w-3xl w-full bg-white shadow-md rounded-xl p-8">
        <h1 className="text-4xl font-bold mb-4 text-center text-gray-800 uppercase">
          Contact Support
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          We're here to help! Fill out the form below and we'll get back to you
          as soon as possible.
        </p>

        {status.message && (
          <div
            className={`mb-6 p-4 rounded-lg text-center text-sm font-medium ${
              status.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#06cb03] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="storename" className="block text-sm font-semibold text-gray-700 mb-1">
              Store / Company
            </label>
            <input
              id="storename"
              name="storename"
              type="text"
              value={formData.storename}
              onChange={handleChange}
              placeholder="Enter your store or company name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#06cb03] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#06cb03] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#06cb03] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1">
              What do you need?
            </label>
            <select
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#06cb03] focus:border-transparent bg-white"
            >
              <option value="" disabled>Select an option</option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Order Issue">Order Issue</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Billing / Subscription">Billing / Subscription</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows="5"
              required
              value={formData.message}
              onChange={handleChange}
              placeholder="Describe your issue or question..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#06cb03] focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#06cb03] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Send Message"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <p className="text-[12px] text-gray-500">
            We typically respond within 24 hours.
          </p>
          <Link
            href="/login"
            className="text-[12px] text-[#6e482d] underline hover:opacity-80"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ContactSupportPage;
