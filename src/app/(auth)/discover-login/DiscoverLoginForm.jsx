"use client";
import { useState } from "react";

const DiscoverLoginForm = ({ redirectUri }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const missingRedirect = !redirectUri;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/discover-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password, redirectUri }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }
      window.location.href = `${redirectUri}?code=${encodeURIComponent(data.code)}`;
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-fash-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] rounded-[14px] bg-white p-8 shadow-lg text-center">
        <img src="/new_ree_icon.png" alt="Ree" className="w-[72px] mx-auto py-[8px]" />
        <h1 className="text-[1.8rem] font-semibold text-gray-900 mb-6">Sign in to continue</h1>

        {missingRedirect ? (
          <p className="text-red-500 text-sm">This sign-in link is invalid. Please return to the app and try again.</p>
        ) : (
          <form className="text-start" onSubmit={onSubmit}>
            {error && <p className="text-red-500 text-[13px] font-bold mb-3">{error}</p>}
            <div className="mb-4">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-gray-300 px-4 py-3 text-[15px]"
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border border-gray-300 px-4 py-3 text-[15px]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-black text-white py-3 text-[15px] font-semibold disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default DiscoverLoginForm;
