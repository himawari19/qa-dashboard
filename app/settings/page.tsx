import { PageShell } from "@/components/page-shell";
import { Users, Gear, CaretRight, UserPlus, Info, Lock } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function SettingsPage() {
  const settingsGroups = [
    {
      title: "Personal",
      description: "Manage your own account information and preferences.",
      items: [
        {
          title: "My Profile",
          description: "Update your name, role, and view your account details.",
          href: "/settings/profile",
          icon: Gear,
          color: "text-indigo-600 dark:text-indigo-400",
          bg: "bg-indigo-50 dark:bg-indigo-900/20",
          disabled: false,
        },
      ],
    },
    {
      title: "User Management",
      description: "Manage people, roles, and permissions in your workspace.",
      items: [
        {
          title: "Assignees / Team Members",
          description: "Manage the list of people available for task assignments and test execution.",
          href: "/assignees",
          icon: Users,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          disabled: false,
        },
        {
          title: "User Accounts",
          description: "Manage system access, roles, and credentials for all users.",
          href: "/settings/users",
          icon: Lock,
          color: "text-rose-600 dark:text-rose-400",
          bg: "bg-rose-50 dark:bg-rose-900/20",
          disabled: false,
        },
      ],
    },
    {
        title: "Application",
        description: "General workspace configuration and metadata.",
        items: [
            {
                title: "General Settings",
                description: "Configure workspace name, timezone, and regional preferences.",
                href: "#",
                icon: Gear,
                color: "text-slate-600 dark:text-slate-400",
                bg: "bg-slate-50 dark:bg-slate-900/20",
                disabled: true
            },
            {
                title: "About QA Daily",
                description: "Version information, documentation, and system status.",
                href: "#",
                icon: Info,
                color: "text-sky-600 dark:text-sky-400",
                bg: "bg-sky-50 dark:bg-sky-900/20",
                disabled: true
            }
        ]
    }
  ];

  return (
    <PageShell 
      title="Settings" 
      eyebrow="Configure your workspace"
    >
      <div className="max-w-4xl space-y-12">
        {settingsGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{group.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{group.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((item, itemIdx) => (
                <div 
                  key={itemIdx}
                  className={`relative group p-4 rounded-xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-black/20 transition-all duration-300 ${item.disabled ? 'opacity-50 grayscale' : 'hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>
                      <item.icon size={24} weight="bold" className={item.color} />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {item.title}
                        {item.disabled && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-slate-500">Soon</span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {!item.disabled && (
                        <div className="self-center">
                            <CaretRight size={18} weight="bold" className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                    )}
                  </div>
                  
                  {!item.disabled && (
                    <Link href={item.href} className="absolute inset-0">
                      <span className="sr-only">Go to {item.title}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </PageShell>
  );
}
