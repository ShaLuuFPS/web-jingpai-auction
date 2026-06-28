import prisma from "@/lib/prisma";
import TunnelInfo from "./TunnelInfo";

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
    { label: "注册用户", value: totalUsers },
    { label: "车辆总数", value: totalVehicles },
    { label: "进行中拍卖", value: activeAuctions },
    { label: "已结束拍卖", value: endedAuctions },
    { label: "总出价次数", value: totalBids },
  ];

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-8">仪表盘</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 text-center"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div className="text-[32px] font-semibold text-gray-900 tabular-nums mb-1">
              {s.value}
            </div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <a href="/admin/vehicles/new"
          className="bg-white border border-gray-100 rounded-xl p-4 text-center
            text-sm font-medium text-gray-700
            hover:border-[#635bff] hover:text-[#635bff] transition-all duration-150"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          添加车辆
        </a>
        <a href="/admin/auctions/new"
          className="bg-white border border-gray-100 rounded-xl p-4 text-center
            text-sm font-medium text-gray-700
            hover:border-[#635bff] hover:text-[#635bff] transition-all duration-150"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          创建拍卖
        </a>
        <a href="/admin/users/new"
          className="bg-white border border-gray-100 rounded-xl p-4 text-center
            text-sm font-medium text-gray-700
            hover:border-[#635bff] hover:text-[#635bff] transition-all duration-150"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          添加用户
        </a>
        <a href="/"
          className="bg-white border border-gray-100 rounded-xl p-4 text-center
            text-sm font-medium text-gray-400
            hover:border-gray-200 hover:text-gray-600 transition-all duration-150"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          回到前台
        </a>
      </div>

      <TunnelInfo />
    </div>
  );
}
