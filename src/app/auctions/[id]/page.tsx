import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import BidPanel from "./BidPanel";

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
      : auction.bidResetSeconds;

  return (
    <>
      {/* Auto-refresh for no-JS fallback: updates countdown every 3s */}
      <noscript>
        <meta httpEquiv="refresh" content="3" />
      </noscript>
      <div className="flex flex-col md:flex-row gap-6">
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

        {/* Bid history */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-3">📋 出价记录</h2>
          {bidsReversed.length === 0 ? (
            <p className="text-sm text-gray-400">暂无出价</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {bidsReversed.map((bid) => (
                <div
                  key={bid.id}
                  className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
                >
                  <span>
                    {bid.user.nickname}
                    {bid.user.id === auction.currentWinner?.id && " 🏆"}
                  </span>
                  <span className="font-mono font-medium text-red-600">
                    ¥{bid.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Bid panel (client component) */}
      <div className="w-full md:w-80 lg:w-96">
        <BidPanel auction={JSON.parse(JSON.stringify(auction))} remainingSeconds={remainingSeconds} />
      </div>
      </div>
    </>
  );
}
