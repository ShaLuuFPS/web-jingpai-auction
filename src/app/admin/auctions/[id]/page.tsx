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

  const lastBidTime = auction.bids[0]?.createdAt || auction.startedAt;
  const elapsed = lastBidTime
    ? Math.floor((Date.now() - new Date(lastBidTime).getTime()) / 1000)
    : 0;
  const bidRemainingSeconds =
    auction.status === "active"
      ? Math.max(0, auction.bidResetSeconds - elapsed)
      : auction.bidResetSeconds;

  const previewElapsed = auction.startedAt
    ? Math.floor((Date.now() - new Date(auction.startedAt).getTime()) / 1000)
    : 0;
  const previewRemainingSeconds =
    auction.status === "preview"
      ? Math.max(0, auction.previewSeconds - previewElapsed)
      : auction.previewSeconds;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">管理拍卖</h1>
        <Link
          href={`/auctions/${auction.id}`}
          target="_blank"
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium
            hover:border-[#635bff] hover:text-[#635bff] transition-all duration-150"
        >
          查看拍卖页面
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

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <h3 className="font-semibold text-base text-gray-900 mb-4">出价记录</h3>
        {auction.bids.length === 0 ? (
          <p className="text-sm text-gray-400">暂无出价</p>
        ) : (
          <div className="space-y-1">
            {auction.bids.map((b) => (
              <div key={b.id}
                className="flex items-center justify-between text-sm py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-gray-600 min-w-0 truncate">{b.user.nickname}</span>
                <span className="font-semibold text-gray-900 tabular-nums shrink-0 mx-4">
                  ¥{b.amount.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(b.createdAt).toLocaleTimeString("zh-CN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
