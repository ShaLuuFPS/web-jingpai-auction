import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import BidPanel from "./BidPanel";
import BidHistory from "./BidHistory";
import PriceChart from "./PriceChart";

export const dynamic = "force-dynamic";

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const auction = await prisma.auction.findUnique({
    where: { id },
    include: {
      vehicle: { include: { images: { orderBy: { sortOrder: "asc" } } } },
      currentWinner: { select: { id: true, nickname: true } },
      bids: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, nickname: true } } },
      },
    },
  });

  if (!auction) notFound();

  const bidsReversed = [...auction.bids].reverse();

  // Calculate actual remaining countdown seconds (server-side)
  const lastBidTime =
    auction.bids[0]?.createdAt || auction.startedAt;
  const elapsed = lastBidTime
    ? Math.floor((Date.now() - new Date(lastBidTime).getTime()) / 1000)
    : 0;
  const remainingSeconds =
    auction.status === "active"
      ? Math.max(0, auction.bidResetSeconds - elapsed)
      : auction.status === "preview"
      ? Math.max(0, auction.previewSeconds - Math.floor((Date.now() - new Date(auction.startedAt!).getTime()) / 1000))
      : auction.bidResetSeconds;

  return (
    <>
      {/* Auto-refresh for no-JS fallback: updates countdown every 3s (only when not ended) */}
      {auction.status !== "ended" && (
        <noscript>
          <meta httpEquiv="refresh" content="3" />
        </noscript>
      )}
      <div className="flex flex-col md:flex-row gap-6 pb-24 md:pb-0">
      {/* Left: Vehicle info */}
      <div className="flex-1 space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          {auction.vehicle.images.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {auction.vehicle.images.map((img) => (
                <img
                  key={img.id}
                  src={img.filePath}
                  alt={auction.vehicle.title}
                  className="w-full max-w-md h-64 object-cover rounded"
                />
              ))}
            </div>
          )}
          {auction.vehicle.images.length === 0 && (
            <div className="mb-4 w-full h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">
              🚗 暂无图片
            </div>
          )}
          <h1 className="text-xl font-bold mb-3">{auction.vehicle.title}</h1>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">车牌号</span>
              <p className="font-medium">{auction.vehicle.plateNumber}</p>
            </div>
            <div>
              <span className="text-gray-400">表显里程</span>
              <p className="font-medium">{auction.vehicle.mileage.toLocaleString()} km</p>
            </div>
            <div>
              <span className="text-gray-400">上牌时间</span>
              <p className="font-medium">{auction.vehicle.registrationDate}</p>
            </div>
            <div>
              <span className="text-gray-400">加价幅度</span>
              <p className="font-medium">¥{auction.vehicle.minBidIncrement.toLocaleString()}</p>
            </div>
          </div>
          {auction.vehicle.description && (
            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              {auction.vehicle.description}
            </div>
          )}
        </div>

        {/* Bid history (client component for real-time updates) */}
        <BidHistory
          auctionId={auction.id}
          initialBids={JSON.parse(JSON.stringify(bidsReversed))}
          initialWinner={JSON.parse(JSON.stringify(auction.currentWinner))}
          startingPrice={auction.vehicle.startingPrice}
        />
      </div>

      {/* Right: Price chart + Bid panel */}
      <div className="w-full md:w-80 lg:w-96 space-y-4">
        <PriceChart
          auctionId={auction.id}
          initialData={bidsReversed.map((b) => ({
            time: new Date(b.createdAt).toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            price: b.amount,
            bidder: b.user.nickname,
          }))}
        />
        <BidPanel auction={JSON.parse(JSON.stringify(auction))} remainingSeconds={remainingSeconds} />
      </div>
      </div>
    </>
  );
}
