"use server";

import { getCurrentUser } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function placeBid(prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "请先登录才能出价" };
  }

  const auctionId = formData.get("auctionId") as string;
  // quickAmount from quick bid buttons takes priority over manual input
  const quickAmountStr = formData.get("quickAmount") as string;
  const amountStr = quickAmountStr || (formData.get("amount") as string);
  const amount = parseInt(amountStr);

  if (!auctionId) return { error: "缺少拍卖ID" };
  if (!amount || isNaN(amount) || amount <= 0) {
    return { error: "请输入有效的出价金额" };
  }

  // ── Cooldown: prevent rapid-fire bids (3 seconds) ──
  const lastUserBid = await prisma.bid.findFirst({
    where: { auctionId, userId: user.userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (lastUserBid) {
    const sinceLastBid = (Date.now() - new Date(lastUserBid.createdAt).getTime()) / 1000;
    if (sinceLastBid < 3) {
      return { error: `请等待 ${Math.ceil(3 - sinceLastBid)} 秒后再出价` };
    }
  }

  let result: { auction: { id: string }; bid: unknown } | null = null;

  try {
    result = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: { vehicle: true },
      });

      if (!auction) throw new Error("拍卖不存在");
      if (auction.status !== "active") throw new Error("拍卖未在进行中");

      const minBid =
        (auction.currentHighestBid || auction.vehicle.startingPrice) +
        auction.vehicle.minBidIncrement;

      if (amount < minBid) {
        throw new Error(`出价必须至少 ¥${minBid.toLocaleString()}`);
      }

      const bid = await tx.bid.create({
        data: { auctionId, userId: user.userId, amount },
      });

      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentHighestBid: amount,
          currentWinnerId: user.userId,
          bidCount: { increment: 1 },
        },
      });

      return { auction: updated, bid };
    });
  } catch (err: any) {
    const message = err.message;
    if (message.includes("Unique constraint")) {
      return { error: "该金额已被出价，请尝试其他金额" };
    }
    return { error: message };
  }

  // redirect() must be OUTSIDE try/catch because it throws NEXT_REDIRECT
  // internally — catching it prevents the redirect from working.
  if (result) {
    redirect(`/auctions/${result.auction.id}`);
  }
}
