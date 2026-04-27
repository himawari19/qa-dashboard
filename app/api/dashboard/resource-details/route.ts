import { NextResponse } from "next/server";
import { getResourceDetails } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const data = await getResourceDetails(name);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Resource Details API error:", error);
    return NextResponse.json({ error: "Failed to load resource details" }, { status: 500 });
  }
}
