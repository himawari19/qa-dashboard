"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils";

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
    company: ""
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
        company: formData.company
      }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || `${mode === "signup" ? "Registration" : "Login"} failed.`);
        return;
      }

      if (mode === "signup") {
        setShowSuccessModal(true);
        setMode("signin");
        setFormData({ name: "", email: "", password: "", role: "", company: "" });
        return;
      }

      toast("Welcome back!", "success");
      setFormData({ name: "", email: "", password: "", role: "", company: "" });
      router.replace(nextUrl);
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans">
      {/* Left Side: Visual/Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#2563eb] relative overflow-hidden items-center justify-center p-12">
        {/* Animated Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-400/20 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="relative z-10 text-white max-w-md">
          <h1 className="text-6xl font-black mb-6 leading-tight tracking-tight">QA Daily Hub.</h1>
          <p className="text-xl text-blue-100 leading-relaxed mb-8 font-medium">
            Master your software quality journey. The all-in-one platform for modern QA teams to collaborate and excel.
          </p>
        </div>

        {/* Decorative Graphic */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12 bg-white overflow-y-auto max-h-screen">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {mode === "signup" ? "Get started now" :
               mode === "forgot" ? "Reset password" :
               "Welcome back"}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {mode === "signup" ? "Create your account and join our platform." :
               mode === "forgot" ? "Enter your email and we'll send you a reset link." :
               "Enter your credentials to access your dashboard."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white px-4 py-2.5 rounded-xl outline-none transition-all text-slate-900 font-medium text-sm"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="text"
                      name="email"
                      value={formData.email}
                onChange={handleInputChange}
                placeholder="name@company.com"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white px-4 py-2.5 rounded-xl outline-none transition-all text-slate-900 font-medium text-sm"
                required
              />
            </div>

            {mode !== "forgot" && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
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
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white px-4 py-2.5 pr-11 rounded-xl outline-none transition-all text-slate-900 font-medium text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Software Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white px-4 py-2.5 rounded-xl outline-none transition-all text-slate-900 font-medium appearance-none text-sm"
                      required
                    >
                      <option value="" disabled>Select your role</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="System Analyst">System Analyst</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Fullstack Developer">Fullstack Developer</option>
                      <option value="Mobile Developer">Mobile Developer</option>
                      <option value="QA Engineer">QA Engineer</option>
                      <option value="QA Automation Engineer">QA Automation Engineer</option>
                      <option value="DevOps Engineer">DevOps Engineer</option>
                      <option value="Security Engineer">Security Engineer</option>
                      <option value="Database Administrator">Database Administrator</option>
                      <option value="Software Architect">Software Architect</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Company Name</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white px-4 py-2.5 rounded-xl outline-none transition-all text-slate-900 font-medium text-sm"
                      required
                    />
                  </div>
                </>
              )}
            </>)}

            {error && (
              <div className="px-4 py-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-xs font-semibold text-rose-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-blue-600 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 text-sm uppercase tracking-widest"
            >
              <span>{pending ? "Processing..." :
                    mode === "signup" ? "Create Account" :
                    mode === "forgot" ? "Send Reset Link" :
                    "Sign In"}</span>
              {!pending && <ArrowRight size={16} weight="bold" />}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors pt-1"
              >
                <ArrowLeft size={14} weight="bold" />
                <span>Back to sign in</span>
              </button>
            )}
          </form>

          {mode !== "forgot" && (
            <p className="text-center mt-6 text-sm text-slate-500 font-medium">
              {mode === "signup" ? "Already a member?" : "New to the platform?"}{" "}
              <button
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setError("");
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                {mode === "signup" ? "Sign in instead" : "Create an account"}
              </button>
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
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-3xl text-blue-600 tracking-tighter">QA Daily Hub.</div>}>
      <LoginContent />
    </Suspense>
  );
}
