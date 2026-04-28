"use client";

import React, { useState } from "react";
import { IdentificationCard, EnvelopeSimple, Briefcase, User, CheckCircle, Warning } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

export function ProfileForm({ user }: { user: UserProfile }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: user.name || "",
    role: user.role || "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          password: formData.password || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast("Profile updated successfully", "success");
        router.refresh();
      } else {
        toast(data.error || "Failed to update profile", "error");
      }
    } catch (err) {
      toast("An error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Name Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <User size={12} weight="bold" /> Full Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-11 px-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm font-bold text-slate-800 dark:text-white"
            placeholder="e.g. John Doe"
            required
          />
        </div>

        {/* Role Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Briefcase size={12} weight="bold" /> Role / Title
          </label>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full h-11 px-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm font-bold text-slate-800 dark:text-white"
            placeholder="e.g. Senior QA Engineer"
          />
        </div>

        {/* Username (Read-only) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <IdentificationCard size={12} weight="bold" /> Username
          </label>
          <div className="w-full h-11 px-4 rounded-lg bg-slate-100 dark:bg-white/2 border border-slate-200 dark:border-white/5 flex items-center text-sm font-bold text-slate-500 opacity-70 cursor-not-allowed">
            {user.username}
          </div>
        </div>

        {/* Email (Read-only as per request) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <EnvelopeSimple size={12} weight="bold" /> Email Address
          </label>
          <div className="w-full h-11 px-4 rounded-lg bg-slate-100 dark:bg-white/2 border border-slate-200 dark:border-white/5 flex items-center text-sm font-bold text-slate-500 opacity-70 cursor-not-allowed justify-between">
            {user.email || "No email linked"}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-[8px] font-black uppercase tracking-wider text-slate-500">
               <Warning size={10} weight="bold" /> Locked
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 dark:border-white/5">
        <div className="mb-6">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
             <CheckCircle size={16} className="text-blue-500" weight="bold" /> Security Update
           </h3>
           <p className="text-xs text-slate-500 mt-1">Leave password fields empty if you don't want to change it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-11 px-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm font-bold text-slate-800 dark:text-white"
                placeholder="••••••••"
              />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm New Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full h-11 px-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm font-bold text-slate-800 dark:text-white"
                placeholder="••••••••"
              />
           </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="h-11 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
        >
          {loading ? "Updating..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
