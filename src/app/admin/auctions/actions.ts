"use server";

import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createAuction(prevState: { error?: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权，请重新登录" };
  }

  const vehicleId = formData.get("vehicleId") as string;
  const bidResetSeconds = parseInt((formData.get("bidResetSeconds") as string) || "120");
  const previewSeconds = parseInt((formData.get("previewSeconds") as string) || "120");
  const autoRelist = formData.get("autoRelist") === "on";
  const relistDelaySeconds = parseInt((formData.get("relistDelaySeconds") as string) || "60");

  if (!vehicleId) {
    return { error: "请选择车辆" };
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return { error: "车辆不存在" };
  if (vehicle.status !== "available") return { error: "车辆不可用" };

  const auction = await prisma.auction.create({
    data: {
      vehicleId,
      bidResetSeconds: isNaN(bidResetSeconds) ? 120 : bidResetSeconds,
      previewSeconds: isNaN(previewSeconds) ? 120 : previewSeconds,
      autoRelist,
      relistDelaySeconds: isNaN(relistDelaySeconds) ? 60 : relistDelaySeconds,
      createdBy: (await requireAdmin()).userId,
    },
  });

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      status: "in_auction",
      ...(autoRelist
        ? {
            autoAuction: true,
            previewSeconds: isNaN(previewSeconds) ? 120 : previewSeconds,
            relistDelaySeconds: isNaN(relistDelaySeconds) ? 60 : relistDelaySeconds,
          }
        : {}),
    },
  });

  redirect(`/admin/auctions/${auction.id}`);
}

export async function auctionAction(prevState: { error?: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权" };
  }

  const auctionId = formData.get("auctionId") as string;
  const action = formData.get("action") as string;

  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) return { error: "拍卖不存在" };

  if (action === "start") {
    if (auction.status !== "pending") return { error: "只能开始待开始的拍卖" };
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: "preview", startedAt: new Date() },
    });

    // Start preview countdown timer
    const g = globalThis as any;
    if (g.__startPreviewTimer) {
      g.__startPreviewTimer(auctionId, auction.previewSeconds);
    }

    // Notify all clients that preview has started
    if (g.__io) {
      g.__io.to(auctionId).emit("preview-started", {
        auctionId,
        previewSeconds: auction.previewSeconds,
      });
    }
  } else if (action === "end") {
    if (auction.status !== "preview" && auction.status !== "active") {
      return { error: "只能结束预告中或进行中的拍卖" };
    }
    // Call the server-side endAuction to handle timers + autoRelist
    const g = globalThis as any;
    if (g.__endAuction) {
      await g.__endAuction(auctionId);
    } else {
      // Fallback if global not available
      const wasPreview = auction.status === "preview";
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: "ended", endedAt: new Date() },
      });
      await prisma.vehicle.update({
        where: { id: auction.vehicleId },
        data: { status: wasPreview ? "available" : "sold" },
      });
      if (g.__io) {
        if (g.__stopAuctionTimer) g.__stopAuctionTimer(auctionId);
        g.__io.to(auctionId).emit("auction-ended", {
          auctionId,
          winner: auction.currentWinnerId
            ? { id: auction.currentWinnerId, nickname: "" }
            : null,
          finalAmount: auction.currentHighestBid,
        });
      }
    }
  } else {
    return { error: "无效操作" };
  }

  redirect(`/admin/auctions/${auctionId}`);
}

/** Single-purpose action for starting an auction from the list page (no useActionState needed) */
export async function startAuctionAction(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const auctionId = formData.get("auctionId") as string;
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction || auction.status !== "pending") {
    redirect("/admin/auctions");
  }

  await prisma.auction.update({
    where: { id: auctionId },
    data: { status: "preview", startedAt: new Date() },
  });

  // Start preview countdown timer
  const g = globalThis as any;
  if (g.__startPreviewTimer) {
    g.__startPreviewTimer(auctionId, auction.previewSeconds);
  }

  // Notify all clients that preview has started
  if (g.__io) {
    g.__io.to(auctionId).emit("preview-started", {
      auctionId,
      previewSeconds: auction.previewSeconds,
    });
  }

  redirect(`/admin/auctions/${auctionId}`);
}

