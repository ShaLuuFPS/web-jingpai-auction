import prisma from "@/lib/prisma";
import Link from "next/link";
import DeleteVehicleButton from "./DeleteVehicleButton";

export const dynamic = "force-dynamic";

export default async function AdminVehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">
          车辆管理
        </h1>
        <Link
          href="/admin/vehicles/new"
          className="bg-[#635bff] text-white px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-150 ease-out
            hover:bg-[#0a2540] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
            active:translate-y-0"
        >
          添加车辆
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                图片
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                标题
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                车牌
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                里程
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                起拍价
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                状态
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr
                key={v.id}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="py-3 px-4">
                  {v.images[0] ? (
                    <img
                      src={v.images[0].filePath}
                      alt=""
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                      无
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">
                  {v.title}
                </td>
                <td className="py-3 px-4 text-gray-600">{v.plateNumber}</td>
                <td className="py-3 px-4 text-gray-600">
                  {v.mileage.toLocaleString()} km
                </td>
                <td className="py-3 px-4 text-gray-900 font-medium tabular-nums">
                  ¥{v.startingPrice.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                      v.status === "available"
                        ? "bg-green-50 text-green-700"
                        : v.status === "in_auction"
                          ? "bg-[#eef2ff] text-[#635bff]"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {v.status === "available"
                      ? "可售"
                      : v.status === "in_auction"
                        ? "拍卖中"
                        : "已售"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link
                      href={`/admin/vehicles/${v.id}/edit`}
                      className="text-xs font-medium text-[#635bff] hover:text-[#4f49cc] transition-colors"
                    >
                      编辑
                    </Link>
                    <span className="text-gray-200">|</span>
                    <DeleteVehicleButton vehicleId={v.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
