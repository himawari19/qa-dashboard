import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  moduleWorkspace: vi.fn(() => <div data-testid="module-workspace" />),
  getModuleRowsPage: vi.fn(async (module: string) => {
    if (module === "users") {
      return {
        rows: [
          { id: 1, name: "Alice", email: "alice@example.com", role: "lead", company: "acme" },
        ],
        total: 1,
      };
    }
    return { rows: [], total: 0 };
  }),
  getAssigneeOptions: vi.fn(async () => [
    { value: "Rina", label: "Rina" },
    { value: "Budi", label: "Budi" },
  ]),
  getProjectOptions: vi.fn(async () => []),
  getTestPlanReferenceRows: vi.fn(async () => [
    { id: "1", title: "Plan A", project: "Acme", publicToken: "tok", sprint: "Sprint 1" },
  ]),
  getModuleRows: vi.fn(async (module: string) => {
    if (module === "users") {
      return [
        { id: 1, name: "Alice", email: "alice@example.com", role: "lead", company: "acme" },
      ];
    }
    if (module === "assignees") {
      return [
        { id: 1, name: "Rina" },
        { id: 2, name: "Budi" },
      ];
    }
    return [];
  }),
  getCurrentUser: vi.fn(async () => ({ id: 1, role: "lead", company: "acme", email: "lead@example.com" })),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/components/module-workspace", () => ({
  ModuleWorkspace: mocks.moduleWorkspace,
}));

vi.mock("@/lib/data", () => ({
  getModuleRows: mocks.getModuleRows,
  getModuleRowsPage: mocks.getModuleRowsPage,
  getAssigneeOptions: mocks.getAssigneeOptions,
  getProjectOptions: mocks.getProjectOptions,
  getTestPlanReferenceRows: mocks.getTestPlanReferenceRows,
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

import ModulePage, { generateStaticParams } from "@/app/[module]/page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("module route", () => {
  it("generates static params for all modules", () => {
    const params = generateStaticParams();

    expect(params.length).toBeGreaterThan(0);
    expect(params[0]).toHaveProperty("module");
  });

  it("passes loaded data and query params to ModuleWorkspace", async () => {
    const element = await ModulePage({
      params: Promise.resolve({ module: "users" }),
      searchParams: Promise.resolve({ company: "acme", preset: ["x", "y"] }),
    });

    renderToStaticMarkup(element);

    expect(mocks.getModuleRowsPage).toHaveBeenCalledWith("users", 1, 10);
    expect(mocks.getAssigneeOptions).toHaveBeenCalled();
    expect(mocks.moduleWorkspace).toHaveBeenCalled();

    const moduleWorkspaceMock = mocks.moduleWorkspace as unknown as {
      mock: { calls: Array<[{
      module: string;
      rows: Array<Record<string, unknown>>;
      currentPage: number;
      totalPages: number;
      totalItems: number;
      initialFormValues: Record<string, string>;
      user: Record<string, unknown>;
    }]> };
    };
    const props = moduleWorkspaceMock.mock.calls[0]![0];
    expect(props.module).toBe("users");
    expect(props.rows).toEqual([
      { id: 1, name: "Alice", email: "alice@example.com", role: "lead", company: "acme" },
    ]);
    expect(props.initialFormValues).toEqual({
      company: "acme",
      preset: "x",
    });
    expect(props.user).toEqual({
      id: 1,
      role: "lead",
      company: "acme",
      email: "lead@example.com",
    });
  });

  it("throws notFound for unknown modules", async () => {
    await expect(
      ModulePage({
        params: Promise.resolve({ module: "unknown" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
