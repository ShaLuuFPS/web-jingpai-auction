import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    if (!user.enabled) {
      return NextResponse.json({ error: "账号已被禁用" }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.nickname = user.nickname;
    session.role = user.role;
    await session.save();

    return NextResponse.json({
      user: {
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
