"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { getPublicRoleOptions } from "@/lib/roles";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    company: "",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");

    if (mode === "forgot") {
      setTimeout(() => {
        toast("If an account exists with that email, a reset link has been sent.", "info");
        setPending(false);
        setMode("signin");
      }, 1000);
      return;
    }

    const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          company: formData.company,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : { error: await res.text() };

      if (!res.ok) throw new Error(data.error || "Authentication failed");

      if (mode === "signup") {
        setShowSuccessModal(true);
        setFormData({ name: "", email: "", password: "", role: "", company: "" });
        setMode("signin");
        return;
      }

      router.push(nextUrl);
      router.refresh();
      toast("Welcome back!", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-100 font-sans text-slate-900">
      <div className="hidden lg:flex w-1/2 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.16),transparent_32%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)] p-12">
        <div className="relative z-10 max-w-md">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.32em] text-sky-200">QA Daily Hub</p>
          <h1 className="text-5xl font-black leading-tight tracking-tight text-slate-50 sm:text-6xl">
            Quality control, made sharp.
          </h1>
          <p className="mt-6 text-xl font-medium leading-relaxed text-slate-200">
            A focused workspace for test cases, execution, bugs, and the daily QA rhythm.
          </p>
        </div>
      </div>

      <div className="flex max-h-screen w-full items-center justify-center overflow-y-auto p-6 sm:p-8 md:p-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Recover access" : "Sign in"}
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              {mode === "signup" ? "Get started now" : mode === "forgot" ? "Reset password" : "Welcome back"}
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              {mode === "signup"
                ? "Create your account and join our platform."
                : mode === "forgot"
                ? "Enter your email and we'll send you a reset link."
                : "Enter your credentials to access your dashboard."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@company.com"
                className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                required
              />
            </div>

            {mode !== "forgot" && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 pr-10 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-blue-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Software Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                      >
                        <option value="">Select your role</option>
                        {getPublicRoleOptions().map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company Name</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="e.g. Acme Corp"
                        className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                        required
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:-translate-y-0.5 disabled:opacity-50"
            >
              <span>
                {pending
                  ? "Processing..."
                  : mode === "signup"
                  ? "Create Account"
                  : mode === "forgot"
                  ? "Send Reset Link"
                  : "Sign In"}
              </span>
              {!pending && <ArrowRight size={16} weight="bold" />}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-slate-900"
              >
                <ArrowLeft size={14} weight="bold" />
                <span>Back to sign in</span>
              </button>
            )}
          </form>

          {mode !== "forgot" && (
            <p className="mt-8 text-sm font-medium text-slate-600">
              Invite-only access. Ask the super admin for an invite link.
            </p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showSuccessModal}
        title="Registration Successful"
        message="Your account has been created successfully. You can now sign in with your email and password."
        confirmText="Sign In Now"
        cancelText="Close"
        type="info"
        onConfirm={() => setShowSuccessModal(false)}
        onCancel={() => setShowSuccessModal(false)}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 font-black text-3xl tracking-tighter text-blue-600">
          QA Daily Hub
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
