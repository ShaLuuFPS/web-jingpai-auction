import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import AuctionActions from "./AuctionActions";

export const dynamic = "force-dynamic";

export default async function AdminAuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auction = await prisma.auction.findUnique({
    where: { id },
    include: {
      vehicle: true,
      currentWinner: { select: { nickname: true } },
      bids: { orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { nickname: true } } } },
    },
  });
  if (!auction) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🔨 管理拍卖</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-lg font-semibold mb-2">{auction.vehicle.title}</h2>
        <div className="text-sm text-gray-500 space-y-1">
          <p>状态：{auction.status === "active" ? "进行中" : auction.status === "pending" ? "待开始" : "已结束"}</p>
          <p>起拍价：¥{auction.vehicle.startingPrice.toLocaleString()}</p>
          <p>当前最高价：{auction.currentHighestBid ? `¥${auction.currentHighestBid.toLocaleString()}` : "无"}</p>
          <p>出价次数：{auction.bidCount}</p>
          <p>倒计时：{auction.bidResetSeconds}秒</p>
        </div>
      </div>
      <AuctionActions auctionId={auction.id} status={auction.status} bidResetSeconds={auction.bidResetSeconds} />
      <div className="bg-white rounded-lg shadow p-6 mt-4">
        <h3 className="font-semibold mb-3">出价记录</h3>
        <div className="space-y-2">
          {auction.bids.map((b) => (
            <div key={b.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
              <span>{b.user.nickname}</span>
              <span className="font-mono text-red-600">¥{b.amount.toLocaleString()}</span>
              <span className="text-gray-400 text-xs">{new Date(b.createdAt).toLocaleTimeString("zh-CN")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
