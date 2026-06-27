"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";

export default function BidNotificationBar() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<{
    nickname: string;
    vehicleTitle: string;
    amount: number;
    auctionId: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [notifKey, setNotifKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const socket: Socket = io(window.location.origin, { path: "/socket.io" });

    socket.on(
      "bid-notification",
      (data: {
        auctionId: string;
        amount: number;
        nickname: string;
        vehicleTitle: string;
      }) => {
        clearTimer();
        setDismissed(false);
        // Briefly hide to force re-mount, then show with new key for fresh animation
        setVisible(false);
        setMessage({
          nickname: data.nickname,
          vehicleTitle: data.vehicleTitle || "未知车辆",
          amount: data.amount,
          auctionId: data.auctionId,
        });
        setNotifKey((k) => k + 1);
        // A micro-tick later show the bar so the marquee re-mounts from the right
        setTimeout(() => setVisible(true), 0);

        // Auto-hide after 10 seconds
        timerRef.current = setTimeout(() => {
          setVisible(false);
        }, 10000);
      }
    );

    return () => {
      clearTimer();
      socket.disconnect();
    };
  }, [clearTimer]);

  const handleClose = () => {
    clearTimer();
    setDismissed(true);
    setVisible(false);
  };

  const show = visible && message && !dismissed;

  return (
    <div className={`h-9 overflow-hidden ${show ? "border-b border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50" : ""}`}>
      <div className="container mx-auto max-w-7xl px-4 relative h-full">
        {show ? (
          <>
            <Link
              href={`/auctions/${message.auctionId}`}
              className="block py-2 text-sm text-orange-700 hover:text-orange-900"
            >
              <div className="overflow-hidden whitespace-nowrap">
                <span key={notifKey} className="inline-block animate-marquee">
                  🔥{" "}
                  <span className="font-medium">{message.nickname}</span>{" "}
                  在{" "}
                  <span className="font-medium">{message.vehicleTitle}</span>{" "}
                  出价了{" "}
                  <span className="font-mono font-bold text-red-600">
                    ¥{message.amount.toLocaleString()}
                  </span>
                  ！点我查看详情
                </span>
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600 text-lg leading-none px-2"
              aria-label="关闭"
            >
              ✕
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
