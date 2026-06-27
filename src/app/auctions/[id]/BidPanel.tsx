"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface AuctionData {
  id: string;
  status: string;
  currentHighestBid: number | null;
  currentWinner: { id: string; nickname: string } | null;
  bidResetSeconds: number;
  bidCount: number;
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

  const currentPrice = currentBid || auction.vehicle.startingPrice;
  const minBid = auction.vehicle.minBidIncrement;
  const socketRef = useRef<Socket | null>(null);

  // Quick bid increments: 1x, 2x, 3x, 5x, 10x of minBidIncrement
  const quickIncrements = [1, 2, 3, 5, 10].map((m) => m * minBid);
  const quickBids = quickIncrements.map((inc) => currentPrice + inc);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user));
  }, []);

  // Socket.IO connection for real-time updates
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
    }) => {
      if (data.auctionId === auction.id) {
        setAuctionStatus("ended");
        setTimer(0);
        setWinner(data.winner);
        setFinalAmount(data.finalAmount);
      }
    });

    socket.on("bid-success", (data: { auctionId: string; amount: number }) => {
      if (data.auctionId === auction.id) {
        setMessage(`✅ 出价成功！¥${data.amount.toLocaleString()}`);
        setCustomAmount("");
        setIsSubmitting(false);
        setCooldown(BID_COOLDOWN_SEC);
      }
    });

    socket.on("bid-failed", (data: { message: string }) => {
      setMessage(`❌ ${data.message}`);
      setIsSubmitting(false);
    });

    return () => {
      socket.emit("leave-auction", { auctionId: auction.id });
      socket.disconnect();
    };
  }, [auction.id]);

  // Countdown cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Local countdown (visual, kept in sync by socket events)
  useEffect(() => {
    if (auctionStatus !== "active") return;
    const interval = setInterval(() => {
      setTimer((t: number) => {
        if (t <= 1) {
          setAuctionStatus("ended");
          return 0;
        }
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

  // Emit bid via Socket.IO
  const handleQuickBid = (amount: number) => {
    if (!socketRef.current) return;
    if (!confirm(`确认出价 ¥${amount.toLocaleString()}？`)) return;
    setIsSubmitting(true);
    socketRef.current.emit("place-bid", { auctionId: auction.id, amount });
  };

  const handleCustomBid = () => {
    if (!socketRef.current) return;
    const a = parseInt(customAmount);
    if (!a || a < currentPrice + minBid) {
      setMessage(`❌ 出价必须 ≥ ¥${(currentPrice + minBid).toLocaleString()}`);
      return;
    }
    if (!confirm(`确认出价 ¥${a.toLocaleString()}？`)) return;
    setIsSubmitting(true);
    socketRef.current.emit("place-bid", { auctionId: auction.id, amount: a });
  };

  const isEnded = auctionStatus === "ended";
  const isActive = auctionStatus === "active";
  const isFormLocked = isSubmitting || cooldown > 0;

  const timerDisplay = (
    <div
      className={`text-lg font-mono font-bold ${
        timer <= 30 && isActive ? "text-red-500 animate-pulse" : "text-gray-800"
      }`}
    >
      {isEnded ? "已结束" : isActive ? formatTime(timer) : formatTime(auction.bidResetSeconds)}
    </div>
  );

  const statusLabel =
    auctionStatus === "active" ? "倒计时" : auctionStatus === "pending" ? "待开始" : "已结束";

  // ── Shared bid form controls ──

  const quickButtons = quickBids.map((amount, i) => (
    <button
      key={i}
      type="button"
      disabled={isFormLocked}
      onClick={() => handleQuickBid(amount)}
      className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-2 rounded border border-blue-200 transition-colors disabled:opacity-50"
      title={`在当前价基础上加 ¥${quickIncrements[i].toLocaleString()}`}
    >
      +¥{quickIncrements[i].toLocaleString()}
    </button>
  ));

  const customInput = (
    <div className="flex gap-2">
      <input
        type="number"
        value={customAmount}
        onChange={(e) => setCustomAmount(e.target.value)}
        placeholder={`≥ ¥${(currentPrice + minBid).toLocaleString()}`}
        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        min={currentPrice + minBid}
        step={100}
      />
      <button
        type="button"
        disabled={isFormLocked}
        onClick={handleCustomBid}
        className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? "处理中..." : cooldown > 0 ? `${cooldown}s` : "出价"}
      </button>
    </div>
  );

  const messageBar = message ? (
    <div
      className={`text-sm p-2 rounded mb-2 ${
        message.startsWith("✅")
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {message}
      <button
        onClick={() => setMessage("")}
        className="float-right text-xs opacity-50 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  ) : null;

  const cooldownBar = cooldown > 0 ? (
    <p className="text-xs text-gray-400 text-center mt-1">{cooldown} 秒后可再次出价</p>
  ) : null;

  return (
    <>
      {/* ── Desktop: right panel ── */}
      <div className="hidden md:block bg-white rounded-lg shadow p-6 sticky top-20">
        <div className="text-center mb-4">
          <div className="text-4xl font-mono font-bold">{timerDisplay}</div>
          <div className="text-xs text-gray-400 mt-1">{statusLabel}</div>
        </div>
        <div className="text-center mb-6 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-500">当前最高出价</div>
          <div className="text-2xl font-bold text-red-600">¥{currentPrice.toLocaleString()}</div>
          {currentWinner && (
            <div className="text-sm text-gray-600 mt-1">出价人：{currentWinner.nickname}</div>
          )}
          <div className="text-xs text-gray-400 mt-1">{bidCount} 次出价</div>
        </div>

        {isActive && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">{quickButtons}</div>
            {customInput}
            {cooldownBar}
            {messageBar}
          </div>
        )}

        {isEnded && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-lg">🔒 拍卖已结束</p>
            {((currentWinner) || winner) && (
              <p className="mt-2">
                成交价：
                <span className="font-bold text-red-600">
                  ¥{(finalAmount || currentBid)?.toLocaleString()}
                </span>{" "}
                | 买家：{(winner || currentWinner)?.nickname}
              </p>
            )}
          </div>
        )}
        {auctionStatus === "pending" && (
          <div className="text-center py-6 text-gray-400">
            <p>⏳ 等待管理员开始拍卖</p>
          </div>
        )}
      </div>

      {/* ── Mobile: fixed bottom bar ── */}
      {isActive && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10 p-3">
          {message && (
            <p
              className={`text-xs mb-1 ${
                message.startsWith("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
          {cooldown > 0 && (
            <p className="text-xs text-gray-400 text-center mb-1">{cooldown}秒后可再出价</p>
          )}
          <div className="flex items-center gap-1.5">
            <div className="text-center min-w-[55px]">
              <div className={timer <= 30 ? "text-red-500" : ""}>{timerDisplay}</div>
              <div className="text-xs text-gray-400">¥{currentPrice.toLocaleString()}</div>
            </div>
            {quickBids.slice(0, 2).map((amount, i) => (
              <button
                key={i}
                type="button"
                disabled={isFormLocked}
                onClick={() => handleQuickBid(amount)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-2 rounded border border-blue-200 disabled:opacity-50"
              >
                +¥{quickIncrements[i].toLocaleString()}
              </button>
            ))}
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={`≥¥${(currentPrice + minBid).toLocaleString()}`}
              className="w-16 border border-gray-300 rounded px-1.5 py-2 text-xs"
              min={currentPrice + minBid}
              step={100}
            />
            <button
              type="button"
              disabled={isFormLocked}
              onClick={handleCustomBid}
              className="bg-green-600 text-white px-2.5 py-2 rounded text-xs font-medium whitespace-nowrap disabled:opacity-50"
            >
              {isSubmitting ? "..." : cooldown > 0 ? `${cooldown}s` : "出价"}
            </button>
          </div>
        </div>
      )}
      {!isActive && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10 p-3 text-center">
          <div className="flex items-center justify-between">
            {timerDisplay}
            <span className="text-sm text-gray-500">
              {isEnded
                ? `成交 ¥${(finalAmount || currentBid)?.toLocaleString()}`
                : `${auctionStatus === "pending" ? "待开始" : statusLabel}`}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
