import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const scenarioId = String(formData.get("scenarioId") || "");
    const tcId = String(formData.get("tcId") || "");
    const typeCase = String(formData.get("typeCase") || "");
    const preCondition = String(formData.get("preCondition") || "");
    const caseName = String(formData.get("caseName") || "");
    const testStep = String(formData.get("testStep") || "");
    const expectedResult = String(formData.get("expectedResult") || "");
    const actualResult = String(formData.get("actualResult") || "");
    const status = String(formData.get("status") || "Pending");

    if (!scenarioId || !tcId || !typeCase || !caseName || !testStep || !expectedResult) {
      return NextResponse.json({ error: "Selesaikan semua form yang wajib diisi." }, { status: 400 });
    }

    await db.run(
      `INSERT INTO "TestCase" ("scenarioId", "tcId", "typeCase", "preCondition", "caseName", "testStep", "expectedResult", "actualResult", "status")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [scenarioId, tcId, typeCase, preCondition, caseName, testStep, expectedResult, actualResult, status]
    );

    revalidatePath("/test-case-management");
    revalidatePath(`/test-case-management/${scenarioId}`);

    return NextResponse.json({ message: "Test case berhasil ditambahkan." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan test case.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const idStr = request.nextUrl.searchParams.get("id");
  const id = idStr ? Number(idStr) : null;

  if (!id) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const tc = await db.get('SELECT "scenarioId" FROM "TestCase" WHERE id = ?', [id]) as { scenarioId?: string };
    await db.run('DELETE FROM "TestCase" WHERE "id" = ?', [id]);

    revalidatePath("/test-case-management");
    if (tc && tc.scenarioId) {
      revalidatePath(`/test-case-management/${tc.scenarioId}`);
    }

    return NextResponse.json({ message: "Test case berhasil dihapus." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus test case.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const rows = data.rows as Record<string, any>[];

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Data eksekusi tidak valid" }, { status: 400 });
    }

    for (const tc of rows) {
      if (tc.id) {
        await db.run(
          'UPDATE "TestCase" SET status = ?, "actualResult" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?',
          [tc.status || "Pending", tc.actualResult || "", tc.id]
        );
      }
    }
    
    revalidatePath("/test-case-management");
    
    return NextResponse.json({ message: "Eksekusi berhasil disimpan!" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan eksekusi test case.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
