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
    <form action={formAction} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">选择车辆 *</label>
        <select name="vehicleId" required
          className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm text-gray-900
            focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15
            bg-white">
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">预告倒计时（秒）</label>
          <input name="previewSeconds" type="number" defaultValue={120} min={10} max={3600} step={10}
            className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm
              focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15" />
          <p className="text-xs text-gray-400 mt-1">开始拍卖后先进入预告期，预告结束后开放出价</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">竞价倒计时（秒）</label>
          <input name="bidResetSeconds" type="number" defaultValue={120} min={10} max={3600} step={10}
            className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm
              focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15" />
          <p className="text-xs text-gray-400 mt-1">每次出价后重置倒计时</p>
        </div>
      </div>

      {/* Auto relist */}
      <div className="border-t border-gray-100 pt-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="autoRelist"
            checked={autoRelist}
            onChange={(e) => setAutoRelist(e.target.checked)}
            className="w-4 h-4 text-[#635bff] rounded accent-[#635bff]"
          />
          <span className="text-sm font-medium text-gray-700">启用自动重新拍卖</span>
          <span className="text-xs text-gray-400">结束后自动重新开始当前拍卖（需管理员手动启动）</span>
        </label>

        {autoRelist && (
          <div className="mt-3 ml-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">结束后等待（秒）</label>
            <input
              name="relistDelaySeconds"
              type="number"
              defaultValue={60}
              min={10}
              max={3600}
              step={10}
              className="w-32 border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm
                focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15"
            />
            <p className="text-xs text-gray-400 mt-1">拍卖结束后等待此时间再自动重新开始</p>
          </div>
        )}
      </div>

      {state.error && (
        <div className="bg-red-50 border border-[#ff6b6b]/30 rounded-lg px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#ff6b6b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-[#ff6b6b]">{state.error}</span>
        </div>
      )}

      <button type="submit" disabled={isPending}
        className="bg-[#635bff] text-white px-6 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-150 ease-out
          hover:bg-[#0a2540] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
          active:translate-y-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none">
        {isPending ? "创建中..." : "创建拍卖"}
      </button>
    </form>
  );
}
