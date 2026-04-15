import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { query, params } = await request.json();
    
    // Security: Only allow SELECT for basic playground to prevent accidental data loss 
    // unless you really want full power. Let's allow full for now since it's personal.
    const result = await db.query(query, params || []);
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
