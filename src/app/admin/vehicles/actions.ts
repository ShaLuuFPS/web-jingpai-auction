"use server";

import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createVehicle(prevState: { error?: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权，请重新登录" };
  }

  const title = formData.get("title") as string;
  const plateNumber = formData.get("plateNumber") as string;
  const registrationDate = formData.get("registrationDate") as string;
  const mileage = parseInt(formData.get("mileage") as string);
  const startingPrice = parseFloat(formData.get("startingPrice") as string);
  const minBidIncrement = parseFloat(formData.get("minBidIncrement") as string);
  const description = (formData.get("description") as string) || "";

  if (!title || !plateNumber || !registrationDate) {
    return { error: "请填写必填字段" };
  }
  if (isNaN(mileage) || isNaN(startingPrice) || isNaN(minBidIncrement)) {
    return { error: "数字字段格式不正确" };
  }

  await prisma.vehicle.create({
    data: {
      title,
      plateNumber,
      mileage,
      registrationDate,
      startingPrice,
      minBidIncrement,
      description,
      createdBy: (await requireAdmin()).userId,
    },
  });

  redirect("/admin/vehicles");
}

export async function updateVehicle(
  vehicleId: string,
  prevState: { error?: string },
  formData: FormData
) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权，请重新登录" };
  }

  const title = formData.get("title") as string;
  const plateNumber = formData.get("plateNumber") as string;
  const registrationDate = formData.get("registrationDate") as string;
  const mileage = parseInt(formData.get("mileage") as string);
  const startingPrice = parseFloat(formData.get("startingPrice") as string);
  const minBidIncrement = parseFloat(formData.get("minBidIncrement") as string);
  const description = (formData.get("description") as string) || "";

  if (!title || !plateNumber || !registrationDate) {
    return { error: "请填写必填字段" };
  }

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      title,
      plateNumber,
      mileage,
      registrationDate,
      startingPrice,
      minBidIncrement,
      description,
    },
  });

  redirect("/admin/vehicles");
}

export async function deleteVehicle(
  vehicleId: string,
  prevState: { error?: string },
  _formData: FormData
) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权，请重新登录" };
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { auctions: { where: { status: "active" } } },
  });
  if (!vehicle) return { error: "车辆不存在" };

  if (vehicle.auctions.length > 0) {
    return { error: "该车辆有进行中的拍卖，无法删除" };
  }

  // Delete associated images first
  await prisma.vehicleImage.deleteMany({ where: { vehicleId } });
  await prisma.vehicle.delete({ where: { id: vehicleId } });

  redirect("/admin/vehicles");
}
