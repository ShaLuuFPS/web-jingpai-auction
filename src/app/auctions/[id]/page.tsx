import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import BidPanel from "./BidPanel";
import BidHistory from "./BidHistory";
import PriceChart from "./PriceChart";
import ImageCarousel from "@/components/ImageCarousel";

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
      {auction.status !== "ended" && (
        <noscript>
          <meta httpEquiv="refresh" content="3" />
        </noscript>
      )}
      <div className="flex flex-col md:flex-row gap-6 pb-24 md:pb-0">
        {/* Left: Vehicle info + bid history */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            {/* Vehicle images */}
            <ImageCarousel
              images={auction.vehicle.images}
              alt={auction.vehicle.title}
            />
            {auction.vehicle.images.length === 0 && (
              <div className="mb-5 w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  暂无图片
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              {auction.vehicle.title}
            </h1>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">车牌号</div>
                <div className="font-medium text-gray-900">{auction.vehicle.plateNumber}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">表显里程</div>
                <div className="font-medium text-gray-900">{auction.vehicle.mileage.toLocaleString()} km</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">上牌时间</div>
                <div className="font-medium text-gray-900">{auction.vehicle.registrationDate}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">加价幅度</div>
                <div className="font-medium text-gray-900">¥{auction.vehicle.minBidIncrement.toLocaleString()}</div>
              </div>
            </div>

            {/* Description */}
            {auction.vehicle.description && (
              <div className="mt-5 pt-5 border-t border-gray-100 text-sm text-gray-500 leading-relaxed">
                {auction.vehicle.description}
              </div>
            )}
          </div>

          {/* Bid history */}
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
