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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">🚗 车辆管理</h1>
        <Link href="/admin/vehicles/new" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          ➕ 添加车辆
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3">图片</th>
              <th className="text-left p-3">标题</th>
              <th className="text-left p-3">车牌</th>
              <th className="text-left p-3">里程</th>
              <th className="text-left p-3">起拍价</th>
              <th className="text-left p-3">状态</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="p-3">
                  {v.images[0] ? (
                    <img src={v.images[0].filePath} alt="" className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">无</div>
                  )}
                </td>
                <td className="p-3 font-medium">{v.title}</td>
                <td className="p-3">{v.plateNumber}</td>
                <td className="p-3">{v.mileage.toLocaleString()} km</td>
                <td className="p-3">¥{v.startingPrice.toLocaleString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    v.status === "available" ? "bg-green-100 text-green-700" :
                    v.status === "in_auction" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {v.status === "available" ? "可售" : v.status === "in_auction" ? "拍卖中" : "已售"}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <Link href={`/admin/vehicles/${v.id}/edit`} className="text-blue-600 hover:underline text-xs">
                    编辑
                  </Link>
                  <span className="mx-1 text-gray-300">|</span>
                  <DeleteVehicleButton vehicleId={v.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
