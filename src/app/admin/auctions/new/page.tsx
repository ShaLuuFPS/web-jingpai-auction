import prisma from "@/lib/prisma";
import NewAuctionForm from "./NewAuctionForm";

export const dynamic = "force-dynamic";

export default async function NewAuctionPage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: "available" },
    select: { id: true, title: true, startingPrice: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-8">创建拍卖</h1>
      <NewAuctionForm vehicles={vehicles} />
    </div>
  );
}