/** Restart an ended auction: clear bids, reset to pending, set vehicle back to available */
export async function restartAuction(prevState: { error?: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权" };
  }

  const auctionId = formData.get("auctionId") as string;
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) return { error: "拍卖不存在" };
  if (auction.status !== "ended") return { error: "只能重新开始已结束的拍卖" };

  // Stop any lingering server-side timer
  const g = globalThis as any;
  if (g.__stopAuctionTimer) g.__stopAuctionTimer(auctionId);

  // Delete all bids, reset auction, and update vehicle in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.bid.deleteMany({ where: { auctionId } });
    await tx.auction.update({
      where: { id: auctionId },
      data: {
        status: "pending",
        currentHighestBid: null,
        currentWinnerId: null,
        bidCount: 0,
        startedAt: null,
        endedAt: null,
        // Keep previewSeconds, autoRelist, relistDelaySeconds as-is
      },
    });
    await tx.vehicle.update({
      where: { id: auction.vehicleId },
      data: { status: "available" },
    });
  });

  redirect(`/admin/auctions/${auctionId}`);
}

/** Update the bid reset (countdown) seconds for an auction */
export async function updateBidResetSeconds(prevState: { error?: string; success?: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权" };
  }

  const auctionId = formData.get("auctionId") as string;
  const seconds = parseInt(formData.get("bidResetSeconds") as string);

  if (!auctionId) return { error: "缺少拍卖ID" };
  if (!seconds || isNaN(seconds) || seconds < 10 || seconds > 3600) {
    return { error: "倒计时必须在 10-3600 秒之间" };
  }

  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) return { error: "拍卖不存在" };
  if (auction.status === "ended") return { error: "已结束的拍卖无法修改倒计时" };

  await prisma.auction.update({
    where: { id: auctionId },
    data: { bidResetSeconds: seconds },
  });

  return { success: `竞价倒计时已更新为 ${seconds} 秒` };
}

/** Update the preview seconds for an auction */
export async function updatePreviewSeconds(prevState: { error?: string; success?: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权" };
  }

  const auctionId = formData.get("auctionId") as string;
  const seconds = parseInt(formData.get("previewSeconds") as string);

  if (!auctionId) return { error: "缺少拍卖ID" };
  if (!seconds || isNaN(seconds) || seconds < 10 || seconds > 3600) {
    return { error: "预告时间必须在 10-3600 秒之间" };
  }

  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) return { error: "拍卖不存在" };
  if (auction.status !== "pending") return { error: "只能在待开始状态下修改预告时间" };

  await prisma.auction.update({
    where: { id: auctionId },
    data: { previewSeconds: seconds },
  });

  return { success: `预告时间已更新为 ${seconds} 秒` };
}

/** Toggle auto-relist for an auction (only in pending status) */
export async function toggleAutoRelist(prevState: { error?: string; success?: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权" };
  }

  const auctionId = formData.get("auctionId") as string;
  const enabled = formData.get("enabled") === "true";

  if (!auctionId) return { error: "缺少拍卖ID" };

  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) return { error: "拍卖不存在" };
  if (auction.status !== "pending") return { error: "只能在待开始状态下修改" };

  await prisma.auction.update({
    where: { id: auctionId },
    data: { autoRelist: enabled },
  });

  // Also sync to vehicle
  await prisma.vehicle.update({
    where: { id: auction.vehicleId },
    data: {
      autoAuction: enabled,
      ...(enabled ? {
        previewSeconds: auction.previewSeconds,
        relistDelaySeconds: auction.relistDelaySeconds,
      } : {}),
    },
  });

  return { success: enabled ? "自动拍卖已启用" : "自动拍卖已关闭" };
}

/** Create a new auction with the same vehicle (vehicle must be available first) */
export async function relistAuction(prevState: { error?: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "未授权" };
  }

  const auctionId = formData.get("auctionId") as string;
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { vehicle: true },
  });
  if (!auction) return { error: "拍卖不存在" };
  if (auction.status !== "ended") return { error: "只能对已结束的拍卖重新上架" };

  // Stop any lingering server-side timer for the old auction
  const g = globalThis as any;
  if (g.__stopAuctionTimer) g.__stopAuctionTimer(auctionId);

  // Reset vehicle to available and create new auction
  await prisma.vehicle.update({
    where: { id: auction.vehicleId },
    data: { status: "available" },
  });

  const newAuction = await prisma.auction.create({
    data: {
      vehicleId: auction.vehicleId,
      bidResetSeconds: auction.bidResetSeconds,
      previewSeconds: auction.previewSeconds,
      autoRelist: auction.autoRelist,
      relistDelaySeconds: auction.relistDelaySeconds,
      createdBy: (await requireAdmin()).userId,
    },
  });

  await prisma.vehicle.update({
    where: { id: auction.vehicleId },
    data: { status: "in_auction" },
  });

  redirect(`/admin/auctions/${newAuction.id}`);
}
