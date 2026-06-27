import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const links = [
    { href: "/admin", label: "📊 仪表盘" },
    { href: "/admin/vehicles", label: "🚗 车辆管理" },
    { href: "/admin/auctions", label: "🔨 拍卖管理" },
    { href: "/admin/users", label: "👥 账户管理" },
  ];

  return (
    <div className="flex gap-6">
      <aside className="hidden md:block w-48 shrink-0">
        <nav className="bg-white rounded-lg shadow p-4 sticky top-20">
          <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">管理后台</h2>
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block px-3 py-2 rounded text-sm hover:bg-gray-100 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
