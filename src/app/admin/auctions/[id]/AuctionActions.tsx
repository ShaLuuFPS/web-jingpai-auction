"use client";

import { useActionState, useState } from "react";
import { auctionAction, restartAuction, relistAuction, updateBidResetSeconds } from "../actions";

const initialState = { error: "" };
const timerInitialState = { error: "", success: "" };

export default function AuctionActions({
  auctionId,
  status,
  bidResetSeconds,
}: {
  auctionId: string;
  status: string;
  bidResetSeconds: number;
}) {
  const [state, formAction, isPending] = useActionState(auctionAction, initialState);
  const [restartState, restartAction, restartPending] = useActionState(restartAuction, initialState);
  const [relistState, relistAction, relistPending] = useActionState(relistAuction, initialState);
  const [timerState, timerAction, timerPending] = useActionState(updateBidResetSeconds, timerInitialState);
  const [timerValue, setTimerValue] = useState(bidResetSeconds);

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
        {status === "active" && (
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

      {/* ── Countdown timer setting ── */}
      {status !== "ended" && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">⏱ 倒计时设置</h4>
          <form action={timerAction} className="flex items-center gap-2">
            <input type="hidden" name="auctionId" value={auctionId} />
            <input
              type="number"
              name="bidResetSeconds"
              value={timerValue}
              onChange={(e) => setTimerValue(parseInt(e.target.value) || 0)}
              className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm"
              min={10}
              max={3600}
              step={10}
            />
            <span className="text-sm text-gray-400">秒</span>
            <button
              type="submit"
              disabled={timerPending}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm border border-gray-300 disabled:opacity-50"
            >
              {timerPending ? "更新中..." : "更新"}
            </button>
          </form>
          {timerState.error && <p className="text-sm text-red-500 mt-1">⚠ {timerState.error}</p>}
          {timerState.success && <p className="text-sm text-green-600 mt-1">✅ {timerState.success}</p>}
        </div>
      )}
    </div>
  );
}
