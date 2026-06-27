import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalUsers, totalVehicles, activeAuctions, endedAuctions, totalBids] = await Promise.all([
    prisma.user.count(),
    prisma.vehicle.count(),
    prisma.auction.count({ where: { status: "active" } }),
    prisma.auction.count({ where: { status: "ended" } }),
    prisma.bid.count(),
  ]);

  const stats = [
    { label: "注册用户", value: totalUsers, emoji: "👥" },
    { label: "车辆总数", value: totalVehicles, emoji: "🚗" },
    { label: "进行中拍卖", value: activeAuctions, emoji: "🔥" },
    { label: "已结束拍卖", value: endedAuctions, emoji: "✅" },
    { label: "总出价次数", value: totalBids, emoji: "💰" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 仪表盘</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <a href="/admin/vehicles/new" className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center text-blue-700 font-medium text-sm transition-colors">
          ➕ 添加车辆
        </a>
        <a href="/admin/auctions/new" className="bg-green-50 hover:bg-green-100 rounded-lg p-4 text-center text-green-700 font-medium text-sm transition-colors">
          🔨 创建拍卖
        </a>
        <a href="/admin/users/new" className="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 text-center text-purple-700 font-medium text-sm transition-colors">
          👤 添加用户
        </a>
        <a href="/" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 text-center text-gray-700 font-medium text-sm transition-colors">
          🏠 回到前台
        </a>
      </div>
      <TunnelInfo />
    </div>
  );
}

import TunnelInfo from "./TunnelInfo";
