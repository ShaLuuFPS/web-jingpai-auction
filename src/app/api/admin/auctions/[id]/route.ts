import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action } = await req.json();

    const auction = await prisma.auction.findUnique({ where: { id } });
    if (!auction) return NextResponse.json({ error: "拍卖不存在" }, { status: 404 });

    if (action === "start") {
      if (auction.status !== "pending") return NextResponse.json({ error: "只能开始待开始的拍卖" }, { status: 400 });
      await prisma.auction.update({
        where: { id },
        data: { status: "active", startedAt: new Date() },
      });
    } else if (action === "end") {
      if (auction.status !== "active") return NextResponse.json({ error: "只能结束进行中的拍卖" }, { status: 400 });
      await prisma.auction.update({
        where: { id },
        data: { status: "ended", endedAt: new Date() },
      });
      await prisma.vehicle.update({
        where: { id: auction.vehicleId },
        data: { status: "sold" },
      });
    } else {
      return NextResponse.json({ error: "无效操作" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "未授权" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
