"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export default function AdminCountdownTimer({
  auctionId,
  initialSeconds,
  status,
}: {
  auctionId: string;
  initialSeconds: number;
  status: string;
}) {
  const [timer, setTimer] = useState(initialSeconds);
  const isActiveRef = useRef(status === "active");

  useEffect(() => {
    isActiveRef.current = status === "active";
  }, [status]);

  useEffect(() => {
    const socket: Socket = io(window.location.origin, { path: "/socket.io" });

    socket.on("connect", () => {
      socket.emit("join-auction", { auctionId });
    });

    socket.on("timer-reset", (data: { auctionId: string; remainingSeconds: number }) => {
      if (data.auctionId === auctionId) setTimer(data.remainingSeconds);
    });

    socket.on("timer-sync", (data: { auctionId: string; remainingSeconds: number }) => {
      if (data.auctionId === auctionId) setTimer(data.remainingSeconds);
    });

    socket.on("auction-ended", (data: { auctionId: string }) => {
      if (data.auctionId === auctionId) {
        isActiveRef.current = false;
        setTimer(0);
      }
    });

    return () => {
      socket.emit("leave-auction", { auctionId });
      socket.disconnect();
    };
  }, [auctionId]);

  // Local countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isActiveRef.current) return;
      setTimer((t) => {
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

  const isLow = timer <= 30 && timer > 0 && isActiveRef.current;

  return (
    <div className={`text-3xl font-semibold font-mono tabular-nums ${
      isLow ? "text-[#ff6b6b] animate-pulse" : "text-gray-900"
    }`}>
      {timer > 0 ? formatTime(timer) : "00:00"}
    </div>
  );
}
