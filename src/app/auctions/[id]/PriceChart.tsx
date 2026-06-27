"use client";

import { useState, useEffect, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PricePoint {
  time: string;
  price: number;
  bidder: string;
}

/** 12-color palette optimized for chart visibility */
const BIDDER_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#d946ef", // fuchsia
];

export default function PriceChart({
  auctionId,
  initialData,
}: {
  auctionId: string;
  initialData: PricePoint[];
}) {
  const [data, setData] = useState<PricePoint[]>(initialData);

  useEffect(() => {
    const socket: Socket = io(window.location.origin, { path: "/socket.io" });

    socket.on("connect", () => {
      socket.emit("join-auction", { auctionId });
    });

    socket.on(
      "bid-update",
      (d: { auctionId: string; amount: number; nickname: string }) => {
        if (d.auctionId === auctionId) {
          const now = new Date();
          const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
          setData((prev) => [
            ...prev,
            { time, price: d.amount, bidder: d.nickname },
          ]);
        }
      }
    );

    return () => {
      socket.emit("leave-auction", { auctionId });
      socket.disconnect();
    };
  }, [auctionId]);

  // Assign a stable color to each unique bidder
  const bidderColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const seen = new Set<string>();
    for (const point of data) {
      if (!seen.has(point.bidder)) {
        seen.add(point.bidder);
        map.set(point.bidder, BIDDER_COLORS[map.size % BIDDER_COLORS.length]);
      }
    }
    return map;
  }, [data]);

  // Build segments: each segment is 2 consecutive points, colored by the destination bidder
  const segments = useMemo(() => {
    if (data.length < 2) return [];
    return data.slice(1).map((point, i) => ({
      key: `seg-${i}`,
      points: [data[i], point],
      color: bidderColorMap.get(point.bidder) || "#6b7280",
    }));
  }, [data, bidderColorMap]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-sm mb-3">📈 价格走势</h3>
        <p className="text-xs text-gray-400 text-center py-8">暂无出价数据</p>
      </div>
    );
  }

  const minPrice = Math.min(...data.map((d) => d.price)) * 0.98;
  const maxPrice = Math.max(...data.map((d) => d.price)) * 1.02;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-sm mb-3">📈 价格走势</h3>

      <div className="outline-none select-none" style={{ WebkitTapHighlightColor: "transparent" }}>
        <style>{`
          .price-chart svg { outline: none !important; -webkit-tap-highlight-color: transparent; }
          .price-chart svg * { outline: none !important; }
          .price-chart .recharts-tooltip-wrapper { outline: none !important; border: none !important; box-shadow: none !important; }
        `}</style>
        <div className="price-chart">

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-2">
        {Array.from(bidderColorMap.entries()).map(([bidder, color]) => (
          <div key={bidder} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600">{bidder}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} allowDuplicatedCategory={false} />
          <YAxis
            domain={[Math.floor(minPrice), Math.ceil(maxPrice)]}
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `¥${(v / 10000).toFixed(1)}万`}
          />
          <Tooltip
            wrapperStyle={{ border: "none", outline: "none", boxShadow: "none", background: "transparent" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white/90 rounded px-2 py-1 text-xs">
                  <p className="text-gray-500" style={{ fontSize: 10 }}>{label}</p>
                  <p className="font-semibold text-gray-800" style={{ fontSize: 11 }}>
                    ¥{Number(payload[0].value).toLocaleString()}
                  </p>
                </div>
              );
            }}
          />

          {/* Segments: each is a mini Line between two consecutive data points */}
          {segments.map((seg) => (
            <Line
              key={seg.key}
              data={seg.points}
              type="linear"
              dataKey="price"
              stroke={seg.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              legendType="none"
            />
          ))}

          {/* Dots: render each point with its bidder's color */}
          {data.map((point, i) => {
            const color = bidderColorMap.get(point.bidder) || "#6b7280";
            return (
              <Line
                key={`dot-${i}`}
                data={[point]}
                type="linear"
                dataKey="price"
                stroke={color}
                strokeWidth={0}
                dot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive={false}
                legendType="none"
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}
