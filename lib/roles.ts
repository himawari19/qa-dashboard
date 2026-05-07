export const WORKSPACE_ROLES = ["admin", "fe", "be", "fullstack", "qa", "pm", "ai"] as const;
export const INVITE_ROLES = ["fe", "be", "fullstack", "qa", "pm", "ai"] as const;

const ROLE_ALIASES: Record<string, string> = {
  "admin (owner)": "admin",
  "super admin": "admin",
  superadmin: "admin",
  owner: "admin",
  admin: "admin",
  "frontend developer": "fe",
  frontend: "fe",
  fe: "fe",
  "backend developer": "be",
  backend: "be",
  be: "be",
  "fullstack developer": "fullstack",
  fullstack: "fullstack",
  "ai engineer": "ai",
  "artificial intelligence engineer": "ai",
  "machine learning engineer": "ai",
  ai: "ai",
  "qa engineer": "qa",
  "qa automation engineer": "qa",
  qa: "qa",
  "product manager": "pm",
  "project manager": "pm",
  pm: "pm",
  lead: "pm",
  editor: "fullstack",
  viewer: "qa",
  user: "qa",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin",
  fe: "Front-end Engineer",
  be: "Back-end Engineer",
  fullstack: "Fullstack Engineer",
  ai: "AI Engineer",
  qa: "QA Engineer",
  pm: "Product Manager",
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
