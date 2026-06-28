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
        setVisible(false);
        setMessage({
          nickname: data.nickname,
          vehicleTitle: data.vehicleTitle || "未知车辆",
          amount: data.amount,
          auctionId: data.auctionId,
        });
        setNotifKey((k) => k + 1);
        setTimeout(() => setVisible(true), 0);

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
    <div
      className={`h-9 overflow-hidden ${
        show ? "bg-[#eef2ff] border-b border-[#635bff]/20" : ""
      }`}
    >
      <div className="container mx-auto max-w-7xl px-4 relative h-full">
        {show ? (
          <>
            <Link
              href={`/auctions/${message.auctionId}`}
              className="block py-2 text-sm text-[#635bff] hover:text-[#4f49cc]"
            >
              <div className="overflow-hidden whitespace-nowrap">
                <span
                  key={notifKey}
                  className="inline-block animate-marquee"
                >
                  <svg
                    className="inline-block w-3.5 h-3.5 mr-1 -mt-0.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M13 2L4.093 20.583c-.462.967.197 2.096 1.221 2.096h13.372c1.024 0 1.683-1.13 1.221-2.096L13 2z" />
                  </svg>
                  <span className="font-semibold">{message.nickname}</span>{" "}
                  在{" "}
                  <span className="font-medium">{message.vehicleTitle}</span>{" "}
                  出价{" "}
                  <span className="font-semibold text-gray-900">
                    ¥{message.amount.toLocaleString()}
                  </span>
                  {" "}· 点击查看
                </span>
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#635bff]/50 hover:text-[#635bff] text-base leading-none px-1"
              aria-label="关闭"
            >
              ×
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
