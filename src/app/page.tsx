import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const auctions = await prisma.auction.findMany({
    where: { status: { in: ["pending", "active"] } },
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
            <Link
              key={a.id}
              href={`/auctions/${a.id}`}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 block"
            >
              <h2 className="font-semibold text-lg mb-2 line-clamp-1">{a.vehicle.title}</h2>
              <div className="text-sm text-gray-500 space-y-1">
                <p>📅 {a.vehicle.registrationDate} 上牌</p>
                <p>🛣️ {a.vehicle.mileage.toLocaleString()} km</p>
                <p>💰 起拍价 ¥{a.vehicle.startingPrice.toLocaleString()}</p>
                {a.currentHighestBid ? (
                  <p className="text-red-500 font-medium">
                    当前出价 ¥{a.currentHighestBid.toLocaleString()}
                    {a.currentWinner && ` (${a.currentWinner.nickname})`}
                  </p>
                ) : (
                  <p className="text-gray-400">暂无出价</p>
                )}
                <p>🔢 {a.bidCount} 次出价</p>
              </div>
              <div className="mt-3">
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full ${
                    a.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {a.status === "active" ? "🔥 竞拍中" : "⏳ 待开始"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
