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
      className={`bg-white rounded-2xl border border-gray-100 p-6 block
        transition-all duration-200 ease-out
        hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
        ${isEndedFinal ? "opacity-50" : ""}`}
    >
      {/* Title + auto-relist badge */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-lg text-gray-900 truncate">
          {auction.vehicle.title}
        </h2>
        {auction.autoRelist && (status === "active" || status === "preview" || status === "pending") && (
          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 shrink-0">
            自动
          </span>
        )}
      </div>

      {/* Details */}
      <div className="text-sm text-gray-500 space-y-1.5 mb-4">
        <div className="flex justify-between">
          <span>上牌时间</span>
          <span className="text-gray-700">{auction.vehicle.registrationDate}</span>
        </div>
        <div className="flex justify-between">
          <span>表显里程</span>
          <span className="text-gray-700">{auction.vehicle.mileage.toLocaleString()} km</span>
        </div>
        <div className="flex justify-between">
          <span>起拍价</span>
          <span className="text-gray-700">¥{auction.vehicle.startingPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>当前出价</span>
          {currentBid ? (
            <span className="font-semibold text-gray-900">
              ¥{currentBid.toLocaleString()}
              {winner && (
                <span className="font-normal text-gray-400 text-xs ml-1">
                  ({winner.nickname})
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-400">暂无</span>
          )}
        </div>
        <div className="flex justify-between">
          <span>出价次数</span>
          <span className="text-gray-700">{auction.bidCount} 次</span>
        </div>
      </div>

      {/* Status + Countdown row */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
            status === "active"
              ? "bg-[#eef2ff] text-[#635bff]"
              : status === "preview"
                ? "bg-gray-100 text-gray-500"
                : status === "ended"
                  ? "bg-gray-100 text-gray-400"
                  : "bg-gray-100 text-gray-500"
          }`}
        >
          {status === "active"
            ? "竞拍中"
            : status === "preview"
              ? "预告中"
              : status === "ended" && isRelisting
                ? "即将重新开始"
                : status === "ended"
                  ? "已结束"
                  : "待开始"}
        </span>

        {/* Preview countdown */}
        {status === "preview" && (
          <span className="font-mono font-semibold text-sm text-[#635bff] bg-[#eef2ff] px-2.5 py-0.5 rounded-md">
            {countdownReady ? formatTime(previewTimer) : "加载中..."}
          </span>
        )}

        {/* Relist countdown */}
        {isRelisting && (
          <span className="font-mono font-semibold text-sm text-[#635bff] bg-[#eef2ff] px-2.5 py-0.5 rounded-md animate-pulse">
            {formatTime(relistTimer)}
          </span>
        )}

        {/* Relist finished hint — auction should now be pending */}
        {status === "ended" && relistTimer === 0 && relistRef.current === false && auction.autoRelist && (
          <span className="text-xs text-gray-400">等待重新开始中…</span>
        )}
      </div>

      {/* Relist progress bar */}
      {isRelisting && (
        <div className="mt-3 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-[#635bff] transition-all duration-1000 ease-linear"
            style={{
              width: `${((auction.relistDelaySeconds - relistTimer) / auction.relistDelaySeconds) * 100}%`,
            }}
          />
        </div>
      )}
    </Link>
  );
}
