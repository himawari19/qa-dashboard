import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/dashboard/route";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getDashboardData: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/data", () => ({
  getDashboardData: mocks.getDashboardData,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("dashboard api", () => {
  it("returns empty dashboard when user is missing", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/dashboard"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      metrics: expect.any(Array),
      spotlight: expect.any(Object),
    });
  });

  it("returns dashboard data", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce({ id: 1, role: "admin", company: "" });
    mocks.getDashboardData.mockResolvedValueOnce({ ok: true });

    const response = await GET(new Request("http://localhost/api/dashboard?project=QA"));

    expect(mocks.getDashboardData).toHaveBeenCalledWith("QA");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
