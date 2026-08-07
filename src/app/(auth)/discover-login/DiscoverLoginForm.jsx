"use client";
import { useState } from "react";

const DiscoverLoginForm = ({ redirectUri }) => {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const missingRedirect = !redirectUri;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const endpoint = mode === "signin" ? "/api/discover-login" : "/api/discover-signup";
      const body =
        mode === "signin"
          ? { email: email.toLowerCase(), password, redirectUri }
          : { firstname, lastname, email: email.toLowerCase(), password, phone, redirectUri };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 202 && data.accountCreated) {
        // Account was created but the immediate sign-in hiccuped — send them
        // to sign in with the credentials they just picked.
        setMode("signin");
        setInfo("Account created — please sign in.");
        setSubmitting(false);
        return;
      }
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
        <h1 className="text-[1.8rem] font-semibold text-gray-900 mb-6">
          {mode === "signin" ? "Sign in to continue" : "Create your account"}
        </h1>

        {missingRedirect ? (
          <p className="text-red-500 text-sm">This sign-in link is invalid. Please return to the app and try again.</p>
        ) : (
          <>
            <form className="text-start" onSubmit={onSubmit}>
              {error && <p className="text-red-500 text-[13px] font-bold mb-3">{error}</p>}
              {info && <p className="text-green-600 text-[13px] font-bold mb-3">{info}</p>}

              {mode === "signup" && (
                <>
                  <div className="mb-4">
                    <input
                      type="text"
                      required
                      placeholder="First name"
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      className="w-full rounded-full border border-gray-300 px-4 py-3 text-[15px]"
                    />
                  </div>
                  <div className="mb-4">
                    <input
                      type="text"
                      required
                      placeholder="Last name"
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      className="w-full rounded-full border border-gray-300 px-4 py-3 text-[15px]"
                    />
                  </div>
                </>
              )}

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

              {mode === "signup" && (
                <div className="mb-4">
                  <input
                    type="tel"
                    required
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-full border border-gray-300 px-4 py-3 text-[15px]"
                  />
                </div>
              )}

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
                {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setInfo("");
              }}
              className="mt-4 text-[13px] text-gray-600 underline"
            >
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default DiscoverLoginForm;
