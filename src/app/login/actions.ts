"use server";

import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginAction(prevState: { error?: string }, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "请输入用户名和密码" };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return { error: "用户名或密码错误" };
  }

  if (!user.enabled) {
    return { error: "账号已被禁用" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "用户名或密码错误" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.nickname = user.nickname;
  session.role = user.role;
  await session.save();

  redirect("/");
}
