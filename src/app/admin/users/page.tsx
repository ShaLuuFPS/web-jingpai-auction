import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">
          账户管理
        </h1>
        <Link
          href="/admin/users/new"
          className="bg-[#635bff] text-white px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-150 ease-out
            hover:bg-[#0a2540] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
            active:translate-y-0"
        >
          添加用户
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">用户名</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">昵称</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">角色</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">创建时间</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{u.username}</td>
                <td className="py-3 px-4 text-gray-600">{u.nickname}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                    u.role === "admin" ? "bg-[#eef2ff] text-[#635bff]" : "bg-gray-100 text-gray-600"
                  }`}>
                    {u.role === "admin" ? "管理员" : "用户"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                    u.enabled ? "bg-green-50 text-green-700" : "bg-red-50 text-[#ff6b6b]"
                  }`}>
                    {u.enabled ? "启用" : "禁用"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="py-3 px-4">
                  <Link href={`/admin/users/${u.id}/edit`}
                    className="text-xs font-medium text-[#635bff] hover:text-[#4f49cc] transition-colors">
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
