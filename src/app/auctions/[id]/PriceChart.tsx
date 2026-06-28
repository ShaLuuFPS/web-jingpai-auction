"use client";

import { useState, useEffect, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PricePoint {
  time: string;
  price: number;
  bidder: string;
}

/** Softer 12-color palette — lower saturation, Stripe-compatible */
const BIDDER_COLORS = [
  "#6366f1", // indigo (primary)
  "#f97316", // orange
  "#22c55e", // green
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#84cc16", // lime
  "#ef4444", // red
  "#14b8a6", // teal
  "#3b82f6", // blue
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

  const segments = useMemo(() => {
    if (data.length < 2) return [];
    return data.slice(1).map((point, i) => ({
      key: `seg-${i}`,
      points: [data[i], point],
      color: bidderColorMap.get(point.bidder) || "#9ca3af",
    }));
  }, [data, bidderColorMap]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">价格走势</h3>
        <p className="text-xs text-gray-400 text-center py-10">
          暂无出价数据
        </p>
      </div>
    );
  }

  const minPrice = Math.min(...data.map((d) => d.price)) * 0.98;
  const maxPrice = Math.max(...data.map((d) => d.price)) * 1.02;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <h3 className="font-semibold text-sm text-gray-900 mb-3">价格走势</h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {Array.from(bidderColorMap.entries()).map(([bidder, color]) => (
          <div key={bidder} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-500">{bidder}</span>
          </div>
        ))}
      </div>

      <div className="select-none [&_*]:outline-none" style={{ WebkitTapHighlightColor: "transparent" }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={{ stroke: "#f3f4f6" }}
              tickLine={false}
              allowDuplicatedCategory={false}
            />
            <YAxis
              domain={[Math.floor(minPrice), Math.ceil(maxPrice)]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `¥${(v / 10000).toFixed(1)}万`}
              width={50}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white rounded-lg px-2.5 py-1.5 text-xs"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                    <p className="text-gray-400" style={{ fontSize: 10 }}>
                      {payload[0].payload.time}
                    </p>
                    <p className="font-semibold text-gray-900" style={{ fontSize: 11 }}>
                      ¥{Number(payload[0].value).toLocaleString()}
                    </p>
                  </div>
                );
              }}
            />

            {/* Segments colored by bidder */}
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

            {/* Dots */}
            {data.map((point, i) => {
              const color = bidderColorMap.get(point.bidder) || "#9ca3af";
              return (
                <Line
                  key={`dot-${i}`}
                  data={[point]}
                  type="linear"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={0}
                  dot={{ r: 3.5, fill: color, stroke: "#fff", strokeWidth: 1.5 }}
                  isAnimationActive={false}
                  legendType="none"
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
