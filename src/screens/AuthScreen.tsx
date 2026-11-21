import { FormEvent, useMemo, useState } from "react";
import { UserAccount } from "../types";
import { DEFAULT_AVATAR_URL } from "../data/providers";
import { SlotWiseLogo } from "../components/SlotWiseLogo";

interface AuthScreenProps {
  user: UserAccount | null;
  onAuthSuccess: (user: UserAccount) => void;
  onSignOut: () => void;
  onBack: () => void;
}

export function AuthScreen({ user, onAuthSuccess, onSignOut, onBack }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) return { level: 3, label: "Strong" }; // Matches initial visual preview when empty or calculated live
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: "Weak" };
    if (score === 2) return { level: 2, label: "Fair" };
    if (score === 3) return { level: 3, label: "Strong" };
    return { level: 4, label: "Very Strong" };
  }, [password]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isSignUp) {
      if (!fullName.trim()) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
      if (password.length < 8) {
        setErrorMsg("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPwd) {
        setErrorMsg("Passwords do not match.");
        return;
      }
      if (!agreedTerms) {
        setErrorMsg("Please agree to the Terms of Service and Privacy Policy.");
        return;
      }
      onAuthSuccess({
        id: `usr-${Date.now()}`,
        name: fullName.trim(),
        email: email.trim(),
        avatarUrl: DEFAULT_AVATAR_URL,
        welcomeDiscountAvailable: true,
      });
    } else {
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Please enter your email address.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Please enter your password.");
        return;
      }
      const derivedName = email.split("@")[0].replace(/[._-]/g, " ");
      const formattedName =
        derivedName
          .split(" ")
          .filter(Boolean)
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(" ") || "Alex Morgan";
      onAuthSuccess({
        id: `usr-${Date.now()}`,
        name: formattedName,
        email: email.trim(),
        avatarUrl: DEFAULT_AVATAR_URL,
        welcomeDiscountAvailable: true,
      });
    }
  };

  const handleSocialLogin = (providerName: "Google" | "Apple") => {
    onAuthSuccess({
      id: `usr-${Date.now()}`,
      name: "Alex Morgan",
      email: `alex.${providerName.toLowerCase()}@example.com`,
      avatarUrl: DEFAULT_AVATAR_URL,
      welcomeDiscountAvailable: true,
    });
  };

  return (
    <div className="flex flex-col w-full pb-8 max-w-lg mx-auto">
      {/* Brand Top Bar */}
      <header className="flex items-center justify-between pt-space-md pb-space-sm">
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Explore"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <SlotWiseLogo className="w-10 h-10" />
          <div>
            <span className="text-headline-sm text-on-surface tracking-tight block leading-tight">
              SlotWise
            </span>
            <span className="text-label-sm text-on-surface-variant block -mt-0.5">
              Smart Scheduling
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-md">
          <span className="material-symbols-outlined material-symbols-filled text-[16px]">
            verified_user
          </span>
          <span>Secure 256-bit</span>
        </div>
      </header>

      {/* Signed-in Session Banner */}
      {user && (
        <div className="mt-space-sm p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-label-lg text-on-surface font-semibold truncate">
                Signed in as {user.name}
              </p>
              <p className="text-body-sm text-on-surface-variant truncate">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="px-3.5 py-2 rounded-xl bg-surface-container text-on-surface text-label-md font-semibold hover:bg-surface-container-high transition-colors shrink-0"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Segmented Form Mode Switcher */}
      <div className="mt-space-sm">
        <div className="grid grid-cols-2 p-1 bg-surface-container rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-lg text-label-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
              isSignUp
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Sign Up</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-lg text-label-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
              !isSignUp
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>Log In</span>
          </button>
        </div>
      </div>

      {/* Hero Welcome Greeting */}
      <section className="pt-space-lg pb-space-sm">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary text-label-sm mb-2">
          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          <span>Get started in under 60 seconds</span>
        </div>
        <h1 className="text-headline-lg-mobile text-on-surface">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          {isSignUp
            ? "Join thousands booking seamless appointments every day."
            : "Access your booked appointments and schedule settings."}
        </p>
      </section>

      {/* Interactive Form Container */}
      <div className="mt-space-sm">
        <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="px-3.5 py-2.5 rounded-xl bg-error-container text-on-error-container text-body-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {forgotSent && !isSignUp && (
            <div className="px-3.5 py-2.5 rounded-xl bg-secondary-container text-on-secondary-container text-body-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
              <span>Password reset link sent to {email || "your email"}.</span>
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-label-lg text-on-surface" htmlFor="fullname">
                Full Name
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">
                  person
                </span>
                <input
                  id="fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-lowest text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-lg text-on-surface" htmlFor="email">
              Email Address
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">
                mail
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-lowest text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Password Field & Strength */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-label-lg text-on-surface" htmlFor="password">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="text-primary text-label-md hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">
                lock
              </span>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-11 pl-11 pr-11 rounded-xl bg-surface-container-lowest text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition-all"
              />
              <button
                type="button"
                aria-label={showPwd ? "Hide password" : "Show password"}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3.5 text-on-surface-variant hover:text-on-surface flex items-center justify-center p-1"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPwd ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            {isSignUp && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={`h-1.5 rounded-full transition-all ${
                        bar <= passwordStrength.level
                          ? "bg-secondary"
                          : "bg-surface-container-highest"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label-sm text-on-surface-variant">
                    Must be at least 8 characters
                  </span>
                  <span className="text-label-sm text-secondary font-medium">
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-label-lg text-on-surface" htmlFor="confirm-pwd">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">
                  lock_reset
                </span>
                <input
                  id="confirm-pwd"
                  type={showPwd ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-lowest text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition-all"
                />
              </div>
            </div>
          )}

          {/* Terms Checkbox (Sign Up only) */}
          {isSignUp && (
            <div className="flex items-start gap-2.5 pt-1">
              <label className="relative flex items-center cursor-pointer mt-0.5">
                <input
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="sr-only"
                  id="terms"
                  type="checkbox"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    agreedTerms ? "bg-primary-container" : "bg-surface-container-highest"
                  }`}
                >
                  {agreedTerms && (
                    <span className="material-symbols-outlined text-on-primary text-[16px] font-bold">
                      check
                    </span>
                  )}
                </div>
              </label>
              <label
                className="text-body-sm text-on-surface-variant cursor-pointer"
                htmlFor="terms"
              >
                I agree to the{" "}
                <span className="text-primary font-medium">Terms of Service</span> and{" "}
                <span className="text-primary font-medium">Privacy Policy</span>.
              </label>
            </div>
          )}

          {/* Primary CTA Action */}
          <button
            className="w-full h-12 rounded-xl bg-primary-container text-on-primary text-label-lg flex items-center justify-center gap-2 shadow-md hover:bg-primary active:scale-[0.98] transition-all mt-2"
            type="submit"
          >
            <span>{isSignUp ? "Create Free Account" : "Sign In to SlotWise"}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>

          {/* Social Auth Divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="w-full h-px bg-surface-container-high" />
            <span className="absolute px-3 bg-surface text-on-surface-variant text-label-sm">
              Or continue with
            </span>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("Google")}
              className="h-11 px-3 rounded-xl bg-surface-container-lowest text-on-surface text-label-md flex items-center justify-center gap-2.5 shadow-sm hover:bg-surface-container-low active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin("Apple")}
              className="h-11 px-3 rounded-xl bg-surface-container-lowest text-on-surface text-label-md flex items-center justify-center gap-2.5 shadow-sm hover:bg-surface-container-low active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4 fill-current text-on-surface" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.76 1.05-1.81.93-2.87-.9.04-2 .6-2.65 1.36-.57.66-.99 1.74-.86 2.76 1.01.08 1.96-.49 2.58-1.25z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>
        </form>
      </div>

      {/* Why Join SlotWise Delight Card */}
      <div className="mt-space-lg">
        <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">stars</span>
              </span>
              <span className="text-label-lg text-on-surface font-semibold">
                Why join SlotWise?
              </span>
            </div>
            <span className="text-label-sm text-secondary font-medium px-2 py-0.5 rounded-full bg-secondary-container">
              100% Free
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[18px]">sms</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-md text-on-surface font-medium truncate">
                  Instant SMS Reminders
                </p>
                <p className="text-body-sm text-on-surface-variant truncate">
                  Zero missed appointments with auto alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[18px]">event_repeat</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-md text-on-surface font-medium truncate">
                  1-Click Slot Rescheduling
                </p>
                <p className="text-body-sm text-on-surface-variant truncate">
                  Switch timings painlessly without phone calls
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-md text-on-surface font-medium truncate">
                  24/7 AI Concierge Assistant
                </p>
                <p className="text-body-sm text-on-surface-variant truncate">
                  Natural language booking &amp; schedule matching
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges & Metrics Strip */}
      <div className="mt-space-md">
        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-surface-container text-center">
          <div>
            <span className="text-headline-sm text-primary block tabular-nums">4.9/5</span>
            <span className="text-label-sm text-on-surface-variant block">Client Rating</span>
          </div>
          <div>
            <span className="text-headline-sm text-secondary block tabular-nums">120k+</span>
            <span className="text-label-sm text-on-surface-variant block">Slots Booked</span>
          </div>
          <div>
            <span className="text-headline-sm text-tertiary-container block tabular-nums">99.9%</span>
            <span className="text-label-sm text-on-surface-variant block">Uptime</span>
          </div>
        </div>
      </div>

      {/* Footer Switcher Prompt */}
      <footer className="mt-space-lg text-center">
        <p className="text-body-md text-on-surface-variant">
          {isSignUp ? "Already have an account?" : "Don't have an account yet?"}
          <button
            type="button"
            onClick={() => {
              setIsSignUp((v) => !v);
              setErrorMsg(null);
            }}
            className="text-primary font-semibold hover:underline ml-1"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </p>
      </footer>
    </div>
  );
}
