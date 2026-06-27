import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    await requireAdmin();
    const urlFile = path.join(process.cwd(), ".tunnel-url");
    if (fs.existsSync(urlFile)) {
      const url = fs.readFileSync(urlFile, "utf-8").trim();
      return NextResponse.json({ url });
    }
    return NextResponse.json({ url: null });
  } catch {
    return NextResponse.json({ url: null });
  }
}
