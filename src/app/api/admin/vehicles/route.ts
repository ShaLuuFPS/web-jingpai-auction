import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const vehicles = await prisma.vehicle.findMany({
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(vehicles);
  } catch {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const data = await req.json();
    const vehicle = await prisma.vehicle.create({
      data: {
        title: data.title,
        plateNumber: data.plateNumber,
        mileage: parseInt(data.mileage),
        registrationDate: data.registrationDate,
        startingPrice: parseFloat(data.startingPrice),
        minBidIncrement: parseFloat(data.minBidIncrement),
        description: data.description || "",
        createdBy: admin.userId,
      },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "未授权" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
