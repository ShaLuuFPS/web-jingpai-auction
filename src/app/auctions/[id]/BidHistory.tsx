"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface BidEntry {
  id: string;
  amount: number;
  createdAt: string;
  user: { id: string; nickname: string };
}

interface CurrentWinner {
  id: string;
  nickname: string;
}

export default function BidHistory({
  auctionId,
  initialBids,
  initialWinner,
  startingPrice,
}: {
  auctionId: string;
  initialBids: BidEntry[];
  initialWinner: CurrentWinner | null;
  startingPrice: number;
}) {
  const [bids, setBids] = useState<BidEntry[]>(initialBids);
  const [currentWinner, setCurrentWinner] = useState<CurrentWinner | null>(
    initialWinner
  );

  useEffect(() => {
    const socket: Socket = io(window.location.origin, { path: "/socket.io" });

    socket.on("connect", () => {
      socket.emit("join-auction", { auctionId });
    });

    socket.on(
      "bid-update",
      (data: {
        auctionId: string;
        amount: number;
        userId: string;
        nickname: string;
        bidCount: number;
        bidId: string;
        timestamp: string;
      }) => {
        if (data.auctionId === auctionId) {
          setCurrentWinner({ id: data.userId, nickname: data.nickname });
          setBids((prev) => [
            {
              id: data.bidId,
              amount: data.amount,
              createdAt: data.timestamp,
              user: { id: data.userId, nickname: data.nickname },
            },
            ...prev,
          ]);
        }
      }
    );

    return () => {
      socket.emit("leave-auction", { auctionId });
      socket.disconnect();
    };
  }, [auctionId]);

  // Calculate increment relative to previous bid (or starting price for first bid)
  const getIncrement = (index: number, currentAmount: number): number => {
    if (index < bids.length - 1) {
      return currentAmount - bids[index + 1].amount;
    }
    return currentAmount - startingPrice;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="font-semibold mb-2">📋 出价记录</h2>

      {/* Current leader */}
      {currentWinner && bids.length > 0 ? (
        <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          🏆 当前领先：<span className="font-medium">{currentWinner.nickname}</span>
          <span className="mx-1">·</span>
          <span className="font-mono font-bold text-red-600">
            ¥{bids[0].amount.toLocaleString()}
          </span>
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-2">暂无出价</p>
      )}

      {bids.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {bids.map((bid, i) => {
            const increment = getIncrement(i, bid.amount);
            return (
              <div
                key={bid.id}
                className="text-sm py-1.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">
                    {formatTime(bid.createdAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-mono">
                      +¥{increment.toLocaleString()}
                    </span>
                    <span className="font-mono font-medium text-red-600">
                      ¥{bid.amount.toLocaleString()}
                    </span>
                  </span>
                </div>
                <span className="text-xs text-gray-500">{bid.user.nickname}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
