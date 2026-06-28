import prisma from "@/lib/prisma";
import Link from "next/link";
import { startAuctionAction } from "./actions";
import DeleteAuctionButton from "./DeleteAuctionButton";
import ClearEndedAuctionsButton from "./ClearEndedAuctionsButton";

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">
          拍卖管理
        </h1>
        <div className="flex items-center gap-3">
          <ClearEndedAuctionsButton />
          <Link
            href="/admin/auctions/new"
            className="bg-[#635bff] text-white px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-150 ease-out
              hover:bg-[#0a2540] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
              active:translate-y-0"
          >
            创建拍卖
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                车辆
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                状态
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                当前最高价
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                出价次数
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                创建时间
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4">
                  <Link
                    href={`/admin/auctions/${a.id}`}
                    className="font-medium text-gray-900 hover:text-[#635bff] transition-colors"
                  >
                    {a.vehicle.title}
                  </Link>
                  <div className="text-xs text-gray-400 mt-0.5">{a.vehicle.plateNumber}</div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                      a.status === "active"
                        ? "bg-[#eef2ff] text-[#635bff]"
                        : a.status === "preview"
                          ? "bg-gray-100 text-gray-500"
                          : a.status === "pending"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {a.status === "active"
                      ? "进行中"
                      : a.status === "preview"
                        ? "预告中"
                        : a.status === "pending"
                          ? "待开始"
                          : "已结束"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {a.currentHighestBid ? (
                    <span className="font-semibold text-gray-900 tabular-nums">
                      ¥{a.currentHighestBid.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600">{a.bidCount}</td>
                <td className="py-3 px-4 text-gray-400">
                  {new Date(a.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link
                      href={`/admin/auctions/${a.id}`}
                      className="text-xs font-medium text-[#635bff] hover:text-[#4f49cc] transition-colors"
                    >
                      管理
                    </Link>
                    {a.status === "pending" && (
                      <form action={startAuctionAction} className="inline">
                        <input type="hidden" name="auctionId" value={a.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors cursor-pointer"
                        >
                          开始
                        </button>
                      </form>
                    )}
                    <DeleteAuctionButton auctionId={a.id} />
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
