import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTestSuite } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const testSuiteId = String(formData.get("testSuiteId") || "");
    const tcId = String(formData.get("tcId") || "");
    const typeCase = String(formData.get("typeCase") || "");
    const preCondition = String(formData.get("preCondition") || "");
    const caseName = String(formData.get("caseName") || "");
    const testStep = String(formData.get("testStep") || "");
    const expectedResult = String(formData.get("expectedResult") || "");
    const actualResult = String(formData.get("actualResult") || "");
    const status = String(formData.get("status") || "Pending");

    if (!testSuiteId || !tcId || !typeCase || !caseName || !testStep || !expectedResult) {
      return NextResponse.json({ error: "Selesaikan semua form yang wajib diisi." }, { status: 400 });
    }

    await db.run(
      `INSERT INTO "TestCase" ("testSuiteId", "tcId", "typeCase", "preCondition", "caseName", "testStep", "expectedResult", "actualResult", "status")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testSuiteId, tcId, typeCase, preCondition, caseName, testStep, expectedResult, actualResult, status]
    );

    revalidatePath("/test-cases");
    const suite = await getTestSuite(testSuiteId);
    if (suite && (suite as Record<string, unknown>).publicToken) {
      revalidatePath(`/test-suites/execute/${String((suite as Record<string, unknown>).publicToken)}`);
    }

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
    const tc = await db.get('SELECT "testSuiteId" FROM "TestCase" WHERE id = ?', [id]) as { testSuiteId?: string };
    await db.run('UPDATE "TestCase" SET "deletedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?', [id]);

    revalidatePath("/test-cases");
    if (tc && tc.testSuiteId) {
      const suite = await getTestSuite(tc.testSuiteId);
      if (suite && (suite as Record<string, unknown>).publicToken) {
        revalidatePath(`/test-suites/execute/${String((suite as Record<string, unknown>).publicToken)}`);
      }
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
    
    revalidatePath("/test-cases");
    
    return NextResponse.json({ message: "Eksekusi berhasil disimpan!" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan eksekusi test case.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
