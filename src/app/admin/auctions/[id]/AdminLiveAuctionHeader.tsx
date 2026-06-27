"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Props {
  auctionId: string;
  vehicleTitle: string;
  startingPrice: number;
  initialStatus: string;
  initialCurrentBid: number | null;
  initialWinner: { nickname: string } | null;
  initialBidCount: number;
  initialBidSeconds: number;
  initialPreviewSeconds: number;
}

export default function AdminLiveAuctionHeader({
  auctionId,
  vehicleTitle,
  startingPrice,
  initialStatus,
  initialCurrentBid,
  initialWinner,
  initialBidCount,
  initialBidSeconds,
  initialPreviewSeconds,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [currentBid, setCurrentBid] = useState(initialCurrentBid);
  const [winner, setWinner] = useState(initialWinner);
  const [bidCount, setBidCount] = useState(initialBidCount);
  // Two countdowns: preview goes first, then bidding
  const [previewTimer, setPreviewTimer] = useState(
    initialStatus === "pending" ? initialPreviewSeconds : initialStatus === "preview" ? initialPreviewSeconds : 0
  );
  const [bidTimer, setBidTimer] = useState(
    initialStatus === "active" ? initialBidSeconds : initialBidSeconds
  );
  const [endedWinner, setEndedWinner] = useState<{ nickname: string } | null>(null);
  const [endedFinalAmount, setEndedFinalAmount] = useState<number | null>(null);

  const isPreviewRef = useRef(initialStatus === "preview");
  const isActiveRef = useRef(initialStatus === "active");

  useEffect(() => {
    isPreviewRef.current = status === "preview";
    isActiveRef.current = status === "active";
  }, [status]);

  useEffect(() => {
    const socket: Socket = io(window.location.origin, { path: "/socket.io" });

    socket.on("connect", () => {
      socket.emit("join-auction", { auctionId });
    });

    socket.on("bid-update", (data: {
      auctionId: string; amount: number; userId: string; nickname: string; bidCount: number;
    }) => {
      if (data.auctionId === auctionId) {
        setCurrentBid(data.amount);
        setWinner({ nickname: data.nickname });
        setBidCount(data.bidCount);
      }
    });

    socket.on("timer-reset", (data: { auctionId: string; remainingSeconds: number; phase?: string }) => {
      if (data.auctionId === auctionId) {
        setBidTimer(data.remainingSeconds);
        if (data.phase === "active" && !isActiveRef.current) {
          setStatus("active");
          setPreviewTimer(0);
          isActiveRef.current = true;
          isPreviewRef.current = false;
        }
      }
    });

    socket.on("timer-sync", (data: { auctionId: string; remainingSeconds: number; phase?: string }) => {
      if (data.auctionId === auctionId) {
        if (data.phase === "preview") {
          setPreviewTimer(data.remainingSeconds);
        } else {
          setBidTimer(data.remainingSeconds);
        }
      }
    });

    socket.on("preview-started", (data: { auctionId: string; previewSeconds: number }) => {
      if (data.auctionId === auctionId) {
        setStatus("preview");
        setPreviewTimer(data.previewSeconds);
        isPreviewRef.current = true;
        isActiveRef.current = false;
      }
    });

    socket.on("bidding-started", (data: { auctionId: string; bidResetSeconds: number }) => {
      if (data.auctionId === auctionId) {
        setStatus("active");
        setPreviewTimer(0);
        setBidTimer(data.bidResetSeconds);
        isPreviewRef.current = true; // for timer ticks below
        isActiveRef.current = true;
        isPreviewRef.current = false;
      }
    });

    socket.on("auction-ended", (data: {
      auctionId: string; winner: { nickname: string } | null; finalAmount: number | null;
    }) => {
      if (data.auctionId === auctionId) {
        isPreviewRef.current = false;
        isActiveRef.current = false;
        setStatus("ended");
        setPreviewTimer(0);
        setBidTimer(0);
        if (data.winner) {
          setEndedWinner(data.winner);
          setEndedFinalAmount(data.finalAmount);
          setWinner(data.winner);
          setCurrentBid(data.finalAmount);
        }
      }
    });

    return () => {
      socket.emit("leave-auction", { auctionId });
      socket.disconnect();
    };
  }, [auctionId]);

  // Local countdown: preview phase
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPreviewRef.current) return;
      setPreviewTimer((t) => {
        if (t <= 1) {
          // Will be handled by bidding-started event from server
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Local countdown: active/bidding phase
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isActiveRef.current) return;
      setBidTimer((t) => {
        if (t <= 1) {
          isActiveRef.current = false;
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const statusLabel =
    status === "active" ? "进行中" :
    status === "preview" ? "预告中" :
    status === "pending" ? "待开始" : "已结束";
  const statusColor =
    status === "active" ? "bg-green-100 text-green-700" :
    status === "preview" ? "bg-blue-100 text-blue-700" :
    status === "pending" ? "bg-yellow-100 text-yellow-700" :
    "bg-gray-100 text-gray-500";

  const isLowBid = bidTimer <= 30 && bidTimer > 0 && status === "active";
  const displayWinner = endedWinner || winner;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">
            <a href={`/auctions/${auctionId}`} target="_blank" className="text-blue-600 hover:underline">
              {vehicleTitle}
            </a>
          </h2>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>{statusLabel}</span>
            <span>起拍价：¥{startingPrice.toLocaleString()}</span>
            <span>
              当前最高：{currentBid ? `¥${currentBid.toLocaleString()}` : "无"}
            </span>
            <span>{bidCount} 次出价</span>
          </div>
          {status === "ended" && displayWinner && (
            <div className="text-sm">
              🏆 最终买家：
              <span className="font-medium">{displayWinner.nickname}</span>
              {endedFinalAmount && (
                <>
                  <span className="mx-1">·</span>
                  成交价：
                  <span className="font-mono font-bold text-red-600">
                    ¥{endedFinalAmount.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Dual countdown display */}
        <div className="flex gap-6 text-center">
          {/* Preview countdown */}
          <div>
            <div className="text-xs text-gray-400 mb-1">
              {status === "preview" ? "📢 预告倒计时" : "预告"}
            </div>
            <div className={`text-2xl font-mono font-bold ${
              status === "preview" ? "text-blue-600" : "text-gray-300"
            }`}>
              {status === "pending" ? `${Math.floor(initialPreviewSeconds / 60)}:${(initialPreviewSeconds % 60).toString().padStart(2, "0")}` :
               status === "ended" ? "0:00" :
               formatTime(previewTimer)}
            </div>
            {status === "pending" && <div className="text-xs text-gray-300 mt-0.5">未开始</div>}
          </div>

          <div className="text-gray-300 text-lg self-center">→</div>

          {/* Bidding countdown */}
          <div>
            <div className="text-xs text-gray-400 mb-1">
              {status === "active" ? "⏱ 竞价倒计时" : "竞价"}
            </div>
            <div className={`text-2xl font-mono font-bold ${
              isLowBid ? "text-red-500 animate-pulse" :
              status === "active" ? "text-gray-800" : "text-gray-300"
            }`}>
              {status === "pending" ? `${Math.floor(initialBidSeconds / 60)}:${(initialBidSeconds % 60).toString().padStart(2, "0")}` :
               formatTime(bidTimer)}
            </div>
            {status === "pending" && <div className="text-xs text-gray-300 mt-0.5">未开始</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
