import { PageShell } from "@/components/page-shell";
import { getCurrentUser } from "@/lib/auth";
import { User, IdentificationCard, EnvelopeSimple, Briefcase, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <PageShell 
      title="My Profile" 
      eyebrow="Personal Settings"
      description="View and update your personal information. Your email address is fixed for security."
      crumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings", href: "/settings" },
        { label: "Profile" }
      ]}
    >
      <div className="w-full">
        <div className="glass-card overflow-hidden">
          {/* Header/Banner area */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
            <div className="absolute -bottom-10 left-8">
              <div className="h-20 w-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center overflow-hidden">
                <div className="h-full w-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <User size={40} weight="duotone" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-14 p-8">
             <div className="mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Account Details</h2>
                <p className="text-sm text-slate-500">Manage your identity within the QA Daily platform.</p>
             </div>

             <ProfileForm user={JSON.parse(JSON.stringify(user))} />
             
             <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                   <ShieldCheck size={24} className="text-emerald-500 shrink-0" weight="fill" />
                   <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">Security & Access</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                         Your account is linked to the <strong>{user.email}</strong> address. 
                         Email updates are currently restricted to administrator-only actions to maintain audit log integrity.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
