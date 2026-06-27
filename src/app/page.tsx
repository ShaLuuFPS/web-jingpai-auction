import prisma from "@/lib/prisma";
import AuctionCard from "@/components/AuctionCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const auctions = await prisma.auction.findMany({
    where: { status: { in: ["pending", "preview", "active"] } },
    include: {
      vehicle: true,
      currentWinner: { select: { id: true, nickname: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🚗 竞拍大厅</h1>
      {auctions.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-lg shadow">
          <p className="text-lg">暂无竞拍车辆</p>
          <p className="text-sm mt-2">请联系管理员添加拍卖场次</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
