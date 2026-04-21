import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  const existing = await db.query('SELECT COUNT(*) as total FROM "ApiEndpoint"') as { total: number }[];
  if (Number(existing[0]?.total || 0) > 0) {
    return NextResponse.json({ ok: true, message: "API testing data already exists." });
  }

  await db.run(
    `INSERT INTO "ApiEndpoint" (title, method, endpoint, payload, response, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      "SauceDemo product catalog",
      "GET",
      "https://www.saucedemo.com/inventory.html",
      "",
      "Inventory page content and product cards.",
      "Use this as the main smoke endpoint for the catalog page.",
    ],
  );

  await db.run(
    `INSERT INTO "ApiEndpoint" (title, method, endpoint, payload, response, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      "SauceDemo cart page",
      "GET",
      "https://www.saucedemo.com/cart.html",
      "",
      "Cart page content for selected products.",
      "Use this to validate cart rendering and session state.",
    ],
  );

  return NextResponse.json({ ok: true, message: "Demo API testing data loaded." });
}
