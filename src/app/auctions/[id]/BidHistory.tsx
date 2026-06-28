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
    <div className="bg-white rounded-2xl border border-gray-100 p-6"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <h2 className="font-semibold text-base text-gray-900 mb-4">
        出价记录
      </h2>

      {/* Current leader */}
      {currentWinner && bids.length > 0 ? (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">
              当前领先：<span className="font-medium text-gray-900">{currentWinner.nickname}</span>
            </span>
            <span className="font-semibold text-gray-900 tabular-nums">
              ¥{bids[0].amount.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">暂无出价</p>
      )}

      {bids.length > 0 && (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {bids.map((bid, i) => {
            const increment = getIncrement(i, bid.amount);
            return (
              <div
                key={bid.id}
                className="flex items-center justify-between text-sm py-2 px-2
                  rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-400 w-16 shrink-0">
                    {formatTime(bid.createdAt)}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {bid.user.nickname}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                    +¥{increment.toLocaleString()}
                  </span>
                  <span className="font-semibold text-gray-900 tabular-nums min-w-[80px] text-right">
                    ¥{bid.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
