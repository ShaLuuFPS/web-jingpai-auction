"use client";

import { useActionState, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { auctionAction, restartAuction, relistAuction, updateBidResetSeconds, updatePreviewSeconds, toggleAutoRelist } from "../actions";

const initialState = { error: "" };
const timerInitialState = { error: "", success: "" } as { error?: string; success?: string };

export default function AuctionActions({
  auctionId,
  status: initialStatus,
  bidResetSeconds,
  previewSeconds,
  autoRelist: initialAutoRelist,
}: {
  auctionId: string;
  status: string;
  bidResetSeconds: number;
  previewSeconds: number;
  autoRelist: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [state, formAction, isPending] = useActionState(auctionAction, initialState);
  const [restartState, restartAction, restartPending] = useActionState(restartAuction, initialState);
  const [relistState, relistAction, relistPending] = useActionState(relistAuction, initialState);
  const [bidTimerState, bidTimerAction, bidTimerPending] = useActionState(updateBidResetSeconds, timerInitialState);
  const [previewTimerState, previewTimerAction, previewTimerPending] = useActionState(updatePreviewSeconds, timerInitialState);
  const [autoRelistState, autoRelistAction, autoRelistPending] = useActionState(toggleAutoRelist, timerInitialState);
  const [bidTimerValue, setBidTimerValue] = useState(bidResetSeconds);
  const [previewTimerValue, setPreviewTimerValue] = useState(previewSeconds);
  const [autoRelist, setAutoRelist] = useState(initialAutoRelist);

  // Listen for auction events so buttons update in real-time
  useEffect(() => {
    const socket: Socket = io(window.location.origin, { path: "/socket.io" });

    socket.on("connect", () => {
      socket.emit("join-auction", { auctionId });
    });

    socket.on("preview-started", (data: { auctionId: string }) => {
      if (data.auctionId === auctionId) setStatus("preview");
    });

    socket.on("bidding-started", (data: { auctionId: string }) => {
      if (data.auctionId === auctionId) setStatus("active");
    });

    socket.on("auction-ended", (data: { auctionId: string }) => {
      if (data.auctionId === auctionId) setStatus("ended");
    });

    return () => {
      socket.emit("leave-auction", { auctionId });
      socket.disconnect();
    };
  }, [auctionId]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold mb-3">操作</h3>
      <div className="flex flex-wrap gap-3">
        {status === "pending" && (
          <form action={formAction}>
            <input type="hidden" name="auctionId" value={auctionId} />
            <input type="hidden" name="action" value="start" />
            <button type="submit" disabled={isPending} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              ▶️ 开始拍卖
            </button>
          </form>
        )}
        {(status === "preview" || status === "active") && (
          <form action={formAction}>
            <input type="hidden" name="auctionId" value={auctionId} />
            <input type="hidden" name="action" value="end" />
            <button type="submit" disabled={isPending} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              ⏹️ 结束拍卖
            </button>
          </form>
        )}
        {status === "ended" && (
          <>
            <form action={restartAction}>
              <input type="hidden" name="auctionId" value={auctionId} />
              <button type="submit" disabled={restartPending} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {restartPending ? "处理中..." : "🔄 重新拍卖"}
              </button>
            </form>
            <form action={relistAction}>
              <input type="hidden" name="auctionId" value={auctionId} />
              <button type="submit" disabled={relistPending} className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {relistPending ? "处理中..." : "📋 另起新拍卖"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Settings (only visible when pending) ── */}
      {status === "pending" && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {/* Preview countdown setting */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">📢 预告倒计时</h4>
            <form action={previewTimerAction} className="flex items-center gap-2">
              <input type="hidden" name="auctionId" value={auctionId} />
              <input
                type="number"
                name="previewSeconds"
                value={previewTimerValue}
                onChange={(e) => setPreviewTimerValue(parseInt(e.target.value) || 0)}
                className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm"
                min={10}
                max={3600}
                step={10}
              />
              <span className="text-sm text-gray-400">秒</span>
              <button
                type="submit"
                disabled={previewTimerPending}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm border border-gray-300 disabled:opacity-50"
              >
                {previewTimerPending ? "更新中..." : "更新"}
              </button>
            </form>
            {previewTimerState.error && <p className="text-sm text-red-500 mt-1">⚠ {previewTimerState.error}</p>}
            {previewTimerState.success && <p className="text-sm text-green-600 mt-1">✅ {previewTimerState.success}</p>}
            <p className="text-xs text-gray-400 mt-1">开始拍卖后先进入预告期，预告结束后正式竞价</p>
          </div>

          {/* Bidding countdown setting */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">⏱ 竞价倒计时</h4>
            <form action={bidTimerAction} className="flex items-center gap-2">
              <input type="hidden" name="auctionId" value={auctionId} />
              <input
                type="number"
                name="bidResetSeconds"
                value={bidTimerValue}
                onChange={(e) => setBidTimerValue(parseInt(e.target.value) || 0)}
                className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm"
                min={10}
                max={3600}
                step={10}
              />
              <span className="text-sm text-gray-400">秒</span>
              <button
                type="submit"
                disabled={bidTimerPending}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm border border-gray-300 disabled:opacity-50"
              >
                {bidTimerPending ? "更新中..." : "更新"}
              </button>
            </form>
            {bidTimerState.error && <p className="text-sm text-red-500 mt-1">⚠ {bidTimerState.error}</p>}
            {bidTimerState.success && <p className="text-sm text-green-600 mt-1">✅ {bidTimerState.success}</p>}
            <p className="text-xs text-gray-400 mt-1">有人出价后倒计时重置，无人出价则倒计时结束拍卖</p>
          </div>

          {/* Auto relist toggle */}
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">🔄 自动拍卖</h4>
            <form action={autoRelistAction} className="flex items-center gap-3">
              <input type="hidden" name="auctionId" value={auctionId} />
              <input type="hidden" name="enabled" value={autoRelist ? "false" : "true"} />
              <button
                type="submit"
                disabled={autoRelistPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  autoRelist ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRelist ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                {autoRelist ? "已启用（结束后自动重开）" : "已关闭"}
              </span>
            </form>
            {autoRelistState.error && <p className="text-sm text-red-500 mt-1">⚠ {autoRelistState.error}</p>}
            {autoRelistState.success && <p className="text-sm text-green-600 mt-1">✅ {autoRelistState.success}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
