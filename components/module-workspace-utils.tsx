import type { ReactNode } from "react";
import {
  Tag,
  Folder,
  Compass,
  SquaresFour,
  Pulse,
  Shield,
  Calendar,
  TextAlignLeft,
  Note,
  Paperclip,
  CheckCircle,
  WarningCircle,
  Clock,
  X,
} from "@phosphor-icons/react";
import type { ModuleKey } from "@/lib/modules";

export const PAGE_SIZE = 10;

export function getModuleWorkspacePermissions(userRole: string) {
  const role = userRole.toLowerCase();
  const isAdmin = role === "admin";
  const isLead = role === "lead";
  const isEditor = role === "editor";
  const isViewer = role === "viewer";

  return {
    isAdmin,
    isLead,
    isEditor,
    isViewer,
    canAdd: isAdmin || isLead || isEditor,
    canEdit: isAdmin || isLead || isEditor,
    canDelete: isAdmin || isLead,
  };
}

export function getModuleWorkspaceCrumbs(module: ModuleKey, title: string) {
  const scopeCrumb =
    module === "assignees" || module === "users"
      ? { label: "System Settings", href: "/settings" }
      : module === "meeting-notes" || module === "sprints"
        ? { label: "Documentation", href: "/documentation" }
        : { label: "Test Management", href: "/test-plans" };

  return [
    { label: "Dashboard", href: "/" },
    scopeCrumb,
    { label: title },
  ];
}

export function linkifyToMarkdown(text: string) {
  if (!text) return "-";
  const regex = /\b((?:TASK|BUG|TC|MTG|SUITE|PLAN)-\d+)\b/g;
  return text.replace(regex, (match) => {
    let href = "/";
    if (match.startsWith("TASK")) href = "/tasks";
    else if (match.startsWith("BUG")) href = "/bugs";
    else if (match.startsWith("TC")) href = "/test-cases";
    else if (match.startsWith("SUITE")) href = "/test-suites";
    else if (match.startsWith("PLAN")) href = "/test-plans";
    else if (match.startsWith("MTG")) href = "/meeting-notes";
    return `[${match}](${href})`;
  });
}

export function getPreferredColumnOrder(module: ModuleKey) {
  if (module === "test-plans") {
    return ["code", "project", "title", "sprint", "startDate", "endDate", "scope", "notes", "status"];
  }
  if (module === "test-suites") {
    return ["testPlanLabel", "title", "code", "assignee", "notes", "status"];
  }
  if (module === "test-cases") {
    return ["tcId", "caseName", "priority", "status"];
  }
  if (module === "sprints") {
    return ["name", "project", "testPlanTitle", "startDate", "endDate", "status"];
  }
  if (module === "meeting-notes") {
    return ["code", "date", "project", "title"];
  }
  if (module === "test-sessions") {
    return ["date", "project", "sprint", "tester", "result"];
  }
  if (module === "assignees") {
    return ["name", "role", "email", "status"];
  }
  if (module === "users") {
    return ["name", "email", "role"];
  }
  if (module === "deployments") {
    return ["date", "version", "project", "environment", "developer", "status", "changelog", "notes"];
  }
  return ["code", "title", "project", "status", "priority"];
}

export function getFieldIcons(): Record<string, ReactNode> {
  return {
    title: <Tag size={16} className="text-sky-500" />,
    project: <Folder size={16} className="text-amber-500" />,
    projectName: <Folder size={16} className="text-amber-500" />,
    relatedFeature: <Compass size={16} className="text-purple-500" />,
    feature: <Compass size={16} className="text-purple-500" />,
    module: <SquaresFour size={16} className="text-indigo-500" />,
    moduleName: <SquaresFour size={16} className="text-indigo-500" />,
    category: <SquaresFour size={16} className="text-blue-500" />,
    status: <Pulse size={16} className="text-emerald-500" />,
    priority: <Shield size={16} className="text-orange-500" />,
    severity: <WarningCircle size={16} className="text-rose-500" />,
    dueDate: <Calendar size={16} className="text-rose-500" />,
    date: <Calendar size={16} className="text-rose-500" />,
    description: <TextAlignLeft size={16} className="text-slate-500" />,
    preconditions: <Clock size={16} className="text-amber-600" />,
    stepsToReproduce: <TextAlignLeft size={16} className="text-blue-600" />,
    expectedResult: <CheckCircle size={16} className="text-emerald-600" />,
    actualResult: <WarningCircle size={16} className="text-rose-600" />,
    notes: <Note size={16} className="text-slate-500" />,
    evidence: <Paperclip size={16} className="text-sky-600" />,
    referenceDocument: <Note size={16} className="text-teal-500" />,
    traceability: <Tag size={16} className="text-pink-500" />,
    createdBy: <Tag size={16} className="text-slate-500" />,
    whatTested: <Tag size={16} className="text-blue-500" />,
    issuesFound: <WarningCircle size={16} className="text-rose-500" />,
    progressSummary: <Pulse size={16} className="text-emerald-500" />,
    blockers: <X size={16} className="text-rose-600" />,
    nextPlan: <Clock size={16} className="text-indigo-500" />,
  };
}

export function parseFieldError(moduleFields: Array<{ name: string }>, msg: string) {
  const lower = msg.toLowerCase();
  for (const field of moduleFields) {
    if (lower.includes(field.name.toLowerCase())) return { [field.name]: msg };
  }
  const match = msg.match(/^(\w+)\s+is\s+/i);
  if (match) {
    const candidate = moduleFields.find((n) => n.name.toLowerCase() === match[1].toLowerCase());
    if (candidate) return { [candidate.name]: msg };
  }
  return {};
}
