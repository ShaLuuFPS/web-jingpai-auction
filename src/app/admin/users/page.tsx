import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">👥 账户管理</h1>
        <Link href="/admin/users/new" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          ➕ 添加用户
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3">用户名</th>
              <th className="text-left p-3">昵称</th>
              <th className="text-left p-3">角色</th>
              <th className="text-left p-3">状态</th>
              <th className="text-left p-3">创建时间</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{u.username}</td>
                <td className="p-3">{u.nickname}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    {u.role === "admin" ? "管理员" : "用户"}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {u.enabled ? "启用" : "禁用"}
                  </span>
                </td>
                <td className="p-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                <td className="p-3">
                  <Link href={`/admin/users/${u.id}/edit`} className="text-blue-600 hover:underline text-xs">
                    编辑
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
