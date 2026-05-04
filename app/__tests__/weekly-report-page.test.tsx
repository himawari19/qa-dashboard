import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pageShell: vi.fn(({ children, title }: { children: React.ReactNode; title: string }) => (
    <section data-testid="page-shell" data-title={title}>
      {children}
    </section>
  )),
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

vi.mock("@/components/page-shell", () => ({
  PageShell: mocks.pageShell,
}));

import WeeklyReportPage from "@/app/weekly-report/page";

let stateValues: unknown[] = [];
let hookIndex = 0;
let effectRuns = 0;
const effectLimit = 1;

function resetHooks() {
  stateValues = [];
  hookIndex = 0;
  effectRuns = 0;
}

function renderReportPage() {
  hookIndex = 0;
  return renderToStaticMarkup(<WeeklyReportPage />);
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
  mocks.fetch.mockImplementation(async () => ({
    ok: false,
    json: async () => ({ error: "weekly report unavailable" }),
  } as Response));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("weekly report page", () => {
  it("renders loading state and then the error fallback without a token", async () => {
    const loadingMarkup = renderReportPage();

    expect(loadingMarkup).toContain("data-testid=\"page-shell\"");
    expect(loadingMarkup).toContain("animate-pulse");
    expect(mocks.fetch).toHaveBeenCalledWith("/api/weekly-report");

    await new Promise((resolve) => setTimeout(resolve, 0));

    const errorMarkup = renderReportPage();

    expect(errorMarkup).toContain("Failed to load weekly report.");
    expect(errorMarkup).toContain("weekly report unavailable");
    expect(mocks.pageShell).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        title: "Weekly Report",
      }),
      undefined,
    );
  });
});
