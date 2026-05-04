import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dashboard: vi.fn(() => <div data-testid="dashboard" />),
  skeleton: vi.fn(() => <div data-testid="dashboard-skeleton" />),
  fetch: vi.fn(),
  getCurrentUser: vi.fn(async () => ({ id: 1, role: "lead", company: "acme", email: "lead@example.com" })),
  getDashboardData: vi.fn(async () => ({
    metrics: [{ label: "Open Tasks", value: 3, caption: "" }],
    distribution: { tasks: [], bugs: [], bugByModule: [] },
    personalSuccessRate: 80,
    recent: { tasks: [], bugs: [], testCases: [] },
    recentSessions: [],
    spotlight: {
      projectName: "QA Hub",
      totalScenarios: 0,
      totalBugs: 0,
      completionRate: 0,
      criticalBugs: [],
      priorityTasks: [],
    },
    bugTrendData: [],
    todayActivity: [],
    heatmap: [],
    activity: [],
  })),
  dbQuery: vi.fn(async () => [{ project: "Alpha" }, { project: "Beta" }]),
}));

const reactMocks = vi.hoisted(() => ({
  useState: vi.fn(),
  useEffect: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  const mockReact = {
    ...actual,
    useState: reactMocks.useState,
    useEffect: reactMocks.useEffect,
  };

  return {
    ...mockReact,
    default: mockReact,
  };
});

vi.mock("@/components/dashboard", () => ({
  Dashboard: mocks.dashboard,
}));

vi.mock("@/components/skeleton", () => ({
  DashboardSkeleton: mocks.skeleton,
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/data", () => ({
  getDashboardData: mocks.getDashboardData,
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: mocks.dbQuery,
  },
}));

import Home from "@/app/page";

let stateValues: unknown[] = [];
let hookIndex = 0;
let effectRuns = 0;
const effectLimit = 2;

function resetHooks() {
  stateValues = [];
  hookIndex = 0;
  effectRuns = 0;
}

async function renderHome() {
  hookIndex = 0;
  const element = await Home();
  return renderToStaticMarkup(element);
}

beforeEach(() => {
  resetHooks();
  mocks.fetch.mockReset();

  reactMocks.useState.mockImplementation(((initial: unknown) => {
    const currentIndex = hookIndex++;
    if (stateValues[currentIndex] === undefined) {
      stateValues[currentIndex] = typeof initial === "function" ? (initial as () => unknown)() : initial;
    }

    const setState = (next: unknown) => {
      stateValues[currentIndex] = typeof next === "function"
        ? (next as (prev: unknown) => unknown)(stateValues[currentIndex])
        : next;
    };

    return [stateValues[currentIndex], setState] as any;
  }) as typeof React.useState);

  reactMocks.useEffect.mockImplementation(((effect: React.EffectCallback) => {
    if (effectRuns >= effectLimit) return;
    effectRuns += 1;
    effect();
  }) as typeof React.useEffect);

  globalThis.fetch = mocks.fetch as unknown as typeof fetch;
  mocks.fetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url === "/api/dashboard/projects") {
      return {
        ok: true,
        json: async () => ({ projects: ["Alpha", "Beta"] }),
      } as Response;
    }

    if (url === "/api/dashboard") {
      return {
        ok: true,
        json: async () => ({
          metrics: [{ label: "Open Tasks", value: 3, caption: "" }],
          distribution: { tasks: [], bugs: [], bugByModule: [] },
          personalSuccessRate: 80,
          recent: { tasks: [], bugs: [], testCases: [] },
          recentSessions: [],
          spotlight: {
            projectName: "QA Hub",
            totalScenarios: 0,
            totalBugs: 0,
            completionRate: 0,
            criticalBugs: [],
            priorityTasks: [],
          },
          bugTrendData: [],
          todayActivity: [],
          heatmap: [],
          activity: [],
        }),
      } as Response;
    }

    throw new Error(`Unexpected fetch: ${url}`);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("home page", () => {
  it("loads project options and dashboard data without live credentials", async () => {
    const initialMarkup = await renderHome();

    expect(initialMarkup).toContain("dashboard");

    await new Promise((resolve) => setTimeout(resolve, 0));

    const loadedMarkup = await renderHome();

    expect(loadedMarkup).toContain("dashboard");
    expect(mocks.dashboard).toHaveBeenCalledTimes(2);
    expect((mocks.dashboard as unknown as { mock: { calls: Array<[Record<string, unknown>]> } }).mock.calls.at(-1)![0]).toEqual(
      expect.objectContaining({
        metrics: [{ label: "Open Tasks", value: 3, caption: "" }],
      }),
    );
  });
});
