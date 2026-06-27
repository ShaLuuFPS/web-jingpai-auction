import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const data = await req.json();
    if (!data.vehicleId) return NextResponse.json({ error: "请选择车辆" }, { status: 400 });

    // Check vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) return NextResponse.json({ error: "车辆不存在" }, { status: 404 });
    if (vehicle.status !== "available") return NextResponse.json({ error: "车辆不可用" }, { status: 400 });

    const auction = await prisma.auction.create({
      data: {
        vehicleId: data.vehicleId,
        bidResetSeconds: parseInt(data.bidResetSeconds) || 120,
        createdBy: admin.userId,
      },
    });

    // Update vehicle status
    await prisma.vehicle.update({ where: { id: data.vehicleId }, data: { status: "in_auction" } });

    return NextResponse.json(auction, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "未授权" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
