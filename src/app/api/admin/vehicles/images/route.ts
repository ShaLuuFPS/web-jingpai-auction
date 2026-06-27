import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const vehicleId = form.get("vehicleId") as string;
    const files = form.getAll("files") as File[];

    if (!vehicleId || !files.length) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "vehicles", vehicleId);
    await mkdir(uploadDir, { recursive: true });

    const created: { id: string; filePath: string; sortOrder: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${uuid()}.${ext}`;
      const filePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      const image = await prisma.vehicleImage.create({
        data: {
          vehicleId,
          filePath: `/uploads/vehicles/${vehicleId}/${filename}`,
          sortOrder: i,
        },
      });
      created.push({ id: image.id, filePath: image.filePath, sortOrder: image.sortOrder });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "未授权" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const imageId = req.nextUrl.searchParams.get("imageId");
    if (!imageId) return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    await prisma.vehicleImage.delete({ where: { id: imageId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
}
