"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import ConfirmButton from "@/components/ConfirmButton";

interface AuctionData {
  id: string;
  status: string;
  currentHighestBid: number | null;
  currentWinner: { id: string; nickname: string } | null;
  bidResetSeconds: number;
  previewSeconds: number;
  bidCount: number;
  autoRelist: boolean;
  relistDelaySeconds: number;
  vehicle: { startingPrice: number; minBidIncrement: number };
}

const BID_COOLDOWN_SEC = 3;

export default function BidPanel({
  auction,
  remainingSeconds,
}: {
  auction: AuctionData;
  remainingSeconds: number;
}) {
  const [currentBid, setCurrentBid] = useState(auction.currentHighestBid);
  const [currentWinner, setCurrentWinner] = useState(auction.currentWinner);
  const [bidCount, setBidCount] = useState(auction.bidCount);
  const [auctionStatus, setAuctionStatus] = useState(auction.status);
  const [timer, setTimer] = useState(remainingSeconds);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<{ userId?: string; id?: string }>({});
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [winner, setWinner] = useState<{ id: string; nickname: string } | null>(null);
  const [finalAmount, setFinalAmount] = useState<number | null>(null);

  const [relistTimer, setRelistTimer] = useState(0);
  const relistRef = useRef(false);

  const currentPrice = currentBid || auction.vehicle.startingPrice;
  const minBid = auction.vehicle.minBidIncrement;
  const socketRef = useRef<Socket | null>(null);

  const quickIncrements = [1, 2, 3, 5, 10].map((m) => m * minBid);
  const quickBids = quickIncrements.map((inc) => currentPrice + inc);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user));
  }, []);

  // Socket.IO
  useEffect(() => {
    const socket = io(window.location.origin, { path: "/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-auction", { auctionId: auction.id });
    });

    socket.on(
      "bid-update",
      (data: {
        auctionId: string;
        amount: number;
        userId: string;
        nickname: string;
        bidCount: number;
      }) => {
        if (data.auctionId === auction.id) {
          setCurrentBid(data.amount);
          setCurrentWinner({ id: data.userId, nickname: data.nickname });
          setBidCount(data.bidCount);
        }
      }
    );

    socket.on("timer-reset", (data: { auctionId: string; remainingSeconds: number }) => {
      if (data.auctionId === auction.id) setTimer(data.remainingSeconds);
    });

    socket.on("timer-sync", (data: { auctionId: string; remainingSeconds: number }) => {
      if (data.auctionId === auction.id) setTimer(data.remainingSeconds);
    });

    socket.on("auction-ended", (data: {
      auctionId: string;
      winner: { id: string; nickname: string } | null;
      finalAmount: number | null;
      autoRelist?: boolean;
      relistDelaySeconds?: number;
    }) => {
      if (data.auctionId === auction.id) {
        setAuctionStatus("ended");
        setTimer(0);
        setWinner(data.winner);
        setFinalAmount(data.finalAmount);
        if (data.autoRelist && data.relistDelaySeconds) {
          setRelistTimer(data.relistDelaySeconds);
          relistRef.current = true;
        }
      }
    });

    socket.on("relist-scheduled", (data: {
      auctionId: string;
      delaySeconds: number;
    }) => {
      if (data.auctionId === auction.id) {
        setRelistTimer(data.delaySeconds);
        relistRef.current = true;
      }
    });

    socket.on("preview-started", (data: { auctionId: string; previewSeconds: number }) => {
      if (data.auctionId === auction.id) {
        setAuctionStatus("preview");
        setTimer(data.previewSeconds);
      }
    });

    socket.on("bidding-started", (data: { auctionId: string; bidResetSeconds: number }) => {
      if (data.auctionId === auction.id) {
        setAuctionStatus("active");
        setTimer(data.bidResetSeconds);
      }
    });

    socket.on("bid-success", (data: { auctionId: string; amount: number }) => {
      if (data.auctionId === auction.id) {
        setMessage(`出价成功！¥${data.amount.toLocaleString()}`);
        setCustomAmount("");
        setIsSubmitting(false);
        setCooldown(BID_COOLDOWN_SEC);
      }
    });

    socket.on("bid-failed", (data: { message: string }) => {
      setMessage(data.message);
      setIsSubmitting(false);
    });

    return () => {
      socket.emit("leave-auction", { auctionId: auction.id });
      socket.disconnect();
    };
  }, [auction.id]);

  // Cooldown tick
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

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

  // Local countdown tick
  useEffect(() => {
    if (auctionStatus !== "active" && auctionStatus !== "preview") return;
    const interval = setInterval(() => {
      setTimer((t: number) => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [auctionStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const executeBid = (amount: number) => {
    if (!socketRef.current) return;
    setIsSubmitting(true);
    socketRef.current.emit("place-bid", { auctionId: auction.id, amount });
  };

  const validateCustomBid = () => {
    const a = parseInt(customAmount);
    if (!a || a < currentPrice + minBid) {
      setMessage(`出价必须 ≥ ¥${(currentPrice + minBid).toLocaleString()}`);
      return false;
    }
    return true;
  };

  const isEnded = auctionStatus === "ended";
  const isActive = auctionStatus === "active";
  const isPreview = auctionStatus === "preview";
  const isPending = auctionStatus === "pending";
  const isFormLocked = isSubmitting || cooldown > 0;
  const isSettling = isActive && timer === 0;
  const isRelisting = isEnded && relistTimer > 0;
  const isUrgent = timer <= 30 && (isActive || isPreview) && !isSettling;

  // ── Timer display ──
  const timerDisplay = (
    <div
      className={`text-[32px] font-semibold font-mono tabular-nums tracking-tight ${
        isEnded
          ? isRelisting
            ? "text-[#635bff]"
            : "text-gray-300"
          : isSettling
            ? "text-gray-400"
            : isUrgent
              ? "text-[#ff6b6b] animate-pulse"
              : "text-gray-900"
      }`}
    >
      {isEnded
        ? isRelisting
          ? formatTime(relistTimer)
          : "已结束"
        : isSettling
          ? "结算中..."
          : isPending
            ? formatTime(auction.bidResetSeconds)
            : formatTime(timer)}
    </div>
  );

  const statusLabel =
    isSettling
      ? "结算中，请稍候..."
      : isRelisting
        ? "即将重新开始竞价"
        : isActive
          ? "竞价倒计时"
          : isPreview
            ? "预告倒计时"
            : isPending
              ? "待开始"
              : "已结束";

  // ── Quick bid buttons ──
  const quickButtons = quickBids.map((amount, i) => (
    <ConfirmButton
      key={i}
      title={`确认出价 ¥${amount.toLocaleString()}？`}
      confirmText="确认出价"
      variant="primary"
      disabled={isFormLocked}
      onConfirm={() => executeBid(amount)}
      className="bg-white border border-gray-200 text-gray-700 text-xs font-medium
        py-2.5 rounded-lg transition-all duration-150
        hover:border-[#635bff] hover:text-[#635bff]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700"
    >
      +¥{quickIncrements[i].toLocaleString()}
    </ConfirmButton>
  ));

  // ── Custom input ──
  const customInput = (
    <div className="flex gap-2">
      <input
        type="number"
        value={customAmount}
        onChange={(e) => setCustomAmount(e.target.value)}
        placeholder={`≥ ¥${(currentPrice + minBid).toLocaleString()}`}
        className="flex-1 border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm
          text-gray-900 placeholder:text-gray-400
          transition-all duration-200
          focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15"
        min={currentPrice + minBid}
        step={100}
      />
      <ConfirmButton
        title={`确认出价 ¥${parseInt(customAmount).toLocaleString()}？`}
        confirmText="确认出价"
        variant="primary"
        disabled={isFormLocked}
        guard={validateCustomBid}
        onConfirm={() => executeBid(parseInt(customAmount))}
        className="bg-[#635bff] text-white px-5 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-150 ease-out
          hover:bg-[#0a2540] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
          active:translate-y-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {isSubmitting ? "处理中..." : cooldown > 0 ? `${cooldown}s` : "出价"}
      </ConfirmButton>
    </div>
  );

  // ── Message bar ──
  const messageBar = message ? (
    <div
      className={`text-sm p-3 rounded-lg ${
        message.startsWith("出价成功")
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-[#ff6b6b] border border-[#ff6b6b]/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button
          onClick={() => setMessage("")}
          className="text-xs opacity-50 hover:opacity-100 ml-2 shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  ) : null;

  const cooldownBar = cooldown > 0 ? (
    <p className="text-xs text-gray-400 text-center">{cooldown} 秒后可再次出价</p>
  ) : null;

  return (
    <>
      {/* ═══════ Desktop: right panel ═══════ */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 p-6 sticky top-20"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        {/* Timer */}
        <div className="text-center mb-5">
          {timerDisplay}
          <div className="text-xs text-gray-400 mt-1">{statusLabel}</div>
        </div>

        {/* Current price card */}
        <div className="text-center mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            当前最高出价
          </div>
          <div className="text-[32px] font-semibold text-gray-900 tabular-nums">
            ¥{currentPrice.toLocaleString()}
          </div>
          {currentWinner && (
            <div className="text-sm text-gray-500 mt-1.5">
              出价人：{currentWinner.nickname}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">{bidCount} 次出价</div>
        </div>

        {/* Active bidding form */}
        {isActive && !isSettling && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">{quickButtons}</div>
            {customInput}
            {cooldownBar}
            {messageBar}
          </div>
        )}

        {/* Settling spinner */}
        {isSettling && (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#635bff] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">结算中，请稍候...</p>
          </div>
        )}

        {/* Preview */}
        {isPreview && (
          <div className="text-center py-6">
            <div className="text-[#635bff] text-base font-semibold mb-2">
              准备开拍
            </div>
            <p className="text-sm text-gray-500">
              拍卖即将开始，请耐心等待
            </p>
            <p className="text-xs text-gray-400 mt-1">
              预告结束后自动开放出价
            </p>
          </div>
        )}

        {/* Ended */}
        {isEnded && (
          <div className="text-center py-6">
            {isRelisting ? (
              <>
                <p className="text-base font-semibold text-[#635bff] mb-3">
                  即将重新开始竞价
                </p>
                <div className="text-[32px] font-semibold font-mono text-[#635bff] mb-3">
                  {formatTime(relistTimer)}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
                  <div
                    className="h-full bg-[#635bff] rounded-full transition-all duration-1000 ease-linear"
                    style={{
                      width: `${((auction.relistDelaySeconds - relistTimer) / (auction.relistDelaySeconds || 60)) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-400">
                  结束后自动重新开始拍卖
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-gray-400">
                  拍卖已结束
                </p>
                {((currentWinner) || winner) && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">成交价</div>
                    <div className="text-xl font-semibold text-gray-900">
                      ¥{(finalAmount || currentBid)?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      买家：{(winner || currentWinner)?.nickname}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Pending */}
        {isPending && (
          <div className="text-center py-6">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">等待管理员开始拍卖</p>
          </div>
        )}
      </div>

      {/* ═══════ Mobile: fixed bottom bar ═══════ */}
      {isActive && !isSettling && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 p-3"
          style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
          {message && (
            <p
              className={`text-xs mb-1.5 ${
                message.startsWith("出价成功") ? "text-green-600" : "text-[#ff6b6b]"
              }`}
            >
              {message}
            </p>
          )}
          {cooldown > 0 && (
            <p className="text-xs text-gray-400 text-center mb-1.5">
              {cooldown}秒后可再出价
            </p>
          )}
          <div className="flex items-center gap-1.5">
            <div className="text-center min-w-[60px]">
              <div
                className={`font-mono font-semibold text-sm ${
                  isUrgent ? "text-[#ff6b6b]" : "text-gray-900"
                }`}
              >
                {formatTime(timer)}
              </div>
              <div className="text-xs text-gray-400">
                ¥{currentPrice.toLocaleString()}
              </div>
            </div>
            {quickBids.slice(0, 2).map((amount, i) => (
              <ConfirmButton
                key={i}
                title={`确认出价 ¥${amount.toLocaleString()}？`}
                confirmText="确认出价"
                variant="primary"
                disabled={isFormLocked}
                onConfirm={() => executeBid(amount)}
                className="bg-white border border-gray-200 text-gray-700 text-xs font-medium
                  py-2.5 px-2 rounded-lg transition-colors
                  hover:border-[#635bff] hover:text-[#635bff]
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +¥{quickIncrements[i].toLocaleString()}
              </ConfirmButton>
            ))}
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={`≥¥${(currentPrice + minBid).toLocaleString()}`}
              className="w-16 border border-[#e0e6eb] rounded-lg px-1.5 py-2.5 text-xs
                focus:outline-none focus:border-[#635bff]"
              min={currentPrice + minBid}
              step={100}
            />
            <ConfirmButton
              title={`确认出价 ¥${parseInt(customAmount).toLocaleString()}？`}
              confirmText="确认出价"
              variant="primary"
              disabled={isFormLocked}
              guard={validateCustomBid}
              onConfirm={() => executeBid(parseInt(customAmount))}
              className="bg-[#635bff] text-white px-3 py-2.5 rounded-lg text-xs font-medium
                whitespace-nowrap transition-colors
                hover:bg-[#4f49cc]
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "..." : cooldown > 0 ? `${cooldown}s` : "出价"}
            </ConfirmButton>
          </div>
        </div>
      )}

      {/* Mobile: non-active states */}
      {!isActive && !isSettling && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 p-3 text-center"
          style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
          {isRelisting ? (
            <div>
              <div className="text-sm font-semibold text-[#635bff] mb-1">
                即将重新开始竞价
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-lg text-[#635bff]">
                  {formatTime(relistTimer)}
                </span>
                <span className="text-xs text-gray-400">结束后自动重新开始</span>
              </div>
            </div>
          ) : isEnded ? (
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-gray-400">已结束</span>
              <span className="text-sm text-gray-500">
                {winner || currentWinner
                  ? `成交 ¥${(finalAmount || currentBid)?.toLocaleString()}`
                  : "拍卖已结束"}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {timerDisplay}
              <span className="text-sm text-gray-500">
                {isPreview ? "准备开拍" : isPending ? "待开始" : statusLabel}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mobile: settling */}
      {isSettling && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 p-3 text-center"
          style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#635bff] rounded-full animate-spin" />
            <span className="text-sm text-gray-500">结算中，请稍候...</span>
          </div>
        </div>
      )}
    </>
  );
}
