import prisma from "@/lib/prisma";
import Link from "next/link";
import { startAuctionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAuctionsPage() {
  const auctions = await prisma.auction.findMany({
    include: {
      vehicle: { select: { title: true, plateNumber: true } },
      currentWinner: { select: { nickname: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">🔨 拍卖管理</h1>
        <Link href="/admin/auctions/new" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          ➕ 创建拍卖
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3">车辆</th>
              <th className="text-left p-3">状态</th>
              <th className="text-left p-3">当前最高价</th>
              <th className="text-left p-3">出价次数</th>
              <th className="text-left p-3">创建时间</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {auctions.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/admin/auctions/${a.id}`} className="font-medium text-blue-600 hover:underline">
                    {a.vehicle.title}
                  </Link>
                  <div className="text-xs text-gray-400">{a.vehicle.plateNumber}</div>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    a.status === "active" ? "bg-green-100 text-green-700" :
                    a.status === "preview" ? "bg-blue-100 text-blue-700" :
                    a.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {a.status === "active" ? "进行中" :
                     a.status === "preview" ? "📢 预告中" :
                     a.status === "pending" ? "待开始" : "已结束"}
                  </span>
                </td>
                <td className="p-3">
                  {a.currentHighestBid ? (
                    <span className="text-red-600 font-medium">¥{a.currentHighestBid.toLocaleString()}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3">{a.bidCount}</td>
                <td className="p-3 text-gray-400">{new Date(a.createdAt).toLocaleDateString("zh-CN")}</td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  <Link href={`/admin/auctions/${a.id}`} className="text-blue-600 hover:underline text-xs">
                    管理
                  </Link>
                  {a.status === "pending" && (
                    <form action={startAuctionAction} className="inline">
                      <input type="hidden" name="auctionId" value={a.id} />
                      <button type="submit" className="text-green-600 hover:text-green-800 text-xs cursor-pointer">
                        ▶ 开始
                      </button>
                    </form>
                  )}
                  <Link href={`/auctions/${a.id}`} className="text-gray-400 hover:underline text-xs" target="_blank">
                    预览 ↗
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
