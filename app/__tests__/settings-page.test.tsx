import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  pageShell: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
}));

vi.mock("@/components/page-shell", () => ({
  PageShell: mocks.pageShell,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import SettingsPage from "@/app/settings/page";

describe("settings page", () => {
  it("renders the main settings groups and links", () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain("Personal");
    expect(html).toContain("User Management");
    expect(html).toContain("My Profile");
    expect(html).toContain('href="/settings/profile"');
    expect(html).toContain('href="/settings/users"');
    const props = (mocks.pageShell as unknown as { mock: { calls: Array<[Record<string, unknown>]> } }).mock.calls[0]![0];
    expect(props).toEqual(expect.objectContaining({
      title: "Settings",
      eyebrow: "Configure your workspace",
    }));
  });
});
