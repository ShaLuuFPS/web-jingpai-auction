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
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // Sync local autoRelist state when server confirms the toggle
  useEffect(() => {
    if (autoRelistState.success) {
      setAutoRelist((prev) => !prev);
    }
  }, [autoRelistState.success]);

  const btnPrimary = "bg-[#635bff] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-[#0a2540] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none";
  const btnDanger = "bg-[#ff6b6b] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-[#e55] disabled:opacity-50";
  const btnSecondary = "bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-50";
  const inputClass = "w-24 border border-[#e0e6eb] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15";
  const updateBtnClass = "bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <h3 className="font-semibold text-base text-gray-900 mb-4">操作</h3>

      <div className="flex flex-wrap gap-3 mb-4">
        {status === "pending" && (
          <form action={formAction}>
            <input type="hidden" name="auctionId" value={auctionId} />
            <input type="hidden" name="action" value="start" />
            <button type="submit" disabled={isPending} className={btnPrimary}>
              开始拍卖
            </button>
          </form>
        )}
        {(status === "preview" || status === "active") && (
          <form action={formAction}>
            <input type="hidden" name="auctionId" value={auctionId} />
            <input type="hidden" name="action" value="end" />
            <button type="submit" disabled={isPending} className={btnDanger}>
              结束拍卖
            </button>
          </form>
        )}
        {status === "ended" && (
          <>
            <form action={restartAction}>
              <input type="hidden" name="auctionId" value={auctionId} />
              <button type="submit" disabled={restartPending} className={btnSecondary}>
                {restartPending ? "处理中..." : "重新拍卖"}
              </button>
            </form>
            <form action={relistAction}>
              <input type="hidden" name="auctionId" value={auctionId} />
              <button type="submit" disabled={relistPending} className={btnPrimary}>
                {relistPending ? "处理中..." : "另起新拍卖"}
              </button>
            </form>
          </>
        )}
      </div>

      {state.error && (
        <div className="bg-red-50 border border-[#ff6b6b]/30 rounded-lg px-4 py-3 mb-4 text-sm text-[#ff6b6b]">{state.error}</div>
      )}

      {/* Settings — collapsible, collapsed by default */}
      {status === "pending" && (
        <div className="border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span>倒计时与自动拍卖设置</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {settingsOpen && (
            <div className="space-y-5 mt-4">
              {/* Preview countdown */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">预告倒计时</h4>
                <form action={previewTimerAction} className="flex items-center gap-2">
                  <input type="hidden" name="auctionId" value={auctionId} />
                  <input
                    type="number"
                    name="previewSeconds"
                    value={previewTimerValue}
                    onChange={(e) => setPreviewTimerValue(parseInt(e.target.value) || 0)}
                    className={inputClass}
                    min={10} max={3600} step={10}
                  />
                  <span className="text-sm text-gray-400">秒</span>
                  <button type="submit" disabled={previewTimerPending} className={updateBtnClass}>
                    {previewTimerPending ? "更新中..." : "更新"}
                  </button>
                </form>
                {previewTimerState.error && <p className="text-sm text-[#ff6b6b] mt-1">{previewTimerState.error}</p>}
                {previewTimerState.success && <p className="text-sm text-green-600 mt-1">{previewTimerState.success}</p>}
                <p className="text-xs text-gray-400 mt-1">开始拍卖后先进入预告期，预告结束后正式竞价</p>
              </div>

              {/* Bidding countdown */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">竞价倒计时</h4>
                <form action={bidTimerAction} className="flex items-center gap-2">
                  <input type="hidden" name="auctionId" value={auctionId} />
                  <input
                    type="number"
                    name="bidResetSeconds"
                    value={bidTimerValue}
                    onChange={(e) => setBidTimerValue(parseInt(e.target.value) || 0)}
                    className={inputClass}
                    min={10} max={3600} step={10}
                  />
                  <span className="text-sm text-gray-400">秒</span>
                  <button type="submit" disabled={bidTimerPending} className={updateBtnClass}>
                    {bidTimerPending ? "更新中..." : "更新"}
                  </button>
                </form>
                {bidTimerState.error && <p className="text-sm text-[#ff6b6b] mt-1">{bidTimerState.error}</p>}
                {bidTimerState.success && <p className="text-sm text-green-600 mt-1">{bidTimerState.success}</p>}
                <p className="text-xs text-gray-400 mt-1">有人出价后倒计时重置，无人出价则倒计时结束拍卖</p>
              </div>

              {/* Auto relist */}
              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">自动重新拍卖</h4>
                <form action={autoRelistAction} className="flex items-center gap-3">
                  <input type="hidden" name="auctionId" value={auctionId} />
                  <input type="hidden" name="enabled" value={autoRelist ? "false" : "true"} />
                  <button
                    type="submit"
                    disabled={autoRelistPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                      autoRelist ? "bg-[#635bff]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoRelist ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {autoRelist ? "已启用（结束后自动重新开始）" : "已关闭"}
                  </span>
                </form>
                {autoRelistState.error && <p className="text-sm text-[#ff6b6b] mt-1">{autoRelistState.error}</p>}
                {autoRelistState.success && <p className="text-sm text-green-600 mt-1">{autoRelistState.success}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
