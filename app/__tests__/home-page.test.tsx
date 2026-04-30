import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dashboard: vi.fn(() => <div data-testid="dashboard" />),
  skeleton: vi.fn(() => <div data-testid="dashboard-skeleton" />),
  fetch: vi.fn(),
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

function renderHome() {
  hookIndex = 0;
  return renderToStaticMarkup(<Home />);
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
    const initialMarkup = renderHome();

    expect(initialMarkup).toContain("dashboard-skeleton");
    expect(mocks.fetch).toHaveBeenNthCalledWith(1, "/api/dashboard/projects");
    expect(mocks.fetch).toHaveBeenNthCalledWith(2, "/api/dashboard", { cache: "no-store" });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const loadedMarkup = renderHome();

    expect(loadedMarkup).toContain("dashboard");
    expect(mocks.dashboard).toHaveBeenCalledTimes(1);
    expect((mocks.dashboard as unknown as { mock: { calls: Array<[Record<string, unknown>]> } }).mock.calls[0]![0]).toEqual(
      expect.objectContaining({
        metrics: [{ label: "Open Tasks", value: 3, caption: "" }],
      }),
    );
  });
});
