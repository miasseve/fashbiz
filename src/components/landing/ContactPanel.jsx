"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const ContactPanel = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);
  const [formData, setFormData] = useState({
    name: "",
    storename: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
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

  const inputClass =
    "w-full border border-[#E0E0E0] rounded-[8px] px-[14px] py-[11px] text-[14px] text-[#252525] placeholder-[#AAAAAA] focus:outline-none focus:border-[#D90600] bg-white";
  const labelClass = "block text-[13px] font-semibold text-[#252525] mb-[6px]";

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-[998] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[480px] bg-white z-[999] shadow-[-8px_0px_40px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-[32px] pt-[32px] pb-[20px] border-b border-[#F0F0F0]">
          <div>
            <h2 className="text-[22px] font-bold text-[#151515] leading-[1.2]">
              Let&apos;s talk
            </h2>
            <p className="text-[14px] text-[#666666] mt-[4px]">
              Tell us about your store — we&apos;ll take it from there.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors cursor-pointer flex-shrink-0 mt-[2px]"
          >
            <X size={18} className="text-[#414141]" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-[32px] py-[24px]">
          {status.message && (
            <div
              className={`mb-[20px] px-[14px] py-[12px] rounded-[8px] text-[13px] font-medium ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-[#D90600] border border-red-200"
              }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
            {/* Name + Store row */}
            <div className="grid grid-cols-2 gap-[12px]">
              <div>
                <label htmlFor="cp-name" className={labelClass}>Name</label>
                <input
                  id="cp-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Alex Johnson"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="cp-storename" className={labelClass}>Store / company</label>
                <input
                  id="cp-storename"
                  name="storename"
                  type="text"
                  value={formData.storename}
                  onChange={handleChange}
                  placeholder="Vintage Loop"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="cp-email" className={labelClass}>Email</label>
              <input
                id="cp-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@vintageloop.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="cp-phone" className={labelClass}>
                Phone <span className="text-[#AAAAAA] font-normal">(optional)</span>
              </label>
              <input
                id="cp-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 555 000 0000"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="cp-subject" className={labelClass}>What do you need?</label>
              <select
                id="cp-subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="" disabled>Select an option...</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Book an Audit">Book an Audit</option>
                <option value="Tool Demo">Tool Demo</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Billing / Subscription">Billing / Subscription</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="cp-message" className={labelClass}>Message</label>
              <textarea
                id="cp-message"
                name="message"
                rows={4}
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe your issue or question..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D90600] hover:bg-[#B80500] text-white font-semibold py-[14px] rounded-[8px] text-[15px] flex items-center justify-center gap-[8px] transition-colors disabled:opacity-60 cursor-pointer mt-[4px]"
            >
              {isSubmitting ? "Sending..." : <>Send →</>}
            </button>

            <p className="text-center text-[14px] text-black">
              No commitment. No sales pressure. <br/>Response within 1 business day.
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default ContactPanel;
