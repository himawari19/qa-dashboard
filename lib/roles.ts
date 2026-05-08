export const WORKSPACE_ROLES = ["admin", "fe", "be", "fullstack", "qa", "pm", "ai"] as const;
export const INVITE_ROLES = ["fe", "be", "fullstack", "ai", "qa", "pm"] as const;
export const ASSIGNEE_ROLES = ["fe", "be", "fullstack", "ai", "qa", "pm"] as const;
export const PUBLIC_ROLES = [
  "Product Manager",
  "Project Manager",
  "System Analyst",
  "UI/UX Designer",
  "Front-end Engineer",
  "Back-end Engineer",
  "Fullstack Engineer",
  "AI Engineer",
  "Mobile Developer",
  "QA Engineer",
  "QA Automation Engineer",
  "DevOps Engineer",
  "Security Engineer",
  "Database Administrator",
  "Software Architect",
] as const;

const ROLE_ALIASES: Record<string, string> = {
  "admin (owner)": "admin",
  "super admin": "admin",
  superadmin: "admin",
  owner: "admin",
  admin: "admin",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin",
  fe: "Front-end Engineer",
  be: "Back-end Engineer",
  fullstack: "Fullstack Engineer",
  ai: "AI Engineer",
  qa: "QA Engineer",
  pm: "Product Manager",
  "system analyst": "System Analyst",
  "ui/ux designer": "UI/UX Designer",
  "mobile developer": "Mobile Developer",
  "devops engineer": "DevOps Engineer",
  "security engineer": "Security Engineer",
  "database administrator": "Database Administrator",
  "software architect": "Software Architect",
};

export function normalizeRole(role: string | null | undefined) {
  const value = String(role ?? "").trim();
  if (!value) return "";
  const lowered = value.toLowerCase();
  return ROLE_ALIASES[lowered] || lowered;
}

export function isAdminUser(role: string | null | undefined, company: string | null | undefined) {
  return normalizeRole(role) === "admin" && !String(company ?? "").trim();
}

export function isInviteRole(role: string | null | undefined) {
  return INVITE_ROLES.includes(normalizeRole(role) as (typeof INVITE_ROLES)[number]);
}

export function getRoleLabel(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return ROLE_LABELS[normalized] || (normalized ? normalized.toUpperCase() : "-");
}

export function getRoleExportLabel(role: string | null | undefined) {
  return getRoleLabel(role);
}

export function getInviteRoleOptions() {
  return INVITE_ROLES.map((value) => ({ label: ROLE_LABELS[value], value }));
}

export function getUserRoleOptions() {
  return [
    { label: ROLE_LABELS.admin, value: "admin" },
    ...getInviteRoleOptions(),
  ];
}

export function getPublicRoleOptions() {
  return PUBLIC_ROLES.map((label) => ({ label, value: label }));
}

export function isAssignableRole(role: string | null | undefined) {
  return ASSIGNEE_ROLES.includes(normalizeRole(role) as (typeof ASSIGNEE_ROLES)[number]);
}
