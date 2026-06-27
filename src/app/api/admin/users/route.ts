import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: { id: true, username: true, nickname: true, role: true, enabled: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const data = await req.json();
    if (!data.username || !data.password || !data.nickname) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }
    if (data.password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        nickname: data.nickname,
        passwordHash,
        role: data.role || "user",
      },
      select: { id: true, username: true, nickname: true, role: true, enabled: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "未授权" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
