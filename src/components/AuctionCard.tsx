"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

interface AuctionCardData {
  id: string;
  status: string;
  currentHighestBid: number | null;
  bidCount: number;
  previewSeconds: number;
  autoRelist: boolean;
  relistDelaySeconds: number;
  vehicle: {
    title: string;
    registrationDate: string;
    mileage: number;
    startingPrice: number;
  };
  currentWinner: { nickname: string } | null;
}

export default function AuctionCard({ auction }: { auction: AuctionCardData }) {
  const [status, setStatus] = useState(auction.status);
  const [previewTimer, setPreviewTimer] = useState(auction.previewSeconds);
  const [currentBid, setCurrentBid] = useState(auction.currentHighestBid);
  const [winner, setWinner] = useState(auction.currentWinner);
  const previewRef = useRef(status === "preview");
  const [countdownReady, setCountdownReady] = useState(false);

  // Relist (restart) countdown state
  const [relistTimer, setRelistTimer] = useState(0);
  const relistRef = useRef(false);

  useEffect(() => {
    previewRef.current = status === "preview";
  }, [status]);

  useEffect(() => {
    const socket: Socket = io(window.location.origin, { path: "/socket.io" });

    socket.on("connect", () => {
      socket.emit("join-auction", { auctionId: auction.id });
    });

    socket.on("timer-sync", (data: { auctionId: string; remainingSeconds: number; phase?: string }) => {
      if (data.auctionId === auction.id && data.phase === "preview") {
        setPreviewTimer(data.remainingSeconds);
        setStatus("preview");
        previewRef.current = true;
        setCountdownReady(true);
      }
    });

    socket.on("preview-started", (data: { auctionId: string; previewSeconds: number }) => {
      if (data.auctionId === auction.id) {
        setStatus("preview");
        setPreviewTimer(data.previewSeconds);
        previewRef.current = true;
        setCountdownReady(true);
      }
    });

    socket.on("bidding-started", (data: { auctionId: string }) => {
      if (data.auctionId === auction.id) {
        setStatus("active");
        setPreviewTimer(0);
        previewRef.current = false;
      }
    });

    socket.on("auction-ended", (data: {
      auctionId: string;
      winner: { id: string; nickname: string } | null;
      finalAmount: number | null;
      autoRelist?: boolean;
      relistDelaySeconds?: number;
    }) => {
      if (data.auctionId === auction.id) {
        setStatus("ended");
        previewRef.current = false;
        if (data.finalAmount != null) setCurrentBid(data.finalAmount);
        if (data.winner) setWinner(data.winner);
        // Start relist countdown if auto-relist is enabled
        if (data.autoRelist && data.relistDelaySeconds) {
          setRelistTimer(data.relistDelaySeconds);
          relistRef.current = true;
        }
      }
    });

    socket.on("relist-scheduled", (data: {
      auctionId: string;
      delaySeconds: number;
      scheduledAt: string;
    }) => {
      if (data.auctionId === auction.id) {
        setRelistTimer(data.delaySeconds);
        relistRef.current = true;
      }
    });

    return () => {
      socket.emit("leave-auction", { auctionId: auction.id });
      socket.disconnect();
    };
  }, [auction.id]);

  // Local preview countdown tick
  useEffect(() => {
    const interval = setInterval(() => {
      if (!previewRef.current) return;
      setCountdownReady(true);
      setPreviewTimer((t) => {
        if (t <= 1) {
          previewRef.current = false;
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Relist countdown tick
  useEffect(() => {
    const interval = setInterval(() => {
      if (!relistRef.current) return;
      setRelistTimer((t) => {
        if (t <= 1) {
          relistRef.current = false;
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

  const isRelisting = status === "ended" && relistTimer > 0;
  const isEndedFinal = status === "ended" && relistTimer <= 0;

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 block relative ${
        isEndedFinal ? "opacity-60" : ""
      }`}
    >
      <h2 className="font-semibold text-lg mb-2 line-clamp-1">{auction.vehicle.title}</h2>
      <div className="text-sm text-gray-500 space-y-1">
        <p>📅 {auction.vehicle.registrationDate} 上牌</p>
        <p>🛣️ {auction.vehicle.mileage.toLocaleString()} km</p>
        <p>💰 起拍价 ¥{auction.vehicle.startingPrice.toLocaleString()}</p>
        {currentBid ? (
          <p className="text-red-500 font-medium">
            当前出价 ¥{currentBid.toLocaleString()}
            {winner && ` (${winner.nickname})`}
          </p>
        ) : (
          <p className="text-gray-400">暂无出价</p>
        )}
        <p>🔢 {auction.bidCount} 次出价</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`inline-block text-xs px-2 py-1 rounded-full ${
            status === "active"
              ? "bg-green-100 text-green-700"
              : status === "preview"
              ? "bg-blue-100 text-blue-700"
              : status === "ended"
              ? "bg-gray-100 text-gray-500"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {status === "active" ? "🔥 竞拍中" :
           status === "preview" ? "📢 预告中" :
           status === "ended" && isRelisting ? "🔄 即将重新开始" :
           status === "ended" ? "已结束" :
           "⏳ 待开始"}
        </span>

        {/* Preview countdown — only shown during preview */}
        {status === "preview" && (
          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-sm md:text-base">
            {countdownReady ? formatTime(previewTimer) : "正在加载..."}
          </span>
        )}

        {/* Relist countdown — shown when auction ended and auto-relist is counting down */}
        {isRelisting && (
          <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-sm md:text-base animate-pulse">
            {formatTime(relistTimer)}
          </span>
        )}

        {/* Relist just finished */}
        {status === "ended" && relistTimer === 0 && relistRef.current === false && auction.autoRelist && (
          <span className="text-xs text-purple-500">刷新查看新场次</span>
        )}
      </div>

      {/* Relist progress bar */}
      {isRelisting && (
        <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-1000 ease-linear"
            style={{
              width: `${((auction.relistDelaySeconds - relistTimer) / auction.relistDelaySeconds) * 100}%`,
            }}
          />
        </div>
      )}
    </Link>
  );
}
