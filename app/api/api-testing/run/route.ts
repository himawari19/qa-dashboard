import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const MAX_BODY = 20000;

function clip(value: string) {
  if (value.length <= MAX_BODY) return value;
  return `${value.slice(0, MAX_BODY)}\n...[truncated]`;
}

export async function POST(request: NextRequest) {
  let apiEndpointId: number | null = null;
  let title = "Untitled API";
  let method = "GET";
  let endpoint = "";
  let requestBody = "";
  try {
    const payload = await request.json();
    apiEndpointId = payload.apiEndpointId ? Number(payload.apiEndpointId) : null;
    title = String(payload.title || "Untitled API");
    method = String(payload.method || "GET").toUpperCase();
    endpoint = String(payload.endpoint || "");
    requestBody = String(payload.requestBody || "");

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: ["GET", "HEAD"].includes(method) ? undefined : requestBody || undefined,
    });

    const responseText = clip(await response.text());
    await db.run(
      `INSERT INTO "ApiTestRun" (apiEndpointId, title, method, endpoint, requestBody, responseStatus, responseBody, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        apiEndpointId,
        title,
        method,
        endpoint,
        requestBody,
        `${response.status} ${response.statusText}`,
        responseText,
        "",
      ],
    );

    return NextResponse.json({
      ok: true,
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });
  } catch (error: any) {
    const message = error?.message || "Unknown error";
    await db.run(
      `INSERT INTO "ApiTestRun" (apiEndpointId, title, method, endpoint, requestBody, responseStatus, responseBody, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [apiEndpointId, title, method, endpoint, requestBody, "ERROR", "", message],
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
