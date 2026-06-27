"use client";

import { useActionState, useState } from "react";
import { createAuction } from "../actions";

const initialState = { error: "" };

interface Vehicle {
  id: string;
  title: string;
  startingPrice: number;
}

export default function NewAuctionForm({ vehicles }: { vehicles: Vehicle[] }) {
  const [state, formAction, isPending] = useActionState(createAuction, initialState);
  const [autoRelist, setAutoRelist] = useState(false);

  return (
    <form action={formAction} className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">选择车辆 *</label>
        <select name="vehicleId" required className="w-full border rounded px-3 py-2 text-sm">
          <option value="">-- 请选择 --</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title} (起拍价 ¥{v.startingPrice.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">📢 预告倒计时（秒）</label>
          <input name="previewSeconds" type="number" defaultValue={120} min={10} max={3600} step={10} className="w-full border rounded px-3 py-2 text-sm" />
          <p className="text-xs text-gray-400 mt-1">开始拍卖后先进入预告期，预告结束后开放出价</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">⏱ 竞价倒计时（秒）</label>
          <input name="bidResetSeconds" type="number" defaultValue={120} min={10} max={3600} step={10} className="w-full border rounded px-3 py-2 text-sm" />
          <p className="text-xs text-gray-400 mt-1">每次出价后重置倒计时</p>
        </div>
      </div>

      {/* Auto relist */}
      <div className="border-t pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="autoRelist"
            checked={autoRelist}
            onChange={(e) => setAutoRelist(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm font-medium">🔄 启用自动拍卖</span>
          <span className="text-xs text-gray-400">结束后自动创建新拍卖并开始</span>
        </label>

        {autoRelist && (
          <div className="mt-3 ml-6">
            <label className="block text-sm font-medium mb-1">结束后等待（秒）</label>
            <input
              name="relistDelaySeconds"
              type="number"
              defaultValue={60}
              min={10}
              max={3600}
              step={10}
              className="w-32 border rounded px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">拍卖结束后等待此时间再自动创建下一场</p>
          </div>
        )}
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3">
          <span className="text-red-600 text-sm">⚠ {state.error}</span>
        </div>
      )}

      <button type="submit" disabled={isPending} className="bg-green-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50">
        {isPending ? "创建中..." : "创建拍卖"}
      </button>
    </form>
  );
}
