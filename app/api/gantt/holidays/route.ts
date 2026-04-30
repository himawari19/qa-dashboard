import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const cache = new Map<number, { data: Record<string, string>; fetchedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchHolidaysForYear(year: number): Promise<Record<string, string>> {
  const cached = cache.get(year);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) return {};

  const json = await res.json() as Array<{ date: string; localName: string }>;
  const data: Record<string, string> = {};
  for (const h of json) {
    data[h.date] = h.localName;
  }

  cache.set(year, { data, fetchedAt: Date.now() });
  return data;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const currentYear = new Date().getFullYear();
  const year = Number(searchParams.get("year") || currentYear);

  // Fetch current year and adjacent years for smooth navigation
  const years = [year - 1, year, year + 1].filter(y => y >= 2020 && y <= 2030);

  try {
    const results = await Promise.all(years.map(fetchHolidaysForYear));
    const merged: Record<string, string> = Object.assign({}, ...results);
    return NextResponse.json(merged);
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
