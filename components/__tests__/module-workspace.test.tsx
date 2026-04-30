import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ModuleKey } from "@/lib/modules";

const routerRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefresh,
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: any }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/badge", () => ({
  Badge: ({ children }: { children: any }) => <span>{children}</span>,
}));

vi.mock("@/components/kanban-board", () => ({
  KanbanBoard: () => <div data-testid="kanban-board" />,
}));

vi.mock("@/components/highlight-text", () => ({
  HighlightText: ({ text }: { text: string }) => <>{text}</>,
}));

vi.mock("@/components/date-picker", () => ({
  ModernDatePicker: () => <input data-testid="date-picker" />,
}));

vi.mock("@/components/ui/confirm-modal", () => ({
  ConfirmModal: () => null,
}));

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: ({ crumbs }: { crumbs: Array<{ label: string }> }) => (
    <nav>{crumbs.map((crumb) => crumb.label).join(" / ")}</nav>
  ),
}));

vi.mock("@/components/ui/auto-resize-textarea", () => ({
  AutoResizeTextarea: (props: any) => <textarea {...props} />,
}));

vi.mock("@/components/attachment-uploader", () => ({
  AttachmentUploader: () => <div data-testid="attachment-uploader" />,
}));

vi.mock("@/components/module-workspace-utils", () => ({
  PAGE_SIZE: 10,
  getFieldIcons: () => ({}),
  getModuleWorkspaceCrumbs: (_module: string, title: string) => [
    { label: "Dashboard" },
    { label: "Test Management" },
    { label: title },
  ],
  getModuleWorkspacePermissions: (role: string) => {
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
  },
  getPreferredColumnOrder: () => [],
  linkifyToMarkdown: (value: string) => value,
  parseFieldError: () => ({}),
}));

vi.mock("@/components/module-view-modal", () => ({
  ViewModal: () => null,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: vi.fn(),
}));

import { ModuleWorkspace } from "@/components/module-workspace";

function renderWorkspace(module: ModuleKey, userRole: string) {
  return renderToStaticMarkup(
    <ModuleWorkspace
      module={module}
      rows={[
        {
          id: 1,
          name: "Alice",
          username: "alice@example.com",
          role: "lead",
        },
      ]}
      user={{ role: userRole, company: "acme" }}
    />,
  );
}

describe("ModuleWorkspace smoke", () => {
  it("keeps viewer read-only for user management", () => {
    const html = renderWorkspace("users", "viewer");

    expect(html).toContain("User Management");
    expect(html).not.toContain("Add Users");
    expect(html).not.toContain(">Edit<");
    expect(html).not.toContain(">Delete<");
  });

  it("shows edit actions but not delete for editors", () => {
    const html = renderWorkspace("users", "editor");

    expect(html).toContain("Add Users");
    expect(html).toContain(">Edit<");
    expect(html).not.toContain(">Delete<");
  });
});
