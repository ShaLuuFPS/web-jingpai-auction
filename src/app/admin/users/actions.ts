"use server";

import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function createUser(prevState: { error?: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权，请重新登录" };
  }

  const username = formData.get("username") as string;
  const nickname = formData.get("nickname") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "user";

  if (!username || !password || !nickname) {
    return { error: "缺少必填字段" };
  }
  if (password.length < 6) {
    return { error: "密码至少6位" };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "用户名已存在" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, nickname, passwordHash, role },
  });

  redirect("/admin/users");
}

export async function updateUser(
  userId: string,
  prevState: { error?: string },
  formData: FormData
) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权，请重新登录" };
  }

  const nickname = formData.get("nickname") as string;
  const role = (formData.get("role") as string) || "user";
  const enabled = formData.get("enabled") === "true";
  const password = formData.get("password") as string;

  if (!nickname) {
    return { error: "昵称不能为空" };
  }

  const updateData: Record<string, unknown> = { nickname, role, enabled };
  if (password) {
    if (password.length < 6) return { error: "密码至少6位" };
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({ where: { id: userId }, data: updateData });
  redirect("/admin/users");
}
