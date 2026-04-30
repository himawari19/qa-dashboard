import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pageShell: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
  badge: vi.fn(({ value }: { value: string }) => <span>{value}</span>),
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

vi.mock("@/components/badge", () => ({
  Badge: mocks.badge,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(" "),
  formatDate: (value: string) => value,
}));

globalThis.fetch = mocks.fetch as unknown as typeof fetch;

import GanttPage from "@/app/gantt/page";

let stateValues: unknown[] = [];
let hookIndex = 0;
let effectRuns = 0;
const effectLimit = 2;

beforeEach(() => {
  stateValues = [];
  hookIndex = 0;
  effectRuns = 0;
  mocks.fetch.mockReset();

  reactMocks.useState.mockImplementation(((initial: unknown) => {
    const currentIndex = hookIndex++;
    if (stateValues[currentIndex] === undefined) {
      stateValues[currentIndex] = typeof initial === "function" ? (initial as () => unknown)() : initial;
    }

    const setState = () => {};
    return [stateValues[currentIndex], setState] as any;
  }) as typeof React.useState);

  reactMocks.useEffect.mockImplementation(((effect: React.EffectCallback) => {
    if (effectRuns >= effectLimit) return;
    effectRuns += 1;
    effect();
  }) as typeof React.useEffect);

  mocks.fetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/gantt?year=")) {
      return {
        ok: true,
        json: async () => ({ sprints: [], plans: [] }),
      } as Response;
    }

    if (url === "/api/auth/profile") {
      return {
        ok: true,
        json: async () => ({ company: "acme" }),
      } as Response;
    }

    throw new Error(`Unexpected fetch: ${url}`);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("gantt page", () => {
  it("renders the loading shell and fetches gantt data", () => {
    const html = renderToStaticMarkup(<GanttPage />);

    expect(html).toContain("animate-pulse");
    expect(html).toContain("glass-card");
    expect(mocks.fetch).toHaveBeenCalledWith(expect.stringMatching(/^\/api\/gantt\?year=\d{4}$/));
    const props = (mocks.pageShell as unknown as { mock: { calls: Array<[Record<string, unknown>]> } }).mock.calls[0]![0];
    expect(props).toEqual(expect.objectContaining({
      title: "Gantt / Timeline",
      eyebrow: "Reports",
    }));
  });
});
