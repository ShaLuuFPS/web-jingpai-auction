import prisma from "@/lib/prisma";
import AuctionCard from "@/components/AuctionCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const auctions = await prisma.auction.findMany({
    include: {
      vehicle: true,
      currentWinner: { select: { id: true, nickname: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 9,
  });

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-8 text-center">
        竞拍大厅
      </h1>

      {auctions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-500">暂无竞拍车辆</p>
          <p className="text-sm text-gray-400 mt-1">
            请联系管理员添加拍卖场次
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((a) => (
            <AuctionCard
              key={a.id}
              auction={JSON.parse(JSON.stringify(a))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
