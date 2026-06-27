import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AuctionActions from "./AuctionActions";
import AdminLiveAuctionHeader from "./AdminLiveAuctionHeader";

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

  // Calculate remaining countdown seconds (server-side)
  const lastBidTime = auction.bids[0]?.createdAt || auction.startedAt;
  const elapsed = lastBidTime
    ? Math.floor((Date.now() - new Date(lastBidTime).getTime()) / 1000)
    : 0;
  const bidRemainingSeconds =
    auction.status === "active"
      ? Math.max(0, auction.bidResetSeconds - elapsed)
      : auction.bidResetSeconds;

  // Preview remaining seconds
  const previewElapsed = auction.startedAt
    ? Math.floor((Date.now() - new Date(auction.startedAt).getTime()) / 1000)
    : 0;
  const previewRemainingSeconds =
    auction.status === "preview"
      ? Math.max(0, auction.previewSeconds - previewElapsed)
      : auction.previewSeconds;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">🔨 管理拍卖</h1>
        <Link
          href={`/auctions/${auction.id}`}
          target="_blank"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          👁 查看拍卖页面 ↗
        </Link>
      </div>

      {/* Header card (client component for real-time updates) */}
      <AdminLiveAuctionHeader
        auctionId={auction.id}
        vehicleTitle={auction.vehicle.title}
        startingPrice={auction.vehicle.startingPrice}
        initialStatus={auction.status}
        initialCurrentBid={auction.currentHighestBid}
        initialWinner={JSON.parse(JSON.stringify(auction.currentWinner))}
        initialBidCount={auction.bidCount}
        initialBidSeconds={bidRemainingSeconds}
        initialPreviewSeconds={previewRemainingSeconds}
      />

      <AuctionActions
        auctionId={auction.id}
        status={auction.status}
        bidResetSeconds={auction.bidResetSeconds}
        previewSeconds={auction.previewSeconds}
        autoRelist={auction.autoRelist}
      />

      <div className="bg-white rounded-lg shadow p-6 mt-4">
        <h3 className="font-semibold mb-3">出价记录</h3>
        {auction.bids.length === 0 ? (
          <p className="text-sm text-gray-400">暂无出价</p>
        ) : (
          <div className="space-y-2">
            {auction.bids.map((b) => (
              <div key={b.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                <span>{b.user.nickname}</span>
                <span className="font-mono text-red-600">¥{b.amount.toLocaleString()}</span>
                <span className="text-gray-400 text-xs">{new Date(b.createdAt).toLocaleTimeString("zh-CN")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
