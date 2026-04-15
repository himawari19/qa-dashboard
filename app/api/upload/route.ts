import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const ext = file.name.split(".").pop() || "png";
    const uniqueSuffix = crypto.randomBytes(6).toString("hex");
    const filename = `${Date.now()}-${uniqueSuffix}.${ext}`;
    
    // Save to public/uploads
    const filepath = path.join(process.cwd(), "public/uploads", filename);
    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
