import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditUserForm from "./EditUserForm";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, nickname: true, role: true, enabled: true },
  });
  if (!user) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">✏️ 编辑用户</h1>
      <EditUserForm user={user} />
    </div>
  );
}
